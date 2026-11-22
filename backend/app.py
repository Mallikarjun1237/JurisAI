from contextlib import asynccontextmanager
import sys

if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
if sys.stderr and hasattr(sys.stderr, "reconfigure"):
    try:
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

"""
JurisAI — FastAPI Application
Endpoints: Auth, Query, History, Cases, Password Reset
"""

from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, datetime, timedelta
from typing import Optional, List
import json

import models
import schemas
import auth
import document_parser
import limitation_service
import precedents_service
import pii_redactor
import court_fee_service
import contract_auditor_service
import storage
from database import engine, get_db
from rag_service import get_rag_service

# Create / migrate all DB tables on startup
models.Base.metadata.create_all(bind=engine)
# Auto-migrate whatsapp_number column if missing
try:
    with engine.connect() as conn:
        from sqlalchemy import text
        conn.execute(text("ALTER TABLE users ADD COLUMN whatsapp_number VARCHAR"))
        conn.commit()
except Exception:
    pass

# Auto-migrate: add any missing columns to existing tables (safe / idempotent)
def _auto_migrate():
    import sqlite3, os
    db_path = os.getenv("DATABASE_URL", "sqlite:///./jurisai.db").replace("sqlite:///./", "").replace("sqlite:///", "")
    if not db_path or not db_path.endswith(".db"):
        return  # skip for non-SQLite (Postgres handles migrations differently)
    try:
        conn = sqlite3.connect(db_path)
        cur = conn.cursor()
        def _has(table, col):
            cur.execute(f"PRAGMA table_info({table})")
            return any(r[1] == col for r in cur.fetchall())
        pending = [
            ("users",      "reset_token",        "ALTER TABLE users ADD COLUMN reset_token TEXT"),
            ("users",      "reset_token_expiry",  "ALTER TABLE users ADD COLUMN reset_token_expiry DATETIME"),
            ("users",      "profile_image",       "ALTER TABLE users ADD COLUMN profile_image TEXT"),
            ("users",      "whatsapp_number",     "ALTER TABLE users ADD COLUMN whatsapp_number VARCHAR"),
            ("query_logs", "case_id",             "ALTER TABLE query_logs ADD COLUMN case_id INTEGER REFERENCES cases(id)"),
            ("doc_chats",  "parent_session_id",   "ALTER TABLE doc_chats ADD COLUMN parent_session_id INTEGER"),
            ("doc_chats",  "context_summary",     "ALTER TABLE doc_chats ADD COLUMN context_summary TEXT"),
        ]
        for table, col, sql in pending:
            if not _has(table, col):
                cur.execute(sql)
                print(f"[migrate] Added {table}.{col}")
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"[migrate] Warning: {e}")

_auto_migrate()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Pre-warm RAG service in background on server boot
    try:
        rag = get_rag_service()
        print("[LIFESPAN] Sovereign Legal RAG Service pre-warmed & ready.")
    except Exception as e:
        print(f"[LIFESPAN] Pre-warming note: {e}")
    yield

app = FastAPI(
    title="JurisAI API",
    description="Legal Intelligence SaaS — RAG-powered statutory & precedent retrieval for Indian law",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ─── CORS CONFIGURATION (Production & Development Safe) ─────────────────────
import os

_frontend_env = os.getenv("FRONTEND_URL", "").strip()
_allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "").strip()

origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]

# Append custom production URLs if provided
for env_val in [_frontend_env, _allowed_origins_env]:
    if env_val:
        for u in env_val.split(","):
            u = u.strip()
            if u and u not in origins:
                origins.append(u)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*(\.vercel\.app|\.netlify\.app|\.onrender\.com|\.railway\.app)",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── HEALTH & ROOT ───────────────────────────────────────────────────────────

