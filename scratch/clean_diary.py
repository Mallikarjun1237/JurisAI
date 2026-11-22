with open(r'jurisai/frontend/src/components/AdvocateDiaryModal.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace(
    'bg-slate-50 dark:bg-[#070817] border border-slate-300 dark:border-indigo-500/30',
    'bg-[#070817] border border-indigo-500/30'
)
c = c.replace(
    'bg-slate-50 dark:bg-indigo-950/20',
    'bg-[#0a0d24] border border-indigo-500/20'
)

with open(r'jurisai/frontend/src/components/AdvocateDiaryModal.jsx', 'w', encoding='utf-8') as f:
    f.write(c)

print("Updated AdvocateDiaryModal.jsx dark theme cleanly!")
