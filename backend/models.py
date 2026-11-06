from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    profile_image = Column(Text, nullable=True)
    is_pro = Column(Boolean, default=False)
    query_count = Column(Integer, default=0)
    daily_query_count = Column(Integer, default=0)
    last_query_date = Column(String, nullable=True)
    # Password reset
    reset_token = Column(String, nullable=True, index=True)
    reset_token_expiry = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    queries = relationship("QueryLog", back_populates="user", cascade="all, delete")
    cases = relationship("Case", back_populates="user", cascade="all, delete")


class Case(Base):
    """A named legal case / conversation thread — groups queries together like ChatGPT conversations."""
    __tablename__ = "cases"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)  # auto-named from first query
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="cases")
    queries = relationship("QueryLog", back_populates="case", cascade="all, delete")


class QueryLog(Base):
    __tablename__ = "query_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=True)
    query_text = Column(Text, nullable=False)
    response_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="queries")
    case = relationship("Case", back_populates="queries")


class DocChat(Base):
    """Conversational case session / chat with uploaded legal documents."""
    __tablename__ = "doc_chats"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, default="New Case Analysis")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    messages = relationship("DocChatMessage", back_populates="chat", cascade="all, delete-orphan")
    documents = relationship("UploadedDoc", back_populates="chat", cascade="all, delete-orphan")


class DocChatMessage(Base):
    """Messages inside a conversational document chat session."""
    __tablename__ = "doc_chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    chat_id = Column(Integer, ForeignKey("doc_chats.id"), nullable=False)
    role = Column(String, nullable=False)  # "user" or "assistant"
    content = Column(Text, nullable=False)
    file_name = Column(String, nullable=True)
    risk_level = Column(String, nullable=True)  # "high", "medium", "low", "none"
    created_at = Column(DateTime, default=datetime.utcnow)

    chat = relationship("DocChat", back_populates="messages")


class UploadedDoc(Base):
    """Metadata and extracted text of legal files uploaded to a chat session."""
    __tablename__ = "uploaded_docs"

    id = Column(Integer, primary_key=True, index=True)
    chat_id = Column(Integer, ForeignKey("doc_chats.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename = Column(String, nullable=False)
    file_size = Column(Integer, default=0)
    extracted_text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    chat = relationship("DocChat", back_populates="documents")


class AdvocateDiaryEntry(Base):
    """
    Advocate Digital Diary & Hearing Daily Planner / Cause List.
    Stores hearing dates, case stages, item numbers, priority deadlines,
    and client follow-up notes isolated strictly per user.
    """
    __tablename__ = "advocate_diary_entries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    doc_chat_id = Column(Integer, ForeignKey("doc_chats.id"), nullable=True)
    case_number = Column(String, nullable=False)
    court_name = Column(String, nullable=False)
    judge_bench = Column(String, nullable=True)
    parties = Column(String, nullable=False)
    hearing_date = Column(String, nullable=False, index=True)  # YYYY-MM-DD
    hearing_time = Column(String, nullable=True)  # e.g. "10:30 AM"
    item_number = Column(String, nullable=True)  # e.g. "Item No. 12"
    stage = Column(String, nullable=False)  # e.g. "Cross-Examination of PW-1"
    priority = Column(String, default="must_do")  # "must_do" (Red), "intermediate" (Amber), "optional" (Blue)
    task_notes = Column(Text, nullable=True)
    client_name = Column(String, nullable=True)
    client_phone = Column(String, nullable=True)
    is_completed = Column(Boolean, default=False)
    next_hearing_date = Column(String, nullable=True)  # NDOH: YYYY-MM-DD
    disposal_status = Column(String, default="pending")  # "pending", "adjourned", "disposed"
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", backref="diary_entries")
    doc_chat = relationship("DocChat")
