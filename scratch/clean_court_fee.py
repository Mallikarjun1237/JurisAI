with open(r'jurisai/frontend/src/components/CourtFeeModal.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace(
    'className="w-full bg-white dark:bg-[#131435] border border-slate-300 dark:border-indigo-500/25 focus:border-indigo-500 text-white text-xs rounded-xl px-3 py-2.5 outline-none transition-all"',
    'className="w-full bg-[#131435] border border-indigo-500/30 focus:border-indigo-500 text-white text-xs rounded-xl px-3 py-2.5 outline-none transition-all"'
)
c = c.replace(
    'className="w-full bg-white dark:bg-[#131435] border border-slate-300 dark:border-indigo-500/25 focus:border-indigo-500 text-white text-xs font-mono rounded-xl pl-7 pr-3 py-2.5 outline-none transition-all"',
    'className="w-full bg-[#131435] border border-indigo-500/30 focus:border-indigo-500 text-white text-xs font-mono rounded-xl pl-7 pr-3 py-2.5 outline-none transition-all"'
)
c = c.replace(
    'className="lg:col-span-7 bg-slate-50 dark:bg-[#080a1c] border border-slate-200 dark:border-indigo-500/20 rounded-2xl p-5 flex flex-col justify-between shadow-xl text-white"',
    'className="lg:col-span-7 bg-[#080a1c] border border-indigo-500/30 rounded-2xl p-5 flex flex-col justify-between shadow-xl text-white"'
)

with open(r'jurisai/frontend/src/components/CourtFeeModal.jsx', 'w', encoding='utf-8') as f:
    f.write(c)

print("Updated CourtFeeModal.jsx dark theme cleanly!")
