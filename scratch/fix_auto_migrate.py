with open(r'jurisai/backend/app.py', 'r', encoding='utf-8') as f:
    c = f.read()

target = """        pending = [
            ("users",      "reset_token",        "ALTER TABLE users ADD COLUMN reset_token TEXT"),
            ("users",      "reset_token_expiry",  "ALTER TABLE users ADD COLUMN reset_token_expiry DATETIME"),
            ("users",      "profile_image",       "ALTER TABLE users ADD COLUMN profile_image TEXT"),
            ("query_logs", "case_id",             "ALTER TABLE query_logs ADD COLUMN case_id INTEGER REFERENCES cases(id)"),
        ]"""

replacement = """        pending = [
            ("users",      "reset_token",        "ALTER TABLE users ADD COLUMN reset_token TEXT"),
            ("users",      "reset_token_expiry",  "ALTER TABLE users ADD COLUMN reset_token_expiry DATETIME"),
            ("users",      "profile_image",       "ALTER TABLE users ADD COLUMN profile_image TEXT"),
            ("users",      "whatsapp_number",     "ALTER TABLE users ADD COLUMN whatsapp_number VARCHAR"),
            ("query_logs", "case_id",             "ALTER TABLE query_logs ADD COLUMN case_id INTEGER REFERENCES cases(id)"),
            ("doc_chats",  "parent_session_id",   "ALTER TABLE doc_chats ADD COLUMN parent_session_id INTEGER"),
            ("doc_chats",  "context_summary",     "ALTER TABLE doc_chats ADD COLUMN context_summary TEXT"),
        ]"""

if target in c:
    c = c.replace(target, replacement)
    with open(r'jurisai/backend/app.py', 'w', encoding='utf-8') as f:
        f.write(c)
    print("Updated _auto_migrate in app.py successfully!")
else:
    print("Target not found in app.py")
