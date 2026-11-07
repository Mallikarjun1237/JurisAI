import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, Paperclip, FileText, Trash2, Plus, ArrowLeft,
  Scale, MessageSquare, AlertTriangle, ShieldAlert,
  ShieldCheck, AlertCircle, Loader2, Sparkles, Check,
  ChevronRight, UploadCloud, Users, Briefcase, Menu, X, Calendar,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLanguage, LanguageSelector } from '../context/LanguageContext'
import { redactPII } from '../utils/piiRedactor'
import VoiceInputButton from '../components/VoiceInputButton'
import ContractAuditModal from '../components/ContractAuditModal'
import AdvocateDiaryModal from '../components/AdvocateDiaryModal'
import DPDPSecurityModal from '../components/DPDPSecurityModal'
import NotificationCenter from '../components/NotificationCenter'
import NotificationPermissionModal from '../components/NotificationPermissionModal'
import {
  apiCreateChatSession,
  apiListChatSessions,
  apiGetChatSession,
  apiDeleteChatSession,
  apiUploadChatDocument,
  apiSendChatMessage,
  apiAuditChatClauses,
} from '../api/client'

function FormattedMessage({ content, isUser = false }) {
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

  const lines = content.split('\n')
  return (
    <div className="font-sans space-y-2 text-xs sm:text-sm leading-relaxed">
      {lines.map((rawLine, idx) => {
        const line = rawLine.trimEnd()
        if (!line.trim()) {
          return <div key={idx} className="h-1" />
        }

        // 1. Heading (#, ##, ###, etc.) -> remove hashes and render styled header
        const headingMatch = line.match(/^#{1,6}\s*(.*)$/)
        if (headingMatch) {
          const headingText = headingMatch[1].replace(/^\*\*|\*\*$/g, '')
          return (
            <div
              key={idx}
              className="text-xs sm:text-sm font-bold text-indigo-300 mt-3 mb-1 pt-1 border-b border-indigo-500/20 flex items-center gap-1.5"
            >
              <Scale className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>{renderInline(headingText)}</span>
            </div>
          )
        }

        // 2. Numbered list point
        const numMatch = line.match(/^(\d+)[.)]\s+(.*)$/)
        if (numMatch) {
          const num = numMatch[1]
          const rest = numMatch[2]
          return (
            <div key={idx} className="flex items-start gap-2 ml-1 my-1">
              <span className="w-5 h-5 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-[10px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                {num}
              </span>
              <div className="flex-1 min-w-0">{renderInline(rest)}</div>
            </div>
          )
        }

        // 3. Bullet point
        const bulletMatch = line.match(/^[-*•]\s+(.*)$/)
        if (bulletMatch) {
          const rest = bulletMatch[1]
          return (
            <div key={idx} className="flex items-start gap-2 ml-2 my-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 shrink-0" />
              <div className="flex-1 min-w-0">{renderInline(rest)}</div>
            </div>
          )
        }

        // 4. Standard text line
        return (
          <p key={idx} className="my-1">
            {renderInline(line)}
          </p>
        )
      })}
    </div>
  )
}

