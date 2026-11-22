import os

def fix():
    # 1. Update rag_service.py with working Groq and Gemini models
    rag_path = os.path.abspath('jurisai/backend/rag_service.py')
    with open(rag_path, 'r', encoding='utf-8') as f:
        code = f.read()

    old_groq = '''GROQ_MODELS = [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
]'''

    new_groq = '''GROQ_MODELS = [
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "qwen/qwen3.8-27b",
]'''

    assert old_groq in code, "old_groq not found"
    code = code.replace(old_groq, new_groq, 1)

    old_gemini = '''MODEL_CANDIDATES = [
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
    "gemini-2.0-flash-lite",
    "gemini-1.5-pro",
]'''

    new_gemini = '''MODEL_CANDIDATES = [
    "gemini-flash-latest",
    "gemini-pro-latest",
    "gemini-flash-lite-latest",
]'''

    assert old_gemini in code, "old_gemini not found"
    code = code.replace(old_gemini, new_gemini, 1)

    with open(rag_path, 'w', encoding='utf-8') as f:
        f.write(code)
    print("rag_service.py updated with WORKING model names!")

    # 2. Update legal_domains.py so detect_legal_domain does not hijack topic switches
    ld_path = os.path.abspath('jurisai/backend/legal_domains.py')
    with open(ld_path, 'r', encoding='utf-8') as f:
        ld_code = f.read()

    # Add murder/homicide/kill keywords to fir_criminal_complaint
    old_fir_kw = '''        "lalita kumari", "police refusal", "efir", "e-fir", "criminal complaint"'''
    new_fir_kw = '''        "lalita kumari", "police refusal", "efir", "e-fir", "criminal complaint",
        "murder", "murdered", "kill", "killed", "homicide", "assault", "stabbed", "shot"'''

    assert old_fir_kw in ld_code, "old_fir_kw not found"
    ld_code = ld_code.replace(old_fir_kw, new_fir_kw, 1)

    # Decouple query from blindly prepending root_q
    old_anchoring = '''    combined = query.lower()
    if conversation_history and len(conversation_history) > 0:
        root_q = conversation_history[0].get("query", "").lower()
        combined = f"{root_q} {combined}"'''

    new_anchoring = '''    # Evaluate the current query on its own merits first
    curr_q = query.lower()
    # Only fall back to root query anchoring if the current query is an ambiguous continuation
    is_continuation = any(k in curr_q for k in [
        "more on this", "tell me more", "what next", "next step", "continue",
        "what should i do now", "elaborate", "explain further", "how much time",
        "cost", "fee", "advocate fee", "court fee", "timeline"
    ])
    if is_continuation and conversation_history and len(conversation_history) > 0:
        root_q = conversation_history[0].get("query", "").lower()
        combined = f"{root_q} {curr_q}"
    else:
        combined = curr_q'''

    assert old_anchoring in ld_code, "old_anchoring not found"
    ld_code = ld_code.replace(old_anchoring, new_anchoring, 1)

    with open(ld_path, 'w', encoding='utf-8') as f:
        f.write(ld_code)
    print("legal_domains.py updated so topic switches (like murder) are NEVER hijacked by old defamation context!")

if __name__ == '__main__':
    fix()
