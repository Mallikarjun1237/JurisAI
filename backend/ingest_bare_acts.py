# coding: utf-8
"""
JurisAI — Phase 1: Production Central Bare Acts Ingestion Engine
Reads all standardized legislative JSON documents in data/bare_acts/*.json
and seeds/upserts them into ChromaDB 'legal_corpus' with section-level metadata.
"""
import os
import glob
import json
import chromadb
from dotenv import load_dotenv

os.environ.setdefault('HF_HUB_OFFLINE', '1')
os.environ.setdefault('TRANSFORMERS_OFFLINE', '1')

try:
    from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction
except ImportError:
    from chromadb.utils import embedding_functions as _ef
    SentenceTransformerEmbeddingFunction = _ef.SentenceTransformerEmbeddingFunction

load_dotenv()

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
CHROMA_PATH = os.path.abspath(os.path.join(BACKEND_DIR, os.getenv("CHROMA_PATH", ".chroma_db")))
BARE_ACTS_DIR = os.path.join(BACKEND_DIR, "data", "bare_acts")


def ingest_all_bare_acts():
    print(f"[*] Connecting to ChromaDB at: {CHROMA_PATH}")
    client = chromadb.PersistentClient(path=CHROMA_PATH)
    collection = client.get_or_create_collection(name="legal_corpus")

    json_files = glob.glob(os.path.join(BARE_ACTS_DIR, "*.json"))
    if not json_files:
        print(f"[!] No JSON files found in {BARE_ACTS_DIR}")
        return

    total_provisions = 0
    all_ids = []
    all_texts = []
    all_metadatas = []

    seen_ids = set()
    for file_path in json_files:
        print(f"[*] Reading legislative corpus from: {os.path.basename(file_path)}")
        with open(file_path, "r", encoding="utf-8") as f:
            acts_data = json.load(f)

        for item in acts_data:
            chunk_id = item.get("id") or f"bare_{item.get('act_id')}_{item.get('section_number')}"
            if chunk_id in seen_ids:
                chunk_id = f"{chunk_id}_{os.path.splitext(os.path.basename(file_path))[0]}"
            seen_ids.add(chunk_id)
            text = f"{item.get('act_title', '')} Section {item.get('section_number', '')} — {item.get('marginal_heading', '')}. {item.get('text', '')}"
            metadata = {
                "doc_type": item.get("doc_type", "statute"),
                "title": f"Section {item.get('section_number')} — {item.get('act_title')}",
                "citation": item.get("citation", item.get("act_title")),
                "court": "Republic of India Sovereign Law",
                "year": str(item.get("enacted_year", 2024)),
                "act_id": str(item.get("act_id", "")),
                "effective_date": str(item.get("effective_date", "2024-07-01")),
            }
            all_ids.append(chunk_id)
            all_texts.append(text)
            all_metadatas.append(metadata)
            total_provisions += 1

    print(f"[*] Upserting {total_provisions} Central Bare Act sections into ChromaDB...")
    # Chroma upsert handles batches up to 500 cleanly
    batch_size = 100
    for i in range(0, len(all_ids), batch_size):
        batch_ids = all_ids[i:i + batch_size]
        batch_texts = all_texts[i:i + batch_size]
        batch_metas = all_metadatas[i:i + batch_size]
        collection.upsert(
            ids=batch_ids,
            documents=batch_texts,
            metadatas=batch_metas,
        )

    print(f"[SUCCESS] Ingested {total_provisions} Central Bare Act provisions into 'legal_corpus'.")
    print(f"[INFO] Total verified corpus documents in collection: {collection.count()}")


if __name__ == "__main__":
    ingest_all_bare_acts()
