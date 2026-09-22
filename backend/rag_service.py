"""
JurisAI — RAG Service
Retrieval: ChromaDB (local) + SentenceTransformers
Generation: Google Gemini via google-genai SDK with multi-model fallback
"""

import chromadb
import json
import os
import re
import time
from dotenv import load_dotenv
from typing import List, Dict, Any, Optional
from google import genai
from google.genai import types as genai_types
from google.genai import errors as genai_errors

# chromadb 1.x — embedding_functions moved; support both paths
try:
    from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction
except ImportError:
    from chromadb.utils import embedding_functions as _ef
    SentenceTransformerEmbeddingFunction = _ef.SentenceTransformerEmbeddingFunction

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
CHROMA_PATH    = os.getenv("CHROMA_PATH", "./.chroma_db")

# ── Model candidates (ordered: newest → most stable fallback) ─────────────────
# All are FREE tier on Google AI Studio (aistudio.google.com)
# The service will try each in order and fall back automatically on 503.
MODEL_CANDIDATES = [
    "gemini-2.5-flash",          # most stable free model as of Sep 2026
    "gemini-2.5-flash-lite",     # lighter, almost always available
    "gemini-2.0-flash-lite",     # very stable fallback
    "gemini-3.6-flash",          # newest but sometimes overloaded
    "gemini-1.5-flash-latest",   # older but rock-solid
    "gemini-1.5-flash-002",      # last-resort
]

SYSTEM_PROMPT = """You are JurisAI, an expert Indian legal assistant. You MUST follow these rules absolutely:

RULE 1: Answer ONLY using the legal documents provided in the LEGAL CONTEXT section below.
RULE 2: Do NOT use any outside knowledge, training data, or memory. If context is insufficient, say so.
RULE 3: Do NOT fabricate, hallucinate, or invent any citations, case names, sections, or legal holdings.
RULE 4: You MUST respond with a single valid JSON object. No markdown, no code fences, no extra text.
RULE 5: The JSON must have EXACTLY these 4 keys:
  - "plain_english_summary": 3-5 sentences in simple language for a common citizen with no legal background.
  - "applicable_statutes": Array of objects with keys: "title", "citation", "excerpt", "doc_type".
  - "relevant_precedents": Array of objects with keys: "title", "citation", "court", "year", "holding".
  - "suggested_next_steps": Array of 3-5 actionable strings telling the user exactly what to do.
RULE 6: Only include items that are directly present in the provided LEGAL CONTEXT.
RULE 7: Be empathetic, precise, and factual. Use plain language in plain_english_summary.
RULE 8: excerpt in applicable_statutes should be 1-2 sentences directly from the source text.
RULE 9: holding in relevant_precedents should be the core legal principle established by the case.
"""


def _call_gemini(
    client: genai.Client,
    model: str,
    prompt: str,
    temperature: float = 0.05,
    max_tokens: int = 2048,
) -> str:
    """Single Gemini API call. Raises on failure.
    NOTE: JSON mode (response_mime_type) is intentionally NOT used — it causes
    503 on many model variants. The system prompt enforces JSON output instead.
    """
    cfg = genai_types.GenerateContentConfig(
        temperature=temperature,
        max_output_tokens=max_tokens,
    )
    response = client.models.generate_content(
        model=model,
        contents=prompt,
        config=cfg,
    )
    return response.text.strip()


def _is_overload_error(e: Exception) -> bool:
    """Returns True if the error is a transient server overload (worth retrying)."""
    msg = str(e).lower()
    return (
        isinstance(e, genai_errors.ServerError)
        or "503" in msg
        or "unavailable" in msg
        or "overload" in msg
        or "resource exhausted" in msg
        or "429" in msg
    )


