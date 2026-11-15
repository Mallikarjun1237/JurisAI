with open(r'jurisai/frontend/src/pages/Dashboard.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace(
    "<span>{t('chatNav') || 'Case Document Chat'}</span>",
    "<span>{t('chatNav') || 'Personal Legal Assistant'}</span>"
)
c = c.replace(
    'title="Case Document Chat & File Intelligence"',
    'title="Personal Legal Assistant & File Intelligence"'
)
c = c.replace(
    'title="Continue this consultation in Case Document Chat with inherited memory"',
    'title="Continue this consultation in Personal Legal Assistant with inherited memory"'
)
c = c.replace(
    '<span>Continue in Case Chat</span>',
    '<span>Continue in Personal Assistant</span>'
)
c = c.replace(
    "showToast('Transferred case consultation to Document Chat!', 'warning')",
    "showToast('Transferred case consultation to Personal Legal Assistant!', 'info')"
)

with open(r'jurisai/frontend/src/pages/Dashboard.jsx', 'w', encoding='utf-8') as f:
    f.write(c)

print("Updated Dashboard.jsx names to Personal Legal Assistant!")
