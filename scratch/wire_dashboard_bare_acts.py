with open(r'jurisai/frontend/src/pages/Dashboard.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

target = """            <BareActsModal
        isOpen={isBareActsModalOpen}
        onClose={() => setIsBareActsModalOpen(false)}
      />"""

replacement = """      <BareActsModal
        isOpen={isBareActsModalOpen}
        onClose={() => setIsBareActsModalOpen(false)}
        onSelectAct={(act) => {
          setIsBareActsModalOpen(false)
          const prompt = `Explain the key statutory provisions, practical litigation applications, and court remedies under ${act.title} (${act.year || ''}) for legal proceedings.`
          setQuery(prompt)
          if (textareaRef.current) {
            setTimeout(() => {
              textareaRef.current.focus()
              textareaRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }, 100)
          }
        }}
      />"""

if target in c:
    c = c.replace(target, replacement)
    with open(r'jurisai/frontend/src/pages/Dashboard.jsx', 'w', encoding='utf-8') as f:
        f.write(c)
    print("Wired BareActsModal onSelectAct into Dashboard.jsx!")
else:
    print("Target not found in Dashboard.jsx!")
