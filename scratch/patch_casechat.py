with open(r'jurisai/frontend/src/pages/CaseChat.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

# 1. Update FormattedMessage safely
old_formatted = """function FormattedMessage({ content, isUser = false }) {
  if (isUser || !content) {
    return <div className="whitespace-pre-wrap font-sans space-y-1">{content}</div>
  }

  const renderInline = (str) => {
    if (!str) return null
    const parts = []
    let lastIdx = 0
    const regex = /(\*\*.*?\*\*|`.*?`)/g
    let match
    while ((match = regex.exec(str)) !== null) {
      if (match.index > lastIdx) {
        parts.push(str.substring(lastIdx, match.index))
      }
      const token = match[0]
      if (token.startsWith('**') && token.endsWith('**')) {
        parts.push(
          <strong key={match.index} className="font-bold text-white">
            {token.slice(2, -2)}
          </strong>
        )
      } else if (token.startsWith('`') && token.endsWith('`')) {
        parts.push(
          <code
            key={match.index}
            className="px-1.5 py-0.5 rounded bg-indigo-950/70 border border-indigo-500/30 text-indigo-300 font-mono text-[11px]"
          >
            {token.slice(1, -1)}
          </code>
        )
      }
      lastIdx = regex.lastIndex
    }
    if (lastIdx < str.length) {
      parts.push(str.substring(lastIdx))
    }
    return parts
  }

  const rawLines = content.split('\\n')
  const blocks = []
  let i = 0"""

new_formatted = """function FormattedMessage({ content, isUser = false }) {
  const safeContent = typeof content === 'string' ? content : String(content || '')
  if (isUser || !safeContent) {
    return <div className="whitespace-pre-wrap font-sans space-y-1">{safeContent}</div>
  }

  const renderInline = (str) => {
    if (!str) return null
    const safeStr = typeof str === 'string' ? str : String(str)
    const parts = []
    let lastIdx = 0
    const regex = /(\\*\\*.*?\\*\\*|`.*?`)/g
    let match
    try {
      while ((match = regex.exec(safeStr)) !== null) {
        if (match.index > lastIdx) {
          parts.push(safeStr.substring(lastIdx, match.index))
        }
        const token = match[0]
        if (token.startsWith('**') && token.endsWith('**')) {
          parts.push(
            <strong key={`${match.index}-b`} className="font-bold text-white">
              {token.slice(2, -2)}
            </strong>
          )
        } else if (token.startsWith('`') && token.endsWith('`')) {
          parts.push(
            <code
              key={`${match.index}-c`}
              className="px-1.5 py-0.5 rounded bg-indigo-950/70 border border-indigo-500/30 text-indigo-300 font-mono text-[11px]"
            >
              {token.slice(1, -1)}
            </code>
          )
        }
        lastIdx = regex.lastIndex
        if (regex.lastIndex === match.index) {
          regex.lastIndex++
        }
      }
      if (lastIdx < safeStr.length) {
        parts.push(safeStr.substring(lastIdx))
      }
    } catch {
      return safeStr
    }
    return parts
  }

  const rawLines = safeContent.split('\\n')
  const blocks = []
  let i = 0"""

if old_formatted in c:
    c = c.replace(old_formatted, new_formatted)
    print("Updated FormattedMessage successfully!")
else:
    print("old_formatted not found")

# 2. Update loadSessions to select list[0] if exists instead of blanking out
old_load = """  const loadSessions = async () => {
    try {
      const res = await apiListChatSessions()
      const list = res.data || []
      setSessions(list)
      // Navigating to Case Document Chat opens a fresh new consultation by default
      if (!activeSessionId) {
        handleNewSession()
      }
    } catch (err) {
      console.error('Failed to load chat sessions:', err)
    }
  }"""

new_load = """  const loadSessions = async () => {
    try {
      const res = await apiListChatSessions()
      const list = res.data || []
      setSessions(list)
      if (!activeSessionId) {
        if (list.length > 0) {
          selectSession(list[0].id)
        } else {
          handleNewSession()
        }
      }
    } catch (err) {
      console.error('Failed to load chat sessions:', err)
      if (!activeSessionId) {
        handleNewSession()
      }
    }
  }"""

if old_load in c:
    c = c.replace(old_load, new_load)
    print("Updated loadSessions successfully!")
else:
    print("old_load not found")

# 3. Update handleContinueInNewChat
old_continue = """  const handleContinueInNewChat = async () => {
    if (!activeSessionId) return
    setLoadingHandoff(true)
    try {
      const res = await apiContinueInNewSession(activeSessionId)
      const newSession = res.data
      setSessions((prev) => [newSession, ...prev])
      setActiveSessionId(newSession.id)
      setCurrentSession(newSession)
      setMessages(newSession.messages || [])
      setDocuments(newSession.documents || [])
      setHandoffModalOpen(false)
    } catch (err) {
      console.error('Failed to continue in new session:', err)
      setError('Could not initialize continuation session.')
    } finally {
      setLoadingHandoff(false)
    }
  }"""

new_continue = """  const handleContinueInNewChat = async () => {
    if (!activeSessionId) return
    setLoadingHandoff(true)
    setError('')
    try {
      const res = await apiContinueInNewSession(activeSessionId)
      const newSession = res.data
      if (!newSession || !newSession.id) {
        throw new Error('Invalid response from server')
      }
      const sessionListItem = {
        id: newSession.id,
        title: newSession.title || 'Continuation Session',
        created_at: newSession.created_at || new Date().toISOString(),
        updated_at: newSession.updated_at || new Date().toISOString(),
        message_count: (newSession.messages || []).length || 1,
        document_count: (newSession.documents || []).length || 0,
      }
      setSessions((prev) => [sessionListItem, ...(prev || []).filter((s) => s.id !== newSession.id)])
      setActiveSessionId(newSession.id)
      setCurrentSession(newSession)
      setMessages(Array.isArray(newSession.messages) ? newSession.messages : [])
      setDocuments(Array.isArray(newSession.documents) ? newSession.documents : [])
      setHandoffModalOpen(false)
    } catch (err) {
      console.error('Failed to continue in new session:', err)
      setError('Could not initialize continuation session. Please try again.')
    } finally {
      setLoadingHandoff(false)
    }
  }"""

if old_continue in c:
    c = c.replace(old_continue, new_continue)
    print("Updated handleContinueInNewChat successfully!")
else:
    print("old_continue not found")

# 4. Update texts: "Start New Case Chat" -> "Start New Consultation", "Case Document Assistant" -> "Personal Legal Assistant"
c = c.replace('<Plus className="w-4 h-4" /> Start New Case Chat', '<Plus className="w-4 h-4" /> New Assistant Session')
c = c.replace("Case Conversations ({sessions.length})", "Assistant Consultations ({sessions.length})")
c = c.replace("{currentSession?.title || 'Case Document Assistant'}", "{currentSession?.title || 'Personal Legal Assistant'}")
c = c.replace("title=\"Case Document Chat & File Analysis\"", "title=\"Personal Legal Assistant & File Analysis\"")

with open(r'jurisai/frontend/src/pages/CaseChat.jsx', 'w', encoding='utf-8') as f:
    f.write(c)

print("Saved CaseChat.jsx changes cleanly!")
