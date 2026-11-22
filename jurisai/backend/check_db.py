import sqlite3
conn = sqlite3.connect('jurisai.db')
cur = conn.cursor()
cur.execute('PRAGMA table_info(users)')
cols = [row[1] for row in cur.fetchall()]
print('users columns:', cols)
cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
print('tables:', [r[0] for r in cur.fetchall()])
conn.close()
