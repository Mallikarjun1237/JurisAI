from pydantic import BaseModel, EmailStr
from typing import Optional, List, Union
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
    whatsapp_number: Optional[str] = None
    is_pro: bool
    query_count: int
    daily_query_count: int
    last_query_date: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    profile_image: Optional[str] = None
    whatsapp_number: Optional[str] = None
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
    query: Optional[str] = None
    query_text: Optional[str] = None
    case_id: Optional[int] = None
    language: Optional[str] = "en"


class StatuteItem(BaseModel):
    title: str = ""
    citation: str = ""
    excerpt: str = ""
    doc_type: str = "Statute"


class PrecedentItem(BaseModel):
    title: str = ""
    citation: str = ""
    court: str = "Supreme Court of India"
    year: Union[str, int] = ""
    holding: str = ""


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
    parent_session_id: Optional[int] = None
    context_summary: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    messages: List[DocChatMessageResponse] = []
    documents: List[UploadedDocResponse] = []

    class Config:
        from_attributes = True


class DocChatListItem(BaseModel):
    id: int
    title: str
    parent_session_id: Optional[int] = None
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
    target_language: Optional[str] = None
    mode: Optional[str] = None
    think_mode: Optional[bool] = False  # "en", "hi", "kn", "te"


class HandoffResponse(BaseModel):
    session_id: int
    session_title: str
    handoff_prompt: str
    summary: str
    key_issues: List[str] = []


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


# ── Legal Draft Localization Schemas ─────────────────────────────────────────

class DraftTranslateRequest(BaseModel):
    query_text: str
    plain_english_summary: str
    target_language: str  # "kn", "hi", "te", "en"
    draft_type: Optional[str] = "legal_notice"


class DraftTranslateResponse(BaseModel):
    translated_facts: str
    translated_allegations: str
    target_language: str


# ── Privacy & PII Redaction Schemas (DPDP Act 2023) ──────────────────────────

class RedactRequest(BaseModel):
    text: str


class CertificateGenerateRequest(BaseModel):
    advocate_name: Optional[str] = None
    chamber_name: Optional[str] = None
    bar_enrolment: Optional[str] = None


# ── Court Fee & Ad-Valorem Calculator Schemas ────────────────────────────────

class CourtFeeCalculateRequest(BaseModel):
    state_code: str = "karnataka"  # "karnataka", "telangana", "delhi", "maharashtra"
    suit_type_key: str = "money_recovery"
    claim_valuation: float
    num_defendants: Optional[int] = 1
    is_joint_possession: Optional[bool] = True
    annual_rent: Optional[float] = None


class ContractAuditRequest(BaseModel):
    document_text: Optional[str] = None
    filename: Optional[str] = "Uploaded Legal Agreement"


# ── Advocate Diary & Hearing Planner Schemas ─────────────────────────────────

class DiaryEntryCreate(BaseModel):
    case_number: str
    court_name: str
    judge_bench: Optional[str] = None
    parties: str
    hearing_date: str  # YYYY-MM-DD
    hearing_time: Optional[str] = "10:30 AM"
    item_number: Optional[str] = None
    stage: str
    priority: str = "must_do"  # "must_do", "intermediate", "optional"
    task_notes: Optional[str] = None
    client_name: Optional[str] = None
    client_phone: Optional[str] = None
    doc_chat_id: Optional[int] = None
    next_hearing_date: Optional[str] = None


class DiaryEntryUpdate(BaseModel):
    case_number: Optional[str] = None
    court_name: Optional[str] = None
    judge_bench: Optional[str] = None
    parties: Optional[str] = None
    hearing_date: Optional[str] = None
    hearing_time: Optional[str] = None
    item_number: Optional[str] = None
    stage: Optional[str] = None
    priority: Optional[str] = None
    task_notes: Optional[str] = None
    client_name: Optional[str] = None
    client_phone: Optional[str] = None
    is_completed: Optional[bool] = None
    next_hearing_date: Optional[str] = None
    disposal_status: Optional[str] = None


class DiaryAdjournRequest(BaseModel):
    next_hearing_date: str  # YYYY-MM-DD
    next_stage: Optional[str] = None
    order_summary: Optional[str] = None


class DiaryEntryResponse(BaseModel):
    id: int
    user_id: int
    doc_chat_id: Optional[int] = None
    case_number: str
    court_name: str
    judge_bench: Optional[str] = None
    parties: str
    hearing_date: str
    hearing_time: Optional[str] = None
    item_number: Optional[str] = None
    stage: str
    priority: str
    task_notes: Optional[str] = None
    client_name: Optional[str] = None
    client_phone: Optional[str] = None
    is_completed: bool
    next_hearing_date: Optional[str] = None
    disposal_status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DiaryStatsResponse(BaseModel):
    total_entries: int
    today_count: int
    this_week_count: int
    must_do_pending: int
    completed_count: int






class BareActsCatalogItem(BaseModel):
    act_id: str
    title: str
    year: int
    domain: str
    effective: Optional[str] = None
    repeals: Optional[str] = None
    provision_count: int = 0


class BareActsCatalogResponse(BaseModel):
    total_acts: int
    total_provisions: int
    total_domain_catalogs: int
    domains: List[str]
    acts: List[BareActsCatalogItem]


class BareActProvisionDetail(BaseModel):
    id: str
    section_number: str
    marginal_heading: str
    citation: str
    text: str
    enacted_year: Optional[int] = None
    effective_date: Optional[str] = None


class BareActDetailResponse(BaseModel):
    act_id: str
    title: str
    year: int
    domain: str
    effective: Optional[str] = None
    repeals: Optional[str] = None
    overview: str
    key_applications: List[str] = []
    provisions: List[BareActProvisionDetail] = []
