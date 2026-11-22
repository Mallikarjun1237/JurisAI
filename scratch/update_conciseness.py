import os

def update_conciseness():
    path = os.path.abspath('jurisai/backend/rag_service.py')
    with open(path, 'r', encoding='utf-8') as f:
        code = f.read()

    # 1. Update SYSTEM_PROMPT Rule 4
    old_rule4 = '''RULE 4 (JSON SCHEMA):
  The JSON must have EXACTLY these 4 keys:
  - "plain_english_summary": 3-5 comprehensive, clear sentences in simple language explaining the user's legal rights, breaches committed, and remedies under Indian law.
  - "applicable_statutes": Array of objects with keys: "title", "citation", "excerpt", "doc_type".
    - excerpt: 1-2 sentences of the core legal rule or statutory provision.
    - doc_type: "Statute" or "Constitutional" or "Regulation".
  - "relevant_precedents": Array of objects with keys: "title", "citation", "court", "year", "holding".
    - court: "Supreme Court of India" or specific High Court.
    - holding: the core ratio decidendi / legal principle established by the bench.
  - "suggested_next_steps": Array of 3-5 actionable strings providing practical steps (e.g. send statutory legal notice, approach District Commission, file police complaint under BNSS Section 173, preserve digital evidence under BSA Section 63).'''

    new_rule4 = '''RULE 4 (JSON SCHEMA & STRICT CONCISENESS):
  The JSON must have EXACTLY these 4 keys:
  - "plain_english_summary": Strictly 2 brief, crisp paragraphs (maximum 80-120 words total) in simple plain language. The user has no patience for long academic treatises: directly state the applicable law, the citizen's immediate legal rights, and the core legal consequence. Keep it concise, direct, and actionable.
  - "applicable_statutes": Array of strictly TOP 2 to 3 objects with keys: "title", "citation", "excerpt", "doc_type".
    - excerpt: Strictly 1 concise sentence of the core statutory rule. Keep it short.
    - doc_type: "Statute" or "Constitutional".
  - "relevant_precedents": Array of strictly TOP 1 to 2 objects with keys: "title", "citation", "court", "year", "holding".
    - holding: Strictly 1 concise sentence of the core judicial ratio.
  - "suggested_next_steps": Array of strictly 3 crisp, direct actionable strings.'''

    assert old_rule4 in code, "old_rule4 not found"
    code = code.replace(old_rule4, new_rule4, 1)

    # 2. Limit statutes and steps in _synthesize_offline_response
    old_offline_statutes = '''            applicable_statutes = [
                {
                    "title": s["title"],
                    "citation": s["citation"],
                    "excerpt": s["excerpt"],
                    "doc_type": s["doc_type"],
                }
                for s in dinfo.get("statutes", [])
            ]
            relevant_precedents = dinfo.get("precedents", []) if is_pro else []'''

    new_offline_statutes = '''            applicable_statutes = [
                {
                    "title": s["title"],
                    "citation": s["citation"],
                    "excerpt": s["excerpt"],
                    "doc_type": s["doc_type"],
                }
                for s in dinfo.get("statutes", [])[:3]
            ]
            relevant_precedents = (dinfo.get("precedents", [])[:2]) if is_pro else []'''

    assert old_offline_statutes in code, "old_offline_statutes not found"
    code = code.replace(old_offline_statutes, new_offline_statutes, 1)

    with open(path, 'w', encoding='utf-8') as f:
        f.write(code)
    print("SUCCESS: rag_service.py updated for concise answers and top 3 statutes max!")

if __name__ == '__main__':
    update_conciseness()
