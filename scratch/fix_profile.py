with open(r'jurisai/frontend/src/components/ProfileModal.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Update header title
c = c.replace(
    '<h2 className="text-base font-bold text-white tracking-wide">Edit Profile & Account</h2>',
    '<h2 className="text-lg font-bold text-white tracking-wide">Edit Profile & Account</h2>'
)
c = c.replace(
    '<p className="text-[11px] text-slate-300">Update photo, name, WhatsApp number, or password</p>',
    '<p className="text-xs text-slate-300 font-medium">Update photo, name, WhatsApp number, or password</p>'
)

# Full name input
c = c.replace(
    'className="w-full bg-[#13142d] border border-white/20 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 font-medium"',
    'className="w-full bg-slate-900/95 border border-slate-700 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-400 font-semibold outline-none transition"'
)

# WhatsApp input
c = c.replace(
    'className="w-full bg-[#13142d] border border-white/20 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 font-mono font-medium"',
    'className="w-full bg-slate-900/95 border border-slate-700 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-400 font-mono font-semibold outline-none transition"'
)

# Email input (replace disabled with readOnly)
c = c.replace(
    '''<input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full bg-[#0a0b17] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-300 font-mono cursor-not-allowed select-none"
              />''',
    '''<input
                type="email"
                value={user?.email || ''}
                readOnly
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 font-mono font-medium select-all cursor-default outline-none shadow-inner"
              />'''
)

# Current password
c = c.replace(
    'className="w-full bg-[#13142d] border border-white/20 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 pr-10 focus:outline-none focus:border-indigo-400"',
    'className="w-full bg-slate-900/95 border border-slate-700 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-400 pr-10 outline-none font-medium transition"'
)

# New password
c = c.replace(
    'className="w-full bg-[#13142d] border border-white/20 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 pr-9 focus:outline-none focus:border-indigo-400"',
    'className="w-full bg-slate-900/95 border border-slate-700 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-400 pr-9 outline-none font-medium transition"'
)

# Confirm password
c = c.replace(
    'className="w-full bg-[#13142d] border border-white/20 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400"',
    'className="w-full bg-slate-900/95 border border-slate-700 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-400 outline-none font-medium transition"'
)

with open(r'jurisai/frontend/src/components/ProfileModal.jsx', 'w', encoding='utf-8') as f:
    f.write(c)

print("Updated ProfileModal.jsx text brightness and contrast!")
