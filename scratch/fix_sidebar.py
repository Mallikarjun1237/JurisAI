with open(r'jurisai/frontend/src/components/Sidebar.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

target = """            title="Case Document Chat & File Analysis"
          >
            <Bot className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="truncate">Case Chat</span>"""

replacement = """            title="Personal Legal Assistant & Document Co-Pilot"
          >
            <Bot className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="truncate">Personal Assistant</span>"""

if target in c:
    c = c.replace(target, replacement)
    with open(r'jurisai/frontend/src/components/Sidebar.jsx', 'w', encoding='utf-8') as f:
        f.write(c)
    print("Updated Sidebar.jsx tab name to Personal Assistant!")
else:
    print("Target not found in Sidebar.jsx")
