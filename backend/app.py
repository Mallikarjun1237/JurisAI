"""
JurisAI — FastAPI Application
Endpoints: Auth, Query, History, Cases, Password Reset
"""

from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
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
from database import engine, get_db
from rag_service import get_rag_service

# Create / migrate all DB tables on startup
models.Base.metadata.create_all(bind=engine)

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
            ("query_logs", "case_id",             "ALTER TABLE query_logs ADD COLUMN case_id INTEGER REFERENCES cases(id)"),
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

app = FastAPI(
    title="JurisAI API",
    description="Legal Intelligence SaaS — RAG-powered statutory & precedent retrieval for Indian law",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── HEALTH ──────────────────────────────────────────────────────────────────

@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok", "service": "JurisAI API v2.0"}


# ─── AUTH ────────────────────────────────────────────────────────────────────

@app.post("/api/auth/signup", response_model=schemas.TokenResponse,
          status_code=status.HTTP_201_CREATED, tags=["Auth"])
def signup(payload: schemas.SignupRequest, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == payload.email).first():
        raise HTTPException(400, "An account with this email already exists.")

    user = models.User(
        email=payload.email,
        hashed_password=auth.hash_password(payload.password),
        full_name=payload.full_name,
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
              "daily_query_count": user.daily_query_count},
    )


@app.post("/api/auth/login", response_model=schemas.TokenResponse, tags=["Auth"])
def login(payload: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user or not auth.verify_password(payload.password, user.hashed_password):
        raise HTTPException(401, "Invalid email or password.")

    token = auth.create_access_token({"sub": user.email})
    return schemas.TokenResponse(
        access_token=token,
        user={"id": user.id, "email": user.email, "full_name": user.full_name,
              "profile_image": user.profile_image,
              "is_pro": user.is_pro, "query_count": user.query_count,
              "daily_query_count": user.daily_query_count},
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
    user = db.query(models.User).filter(models.User.email == payload.email).first()
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
    q = (payload.query or "").strip()
    if not q:
        raise HTTPException(400, "Query cannot be empty.")
    if len(q) < 10:
        raise HTTPException(400, "Please describe your legal situation in more detail (min 10 chars).")

    # Reset daily counter on new day
    today_str = date.today().isoformat()
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
    if payload.case_id:
        case = db.query(models.Case).filter(
            models.Case.id == payload.case_id,
            models.Case.user_id == current_user.id,
        ).first()
        if not case:
            raise HTTPException(404, "Case not found.")
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
        )
    except RuntimeError as e:
        raise HTTPException(503, str(e))

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

    return schemas.QueryResponse(
        plain_english_summary=result.get("plain_english_summary", ""),
        applicable_statutes=[
            schemas.StatuteItem(**s)
            for s in result.get("applicable_statutes", [])
            if isinstance(s, dict)
        ],
        relevant_precedents=[
            schemas.PrecedentItem(**p)
            for p in result.get("relevant_precedents", [])
            if isinstance(p, dict)
        ],
        suggested_next_steps=result.get("suggested_next_steps", []),
        confidence_score=result.get("confidence_score", 0.0),
        query_id=log.id,
        case_id=case.id,
        telemetry=result.get("telemetry"),
    )


# ─── HISTORY ─────────────────────────────────────────────────────────────────

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
    return doc


@app.post("/api/redact/preview", tags=["Privacy & Compliance"])
def redact_preview_endpoint(
    payload: schemas.RedactRequest,
    current_user: models.User = Depends(auth.get_current_user),
):
    """Sanitize arbitrary text and return redacted version + DPDP 2023 audit breakdown."""
    sanitized, meta = pii_redactor.redact_pii(payload.text)
    return {"sanitized_text": sanitized, **meta}


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
        f"--- DOCUMENT: {d.filename} ---\n{d.extracted_text}"
        for d in session.documents
    )

    # Prepare chat history
    history = [
        {"role": m.role, "content": m.content}
        for m in session.messages[-8:]
    ]

    # Generate response via RAG service
    rag = get_rag_service()
    ai_result = rag.chat_with_document(
        query=q,
        document_context=combined_docs,
        chat_history=history,
        tone=payload.tone or "citizen",
        language=payload.language or "en",
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
