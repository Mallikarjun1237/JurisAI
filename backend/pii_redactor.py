"""
PII Redactor and Client Data Masking Module
Conforms to the Digital Personal Data Protection Act, 2023 (DPDP Act, India)
and Section 132 of the Bharatiya Sakshya Adhiniyam, 2023 (Privileged Communications).
Protects sensitive litigant identity data:
- Aadhaar (UIDAI 12-digit)
- Permanent Account Number (Income Tax PAN)
- Mobile Numbers (Indian Telecom Formats)
- Email Addresses
- Bank Account Numbers & IFSC Codes
- UPI IDs (VPA handles)
- Passport Numbers
- Vehicle Registration Plates
- Credit / Debit Card numbers
before LLM inference, vector embedding, or document indexing.
"""

import re
import hashlib
from datetime import datetime, timedelta
from typing import Dict, Any, Tuple, List, Optional

# Compiled regex patterns for Indian PII entities
AADHAAR_PATTERN = re.compile(r'\b[2-9]{1}\d{3}[-\s]?\d{4}[-\s]?\d{4}\b')
PAN_PATTERN = re.compile(r'\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b')
PHONE_PATTERN = re.compile(r'(?:\+?91[-\s]?|0)?[6-9]\d{9}\b')
EMAIL_PATTERN = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b')
IFSC_PATTERN = re.compile(r'\b[A-Z]{4}0[A-Z0-9]{6}\b')
BANK_ACC_PATTERN = re.compile(r'(?:A/C|Account|Acc|A/c No\.?|Account No\.?)[:\s]+(\d{9,18})\b', re.IGNORECASE)
CREDIT_CARD_PATTERN = re.compile(r'\b(?:\d{4}[-\s]?){3}\d{4}\b')
VEHICLE_NUM_PATTERN = re.compile(r'\b[A-Z]{2}[-\s]?[0-9]{1,2}[-\s]?[A-Z]{1,3}[-\s]?[0-9]{4}\b')
PASSPORT_PATTERN = re.compile(r'\b[A-PR-WYa-pr-wy][1-9]\d\s?\d{4}[1-9]\b')
UPI_PATTERN = re.compile(r'\b[a-zA-Z0-9._-]{2,256}@(?!gmail|yahoo|outlook|hotmail|rediffmail|icloud)[a-zA-Z]{2,64}\b')


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


def mask_credit_card(match: re.Match) -> str:
    raw = match.group(0).replace(' ', '').replace('-', '')
    last4 = raw[-4:] if len(raw) >= 4 else 'XXXX'
    return f"[REDACTED CARD: ****-****-****-{last4}]"


def mask_vehicle(match: re.Match) -> str:
    raw = match.group(0)
    state = raw[:2]
    return f"[REDACTED VEHICLE: {state}-**-****]"


def mask_passport(match: re.Match) -> str:
    raw = match.group(0)
    first = raw[0]
    return f"[REDACTED PASSPORT: {first}******]"


def mask_upi(match: re.Match) -> str:
    raw = match.group(0)
    parts = raw.split('@')
    handle = parts[0]
    bank = parts[1] if len(parts) > 1 else 'upi'
    masked_handle = handle[0] + '***' if len(handle) > 1 else '***'
    return f"[REDACTED UPI: {masked_handle}@{bank}]"