export default function CaseChat() {
  const { user } = useAuth()
  const { language } = useLanguage()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

  const [sessions, setSessions] = useState([])
  const [activeSessionId, setActiveSessionId] = useState(null)
  const [currentSession, setCurrentSession] = useState(null)
  const [messages, setMessages] = useState([])
  const [documents, setDocuments] = useState([])

  const [inputMessage, setInputMessage] = useState('')
  const [tone, setTone] = useState('citizen') // 'citizen' | 'counsel'
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Contract Risk Auditor states
  const [auditReport, setAuditReport] = useState(null)
  const [auditModalOpen, setAuditModalOpen] = useState(false)
  const [auditing, setAuditing] = useState(false)

  // Advocate Digital Diary state
  const [diaryModalOpen, setDiaryModalOpen] = useState(false)
  const [notifModalOpen, setNotifModalOpen] = useState(false)
  const [dpdpModalOpen, setDpdpModalOpen] = useState(false)

  // Scroll to bottom on new messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleNewSession = async () => {
    try {
      const res = await apiCreateChatSession('New Case Analysis')
      const newSession = res.data
      setSessions((prev) => [
        {
          id: newSession.id,
          title: newSession.title,
          created_at: newSession.created_at,
          updated_at: newSession.updated_at,
          message_count: 1,
          document_count: 0,
        },
        ...prev,
      ])
      setActiveSessionId(newSession.id)
      setCurrentSession(newSession)
      setMessages(newSession.messages || [])
      setDocuments([])
      setSidebarOpen(false)
    } catch (err) {
      console.error('Failed to create new session:', err)
      setError('Failed to initialize new conversation.')
    }
  }

  const selectSession = async (sessionId) => {
    setActiveSessionId(sessionId)
    setLoading(true)
    setError('')
    try {
      const res = await apiGetChatSession(sessionId)
      setCurrentSession(res.data)
      setMessages(res.data.messages || [])
      setDocuments(res.data.documents || [])
    } catch (err) {
      console.error('Failed to load session details:', err)
      setError('Failed to load conversation history.')
    } finally {
      setLoading(false)
    }
  }

  const loadSessions = async () => {
    try {
      const res = await apiListChatSessions()
      const list = res.data || []
      setSessions(list)
      if (list.length > 0 && !activeSessionId) {
        selectSession(list[0].id)
      } else if (list.length === 0) {
        // Create initial session if none exists
        handleNewSession()
      }
    } catch (err) {
      console.error('Failed to load chat sessions:', err)
    }
  }

  // Load chat sessions on mount
  useEffect(() => {
    loadSessions()
  }, [])

  const handleDeleteSession = async (sessionId, e) => {
    e.stopPropagation()
    if (!confirm('Delete this case conversation and all uploaded files?')) return
    try {
      await apiDeleteChatSession(sessionId)
      const remaining = sessions.filter((s) => s.id !== sessionId)
      setSessions(remaining)
      if (activeSessionId === sessionId) {
        if (remaining.length > 0) {
          selectSession(remaining[0].id)
        } else {
          handleNewSession()
        }
      }
    } catch (err) {
      console.error('Failed to delete session:', err)
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !activeSessionId) return

    setUploading(true)
    setError('')
    try {
      const res = await apiUploadChatDocument(activeSessionId, file)
      const newDoc = res.data
      setDocuments((prev) => [...prev, newDoc])
      // Refresh session messages to show the attachment message
      const sessionRes = await apiGetChatSession(activeSessionId)
      setCurrentSession(sessionRes.data)
      setMessages(sessionRes.data.messages || [])
      // Update session title in list if auto-renamed
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId ? { ...s, title: sessionRes.data.title, document_count: s.document_count + 1 } : s
        )
      )
    } catch (err) {
      console.error('Upload error:', err)
      setError(err.response?.data?.detail || 'Failed to upload and parse document.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleAuditContractClauses = async () => {
    if (!activeSessionId) return
    if (documents.length === 0) {
      setError('Please attach at least one contract or case document first.')
      return
    }
    setAuditing(true)
    setError('')
    try {
      const res = await apiAuditChatClauses(activeSessionId)
      setAuditReport(res.data)
      setAuditModalOpen(true)
      // Refresh chat messages to display audit summary message
      const sessionRes = await apiGetChatSession(activeSessionId)
      setMessages(sessionRes.data.messages || [])
    } catch (err) {
      console.error('Audit error:', err)
      setError(err.response?.data?.detail || 'Failed to complete statutory contract audit.')
    } finally {
      setAuditing(false)
    }
  }

  const handleSendMessage = async (customText = null) => {
    const textToSend = (customText || inputMessage).trim()
    if (!textToSend || !activeSessionId || loading) return

    setInputMessage('')
    setError('')

    // Automatic DPDP Act 2023 PII Sanitization
    const { sanitizedText } = redactPII(textToSend)

    // Optimistic user message preview
    const tempUserMsg = {
      id: Date.now(),
      role: 'user',
      content: sanitizedText,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, tempUserMsg])
    setLoading(true)

    try {
      const res = await apiSendChatMessage(activeSessionId, sanitizedText, tone, language)
      const { user_message, assistant_message } = res.data
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempUserMsg.id),
        user_message,
        assistant_message,
      ])
      // Update session updated_at in sessions list
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId ? { ...s, message_count: s.message_count + 2, updated_at: new Date().toISOString() } : s
        )
      )
    } catch (err) {
      console.error('Send message error:', err)
      setError(err.response?.data?.detail || 'Failed to get analysis. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const quickPrompts = [
    'Summarize this document and its key commitments',
    'Are there any unfair, one-sided, or high-risk clauses?',
    'What legal remedies and statutory protections apply under Indian law?',
    'Draft a formal reply / counter-notice based on these facts',
  ]

  return (
    <div className="min-h-screen bg-[#060714] text-slate-200 flex flex-col lg:flex-row overflow-hidden">
      {/* ── LEFT SIDEBAR: CASE SESSIONS & ATTACHMENTS ── */}
      <AnimatePresence>
        {(sidebarOpen || window.innerWidth >= 1024) && (
          <aside
            className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-[#090a1a] border-r border-indigo-500/15 flex flex-col shrink-0 transition-transform ${
              sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
            }`}
          >
            {/* Top Bar: Return to Dashboard */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors group"
              >
                <ArrowLeft className="w-4 h-4 text-indigo-400 group-hover:-translate-x-1 transition-transform" />
                <span>Formal Research Mode</span>
              </button>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-slate-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* New Session Button */}
            <div className="p-3">
              <button
                onClick={handleNewSession}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2.5 px-4 rounded-xl transition-all shadow-md shadow-indigo-600/20"
              >
                <Plus className="w-4 h-4" /> Start New Case Chat
              </button>
            </div>

            {/* Conversation Sessions List */}
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 min-h-[220px]">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-2 block mb-2">
                Case Conversations ({sessions.length})
              </span>
              {sessions.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-600">No active cases</div>
              ) : (
                sessions.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => {
                      selectSession(s.id)
                      setSidebarOpen(false)
                    }}
                    className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all text-xs ${
                      activeSessionId === s.id
                        ? 'bg-indigo-600/15 text-white border border-indigo-500/30'
                        : 'text-slate-400 hover:text-white hover:bg-white/4'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <MessageSquare
                        className={`w-3.5 h-3.5 shrink-0 ${
                          activeSessionId === s.id ? 'text-indigo-400' : 'text-slate-600'
                        }`}
                      />
                      <span className="truncate font-medium">{s.title}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {s.document_count > 0 && (
                        <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded font-bold flex items-center gap-0.5">
                          <Paperclip className="w-2.5 h-2.5" />
                          {s.document_count}
                        </span>
                      )}
                      <button
                        onClick={(e) => handleDeleteSession(s.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 transition-opacity"
                        title="Delete Chat"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Attached Documents in Current Session */}
            {documents.length > 0 && (
              <div className="p-3 border-t border-white/5 bg-[#070814] max-h-28 overflow-y-auto">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                  Attached Files ({documents.length})
                </span>
                <div className="space-y-1.5">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-2 text-xs bg-white/4 border border-white/6 px-2.5 py-1.5 rounded-lg text-slate-300"
                    >
                      <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span className="truncate flex-1 text-[11px] font-medium">{doc.filename}</span>
                      <span className="text-[9px] text-slate-500">
                        {Math.round(doc.file_size / 1024)} KB
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        )}
      </AnimatePresence>

      {/* ── MAIN CHAT AREA ── */}
      <main className="flex-1 min-w-0 w-full max-w-full flex flex-col h-screen overflow-hidden relative bg-[#050611]">
        {/* Top Header — Responsive Two-Tier Architecture */}
        <header className="border-b border-white/5 bg-[#080918]/90 backdrop-blur-md shrink-0 w-full min-w-0 max-w-full">
          {/* Row 1: Session Context, Return to Dashboard, Language & Bell */}
          <div className="px-3 sm:px-5 py-2 sm:py-2.5 flex items-center justify-between gap-2">
            {/* Left: Mobile Sidebar Toggle, Scales Logo, Title */}
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors shrink-0"
                aria-label="Open Sessions Menu"
              >
                <Menu className="w-4 h-4" />
              </button>

              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-indigo-500/20">
                <Scale className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>

              <div className="min-w-0">
                <h1 className="text-xs sm:text-sm font-bold text-white truncate max-w-[130px] xs:max-w-[190px] sm:max-w-xs md:max-w-md">
                  {currentSession?.title || 'Case Document Assistant'}
                </h1>
              </div>
            </div>

            {/* Right: Dashboard Return, Language, Notifications */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Return to Dashboard */}
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-1 text-xs text-indigo-300 hover:text-white bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/25 px-2.5 py-1.5 rounded-xl transition-all font-semibold shrink-0"
                title="Return to Research Dashboard"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="hidden sm:inline">Dashboard</span>
              </button>

              {/* Vernacular Language Selector */}
              <LanguageSelector compact={true} align="right" />

              {/* Notification Center */}
              <NotificationCenter
                onOpenDiary={() => setDiaryModalOpen(true)}
                onRequestPermissionModal={() => setNotifModalOpen(true)}
                align="right"
              />
            </div>
          </div>

          {/* Row 2: Smooth Horizontal Scrollable Action Ribbon (Zero overlap, zero single-character vertical stacking) */}
          <div className="px-3 sm:px-5 py-1.5 border-t border-white/5 bg-[#0a0c20]/60 flex items-center gap-2 overflow-x-auto scrollbar-none whitespace-nowrap -webkit-overflow-scrolling-touch w-full min-w-0 max-w-full">
            {/* Tone Toggle Switcher */}
            <div className="flex items-center gap-0.5 bg-[#0e1026] p-0.5 rounded-xl border border-white/10 shrink-0">
              <button
                onClick={() => setTone('citizen')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[13px] sm:text-xs font-semibold transition-all shrink-0 ${
                  tone === 'citizen'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Citizen Friendly Analysis Mode"
              >
                <Users className="w-3 h-3 shrink-0" />
                <span>Citizen</span>
              </button>
              <button
                onClick={() => setTone('counsel')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[13px] sm:text-xs font-semibold transition-all shrink-0 ${
                  tone === 'counsel'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Litigation Counsel Analysis Mode"
              >
                <Briefcase className="w-3 h-3 shrink-0" />
                <span>Counsel</span>
              </button>
            </div>

            {/* Audit Clauses Action Button (When document is attached) */}
            {documents.length > 0 && (
              <button
                onClick={handleAuditContractClauses}
                disabled={auditing}
                className="flex items-center gap-1.5 text-[13px] sm:text-xs text-white bg-gradient-to-r from-red-600 via-rose-600 to-indigo-600 hover:from-red-500 hover:to-indigo-500 px-3 py-1 rounded-xl transition-all font-semibold shadow-sm border border-white/10 shrink-0 whitespace-nowrap"
                title="Statutory audit of contract clauses against Indian Contract Act 1872 & Supreme Court ratios"
              >
                {auditing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white shrink-0" />
                ) : (
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                )}
                <span>{auditing ? 'Auditing…' : 'Audit Clauses'}</span>
              </button>
            )}

            {/* Advocate Digital Diary Button */}
            <button
              onClick={() => setDiaryModalOpen(true)}
              className="flex items-center gap-1.5 text-[13px] sm:text-xs text-emerald-300 hover:text-white bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1 rounded-xl transition-all font-semibold border border-emerald-500/30 hover:border-emerald-400 shrink-0 whitespace-nowrap"
              title="Advocate Digital Diary & Hearing Daily Planner / Cause List"
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Advocate Diary</span>
            </button>

            {/* DPDP Act 2023 Shield Button */}
            <button
              onClick={() => setDpdpModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-400 text-emerald-300 text-[13px] sm:text-[13px] sm:text-xs font-semibold transition-all shrink-0 whitespace-nowrap"
              title="DPDP Act 2023 Compliance & Section 132 BSA Privilege Suite"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>DPDP 2023 Shield</span>
            </button>
          </div>
        </header>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Quick Document Attachment Bar (if 0 docs uploaded) */}
          {documents.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-indigo-950/20 border border-indigo-500/20 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-2xl mx-auto mb-2"
            >
              <div className="flex items-center gap-3 text-center sm:text-left">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">Have a Legal Document or FIR?</h3>
                  <p className="text-[11px] text-slate-400">
                    Upload your contract, charge-sheet, or notice (PDF, DOCX, TXT) for clause-by-clause analysis.
                  </p>
                </div>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-md shrink-0"
              >
                {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Paperclip className="w-3.5 h-3.5" />}
                <span>{uploading ? 'Parsing...' : 'Upload File'}</span>
              </button>
            </motion.div>
          )}

          {/* Messages */}
          {messages.map((msg, idx) => (
            <motion.div
              key={msg.id || idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex gap-3 max-w-3xl ${msg.role === 'user' ? 'ml-auto justify-end' : 'mr-auto justify-start'}`}
            >
              {msg.role !== 'user' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-md">
                  <Scale className="w-4 h-4" />
                </div>
              )}

              <div
                className={`rounded-2xl p-3.5 sm:p-4 text-[13.5px] sm:text-sm leading-relaxed max-w-[88%] sm:max-w-2xl shadow-sm break-words [overflow-wrap:anywhere] ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-[#0f1126] border border-white/8 text-slate-200'
                }`}
              >
                {/* Risk Level Callout Banner if present */}
                {msg.risk_level && msg.risk_level !== 'none' && (
                  <div
                    className={`mb-3 px-3 py-1.5 rounded-lg flex items-center gap-2 font-semibold text-[11px] border ${
                      msg.risk_level === 'high'
                        ? 'bg-red-500/15 border-red-500/30 text-red-300'
                        : msg.risk_level === 'medium'
                        ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                        : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                    }`}
                  >
                    {msg.risk_level === 'high' ? (
                      <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    )}
                    <span>
                      {msg.risk_level === 'high'
                        ? 'High Legal Risk / Critical Clause'
                        : 'Advisory Liability Alert'}
                    </span>
                  </div>
                )}

                <FormattedMessage content={msg.content} isUser={msg.role === 'user'} />

                <div className="mt-2 flex items-center justify-end gap-2 text-[10px] text-slate-400/70">
                  <span>
                    {msg.created_at
                      ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : ''}
                  </span>
                </div>
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">
                  {(user?.full_name || user?.email || 'U')[0].toUpperCase()}
                </div>
              )}
            </motion.div>
          ))}

          {loading && (
            <div className="flex gap-3 mr-auto max-w-2xl">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shrink-0">
                <Scale className="w-4 h-4" />
              </div>
              <div className="bg-[#0f1126] border border-white/8 rounded-2xl p-4 text-xs text-slate-400 flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                <span>JurisAI is analyzing statutory framework & precedents...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion prompt chips (shown when conversation is young) */}
        {messages.length <= 2 && (
          <div className="px-3 sm:px-6 py-2 flex gap-2 overflow-x-auto shrink-0 scrollbar-none whitespace-nowrap -webkit-overflow-scrolling-touch">
            {quickPrompts.map((p) => (
              <button
                key={p}
                onClick={() => handleSendMessage(p)}
                className="text-[11px] bg-white/4 hover:bg-white/8 border border-white/8 hover:border-indigo-500/30 text-slate-300 px-3 py-1.5 rounded-full whitespace-nowrap transition-all flex items-center gap-1.5"
              >
                <Sparkles className="w-3 h-3 text-indigo-400" />
                <span>{p}</span>
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <footer className="p-4 bg-[#080918] border-t border-white/5 shrink-0">
          {error && (
            <div className="mb-2 p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="relative flex items-center gap-2 bg-[#12142d] border border-white/10 focus-within:border-indigo-500/50 rounded-2xl p-2 transition-all">
            {/* Attachment Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              title="Upload PDF, DOCX or TXT"
              className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
              ) : (
                <Paperclip className="w-4 h-4" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt,.md"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Input Textarea */}
            <textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                documents.length > 0
                  ? `Ask anything about ${documents[documents.length - 1].filename} or your legal strategy...`
                  : 'Describe your case, ask a legal question, or upload a document...'
              }
              rows={1}
              className="flex-1 bg-transparent text-white placeholder-slate-500 text-[15px] sm:text-xs focus:outline-none resize-none max-h-32 leading-relaxed py-1"
            />

            {/* Voice Input Button — Vernacular dictation */}
            <VoiceInputButton
              language={language}
              onTranscript={(text) => setInputMessage((prev) => (prev ? prev + ' ' + text : text))}
              onError={(msg) => setError(msg)}
              size="sm"
            />

            {/* Send Button */}
            <button
              onClick={() => handleSendMessage()}
              disabled={loading || !inputMessage.trim()}
              className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl transition-all shadow-md shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1.5 px-1 flex-wrap gap-2">
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="hidden xs:inline">DPDP Act 2023 Shield: Automatic Aadhaar, PAN & Client PII Masking Active</span>
              <span className="xs:hidden">DPDP 2023 PII Masking Active</span>
            </span>
            <div className="flex items-center gap-2.5 text-slate-500">
              <span className="hidden sm:inline">Press Enter to send · Shift + Enter for new line</span>
              <span>Tone: {tone === 'citizen' ? 'Citizen Friendly' : 'Litigation Counsel'}</span>
            </div>
          </div>
        </footer>
      </main>

      {/* ── CONTRACT RISK AUDITOR MODAL ── */}
      <AnimatePresence>
        {auditModalOpen && auditReport && (
          <ContractAuditModal
            isOpen={auditModalOpen}
            onClose={() => { setAuditModalOpen(false) }}
            auditData={auditReport}
          />
        )}
      </AnimatePresence>

      {/* ── ADVOCATE DIGITAL DIARY & CAUSE LIST MODAL ── */}
      <AdvocateDiaryModal
        isOpen={diaryModalOpen}
        onClose={() => setDiaryModalOpen(false)}
        initialDocChatId={activeSessionId}
        initialCaseTitle={currentSession?.title || ''}
      />

      {/* ── DPDP 2023 SECURITY & PRIVILEGE MODAL ── */}
      <DPDPSecurityModal
        isOpen={dpdpModalOpen}
        onClose={() => setDpdpModalOpen(false)}
      />

      {/* ── NOTIFICATION PERMISSION MODAL ── */}
      <NotificationPermissionModal
        isOpen={notifModalOpen}
        onClose={() => setNotifModalOpen(false)}
      />
    </div>
  )
}