@app.get("/", tags=["Health"])
def root_check():
    """Root health check for cloud platform uptime probes."""
    return {
        "status": "ok",
        "service": "JurisAI Sovereign Legal Intelligence API",
        "version": "2.0.0",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok", "service": "JurisAI API v2.0"}


@app.get("/api/llm/status", tags=["Health"])
def get_llm_status():
    """Returns current active LLM provider (Groq LPU vs Gemini vs Local Offline Engine)."""
    rag = get_rag_service()
    has_groq = bool(getattr(rag, "groq_api_key", ""))
    has_gemini = bool(getattr(rag, "gemini_api_key", ""))

    if has_groq:
        provider = "Groq LPU Engine"
        speed = "Ultra-Fast (~500-800 tok/sec)"
    elif has_gemini:
        provider = "Google Gemini"
        speed = "Standard Cloud"
    else:
        provider = "JurisAI Local Engine"
        speed = "Instant Local (Offline ChromaDB)"

    return {
        "provider": provider,
        "active_model": getattr(rag, "_last_model_used", "JurisAI Statutory Engine"),
        "groq_configured": has_groq,
        "gemini_configured": has_gemini,
        "speed": speed,
    }


# ─── AUTH ────────────────────────────────────────────────────────────────────

@app.post("/api/auth/signup", response_model=schemas.TokenResponse,
          status_code=status.HTTP_201_CREATED, tags=["Auth"])
def signup(payload: schemas.SignupRequest, db: Session = Depends(get_db)):
    clean_email = payload.email.strip().lower()
    if db.query(models.User).filter(func.lower(models.User.email) == clean_email).first():
        raise HTTPException(400, "An account with this email already exists.")

    user = models.User(
        email=clean_email,
        hashed_password=auth.hash_password(payload.password),
        full_name=payload.full_name.strip() if payload.full_name else clean_email.split('@')[0],
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = auth.create_access_token({"sub": user.email})
    return schemas.TokenResponse(
        access_token=token,
        user={"id": user.id, "email": user.email, "full_name": user.full_name,
              "profile_image": user.profile_image,
              "is_pro": user.is_pro, "query_count": user.query_count,
              "daily_query_count": user.daily_query_count,
              "last_query_date": user.last_query_date},
    )


@app.post("/api/auth/login", response_model=schemas.TokenResponse, tags=["Auth"])
def login(payload: schemas.LoginRequest, db: Session = Depends(get_db)):
    clean_email = payload.email.strip().lower()
    user = db.query(models.User).filter(func.lower(models.User.email) == clean_email).first()
    if not user or not auth.verify_password(payload.password, user.hashed_password):
        raise HTTPException(401, "Invalid email or password.")

    token = auth.create_access_token({"sub": user.email})
    return schemas.TokenResponse(
        access_token=token,
        user={"id": user.id, "email": user.email, "full_name": user.full_name,
              "profile_image": user.profile_image,
              "is_pro": user.is_pro, "query_count": user.query_count,
              "daily_query_count": user.daily_query_count,
              "last_query_date": user.last_query_date},
    )


@app.get("/api/auth/me", response_model=schemas.UserResponse, tags=["Auth"])
def get_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user


@app.patch("/api/auth/profile", response_model=schemas.UserResponse, tags=["Auth"])
def update_profile(
    payload: schemas.ProfileUpdateRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """Update user profile: full name, avatar profile image, or password."""
    if payload.full_name is not None and payload.full_name.strip():
        current_user.full_name = payload.full_name.strip()[:100]

    if payload.profile_image is not None:
        current_user.profile_image = payload.profile_image

    if payload.whatsapp_number is not None:
        current_user.whatsapp_number = payload.whatsapp_number.strip()[:30]

    if payload.new_password:
        if not payload.current_password:
            raise HTTPException(400, "Current password is required to change password.")
        if not auth.verify_password(payload.current_password, current_user.hashed_password):
            raise HTTPException(400, "Current password is incorrect.")
        if len(payload.new_password) < 8:
            raise HTTPException(400, "New password must be at least 8 characters long.")
        current_user.hashed_password = auth.hash_password(payload.new_password)

    db.commit()
    db.refresh(current_user)
    return current_user


@app.patch("/api/auth/upgrade", response_model=schemas.UserResponse, tags=["Auth"])
def toggle_pro(
    action: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """Toggle or set Pro/Free tier — supports explicit upgrade/downgrade or toggle."""
    if action == "upgrade":
        current_user.is_pro = True
    elif action == "downgrade":
        current_user.is_pro = False
    else:
        current_user.is_pro = not current_user.is_pro
    db.commit()
    db.refresh(current_user)
    return current_user


# ─── FORGOT / RESET PASSWORD ─────────────────────────────────────────────────

@app.post("/api/auth/forgot-password", response_model=schemas.MessageResponse, tags=["Auth"])
def forgot_password(payload: schemas.ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Generate a password-reset token and email the user a link.
    Always returns success to prevent email enumeration.
    """
    clean_email = payload.email.strip().lower()
    user = db.query(models.User).filter(func.lower(models.User.email) == clean_email).first()
    if user:
        token = auth.create_reset_token()
        user.reset_token = token
        user.reset_token_expiry = datetime.utcnow() + timedelta(minutes=15)
        db.commit()
        auth.send_reset_email(user.email, token)

    return schemas.MessageResponse(
        message="If an account with this email exists, a password reset link has been sent."
    )


@app.post("/api/auth/reset-password", response_model=schemas.MessageResponse, tags=["Auth"])
def reset_password(payload: schemas.ResetPasswordRequest, db: Session = Depends(get_db)):
    """Validate reset token and update password."""
    if len(payload.new_password) < 8:
        raise HTTPException(400, "Password must be at least 8 characters.")

    user = db.query(models.User).filter(models.User.reset_token == payload.token).first()
    if not user or not user.reset_token_expiry:
        raise HTTPException(400, "Invalid or expired reset link. Please request a new one.")
    if datetime.utcnow() > user.reset_token_expiry:
        raise HTTPException(400, "This reset link has expired (15 min). Please request a new one.")

    user.hashed_password = auth.hash_password(payload.new_password)
    user.reset_token = None
    user.reset_token_expiry = None
    db.commit()

    return schemas.MessageResponse(message="Password updated successfully. You can now log in.")


# ─── CASES ───────────────────────────────────────────────────────────────────

@app.get("/api/cases", response_model=list[schemas.CaseItem], tags=["Cases"])
def list_cases(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """Return all cases for current user, newest first."""
    cases = (
        db.query(models.Case)
        .filter(models.Case.user_id == current_user.id)
        .order_by(models.Case.updated_at.desc())
        .all()
    )
    result = []
    for c in cases:
        result.append(schemas.CaseItem(
            id=c.id,
            name=c.name,
            created_at=c.created_at,
            updated_at=c.updated_at,
            query_count=len(c.queries),
        ))
    return result


@app.get("/api/cases/{case_id}", response_model=schemas.CaseDetail, tags=["Cases"])
def get_case(
    case_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """Get all queries inside a specific case."""
    case = db.query(models.Case).filter(
        models.Case.id == case_id,
        models.Case.user_id == current_user.id,
    ).first()
    if not case:
        raise HTTPException(404, "Case not found.")
    return schemas.CaseDetail(
        id=case.id,
        name=case.name,
        created_at=case.created_at,
        queries=case.queries,
    )


@app.patch("/api/cases/{case_id}", response_model=schemas.CaseItem, tags=["Cases"])
def rename_case(
    case_id: int,
    payload: schemas.RenameCaseRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """Rename a legal case."""
    case = db.query(models.Case).filter(
        models.Case.id == case_id,
        models.Case.user_id == current_user.id,
    ).first()
    if not case:
        raise HTTPException(404, "Case not found.")
    if not payload.name.strip():
        raise HTTPException(400, "Case name cannot be empty.")

    case.name = payload.name.strip()[:120]
    case.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(case)
    return schemas.CaseItem(
        id=case.id, name=case.name,
        created_at=case.created_at, updated_at=case.updated_at,
        query_count=len(case.queries),
    )


@app.delete("/api/cases/{case_id}", response_model=schemas.MessageResponse, tags=["Cases"])
def delete_case(
    case_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """Delete a case and all its queries."""
    case = db.query(models.Case).filter(
        models.Case.id == case_id,
        models.Case.user_id == current_user.id,
    ).first()
    if not case:
        raise HTTPException(404, "Case not found.")
    db.delete(case)
    db.commit()
    return schemas.MessageResponse(message="Case deleted.")


# ─── QUERY ───────────────────────────────────────────────────────────────────

@app.post("/api/query", response_model=schemas.QueryResponse, tags=["Query"])
def run_query(
    payload: schemas.QueryRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """Main RAG query endpoint — auto-creates a case if no case_id provided."""

    # Validate input
    q = (payload.query or payload.query_text or "").strip()
    if not q:
        raise HTTPException(400, "Query cannot be empty.")
    if len(q) < 10:
        raise HTTPException(400, "Please describe your legal situation in more detail (min 10 chars).")

    # Reset daily counter on new day (IST = UTC+5:30)
    ist_now = datetime.utcnow() + timedelta(hours=5, minutes=30)
    today_str = ist_now.date().isoformat()
    if current_user.last_query_date != today_str:
        current_user.daily_query_count = 0
        current_user.last_query_date = today_str

    # Free tier limit: 5 queries/day
    if not current_user.is_pro and current_user.daily_query_count >= 5:
        raise HTTPException(
            429,
            "Daily limit of 5 free queries reached. "
            "Upgrade to Pro for unlimited queries + Supreme Court precedents.",
        )

    # Resolve / create case
    conversation_history = []
    if payload.case_id:
        case = db.query(models.Case).filter(
            models.Case.id == payload.case_id,
            models.Case.user_id == current_user.id,
        ).first()
        if not case:
            raise HTTPException(404, "Case not found.")

        # Load previous conversation turns for this case to preserve case continuity
        prev_logs = (
            db.query(models.QueryLog)
            .filter(models.QueryLog.case_id == case.id)
            .order_by(models.QueryLog.created_at.asc())
            .all()
        )
        for pl in prev_logs:
            try:
                rj = json.loads(pl.response_json) if isinstance(pl.response_json, str) else pl.response_json
                summary_text = rj.get("plain_english_summary", "") if isinstance(rj, dict) else ""
            except Exception:
                summary_text = ""
            conversation_history.append({
                "query": pl.query_text,
                "summary": summary_text[:400],
            })
    else:
        # Auto-name from first 80 chars of query
        case_name = q[:80] + ("…" if len(q) > 80 else "")
        case = models.Case(user_id=current_user.id, name=case_name)
        db.add(case)
        db.flush()  # get case.id without full commit

    # Run RAG pipeline
    rag = get_rag_service()
    try:
        result = rag.generate(
            query=q,
            is_pro=current_user.is_pro,
            language=payload.language or "en",
            conversation_history=conversation_history,
        )
    except Exception as e:
        print(f"[RECOVERY] Exception during query generation ({e}). Falling back to sovereign statutory engine.")
        result = rag._synthesize_offline_response(
            query=q,
            retrieved_docs=[],
            is_pro=current_user.is_pro,
            language=payload.language or "en",
            conversation_history=conversation_history,
        )

    # Persist log
    log = models.QueryLog(
        user_id=current_user.id,
        case_id=case.id,
        query_text=q,
        response_json=json.dumps(result),
    )
    db.add(log)

    # Update counters and case timestamp
    current_user.query_count += 1
    current_user.daily_query_count += 1
    case.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(log)

    cleaned_statutes = []
    for s in result.get("applicable_statutes", []):
        if isinstance(s, dict):
            try:
                cleaned_statutes.append(
                    schemas.StatuteItem(
                        title=str(s.get("title", "") or "Statute"),
                        citation=str(s.get("citation", "") or "N/A"),
                        excerpt=str(s.get("excerpt", "") or ""),
                        doc_type=str(s.get("doc_type", "") or "Statute"),
                    )
                )
            except Exception:
                pass

    cleaned_precedents = []
    for p in result.get("relevant_precedents", []):
        if isinstance(p, dict):
            try:
                cleaned_precedents.append(
                    schemas.PrecedentItem(
                        title=str(p.get("title", "") or "Precedent"),
                        citation=str(p.get("citation", "") or "N/A"),
                        court=str(p.get("court", "") or "Supreme Court of India"),
                        year=str(p.get("year", "") or ""),
                        holding=str(p.get("holding", "") or ""),
                    )
                )
            except Exception:
                pass

    return schemas.QueryResponse(
        plain_english_summary=str(result.get("plain_english_summary", "")),
        applicable_statutes=cleaned_statutes,
        relevant_precedents=cleaned_precedents,
        suggested_next_steps=[str(step) for step in result.get("suggested_next_steps", []) if step],
        confidence_score=float(result.get("confidence_score") or 0.95),
        query_id=log.id,
        case_id=case.id,
        telemetry=result.get("telemetry"),
    )


# ─── HISTORY ─────────────────────────────────────────────────────────────────

@app.post("/api/legal-jargon/define", tags=["Legal Jargon"])
def define_legal_jargon(
    payload: schemas.JargonDefineRequest,
    current_user: models.User = Depends(auth.get_current_user),
):
    """Dynamically define any Indian legal jargon term using LLM with in-memory caching."""
    term = payload.term.strip()
    if not term:
        raise HTTPException(400, "Term cannot be empty.")

    rag = get_rag_service()
    if not hasattr(rag, "_jargon_cache"):
        rag._jargon_cache = {}

    clean_key = term.lower()
    if clean_key in rag._jargon_cache:
        return rag._jargon_cache[clean_key]

    prompt = (
        f"You are JurisAI Indian Legal Assistant. Explain the specific Indian legal jargon term '{term}' for a common citizen.\n"
        f"Respond strictly in a single valid JSON object with exactly two keys:\n"
        f'{{"label": "{term}", "definition": "1 or 2 concise, clear sentences defining this legal term in the context of Indian courts and statutes.", '
        f'"plainMeaning": "1 crisp sentence explaining what this practically means for a normal citizen or litigant."}}\n'
        f"No markdown, no commentary, only JSON."
    )
    try:
        raw_text = rag._generate_with_fallback(prompt)
        clean_json = raw_text.strip()
        if clean_json.startswith("```"):
            clean_json = clean_json.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
        parsed = json.loads(clean_json)
        result = {
            "label": parsed.get("label", term),
            "definition": parsed.get("definition", f"A recognized statutory procedure or legal term in Indian law concerning {term}."),
            "plainMeaning": parsed.get("plainMeaning", "Consult an advocate to understand the specific timeline and procedural impact on your case."),
        }
    except Exception as e:
        result = {
            "label": term,
            "definition": f"A specialized statutory concept in Indian judicial proceedings related to {term}.",
            "plainMeaning": "This term directly affects court procedure, filings, or evidence admissibility in your matter.",
        }

    rag._jargon_cache[clean_key] = result
    return result


@app.get("/api/history", response_model=list[schemas.QueryHistoryItem], tags=["History"])
def get_history(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """Return last 30 queries for the authenticated user."""
    logs = (
        db.query(models.QueryLog)
        .filter(models.QueryLog.user_id == current_user.id)
        .order_by(models.QueryLog.created_at.desc())
        .limit(30)
        .all()
    )
    return logs


# ─── CASE ASSISTANT & DOCUMENT CHAT ──────────────────────────────────────────

@app.post("/api/chat/sessions", response_model=schemas.DocChatDetailResponse, tags=["Document Chat"])
def create_chat_session(
    title: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """Create a new conversational case session / document chat."""
    session = models.DocChat(
        user_id=current_user.id,
        title=(title or "New Case Analysis").strip()[:100],
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    # Initial welcome assistant message
    welcome_msg = models.DocChatMessage(
        chat_id=session.id,
        role="assistant",
        content=(
            "Hello! I am your **JurisAI Case Assistant & Document Co-Pilot**.\n\n"
            "You can upload case documents (contracts, FIRs, legal notices, charge-sheets in PDF/TXT/DOCX) "
            "or simply describe what happened. I can:\n"
            "• Read and cross-examine all clauses in your documents\n"
            "• Highlight unfair terms, liabilities, or statutory violations\n"
            "• Provide strategic legal recourse under Indian law\n\n"
            "Upload a document or ask your first question to begin!"
        ),
        risk_level="none",
    )
    db.add(welcome_msg)
    db.commit()
    db.refresh(session)
    return session


@app.get("/api/chat/sessions", response_model=List[schemas.DocChatListItem], tags=["Document Chat"])
def list_chat_sessions(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """List all document chat sessions for the user (separate conversation history)."""
    sessions = (
        db.query(models.DocChat)
        .filter(models.DocChat.user_id == current_user.id)
        .order_by(models.DocChat.updated_at.desc())
        .all()
    )
    res = []
    for s in sessions:
        res.append(schemas.DocChatListItem(
            id=s.id,
            title=s.title,
            created_at=s.created_at,
            updated_at=s.updated_at,
            message_count=len(s.messages),
            document_count=len(s.documents),
        ))
    return res


@app.get("/api/chat/sessions/{session_id}", response_model=schemas.DocChatDetailResponse, tags=["Document Chat"])
def get_chat_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """Retrieve full conversation messages and uploaded documents for a session."""
    session = (
        db.query(models.DocChat)
        .filter(models.DocChat.id == session_id, models.DocChat.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(404, "Chat session not found.")
    return session


@app.delete("/api/chat/sessions/{session_id}", response_model=schemas.MessageResponse, tags=["Document Chat"])
def delete_chat_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """Delete a chat session and all attached documents/messages."""
    session = (
        db.query(models.DocChat)
        .filter(models.DocChat.id == session_id, models.DocChat.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(404, "Chat session not found.")
    db.delete(session)
    db.commit()
    return schemas.MessageResponse(message="Chat session deleted.")


@app.post("/api/chat/sessions/{session_id}/handoff", response_model=schemas.HandoffResponse, tags=["Document Chat"])
def generate_chat_handoff(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """Generates an executive legal context briefing & continuity prompt for continuing in a new session."""
    session = (
        db.query(models.DocChat)
        .filter(models.DocChat.id == session_id, models.DocChat.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(404, "Chat session not found.")

    if not session.messages:
        raise HTTPException(400, "Cannot generate continuity briefing for an empty chat session.")

    user_queries = [m.content for m in session.messages if m.role == "user"]
    asst_responses = [m.content for m in session.messages if m.role == "assistant"]
    doc_names = [d.filename for d in session.documents]

    initial_fact = user_queries[0] if user_queries else "Initial case assessment."
    follow_ups = "\n".join([f"  - Inquired: {q[:140]}" for q in user_queries[1:8]])
    docs_summary = ", ".join(doc_names) if doc_names else "None (Pure statutory scenario)"

    handoff_prompt = (
        f"=== JURISAI LEGAL CONTINUITY & FACTUAL MATRIX BRIEFING ===\n"
        f"Case Reference: {session.title} (Session ID #{session.id})\n"
        f"Advocate / Client: {current_user.full_name or 'Counsel'}\n"
        f"Date Established: {session.created_at.strftime('%d-%b-%Y') if session.created_at else 'Recent'}\n"
        f"Attached Evidence Files: {docs_summary}\n\n"
        f"--- CORE FACTUAL MATRIX ESTABLISHED ---\n"
        f"{initial_fact}\n\n"
        f"--- SUBSEQUENT INQUIRIES & ARGUMENTS ANALYZED ---\n"
        f"{follow_ups if follow_ups else '  - Comprehensive primary assessment completed.'}\n\n"
        f"--- INSTRUCTIONS FOR SENIOR COUNSEL IN THIS NEW SESSION ---\n"
        f"1. You possess complete factual and statutory continuity with the entire matter described above.\n"
        f"2. Maintain strict alignment with Bharatiya Nyaya Sanhita, BNSS, BSA, CPC, and applicable Indian Central Acts.\n"
        f"3. Do not ask the user to re-explain facts or dates already stated.\n"
        f"4. Acknowledge this case brief with a 2-line confirmation of established facts, and prompt for the next strategic phase or question."
    )

    summary = f"Case continuity profile for '{session.title}': {len(user_queries)} client inquiries, {len(asst_responses)} judicial analyses, and {len(session.documents)} attached evidence document(s)."
    key_issues = [q[:120] for q in user_queries[:5]]

    return schemas.HandoffResponse(
        session_id=session.id,
        session_title=session.title,
        handoff_prompt=handoff_prompt,
        summary=summary,
        key_issues=key_issues,
    )


@app.post("/api/chat/sessions/{session_id}/continue-in-new", response_model=schemas.DocChatDetailResponse, tags=["Document Chat"])
def continue_in_new_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """Clones case memory & evidence into a brand new chat session with zero clutter."""
    orig = (
        db.query(models.DocChat)
        .filter(models.DocChat.id == session_id, models.DocChat.user_id == current_user.id)
        .first()
    )
    if not orig:
        raise HTTPException(404, "Original chat session not found.")

    new_title = (orig.title + " (Continuation)")[:100]

    prior_queries = [m.content for m in orig.messages if m.role == "user"]
    summary_parts = [
        f"PARENT SESSION ID: #{orig.id} ('{orig.title}')",
        "QUESTIONS ASKED BY USER IN PRIOR SESSION:"
    ]
    for idx, pq in enumerate(prior_queries, 1):
        summary_parts.append(f"{idx}. {pq}")
    context_summary_str = "\n".join(summary_parts)

    new_session = models.DocChat(
        user_id=current_user.id,
        title=new_title,
        parent_session_id=orig.id,
        context_summary=context_summary_str,
    )
    db.add(new_session)
    db.flush()

    for doc in orig.documents:
        cloned_doc = models.UploadedDoc(
            chat_id=new_session.id,
            user_id=current_user.id,
            filename=doc.filename,
            file_size=doc.file_size,
            extracted_text=doc.extracted_text,
        )
        db.add(cloned_doc)

    inquiries_list = "\n".join([f"• {q}" for q in prior_queries]) if prior_queries else "• Prior consultation inquiries inherited."

    intro_content = (
        f"### 🏛️ Case Continuity Context Transferred\n\n"
        f"**Continued from Session:** *{orig.title}* (Session #{orig.id})\n"
        f"**Inherited Evidence Files:** {len(orig.documents)} file(s) attached and ready for statutory evaluation.\n\n"
        f"**Prior Inquiries & Questions Asked in Previous Session:**\n"
        f"{inquiries_list}\n\n"
        f"---\n"
        f"⚖️ *JurisAI Senior Co-Pilot has full memory of your previous questions, facts, and evidence. You do not need to repeat past facts. How would you like to proceed with the next phase?*"
    )

    init_msg = models.DocChatMessage(
        chat_id=new_session.id,
        role="assistant",
        content=intro_content,
        risk_level="none",
    )
    db.add(init_msg)
    new_session.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(new_session)

    return new_session


@app.post("/api/chat/sessions/from-case/{case_id}", response_model=schemas.DocChatDetailResponse, tags=["Document Chat"])
def transfer_case_to_chat(
    case_id: int,
    title: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """Converts a Dashboard Case with its sequential turns into a dedicated Document Case Chat."""
    case = (
        db.query(models.Case)
        .filter(models.Case.id == case_id, models.Case.user_id == current_user.id)
        .first()
    )
    if not case:
        raise HTTPException(404, "Case not found.")

    new_session = models.DocChat(
        user_id=current_user.id,
        title=(title or f"Case Study: {case.name}")[:100],
    )
    db.add(new_session)
    db.flush()

    queries = sorted(case.queries, key=lambda q: q.created_at) if case.queries else []
    if queries:
        for q in queries:
            db.add(models.DocChatMessage(
                chat_id=new_session.id,
                role="user",
                content=q.query_text,
                created_at=q.created_at,
            ))
            db.add(models.DocChatMessage(
                chat_id=new_session.id,
                role="assistant",
                content=q.plain_english_summary,
                created_at=q.created_at,
            ))
    else:
        db.add(models.DocChatMessage(
            chat_id=new_session.id,
            role="assistant",
            content=f"🏛️ Transferred from Dashboard Case: **{case.name}**. Ready for deep multi-turn legal analysis.",
        ))

    db.commit()
    db.refresh(new_session)
    return new_session


@app.post("/api/chat/sessions/{session_id}/upload", response_model=schemas.UploadedDocResponse, tags=["Document Chat"])
async def upload_chat_document(
    session_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """Upload a legal file (PDF, TXT, DOCX), extract text, and attach to session."""
    session = (
        db.query(models.DocChat)
        .filter(models.DocChat.id == session_id, models.DocChat.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(404, "Chat session not found.")

    content_bytes = await file.read()
    if len(content_bytes) > 25 * 1024 * 1024:
        raise HTTPException(400, "File size exceeds 25MB limit.")

    extracted = document_parser.extract_text_from_file(file.filename, content_bytes)
    sanitized_text, pii_meta = pii_redactor.redact_pii(extracted)

    doc = models.UploadedDoc(
        chat_id=session.id,
        user_id=current_user.id,
        filename=file.filename,
        file_size=len(content_bytes),
        extracted_text=sanitized_text,
    )
    db.add(doc)

    # Auto-rename session if it has default title
    if session.title == "New Case Analysis":
        clean_title = file.filename.rsplit(".", 1)[0].replace("_", " ").replace("-", " ")
        session.title = f"Case: {clean_title[:35]}"

    # Add confirmation message in chat with DPDP Act 2023 Shield status
    size_kb = max(1, round(len(content_bytes) / 1024))
    redaction_note = ""
    if pii_meta.get("is_sanitized"):
        redaction_items = [f"{v} {k}" for k, v in pii_meta.get("breakdown", {}).items() if v > 0]
        redaction_note = (
            f"\n\n🛡️ **DPDP Act 2023 Shield:** Sanitized {pii_meta['total_redacted']} sensitive identifiers "
            f"({', '.join(redaction_items)}) before vector indexing to ensure client privacy."
        )

    sys_msg = models.DocChatMessage(
        chat_id=session.id,
        role="assistant",
        content=(
            f"📄 **Document Attached:** `{file.filename}` ({size_kb} KB){redaction_note}\n\n"
            f"I have parsed the document. You can now ask me to:\n"
            f"• Summarize key obligations & risks\n"
            f"• Check for legal compliance under Indian law\n"
            f"• Identify one-sided or unfair clauses"
        ),
        file_name=file.filename,
        risk_level="low",
    )
    db.add(sys_msg)
    session.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(doc)

    # Backup raw uploaded file to Neon Object Storage
    if storage.is_storage_configured():
        storage_key = f"cases/{session.id}/{doc.id}_{file.filename}"
        storage.upload_document(
            file_bytes=content_bytes,
            key=storage_key,
            content_type=file.content_type,
        )

    return doc


@app.get("/api/chat/documents/{doc_id}/download", tags=["Document Chat"])
def download_chat_document(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """Download an uploaded legal file via secure presigned Neon Object Storage URL."""
    doc = db.query(models.UploadedDoc).filter(
        models.UploadedDoc.id == doc_id,
        models.UploadedDoc.user_id == current_user.id
    ).first()
    if not doc:
        raise HTTPException(404, "Document not found.")

    storage_key = f"cases/{doc.chat_id}/{doc.id}_{doc.filename}"
    presigned_url = storage.generate_presigned_download_url(storage_key)
    if presigned_url:
        return {"download_url": presigned_url, "filename": doc.filename}

    return {"content": doc.extracted_text, "filename": doc.filename}


@app.get("/api/neon/status", tags=["System"])
def get_neon_status(db: Session = Depends(get_db)):
    """Diagnostic endpoint verifying all connected Neon Cloud services."""
    import os
    from sqlalchemy import text

    # 1. Lakebase Postgres
    try:
        pg_res = db.execute(text("SELECT current_database(), current_user, version();")).fetchone()
        pg_status = {
            "status": "connected",
            "database": pg_res[0],
            "user": pg_res[1],
            "version": pg_res[2].split(" ")[0] + " " + pg_res[2].split(" ")[1],
        }
    except Exception as e:
        pg_status = {"status": "error", "error": str(e)}

    # 2. Object Storage
    storage_status = {
        "configured": storage.is_storage_configured(),
        "bucket": storage.DEFAULT_BUCKET,
        "region": storage.AWS_REGION,
    }

    # 3. Realtime
    rt_url = os.getenv("NEON_REALTIME_URL")
    realtime_status = {
        "configured": bool(rt_url),
        "endpoint": rt_url,
    }

    return {
        "branch": os.getenv("NEON_BRANCH", "production"),
        "branch_id": os.getenv("NEON_BRANCH_ID"),
        "postgres": pg_status,
        "object_storage": storage_status,
        "realtime": realtime_status,
    }


@app.post("/api/redact/preview", tags=["Privacy & Compliance"])
def redact_preview_endpoint(
    payload: schemas.RedactRequest,
    current_user: models.User = Depends(auth.get_current_user),
):
    """Sanitize arbitrary text and return redacted version + DPDP 2023 audit breakdown."""
    sanitized, meta = pii_redactor.redact_pii(payload.text)
    return {"sanitized_text": sanitized, **meta}


@app.post("/api/security/certificate", tags=["Privacy & Compliance"])
def generate_security_certificate(
    payload: Optional[schemas.CertificateGenerateRequest] = None,
    current_user: models.User = Depends(auth.get_current_user),
):
    """
    Generate an official DPDP Act 2023 & Section 132 BSA 2023 Compliance
    Attestation Certificate for the logged-in advocate or chamber.
    """
    adv_name = (payload.advocate_name if payload else None) or current_user.full_name or "Advocate"
    chamber = (payload.chamber_name if payload else None) or f"Chamber of {adv_name}"
    enrolment = (payload.bar_enrolment if payload else None) or "Verified State Bar Council"

    cert = pii_redactor.issue_dpdp_chamber_certificate(
        advocate_name=adv_name,
        chamber_name=chamber,
        bar_enrolment=enrolment,
        user_email=current_user.email,
    )
    return cert


@app.post("/api/chat/sessions/{session_id}/message", tags=["Document Chat"])
def send_chat_message(
    session_id: int,
    payload: schemas.DocChatMessageRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """Send user message and receive AI legal analysis referencing uploaded documents."""
    session = (
        db.query(models.DocChat)
        .filter(models.DocChat.id == session_id, models.DocChat.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(404, "Chat session not found.")

    q = payload.message.strip()
    if not q:
        raise HTTPException(400, "Message cannot be empty.")

    # Save user message
    user_msg = models.DocChatMessage(
        chat_id=session.id,
        role="user",
        content=q,
    )
    db.add(user_msg)
    db.commit()

    # Aggregate extracted document text from all session docs
    combined_docs = "\n\n".join(
        f"--- DOCUMENT: {d.filename} ---\n{document_parser.sanitize_extracted_text(d.extracted_text or '')}"
        for d in session.documents
    )

    # Prepare chat history from current session
    curr_messages = (
        db.query(models.DocChatMessage)
        .filter(models.DocChatMessage.chat_id == session.id)
        .order_by(models.DocChatMessage.id.asc())
        .all()
    )
    history = [
        {"role": m.role, "content": m.content}
        for m in curr_messages[-8:]
    ]

    # Prepare parent session history if continued from earlier chat (or fallback to latest prior chat)
    parent_history = []
    parent_sid = session.parent_session_id
    if not parent_sid:
        last_prior = (
            db.query(models.DocChat)
            .filter(models.DocChat.user_id == current_user.id, models.DocChat.id != session.id)
            .order_by(models.DocChat.id.desc())
            .first()
        )
        if last_prior:
            parent_sid = last_prior.id

    if parent_sid:
        p_msgs = (
            db.query(models.DocChatMessage)
            .filter(models.DocChatMessage.chat_id == parent_sid)
            .order_by(models.DocChatMessage.id.asc())
            .all()
        )
        for pm in p_msgs:
            parent_history.append({"role": pm.role, "content": pm.content})

    # Generate response via RAG service with continuous cross-session memory
    rag = get_rag_service()
    ai_result = rag.chat_with_document(
        query=q,
        document_context=combined_docs,
        chat_history=history,
        parent_chat_history=parent_history,
        context_summary=session.context_summary or "",
        tone=payload.tone or payload.mode or ("counsel" if getattr(payload, "think_mode", False) else "citizen"),
        language=payload.language or payload.target_language or "en",
        think_mode=getattr(payload, "think_mode", False),
    )

    # Save assistant message
    ai_msg = models.DocChatMessage(
        chat_id=session.id,
        role="assistant",
        content=ai_result["content"],
        risk_level=ai_result["risk_level"],
    )
    db.add(ai_msg)
    session.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(ai_msg)

    return {
        "user_message": schemas.DocChatMessageResponse.from_orm(user_msg),
        "assistant_message": schemas.DocChatMessageResponse.from_orm(ai_msg),
    }


# ── Limitation Calculator Endpoints ──────────────────────────────────────────

@app.get("/api/limitation/presets", tags=["Court Limitation"])
def get_limitation_presets(
    current_user: models.User = Depends(auth.get_current_user),
):
    """Retrieve all Indian statutory limitation presets (Limitation Act, BNSS, NI Act, CPC)."""
    return limitation_service.get_all_presets()


@app.post("/api/limitation/calculate", tags=["Court Limitation"])
def calculate_statutory_limitation(
    payload: schemas.LimitationCalculateRequest,
    current_user: models.User = Depends(auth.get_current_user),
):
    """Calculate exact statutory deadline, days remaining, court closed rule, and Sec 5 condonation strategy."""
    try:
        return limitation_service.calculate_limitation(
            preset_id=payload.preset_id,
            cause_of_action_date_str=payload.cause_of_action_date,
            reference_date_str=payload.reference_date,
        )
    except ValueError as e:
        raise HTTPException(400, str(e))


# ── Synoptical Notes & Chronology of Dates Endpoints ─────────────────────────

@app.post("/api/chronology/extract", tags=["Court Chronology"])
def extract_dates_and_events(
    payload: schemas.ChronologyExtractRequest,
    current_user: models.User = Depends(auth.get_current_user),
):
    """Extract court-standard chronological List of Dates & Events from legal text."""
    if not payload.text or not payload.text.strip():
        raise HTTPException(400, "Text content is required.")
    rag = get_rag_service()
    events = rag.extract_chronology(payload.text, language=payload.language or "en")
    return {"events": events}


@app.post("/api/chronology/upload-and-extract", tags=["Court Chronology"])
async def upload_and_extract_chronology(
    file: UploadFile = File(...),
    language: Optional[str] = "en",
    current_user: models.User = Depends(auth.get_current_user),
):
    """Upload FIR, contract, or case file and automatically construct List of Dates & Events."""
    content_bytes = await file.read()
    if len(content_bytes) > 25 * 1024 * 1024:
        raise HTTPException(400, "File size exceeds 25MB limit.")
    extracted = document_parser.extract_text_from_file(file.filename, content_bytes)
    rag = get_rag_service()
    events = rag.extract_chronology(extracted, language=language or "en")
    return {
        "filename": file.filename,
        "events": events,
    }


# ── Judicial Precedent & Citation Lookup Endpoints ───────────────────────────

@app.get("/api/precedents/search", tags=["Precedents & Citations"])
def search_precedents(
    q: Optional[str] = "",
    current_user: models.User = Depends(auth.get_current_user),
):
    """Search curated Indian Supreme Court landmark precedents by citation, case name, act, or judge."""
    results = precedents_service.search_indexed_precedents(q or "")
    return {"results": results, "count": len(results)}


@app.get("/api/precedents/{precedent_id}", tags=["Precedents & Citations"])
def get_precedent_details(
    precedent_id: str,
    current_user: models.User = Depends(auth.get_current_user),
):
    """Retrieve full ratio, obiter dicta, and citation details of an indexed landmark."""
    item = precedents_service.get_precedent_by_id(precedent_id)
    if not item:
        raise HTTPException(404, f"Precedent '{precedent_id}' not found in indexed landmarks.")
    return item


@app.post("/api/precedents/analyze", tags=["Precedents & Citations"])
def analyze_custom_precedent(
    payload: schemas.PrecedentAnalyzeRequest,
    current_user: models.User = Depends(auth.get_current_user),
):
    """Deep analysis of ANY custom citation, case ratio, or judgment using RAG synthesis."""
    q = payload.query_or_citation.strip()
    if not q:
        raise HTTPException(400, "Query or citation is required.")

    # Check if exists in curated index first
    matched = precedents_service.search_indexed_precedents(q)
    if matched and (matched[0].get("relevance_score", 0) >= 15 or matched[0]["citation"].lower() in q.lower()):
        return {"source": "indexed", "data": matched[0]}

    # Otherwise run deep RAG analysis in the selected language
    rag = get_rag_service()
    deep_analysis = rag.lookup_precedent_deep(q, language=payload.language or "en")
    return {"source": "deep_rag", "data": deep_analysis}


# ─── LEGAL DRAFTS LOCALIZATION ───────────────────────────────────────────────

@app.post("/api/drafts/translate", response_model=schemas.DraftTranslateResponse, tags=["Legal Drafts"])
def translate_draft_content(
    payload: schemas.DraftTranslateRequest,
    current_user: models.User = Depends(auth.get_current_user),
):
    """
    Translates case facts and substantive allegations into pure, formal vernacular court pleading language
    (Kannada, Hindi, Telugu, or English) with zero awkward English contamination.
    """
    target_lang = (payload.target_language or "en").lower().strip()
    if target_lang == "en":
        return schemas.DraftTranslateResponse(
            translated_facts=payload.query_text,
            translated_allegations=payload.plain_english_summary,
            target_language="en",
        )

    rag = get_rag_service()
    translated = rag.translate_draft_sections(
        query_text=payload.query_text,
        summary=payload.plain_english_summary,
        language=target_lang,
        draft_type=payload.draft_type or "legal_notice",
    )
    return schemas.DraftTranslateResponse(
        translated_facts=translated.get("translated_facts", payload.query_text),
        translated_allegations=translated.get("translated_allegations", payload.plain_english_summary),
        target_language=target_lang,
    )


# ── Court Fee & Ad-Valorem Calculator Endpoints ───────────────────────────────

@app.get("/api/court-fees/states", tags=["Court Fees & Stamp Duty"])
def get_supported_court_fee_states(
    current_user: models.User = Depends(auth.get_current_user),
):
    """Retrieve all supported Indian states with enacted Court Fees Act citations and gazette versions."""
    svc = court_fee_service.get_court_fee_service()
    return {"states": svc.get_supported_states()}


@app.get("/api/court-fees/suit-types/{state_code}", tags=["Court Fees & Stamp Duty"])
def get_court_fee_suit_types(
    state_code: str,
    current_user: models.User = Depends(auth.get_current_user),
):
    """Retrieve suit categories and valuation rules for a selected state."""
    svc = court_fee_service.get_court_fee_service()
    return {"suit_types": svc.get_suit_types_for_state(state_code)}


@app.post("/api/court-fees/calculate", tags=["Court Fees & Stamp Duty"])
def calculate_court_fees_endpoint(
    payload: schemas.CourtFeeCalculateRequest,
    current_user: models.User = Depends(auth.get_current_user),
):
    """
    Calculate statutory court fees, welfare stamps, process fees, and itemized checkout receipt
    grounded in latest state gazette schedules.
    """
    svc = court_fee_service.get_court_fee_service()
    receipt = svc.calculate_court_fee(
        state_code=payload.state_code,
        suit_type_key=payload.suit_type_key,
        claim_valuation=payload.claim_valuation,
        num_defendants=payload.num_defendants or 1,
        is_joint_possession=payload.is_joint_possession if payload.is_joint_possession is not None else True,
        annual_rent=payload.annual_rent,
    )
    return receipt


# ── Legal Document Clause Risk & Loophole Auditor Endpoints ────────────────────

@app.post("/api/chat/sessions/{session_id}/audit-clauses", tags=["Contract Risk Auditor"])
def audit_chat_session_document_clauses(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """
    Strict statutory audit of uploaded contract clauses inside a chat session.
    Checks against Section 23/27/28 Contract Act, Section 12(5) Arbitration Act,
    and binding Supreme Court precedents (Perkins Eastman, Percept D'Mark).
    """
    session = (
        db.query(models.DocChat)
        .filter(models.DocChat.id == session_id, models.DocChat.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(404, "Chat session not found.")

    if not session.documents or len(session.documents) == 0:
        raise HTTPException(400, "No document uploaded in this session to audit. Please upload a PDF or DOCX first.")

    combined_text = "\n\n".join(
        f"--- DOCUMENT: {d.filename} ---\n{document_parser.sanitize_extracted_text(d.extracted_text or '')}"
        for d in session.documents
    )
    primary_filename = session.documents[-1].filename

    auditor = contract_auditor_service.get_contract_auditor_service()
    audit_report = auditor.audit_document_clauses(combined_text, filename=primary_filename)

    # Save summary message in chat history so it persists
    crit_count = audit_report.get("critical_risks_count", 0)
    high_count = audit_report.get("high_risks_count", 0)
    health = audit_report.get("overall_health_score", 100)

    summary_content = (
        f"🛡️ **Contract Clause Risk Audit Completed: `{primary_filename}`**\n\n"
        f"• **Overall Safety Score:** **{health}/100** ({audit_report.get('statutory_compliance_badge', 'AUDITED')})\n"
        f"• **Critical / Void Ab Initio Clauses:** **{crit_count}**\n"
        f"• **High Liability / Unfair Clauses:** **{high_count}**\n\n"
        f"{audit_report.get('risk_summary', '')}"
    )

    sys_msg = models.DocChatMessage(
        chat_id=session.id,
        role="assistant",
        content=summary_content,
        risk_level="high" if crit_count > 0 else ("medium" if high_count > 0 else "low"),
    )
    db.add(sys_msg)
    session.updated_at = datetime.utcnow()
    db.commit()

    return audit_report


@app.post("/api/documents/audit-clauses", tags=["Contract Risk Auditor"])
def audit_raw_document_clauses(
    payload: schemas.ContractAuditRequest,
    current_user: models.User = Depends(auth.get_current_user),
):
    """Direct statutory audit of raw text against enacted Indian laws and Supreme Court ratios."""
    text = payload.document_text or ""
    if len(text.strip()) < 50:
        raise HTTPException(400, "Document text must be at least 50 characters to audit.")

    auditor = contract_auditor_service.get_contract_auditor_service()
    return auditor.audit_document_clauses(text, filename=payload.filename or "Agreement")


# ── Advocate Digital Diary & Cause List Daily Planner Endpoints ───────────────

@app.get("/api/diary/entries", response_model=List[schemas.DiaryEntryResponse], tags=["Advocate Diary"])
def get_diary_entries(
    filter: str = "all",  # "all", "today", "this_week", "this_month", "must_do", "pending"
    doc_chat_id: Optional[int] = None,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(models.AdvocateDiaryEntry).filter(models.AdvocateDiaryEntry.user_id == current_user.id)

    if doc_chat_id:
        query = query.filter(models.AdvocateDiaryEntry.doc_chat_id == doc_chat_id)

    today = date.today().strftime("%Y-%m-%d")

    if filter == "today":
        query = query.filter(models.AdvocateDiaryEntry.hearing_date == today)
    elif filter == "this_week":
        start_of_week = date.today() - timedelta(days=date.today().weekday())
        end_of_week = start_of_week + timedelta(days=6)
        query = query.filter(
            models.AdvocateDiaryEntry.hearing_date >= start_of_week.strftime("%Y-%m-%d"),
            models.AdvocateDiaryEntry.hearing_date <= end_of_week.strftime("%Y-%m-%d"),
        )
    elif filter == "this_month":
        start_of_month = date.today().replace(day=1).strftime("%Y-%m-%d")
        next_month = (date.today().replace(day=28) + timedelta(days=4)).replace(day=1)
        end_of_month = (next_month - timedelta(days=1)).strftime("%Y-%m-%d")
        query = query.filter(
            models.AdvocateDiaryEntry.hearing_date >= start_of_month,
            models.AdvocateDiaryEntry.hearing_date <= end_of_month,
        )
    elif filter == "must_do":
        query = query.filter(models.AdvocateDiaryEntry.priority == "must_do")
    elif filter == "pending":
        query = query.filter(models.AdvocateDiaryEntry.is_completed == False)

    entries = query.order_by(
        models.AdvocateDiaryEntry.hearing_date.asc(),
        models.AdvocateDiaryEntry.priority.desc(),
        models.AdvocateDiaryEntry.id.asc(),
    ).all()

    return entries


@app.get("/api/diary/stats", response_model=schemas.DiaryStatsResponse, tags=["Advocate Diary"])
def get_diary_stats(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    all_user_entries = db.query(models.AdvocateDiaryEntry).filter(models.AdvocateDiaryEntry.user_id == current_user.id).all()
    today_str = date.today().strftime("%Y-%m-%d")
    start_of_week = (date.today() - timedelta(days=date.today().weekday())).strftime("%Y-%m-%d")
    end_of_week = (date.today() - timedelta(days=date.today().weekday()) + timedelta(days=6)).strftime("%Y-%m-%d")

    total = len(all_user_entries)
    today_c = sum(1 for e in all_user_entries if e.hearing_date == today_str)
    week_c = sum(1 for e in all_user_entries if start_of_week <= e.hearing_date <= end_of_week)
    must_do_p = sum(1 for e in all_user_entries if e.priority == "must_do" and not e.is_completed)
    completed_c = sum(1 for e in all_user_entries if e.is_completed)

    return {
        "total_entries": total,
        "today_count": today_c,
        "this_week_count": week_c,
        "must_do_pending": must_do_p,
        "completed_count": completed_c,
    }


@app.post("/api/diary/entries", response_model=schemas.DiaryEntryResponse, tags=["Advocate Diary"])
def create_diary_entry(
    payload: schemas.DiaryEntryCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    entry = models.AdvocateDiaryEntry(
        user_id=current_user.id,
        doc_chat_id=payload.doc_chat_id,
        case_number=payload.case_number.strip(),
        court_name=payload.court_name.strip(),
        judge_bench=payload.judge_bench.strip() if payload.judge_bench else None,
        parties=payload.parties.strip(),
        hearing_date=payload.hearing_date.strip(),
        hearing_time=payload.hearing_time.strip() if payload.hearing_time else "10:30 AM",
        item_number=payload.item_number.strip() if payload.item_number else None,
        stage=payload.stage.strip(),
        priority=payload.priority,
        task_notes=payload.task_notes.strip() if payload.task_notes else None,
        client_name=payload.client_name.strip() if payload.client_name else None,
        client_phone=payload.client_phone.strip() if payload.client_phone else None,
        next_hearing_date=payload.next_hearing_date.strip() if payload.next_hearing_date else None,
        is_completed=False,
        disposal_status="pending",
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@app.put("/api/diary/entries/{entry_id}", response_model=schemas.DiaryEntryResponse, tags=["Advocate Diary"])
def update_diary_entry(
    entry_id: int,
    payload: schemas.DiaryEntryUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    entry = db.query(models.AdvocateDiaryEntry).filter(
        models.AdvocateDiaryEntry.id == entry_id,
        models.AdvocateDiaryEntry.user_id == current_user.id,
    ).first()
    if not entry:
        raise HTTPException(404, "Diary entry not found.")

    update_data = payload.dict(exclude_unset=True)
    for key, val in update_data.items():
        setattr(entry, key, val)

    entry.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(entry)
    return entry


@app.patch("/api/diary/entries/{entry_id}/toggle-complete", response_model=schemas.DiaryEntryResponse, tags=["Advocate Diary"])
def toggle_diary_entry_complete(
    entry_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    entry = db.query(models.AdvocateDiaryEntry).filter(
        models.AdvocateDiaryEntry.id == entry_id,
        models.AdvocateDiaryEntry.user_id == current_user.id,
    ).first()
    if not entry:
        raise HTTPException(404, "Diary entry not found.")

    entry.is_completed = not entry.is_completed
    entry.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(entry)
    return entry


@app.post("/api/diary/entries/{entry_id}/adjourn", response_model=schemas.DiaryEntryResponse, tags=["Advocate Diary"])
def adjourn_diary_entry(
    entry_id: int,
    payload: schemas.DiaryAdjournRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    entry = db.query(models.AdvocateDiaryEntry).filter(
        models.AdvocateDiaryEntry.id == entry_id,
        models.AdvocateDiaryEntry.user_id == current_user.id,
    ).first()
    if not entry:
        raise HTTPException(404, "Diary entry not found.")

    entry.next_hearing_date = payload.next_hearing_date.strip()
    entry.disposal_status = "adjourned"
    entry.is_completed = True
    if payload.order_summary:
        entry.task_notes = (entry.task_notes or "") + f"\n[Order/Outcome]: {payload.order_summary}"
    entry.updated_at = datetime.utcnow()

    # Automatically create the next hearing entry on the new date
    next_stage = payload.next_stage.strip() if payload.next_stage else entry.stage
    next_entry = models.AdvocateDiaryEntry(
        user_id=current_user.id,
        doc_chat_id=entry.doc_chat_id,
        case_number=entry.case_number,
        court_name=entry.court_name,
        judge_bench=entry.judge_bench,
        parties=entry.parties,
        hearing_date=payload.next_hearing_date.strip(),
        hearing_time=entry.hearing_time,
        item_number=None,
        stage=next_stage,
        priority=entry.priority,
        task_notes=f"Adjourned from {entry.hearing_date}. {payload.order_summary or ''}".strip(),
        client_name=entry.client_name,
        client_phone=entry.client_phone,
        is_completed=False,
        disposal_status="pending",
    )
    db.add(next_entry)
    db.commit()
    db.refresh(entry)
    return entry


@app.delete("/api/diary/entries/{entry_id}", tags=["Advocate Diary"])
def delete_diary_entry(
    entry_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    entry = db.query(models.AdvocateDiaryEntry).filter(
        models.AdvocateDiaryEntry.id == entry_id,
        models.AdvocateDiaryEntry.user_id == current_user.id,
    ).first()
    if not entry:
        raise HTTPException(404, "Diary entry not found.")

    db.delete(entry)
    db.commit()
    return {"status": "success", "message": "Hearing entry deleted successfully."}




# ─── BARE ACTS CATALOG & REPOSITORY ──────────────────────────────────────────

@app.get("/api/legal/acts/catalog", response_model=schemas.BareActsCatalogResponse, tags=["Bare Acts"])
def get_bare_acts_catalog():
    from scripts.ingest_indiacode import CENTRAL_ACTS_REGISTRY, get_stats
    import os, glob, json
    stats = get_stats()
    
    bare_acts_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "bare_acts")
    act_provision_counts = {}
    if os.path.exists(bare_acts_dir):
        for fp in glob.glob(os.path.join(bare_acts_dir, "*.json")):
            try:
                with open(fp, "r", encoding="utf-8") as jf:
                    for item in json.load(jf):
                        aid = item.get("act_id") or item.get("act_title")
                        act_provision_counts[aid] = act_provision_counts.get(aid, 0) + 1
            except Exception:
                pass
                
    acts_list = []
    domains = set()
    for act in CENTRAL_ACTS_REGISTRY:
        domains.add(act["domain"])
        prov_count = act_provision_counts.get(act["act_id"], 0)
        if prov_count == 0:
            for k, count in act_provision_counts.items():
                if k in act["title"] or act["title"] in str(k):
                    prov_count += count
        acts_list.append(schemas.BareActsCatalogItem(
            act_id=act["act_id"],
            title=act["title"],
            year=act["year"],
            domain=act["domain"],
            effective=act.get("effective"),
            repeals=act.get("repeals"),
            provision_count=prov_count
        ))
        
    return schemas.BareActsCatalogResponse(
        total_acts=len(acts_list),
        total_provisions=stats["total_verified_provisions"],
        total_domain_catalogs=stats["total_domain_files"],
        domains=sorted(list(domains)),
        acts=acts_list
    )


@app.get("/api/legal/acts/{act_id}", response_model=schemas.BareActDetailResponse, tags=["Bare Acts"])
def get_bare_act_detail(act_id: str):
    """Retrieve detailed statutory profile, what it states, when enacted, case applications, and section texts."""
    from scripts.ingest_indiacode import CENTRAL_ACTS_REGISTRY
    import bare_acts_knowledge

    found_act = None
    for act in CENTRAL_ACTS_REGISTRY:
        if act["act_id"].lower() == act_id.lower() or act["title"].lower() == act_id.lower():
            found_act = act
            break

    if not found_act:
        for act in CENTRAL_ACTS_REGISTRY:
            if act_id.lower() in act["title"].lower() or act["act_id"].lower() in act_id.lower():
                found_act = act
                break

    if not found_act:
        found_act = {
            "act_id": act_id,
            "title": act_id.replace("_", " ").title(),
            "year": 2024,
            "domain": "Central Legislation",
            "effective": "2024-07-01",
            "repeals": None,
        }

    kb = bare_acts_knowledge.get_act_knowledge(found_act["act_id"], found_act["title"], found_act["domain"])
    provisions = bare_acts_knowledge.get_act_provisions(found_act["act_id"], found_act["title"])

    return schemas.BareActDetailResponse(
        act_id=found_act["act_id"],
        title=found_act["title"],
        year=found_act["year"],
        domain=found_act["domain"],
        effective=found_act.get("effective"),
        repeals=found_act.get("repeals"),
        overview=kb["overview"],
        key_applications=kb["key_applications"],
        provisions=[schemas.BareActProvisionDetail(**p) for p in provisions],
    )
