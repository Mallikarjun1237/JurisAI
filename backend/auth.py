import bcrypt
import smtplib
import secrets
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from database import get_db
import models
import os
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "jurisai-super-secret-key-change-in-production")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

SMTP_EMAIL = os.getenv("SMTP_EMAIL", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

security = HTTPBearer()


# ── Password hashing ──────────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))


# ── JWT tokens ────────────────────────────────────────────────────────────────

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> models.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    return user


# ── Password Reset ────────────────────────────────────────────────────────────

def create_reset_token() -> str:
    """Generate a secure random 64-char hex reset token."""
    return secrets.token_hex(32)


def send_reset_email(to_email: str, token: str) -> bool:
    """
    Send password reset email via Gmail SMTP.
    Returns True on success, False on failure (no SMTP config).
    Falls back to printing token in terminal for dev/testing.
    """
    reset_url = f"{FRONTEND_URL}/reset-password?token={token}"

    html_body = f"""
    <div style="font-family: Inter, sans-serif; max-width: 560px; margin: 0 auto; background: #0a0a1a; color: #e2e8f0; padding: 40px; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="color: #6366f1; font-size: 24px; margin: 0;">⚖️ JurisAI</h1>
        <p style="color: #94a3b8; margin: 8px 0 0;">Legal Intelligence Platform</p>
      </div>
      <h2 style="font-size: 20px; margin-bottom: 16px;">Reset your password</h2>
      <p style="color: #94a3b8; line-height: 1.6;">
        We received a request to reset the password for your JurisAI account.
        Click the button below to set a new password. This link expires in <strong style="color: #e2e8f0;">15 minutes</strong>.
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="{reset_url}"
           style="background: #6366f1; color: white; padding: 14px 32px; border-radius: 8px;
                  text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">
          Reset Password
        </a>
      </div>
      <p style="color: #64748b; font-size: 13px;">
        If you didn't request this, ignore this email — your password won't change.<br/>
        Link: <a href="{reset_url}" style="color: #6366f1;">{reset_url}</a>
      </p>
    </div>
    """

    # Print to terminal always (useful for dev without SMTP config)
    print(f"\n[PASSWORD RESET] Token for {to_email}:")
    print(f"  URL: {reset_url}\n")

    if not SMTP_EMAIL or not SMTP_PASSWORD:
        print("[!] SMTP not configured — reset link printed above for testing.")
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "JurisAI — Reset your password"
        msg["From"] = f"JurisAI <{SMTP_EMAIL}>"
        msg["To"] = to_email
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.sendmail(SMTP_EMAIL, to_email, msg.as_string())

        print(f"[OK] Reset email sent to {to_email}")
        return True
    except Exception as e:
        print(f"[!] Failed to send email: {e}")
        return False
