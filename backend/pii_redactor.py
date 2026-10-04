"""
PII Redactor and Client Data Masking Module
Conforms to the Digital Personal Data Protection Act, 2023 (DPDP Act, India)
Protects sensitive litigant identity data (Aadhaar, PAN, Phone, Email, Bank Details, IFSC)
before LLM inference, vector embedding, or document indexing.
"""

import re
from typing import Dict, Any, Tuple

# Compiled regex patterns for Indian PII entities
AADHAAR_PATTERN = re.compile(r'\b[2-9]{1}\d{3}[-\s]?\d{4}[-\s]?\d{4}\b')
PAN_PATTERN = re.compile(r'\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b')
PHONE_PATTERN = re.compile(r'(?:\+?91[-\s]?|0)?[6-9]\d{9}\b')
EMAIL_PATTERN = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b')
IFSC_PATTERN = re.compile(r'\b[A-Z]{4}0[A-Z0-9]{6}\b')
BANK_ACC_PATTERN = re.compile(r'(?:A/C|Account|Acc|A/c No\.?|Account No\.?)[:\s]+(\d{9,18})\b', re.IGNORECASE)
CREDIT_CARD_PATTERN = re.compile(r'\b(?:\d{4}[-\s]?){3}\d{4}\b')
VEHICLE_NUM_PATTERN = re.compile(r'\b[A-Z]{2}[-\s]?[0-9]{1,2}[-\s]?[A-Z]{1,3}[-\s]?[0-9]{4}\b')


def mask_aadhaar(match: re.Match) -> str:
    raw = match.group(0).replace(' ', '').replace('-', '')
    last4 = raw[-4:] if len(raw) >= 4 else 'XXXX'
    return f"[REDACTED AADHAAR: XXXX-XXXX-{last4}]"


def mask_pan(match: re.Match) -> str:
    raw = match.group(0)
    prefix = raw[:2] if len(raw) >= 2 else 'XX'
    suffix = raw[-1] if len(raw) >= 1 else 'X'
    return f"[REDACTED PAN: {prefix}***{suffix}]"


def mask_phone(match: re.Match) -> str:
    raw = match.group(0).replace(' ', '').replace('-', '')
    last4 = raw[-4:] if len(raw) >= 4 else 'XXXX'
    return f"[REDACTED PHONE: +91-XXXXX-{last4}]"


def mask_email(match: re.Match) -> str:
    raw = match.group(0)
    try:
        user_part, domain = raw.split('@', 1)
        masked_user = user_part[0] + '****' if len(user_part) > 1 else '****'
        return f"[REDACTED EMAIL: {masked_user}@{domain}]"
    except Exception:
        return "[REDACTED EMAIL]"


def mask_ifsc(match: re.Match) -> str:
    raw = match.group(0)
    bank_prefix = raw[:4]
    return f"[REDACTED IFSC: {bank_prefix}0******]"


def mask_bank_acc(match: re.Match) -> str:
    acc = match.group(1)
    last4 = acc[-4:] if len(acc) >= 4 else 'XXXX'
    return match.group(0).replace(acc, f"[REDACTED A/C: ******{last4}]")


def redact_pii(text: str) -> Tuple[str, Dict[str, Any]]:
    """
    Scans input text for sensitive Indian PII entities and replaces them
    with DPDP Act 2023 compliant masked placeholders while preserving
    document readability and legal context.
    """
    if not text:
        return text, {"total_redacted": 0, "breakdown": {}}

    redacted = text
    breakdown = {
        "aadhaar": len(AADHAAR_PATTERN.findall(redacted)),
        "pan": len(PAN_PATTERN.findall(redacted)),
        "phone": len(PHONE_PATTERN.findall(redacted)),
        "email": len(EMAIL_PATTERN.findall(redacted)),
        "ifsc": len(IFSC_PATTERN.findall(redacted)),
        "bank_account": len(BANK_ACC_PATTERN.findall(redacted)),
    }

    # Apply masking
    redacted = AADHAAR_PATTERN.sub(mask_aadhaar, redacted)
    redacted = PAN_PATTERN.sub(mask_pan, redacted)
    redacted = PHONE_PATTERN.sub(mask_phone, redacted)
    redacted = EMAIL_PATTERN.sub(mask_email, redacted)
    redacted = IFSC_PATTERN.sub(mask_ifsc, redacted)
    redacted = BANK_ACC_PATTERN.sub(mask_bank_acc, redacted)

    total_redacted = sum(breakdown.values())

    meta = {
        "total_redacted": total_redacted,
        "is_sanitized": total_redacted > 0,
        "compliance": "DPDP Act, 2023 (Digital Personal Data Protection Act of India)",
        "breakdown": breakdown,
    }

    return redacted, meta
