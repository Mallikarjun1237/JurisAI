import os
import socket
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# 1. Load project root .env.local if present, then backend .env
_backend_dir = os.path.dirname(os.path.abspath(__file__))
_root_dir = os.path.dirname(_backend_dir)
_env_local = os.path.join(_root_dir, ".env.local")
if os.path.exists(_env_local):
    load_dotenv(_env_local, override=True)
load_dotenv(os.path.join(_backend_dir, ".env"))

_default_db_path = os.path.join(_backend_dir, "jurisai.db").replace("\\", "/")
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL or DATABASE_URL == "sqlite:///./jurisai.db":
    DATABASE_URL = f"sqlite:///{_default_db_path}"

# 2. Normalize PostgreSQL driver URL for SQLAlchemy with psycopg2
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg2://", 1)
elif DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)

connect_args = {}
engine_kwargs = {}

if DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False
else:
    # PostgreSQL / Neon configuration
    # Check if local DNS fails to resolve neon host; fallback to direct IP if needed
    try:
        from urllib.parse import urlparse
        parsed = urlparse(DATABASE_URL)
        if parsed.hostname and "c-5.ap-southeast-1.aws.neon.tech" in parsed.hostname:
            try:
                socket.getaddrinfo(parsed.hostname, parsed.port or 5432)
            except socket.gaierror:
                # Local DNS refused or failed resolution; provide known endpoint IP
                connect_args["hostaddr"] = "54.255.3.74"
    except Exception:
        pass

    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_recycle"] = 300
    engine_kwargs["pool_size"] = 10
    engine_kwargs["max_overflow"] = 20

engine = create_engine(DATABASE_URL, connect_args=connect_args, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
