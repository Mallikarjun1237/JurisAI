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
