from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


# ── Auth ─────────────────────────────────────────────────────────────────────

class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: Optional[str] = None
    profile_image: Optional[str] = None
    is_pro: bool
    query_count: int
    daily_query_count: int
    created_at: datetime

    class Config:
        from_attributes = True


class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    profile_image: Optional[str] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class MessageResponse(BaseModel):
    message: str


# ── Query ────────────────────────────────────────────────────────────────────

class QueryRequest(BaseModel):
    query: str
    case_id: Optional[int] = None   # if None → auto-create new case
    language: Optional[str] = "en"  # "en", "hi", "kn", "te"


class StatuteItem(BaseModel):
    title: str
    citation: str
    excerpt: str
    doc_type: str


class PrecedentItem(BaseModel):
    title: str
    citation: str
    court: str
    year: str
    holding: str


class QueryResponse(BaseModel):
    plain_english_summary: str
    applicable_statutes: List[StatuteItem]
    relevant_precedents: List[PrecedentItem]
    suggested_next_steps: List[str]
    confidence_score: float
    query_id: int
    case_id: int
    telemetry: Optional[dict] = None


class QueryHistoryItem(BaseModel):
    id: int
    query_text: str
    response_json: Optional[str]
    created_at: datetime
    case_id: Optional[int]

    class Config:
        from_attributes = True


# ── Cases ────────────────────────────────────────────────────────────────────

class CaseItem(BaseModel):
    id: int
    name: str
    created_at: datetime
    updated_at: datetime
    query_count: int = 0   # filled by endpoint

    class Config:
        from_attributes = True


class CaseDetail(BaseModel):
    id: int
    name: str
    created_at: datetime
    queries: List[QueryHistoryItem]

    class Config:
        from_attributes = True


class RenameCaseRequest(BaseModel):
    name: str


# ── Document & Case Chatbot ──────────────────────────────────────────────────

class DocChatMessageResponse(BaseModel):
    id: int
    role: str
    content: str
    file_name: Optional[str] = None
    risk_level: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class UploadedDocResponse(BaseModel):
    id: int
    filename: str
    file_size: int
    created_at: datetime

    class Config:
        from_attributes = True


class DocChatDetailResponse(BaseModel):
    id: int
    title: str
    created_at: datetime
    updated_at: datetime
    messages: List[DocChatMessageResponse] = []
    documents: List[UploadedDocResponse] = []

    class Config:
        from_attributes = True


class DocChatListItem(BaseModel):
    id: int
    title: str
    created_at: datetime
    updated_at: datetime
    message_count: int = 0
    document_count: int = 0

    class Config:
        from_attributes = True


class DocChatMessageRequest(BaseModel):
    message: str
    tone: Optional[str] = "citizen"  # "citizen" or "counsel"
    language: Optional[str] = "en"  # "en", "hi", "kn", "te"


# ── Limitation & Chronology Schemas ──────────────────────────────────────────

class LimitationCalculateRequest(BaseModel):
    preset_id: str
    cause_of_action_date: str  # YYYY-MM-DD
    reference_date: Optional[str] = None


class ChronologyExtractRequest(BaseModel):
    text: str
    language: Optional[str] = "en"  # "en", "hi", "kn", "te"


# ── Precedent & Citation Lookup Schemas ──────────────────────────────────────

class PrecedentAnalyzeRequest(BaseModel):
    query_or_citation: str
    language: Optional[str] = "en"  # "en", "hi", "kn", "te"


# ── Privacy & PII Redaction Schemas (DPDP Act 2023) ──────────────────────────

class RedactRequest(BaseModel):
    text: str


