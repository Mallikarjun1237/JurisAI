import os

def fix_prompt():
    path = os.path.abspath('jurisai/backend/rag_service.py')
    with open(path, 'r', encoding='utf-8') as f:
        code = f.read()

    old_directive = '''            root_case_query = conversation_history[0].get("query", "")
            history_block = (
                f"\\n=== ONGOING CASE CONVERSATION HISTORY ===\\n"
                + "\\n".join(history_lines)
                + f"\\n=== END CASE CONVERSATION HISTORY ===\\n"
            )
            follow_up_directive = (
                f"\\n=== MANDATORY DIRECTIVE FOR CASE FOLLOW-UP ===\\n"
                f"The client is continuing the existing matter: '{root_case_query}'.\\n"
                f"Their direct follow-up question is: '{query}'\\n\\n"
                f"CRITICAL REQUIREMENTS:\\n"
                f"1. You MUST strictly preserve context and continuity with '{root_case_query}'.\\n"
                f"2. DO NOT hallucinate or switch to an unrelated legal area (e.g., do NOT mention POSH Act / workplace sexual harassment, tenancy, or homicide unless the ongoing matter is specifically about that).\\n"
                f"3. Provide concrete, procedural, and statutory next steps under Indian Law specifically addressing their question. For online defamation or cyber offenses: detail Section 356 BNS 2023, Section 79 IT Act 2000 intermediary takedown, electronic evidence preservation with Certificate under Section 63 BSA 2023, cybercrime.gov.in reporting, and civil damages legal notice.\\n"
                f"=== END DIRECTIVE ===\\n"
            )'''

    new_directive = '''            history_block = (
                f"\\n=== PREVIOUS CASE CONVERSATION HISTORY ===\\n"
                + "\\n".join(history_lines)
                + f"\\n=== END PREVIOUS CONVERSATION HISTORY ===\\n"
            )
            follow_up_directive = (
                f"\\n=== DIRECTIVE FOR USER'S LATEST QUERY ===\\n"
                f"The user has submitted their latest question: '{query}'.\\n"
                f"Analyze the user's latest question directly. If it relates to previous context, maintain continuity; "
                f"if it introduces a new legal situation (e.g., criminal offence, FIR, homicide, property dispute), "
                f"analyze the new situation accurately under Indian statutory law (BNS, BNSS, BSA, etc.) and advise on the appropriate legal rights and remedies.\\n"
                f"=== END DIRECTIVE ===\\n"
            )'''

    assert old_directive in code, "old_directive not found"
    code = code.replace(old_directive, new_directive, 1)

    with open(path, 'w', encoding='utf-8') as f:
        f.write(code)
    print("SUCCESS: Forced defamation prompt directive removed from rag_service.py!")

if __name__ == '__main__':
    fix_prompt()
