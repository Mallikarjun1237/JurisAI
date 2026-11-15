with open(r'jurisai/frontend/src/pages/CaseChat.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

target = "ArrowUpRight,"
replacement = "ArrowUpRight, BookOpen,"

if target in c:
    c = c.replace(target, replacement, 1)
    with open(r'jurisai/frontend/src/pages/CaseChat.jsx', 'w', encoding='utf-8') as f:
        f.write(c)
    print("Added BookOpen to CaseChat.jsx successfully!")
else:
    print("Target not found in CaseChat.jsx")
