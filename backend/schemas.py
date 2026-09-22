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
    full_name: Optional[str]
    is_pro: bool
    query_count: int
    daily_query_count: int
    created_at: datetime

    class Config:
        from_attributes = True


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
