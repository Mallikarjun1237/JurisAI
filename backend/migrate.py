"""
JurisAI DB Migration — adds missing columns to existing tables.
Safe to run multiple times (checks before adding).
"""
import sqlite3
import os

DB_PATH = os.getenv("DATABASE_URL", "sqlite:///./jurisai.db").replace("sqlite:///", "")

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

def column_exists(table, col):
    cur.execute(f"PRAGMA table_info({table})")
    return any(row[1] == col for row in cur.fetchall())

migrations = [
    # users table — new columns for password reset
    ("users", "reset_token",        "ALTER TABLE users ADD COLUMN reset_token TEXT"),
    ("users", "reset_token_expiry", "ALTER TABLE users ADD COLUMN reset_token_expiry DATETIME"),
    # query_logs — link to cases
    ("query_logs", "case_id",       "ALTER TABLE query_logs ADD COLUMN case_id INTEGER REFERENCES cases(id)"),
]

ran = 0
for table, col, sql in migrations:
    if not column_exists(table, col):
        cur.execute(sql)
        print(f"[OK] Added {table}.{col}")
        ran += 1
    else:
        print(f"[--] {table}.{col} already exists, skipping")

conn.commit()
conn.close()
print(f"\nMigration complete. {ran} column(s) added.")