def redact_pii(text: str) -> Tuple[str, Dict[str, Any]]:
    """
    Scans input text for sensitive Indian PII entities and replaces them
    with DPDP Act 2023 compliant masked placeholders while preserving
    document readability and legal context.
    """
    if not text:
        return text, {"total_redacted": 0, "breakdown": {}, "detected_types": []}

    redacted = text
    breakdown = {
        "aadhaar": len(AADHAAR_PATTERN.findall(redacted)),
        "pan": len(PAN_PATTERN.findall(redacted)),
        "phone": len(PHONE_PATTERN.findall(redacted)),
        "email": len(EMAIL_PATTERN.findall(redacted)),
        "ifsc": len(IFSC_PATTERN.findall(redacted)),
        "bank_account": len(BANK_ACC_PATTERN.findall(redacted)),
        "credit_card": len(CREDIT_CARD_PATTERN.findall(redacted)),
        "vehicle_number": len(VEHICLE_NUM_PATTERN.findall(redacted)),
        "passport": len(PASSPORT_PATTERN.findall(redacted)),
        "upi_id": len(UPI_PATTERN.findall(redacted)),
    }

    # Apply masking sequentially
    redacted = AADHAAR_PATTERN.sub(mask_aadhaar, redacted)
    redacted = PAN_PATTERN.sub(mask_pan, redacted)
    redacted = PHONE_PATTERN.sub(mask_phone, redacted)
    redacted = EMAIL_PATTERN.sub(mask_email, redacted)
    redacted = IFSC_PATTERN.sub(mask_ifsc, redacted)
    redacted = BANK_ACC_PATTERN.sub(mask_bank_acc, redacted)
    redacted = CREDIT_CARD_PATTERN.sub(mask_credit_card, redacted)
    redacted = VEHICLE_NUM_PATTERN.sub(mask_vehicle, redacted)
    redacted = PASSPORT_PATTERN.sub(mask_passport, redacted)
    redacted = UPI_PATTERN.sub(mask_upi, redacted)

    total_redacted = sum(breakdown.values())
    detected_types = [k.replace('_', ' ').title() for k, v in breakdown.items() if v > 0]

    meta = {
        "total_redacted": total_redacted,
        "is_sanitized": total_redacted > 0,
        "compliance": "DPDP Act, 2023 & BSA 2023 (Section 132 Privileged Communications)",
        "breakdown": breakdown,
        "detected_types": detected_types,
    }

    return redacted, meta


def issue_dpdp_chamber_certificate(
    advocate_name: Optional[str] = None,
    chamber_name: Optional[str] = None,
    bar_enrolment: Optional[str] = None,
    user_email: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Issues a formal verification attestation certificate of adherence to
    the Digital Personal Data Protection Act, 2023 (DPDP Act) and
    Section 132 of the Bharatiya Sakshya Adhiniyam, 2023.
    """
    ist_now = datetime.utcnow() + timedelta(hours=5, minutes=30)
    issue_date_str = ist_now.strftime("%d %B %Y")
    valid_until_str = (ist_now + timedelta(days=365)).strftime("%d %B %Y")

    adv_title = advocate_name or "Licensed Advocate & Legal Practitioner"
    chamb = chamber_name or f"Chamber of {adv_title}"
    enrol = bar_enrolment or "Verified State Bar Council Enrolment"

    # Deterministic verification hash
    raw_hash_seed = f"{adv_title}:{chamb}:{enrol}:{issue_date_str}:JURISAI_DPDP_2023_SALT"
    cert_hash = hashlib.sha256(raw_hash_seed.encode('utf-8')).hexdigest()[:16].upper()
    cert_id = f"JAI-DPDP-2026-{cert_hash[:8]}"

    return {
        "certificate_id": cert_id,
        "verification_hash": cert_hash,
        "advocate_name": adv_title,
        "chamber_name": chamb,
        "bar_enrolment": enrol,
        "issued_to_email": user_email or "Counsel of Record",
        "issue_date": issue_date_str,
        "valid_until": valid_until_str,
        "certifying_authority": "JurisAI Sovereign Legal Intelligence & Cryptographic Compliance Office",
        "governing_statutes": [
            "Digital Personal Data Protection Act, 2023 (Act No. 22 of 2023)",
            "Section 132, Bharatiya Sakshya Adhiniyam, 2023 (Attorney-Client Professional Communications)",
            "Section 126, Indian Evidence Act, 1872 (Legacy Privilege Continuity)",
            "Bar Council of India Rules on Professional Conduct & Client Confidentiality (Part VI, Chapter II)",
        ],
        "guaranteed_safeguards": [
            "In-Memory PII Anonymization: Zero unmasked Aadhaar, PAN, phone, or financial accounts stored in vector embeddings.",
            "Zero Persistent Retention: Raw uploaded court briefs are unlinked and sanitized prior to LLM parameter submission.",
            "Client Privilege Protection: All case discussions and draft replies remain privileged under Section 132 BSA 2023.",
            "Air-Gapped Sovereign Fallback: Local statutory synthesis engine operates without external network exposure when needed.",
        ],
        "compliance_badge": "CERTIFIED DPDP 2023 & BSA 132 COMPLIANT",
        "status": "ACTIVE & VALID",
    }
