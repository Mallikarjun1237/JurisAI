with open(r'jurisai/frontend/src/pages/CaseChat.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

# 1. Add import
if "import BareActsModal from '../components/BareActsModal'" not in c:
    c = c.replace(
        "import DPDPSecurityModal from '../components/DPDPSecurityModal'",
        "import DPDPSecurityModal from '../components/DPDPSecurityModal'\nimport BareActsModal from '../components/BareActsModal'"
    )

# 2. Add state
if "const [bareActsModalOpen, setBareActsModalOpen]" not in c:
    c = c.replace(
        "const [dpdpModalOpen, setDpdpModalOpen] = useState(false)",
        "const [dpdpModalOpen, setDpdpModalOpen] = useState(false)\n  const [bareActsModalOpen, setBareActsModalOpen] = useState(false)"
    )

# 3. Add button in toolbar
toolbar_target = """              {/* Export to PDF Button */}
              <button
                onClick={handleExportPDF}"""

toolbar_button = """              {/* Central Bare Acts Library */}
              <button
                onClick={() => setBareActsModalOpen(true)}
                className="flex items-center gap-1 text-xs text-indigo-200 hover:text-white bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/25 px-2.5 py-1.5 rounded-xl transition-all font-semibold shrink-0"
                title="India Code Central Bare Acts & Statutory Library (71+ Acts, 124+ Provisions)"
              >
                <BookOpen className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="hidden sm:inline">Bare Acts (71+)</span>
              </button>

              {/* Export to PDF Button */}
              <button
                onClick={handleExportPDF}"""

if toolbar_target in c:
    c = c.replace(toolbar_target, toolbar_button)

# 4. Render modal
modal_target = """      {/* ── NOTIFICATION PERMISSION MODAL ── */}
      <NotificationPermissionModal
        isOpen={notifModalOpen}
        onClose={() => setNotifModalOpen(false)}
      />"""

modal_render = """      {/* ── NOTIFICATION PERMISSION MODAL ── */}
      <NotificationPermissionModal
        isOpen={notifModalOpen}
        onClose={() => setNotifModalOpen(false)}
      />

      {/* ── CENTRAL BARE ACTS & STATUTORY REPOSITORY MODAL ── */}
      <BareActsModal
        isOpen={bareActsModalOpen}
        onClose={() => setBareActsModalOpen(false)}
        onSelectAct={(act) => {
          setBareActsModalOpen(false)
          setInputMessage((prev) =>
            prev
              ? `${prev}\\n\\nPlease analyze under ${act.title} (${act.year || ''}) and specify the statutory requirements and limitation:`
              : `Please analyze under ${act.title} (${act.year || ''}) and specify the statutory requirements, limitation, and remedies:`
          )
        }}
      />"""

if modal_target in c:
    c = c.replace(modal_target, modal_render)

with open(r'jurisai/frontend/src/pages/CaseChat.jsx', 'w', encoding='utf-8') as f:
    f.write(c)

print("Wired BareActsModal into CaseChat.jsx successfully!")