class RAGService:
    def __init__(self):
        if not GEMINI_API_KEY:
            raise ValueError(
                "GEMINI_API_KEY not set. Please add it to backend/.env. "
                "Get a free key at https://aistudio.google.com"
            )

        self._client = genai.Client(api_key=GEMINI_API_KEY)
        self._working_models: List[str] = []   # models confirmed to work, in order

        # Probe all candidates at startup — collect every working model (not just the first)
        print("[*] Probing available Gemini models...")
        for candidate in MODEL_CANDIDATES:
            try:
                self._client.models.generate_content(
                    model=candidate,
                    contents="Hi",
                    config=genai_types.GenerateContentConfig(max_output_tokens=1),
                )
                self._working_models.append(candidate)
                print(f"  [OK] {candidate}")
            except Exception as e:
                short = str(e)[:80]
                print(f"  [..] {candidate} — {short}")

        if not self._working_models:
            raise RuntimeError(
                "No working Gemini model found. "
                "Check your GEMINI_API_KEY at https://aistudio.google.com"
            )

        print(f"[OK] {len(self._working_models)} model(s) available. Primary: {self._working_models[0]}")

        # ChromaDB + embeddings
        self.embedding_fn = SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")
        self.chroma_client = chromadb.PersistentClient(path=CHROMA_PATH)
        try:
            self.collection = self.chroma_client.get_collection(
                name="legal_corpus",
                embedding_function=self.embedding_fn,
            )
            print(f"[OK] ChromaDB connected — {self.collection.count()} legal entries loaded.")
        except Exception as e:
            raise RuntimeError(
                f"ChromaDB collection 'legal_corpus' not found. "
                f"Run 'python ingest.py' first. Error: {e}"
            )

    # ── Retrieval ───────────────────────────────────────────────────────────────

    def retrieve(self, query: str, top_k: int = 5, is_pro: bool = False) -> List[Dict[str, Any]]:
        k = top_k if is_pro else 3
        results = self.collection.query(
            query_texts=[query],
            n_results=min(k, self.collection.count()),
            include=["documents", "metadatas", "distances"],
        )
        retrieved = []
        for i in range(len(results["ids"][0])):
            retrieved.append({
                "text":     results["documents"][0][i],
                "metadata": results["metadatas"][0][i],
                "distance": results["distances"][0][i],
            })
        return retrieved

    # ── Prompt builder ──────────────────────────────────────────────────────────

    def _build_prompt(self, query: str, docs: List[Dict], is_pro: bool) -> str:
        parts = []
        for i, doc in enumerate(docs, 1):
            m = doc["metadata"]
            parts.append(
                f"[Source {i}]\n"
                f"Title: {m.get('title','Unknown')}\n"
                f"Citation: {m.get('citation','N/A')}\n"
                f"Type: {m.get('doc_type','N/A')} | "
                f"Court: {m.get('court','N/A')} | Year: {m.get('year','N/A')}\n"
                f"Content: {doc['text']}\n"
                f"{'─'*60}"
            )
        context = "\n".join(parts)
        tier = (
            "TIER: PRO — Include ALL relevant judgments in relevant_precedents."
            if is_pro else
            "TIER: FREE — Set relevant_precedents to [] and focus on statutes only."
        )
        return (
            f"{SYSTEM_PROMPT}\n\n"
            f"--- LEGAL CONTEXT (use ONLY this) ---\n{context}\n"
            f"--- END LEGAL CONTEXT ---\n\n"
            f"User Legal Scenario: {query}\n\n{tier}\n\n"
            f"Respond with the JSON object now:"
        )

    # ── Generation with full model fallback ────────────────────────────────────

    def _generate_with_fallback(self, prompt: str) -> str:
        """
        Try each working model in order. For each model, retry up to 3 times
        with exponential backoff on overload errors. If a model keeps failing,
        move on to the next. Returns the raw text response.
        """
        last_error: Optional[Exception] = None

        for model in self._working_models:
            RETRIES = 2  # 2 attempts per model, then move on quickly
            for attempt in range(RETRIES):
                try:
                    text = _call_gemini(self._client, model, prompt)
                    if attempt > 0 or model != self._working_models[0]:
                        print(f"[OK] Response from {model} (attempt {attempt+1})")
                    return text

                except Exception as e:
                    last_error = e
                    if _is_overload_error(e):
                        if attempt < RETRIES - 1:
                            wait = 2  # fixed 2s wait before retry
                            print(f"[..] {model} busy (attempt {attempt+1}), wait {wait}s…")
                            time.sleep(wait)
                        else:
                            print(f"[..] {model} still busy — switching to next model")
                            break  # move to next model
                    else:
                        print(f"[!!] {model} error: {str(e)[:120]}")
                        break  # non-overload: move to next model immediately

        # All models failed
        raise RuntimeError(
            "All Gemini models are currently unavailable. "
            "This is a temporary Google API issue. Please try again in 30 seconds."
        )

    # ── Public generate method ─────────────────────────────────────────────────

    def generate(self, query: str, is_pro: bool = False) -> Dict[str, Any]:
        """Full RAG pipeline: retrieve → prompt → Gemini (with fallback) → parse."""
        retrieved_docs = self.retrieve(query, top_k=5, is_pro=is_pro)

        if not retrieved_docs:
            return {
                "plain_english_summary": (
                    "No relevant legal information found for your query. "
                    "Please consult a licensed advocate for personalized advice."
                ),
                "applicable_statutes": [],
                "relevant_precedents": [],
                "suggested_next_steps": [
                    "Consult a licensed advocate for personalized legal advice.",
                    "Contact NALSA (National Legal Services Authority) for free legal aid.",
                ],
                "confidence_score": 0.0,
            }

        prompt = self._build_prompt(query, retrieved_docs, is_pro)
        raw_text = self._generate_with_fallback(prompt)

        # Parse JSON — strip markdown fences if model adds them
        try:
            fence_match = re.search(r"```(?:json)?\s*([\s\S]*?)```", raw_text)
            if fence_match:
                raw_text = fence_match.group(1).strip()
            parsed = json.loads(raw_text)
        except json.JSONDecodeError:
            parsed = {
                "plain_english_summary": (
                    "The AI returned a response that couldn't be parsed. "
                    "Please try again — your query was received correctly."
                ),
                "applicable_statutes": [],
                "relevant_precedents": [],
                "suggested_next_steps": [
                    "Try submitting your query again.",
                    "Rephrase your question with more specific details.",
                    "Consult a licensed legal professional for immediate advice.",
                ],
            }

        # Confidence from cosine similarity
        avg_dist = sum(d["distance"] for d in retrieved_docs) / len(retrieved_docs)
        parsed["confidence_score"] = round(max(0.0, min(1.0, 1.0 - avg_dist)), 2)
        return parsed


# ── Singleton ──────────────────────────────────────────────────────────────────

_rag_service_instance: Optional[RAGService] = None


def get_rag_service() -> RAGService:
    global _rag_service_instance
    if _rag_service_instance is None:
        _rag_service_instance = RAGService()
    return _rag_service_instance
