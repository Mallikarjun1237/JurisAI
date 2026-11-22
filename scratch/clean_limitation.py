with open(r'jurisai/frontend/src/pages/LimitationChronology.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace(
    'className="min-h-screen bg-slate-50 dark:bg-[#060813] text-slate-900 dark:text-slate-100 flex flex-col"',
    'className="min-h-screen bg-[#060813] text-slate-100 flex flex-col"'
)
c = c.replace(
    'className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"',
    'className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"'
)
c = c.replace(
    'className="bg-slate-50 dark:bg-[#12162d] border border-slate-200 dark:border-white/5 rounded-xl p-3 text-white"',
    'className="bg-[#12162d] border border-white/10 rounded-xl p-3 text-white"'
)
c = c.replace(
    'className="p-4 bg-slate-50 dark:bg-[#0e122b] border-b border-slate-200 dark:border-indigo-500/20 flex flex-wrap items-center justify-between gap-3 text-slate-900 dark:text-slate-100"',
    'className="p-4 bg-[#0e122b] border-b border-indigo-500/20 flex flex-wrap items-center justify-between gap-3 text-white"'
)

with open(r'jurisai/frontend/src/pages/LimitationChronology.jsx', 'w', encoding='utf-8') as f:
    f.write(c)

print("Updated LimitationChronology.jsx dark theme cleanly!")
