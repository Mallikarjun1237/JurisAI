import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, Paperclip, FileText, Trash2, Plus, ArrowLeft,
  Scale, MessageSquare, AlertTriangle, ShieldAlert,
  ShieldCheck, AlertCircle, Loader2, Sparkles, Check,
  ChevronRight, UploadCloud, Users, Briefcase, Menu, X, Calendar, Clock,
  Share2, FileDown, Brain, Copy, Printer,
  ArrowUpRight, BookOpen,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLanguage, LanguageSelector } from '../context/LanguageContext'
import { redactPII } from '../utils/piiRedactor'
import VoiceInputButton from '../components/VoiceInputButton'
import ContractAuditModal from '../components/ContractAuditModal'
import AdvocateDiaryModal from '../components/AdvocateDiaryModal'
import DPDPSecurityModal from '../components/DPDPSecurityModal'
import BareActsModal from '../components/BareActsModal'
import NotificationCenter from '../components/NotificationCenter'
import NotificationPermissionModal from '../components/NotificationPermissionModal'
import Breadcrumb from '../components/Breadcrumb'
import {
  apiCreateChatSession,
  apiListChatSessions,
  apiGetChatSession,
  apiDeleteChatSession,
  apiUploadChatDocument,
  apiSendChatMessage,
  apiAuditChatClauses,
  apiGetHandoffPrompt,
  apiContinueInNewSession,
} from '../api/client'

function FormattedMessage({ content, isUser = false }) {
  const safeContent = typeof content === 'string' ? content : String(content || '')
  if (isUser || !safeContent) {
    return <div className="whitespace-pre-wrap font-sans space-y-1">{safeContent}</div>
  }

  const renderInline = (str) => {
    if (!str) return null
    const safeStr = typeof str === 'string' ? str : String(str)
    const parts = []
    let lastIdx = 0
    const regex = /(\*\*.*?\*\*|`.*?`)/g
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

  const rawLines = safeContent.split('\n')
  const blocks = []
  let i = 0

  while (i < rawLines.length) {
    const rawLine = rawLines[i]
    const trimmed = rawLine.trim()

    if (!trimmed) {
      blocks.push({ type: 'spacer', key: i })
      i++
      continue
    }

    // Horizontal Rule (--- or ***)
    if (/^(\-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      blocks.push({ type: 'divider', key: i })
      i++
      continue
    }

    // Blockquote (> ...)
    if (trimmed.startsWith('>')) {
      const quoteText = trimmed.replace(/^>\s*/, '')
      blocks.push({ type: 'quote', text: quoteText, key: i })
      i++
      continue
    }

    // Markdown Table Detection (| Col 1 | Col 2 |)
    if (trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.includes('|')) {
      const tableLines = []
      while (i < rawLines.length && rawLines[i].trim().startsWith('|') && rawLines[i].trim().endsWith('|')) {
        tableLines.push(rawLines[i].trim())
        i++
      }
      if (tableLines.length >= 2) {
        const parseRow = (line) => line.split('|').slice(1, -1).map((c) => c.trim())
        const headerRow = parseRow(tableLines[0])
        const dataRows = []
        for (let t = 1; t < tableLines.length; t++) {
          if (/^\|[\s\-:\|]+\|$/.test(tableLines[t])) continue
          dataRows.push(parseRow(tableLines[t]))
        }
        blocks.push({ type: 'table', headers: headerRow, rows: dataRows, key: `table-${i}` })
        continue
      } else {
        blocks.push({ type: 'text', text: tableLines[0], key: i })
        continue
      }
    }

    // Heading (#, ##, ###)
    const headingMatch = trimmed.match(/^#{1,6}\s*(.*)$/)
    if (headingMatch) {
      blocks.push({ type: 'heading', text: headingMatch[1].replace(/^\*\*|\*\*$/g, ''), key: i })
      i++
      continue
    }

    // Numbered item (1. or 1))
    const numMatch = trimmed.match(/^(\d+)[.)]\s+(.*)$/)
    if (numMatch) {
      blocks.push({ type: 'number', num: numMatch[1], text: numMatch[2], key: i })
      i++
      continue
    }

    // Bullet item (* or -)
    const bulletMatch = trimmed.match(/^[-*•]\s+(.*)$/)
    if (bulletMatch) {
      blocks.push({ type: 'bullet', text: bulletMatch[1], key: i })
      i++
      continue
    }

    // Regular paragraph line
    blocks.push({ type: 'text', text: trimmed, key: i })
    i++
  }

  return (
    <div className="font-sans space-y-2 text-xs sm:text-sm leading-relaxed">
      {blocks.map((block) => {
        if (block.type === 'spacer') {
          return <div key={block.key} className="h-1" />
        }
        if (block.type === 'divider') {
          return <hr key={block.key} className="my-2.5 border-t border-indigo-500/20" />
        }
        if (block.type === 'quote') {
          return (
            <div
              key={block.key}
              className="my-2 pl-3 py-1.5 border-l-2 border-indigo-400 bg-indigo-950/40 text-indigo-200 text-xs sm:text-[13px] rounded-r-lg font-medium"
            >
              {renderInline(block.text)}
            </div>
          )
        }
        if (block.type === 'table') {
          return (
            <div
              key={block.key}
              className="overflow-x-auto my-3 rounded-xl border border-indigo-500/25 bg-[#090b1e]/90 shadow-sm"
            >
              <table className="min-w-full text-xs text-left divide-y divide-indigo-500/20">
                <thead className="bg-indigo-950/70 text-indigo-200 font-semibold text-[11px] uppercase tracking-wider">
                  <tr>
                    {block.headers.map((h, hi) => (
                      <th key={hi} className="px-3 py-2 border-r border-indigo-500/15 last:border-r-0 whitespace-nowrap">
                        {renderInline(h)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {block.rows.map((row, ri) => (
                    <tr key={ri} className="hover:bg-indigo-500/5 transition-colors">
                      {row.map((cell, ci) => (
                        <td key={ci} className="px-3 py-2 border-r border-indigo-500/10 last:border-r-0">
                          {renderInline(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
        if (block.type === 'heading') {
          return (
            <div
              key={block.key}
              className="text-xs sm:text-sm font-bold text-indigo-300 mt-3 mb-1 pt-1 border-b border-indigo-500/20 flex items-center gap-1.5"
            >
              <Scale className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>{renderInline(block.text)}</span>
            </div>
          )
        }
        if (block.type === 'number') {
          return (
            <div key={block.key} className="flex items-start gap-2 ml-1 my-1">
              <span className="w-5 h-5 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-[10px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                {block.num}
              </span>
              <div className="flex-1 min-w-0">{renderInline(block.text)}</div>
            </div>
          )
        }
        if (block.type === 'bullet') {
          return (
            <div key={block.key} className="flex items-start gap-2 ml-2 my-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 shrink-0" />
              <div className="flex-1 min-w-0">{renderInline(block.text)}</div>
            </div>
          )
        }
        return (
          <p key={block.key} className="my-1">
            {renderInline(block.text)}
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
  const messagesContainerRef = useRef(null)
  const textareaRef = useRef(null)

  const [sessions, setSessions] = useState([])
  const [activeSessionId, setActiveSessionId] = useState(null)
  const [currentSession, setCurrentSession] = useState(null)
  const [messages, setMessages] = useState([])
  const [documents, setDocuments] = useState([])

  // Input draft persistence with sessionStorage
  const [inputMessage, setInputMessage] = useState(() => {
    try {
      return sessionStorage.getItem('jurisai_draft_chat_' + (activeSessionId || 'general')) || ''
    } catch {
      return ''
    }
  })

  // Sync draft chat input
  useEffect(() => {
    const draftKey = 'jurisai_draft_chat_' + (activeSessionId || 'general')
    try {
      if (inputMessage.trim()) {
        sessionStorage.setItem(draftKey, inputMessage)
      } else {
        sessionStorage.removeItem(draftKey)
      }
    } catch {}
  }, [inputMessage, activeSessionId])

  // When switching chat sessions, load saved draft if any
  useEffect(() => {
    const draftKey = 'jurisai_draft_chat_' + (activeSessionId || 'general')
    try {
      const saved = sessionStorage.getItem(draftKey)
      setInputMessage(saved || '')
    } catch {}
  }, [activeSessionId])

  // Global Keyboard Accelerators: Esc to close modals / return to Dashboard, Ctrl+K to focus input
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault()
        textareaRef.current?.focus()
        textareaRef.current?.select?.()
        return
      }
      if (e.key === 'Escape') {
        if (handoffModalOpen) { setHandoffModalOpen(false); return }
        if (shareModalOpen) { setShareModalOpen(false); return }
        if (auditModalOpen) { setAuditModalOpen(false); return }
        if (diaryModalOpen) { setDiaryModalOpen(false); return }
        if (notifModalOpen) { setNotifModalOpen(false); return }
        if (dpdpModalOpen) { setDpdpModalOpen(false); return }
        if (bareActsModalOpen) { setBareActsModalOpen(false); return }
        if (sidebarOpen) { setSidebarOpen(false); return }
        navigate('/dashboard')
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [
    handoffModalOpen,
    shareModalOpen,
    auditModalOpen,
    diaryModalOpen,
    notifModalOpen,
    dpdpModalOpen,
    bareActsModalOpen,
    sidebarOpen,
    navigate,
  ])

  const [tone, setTone] = useState('citizen') // 'citizen' | 'counsel'
  const [thinkMode, setThinkMode] = useState(false) // Deep Think / Multi-Step Precedent Mode
  const [handoffModalOpen, setHandoffModalOpen] = useState(false)
  const [handoffData, setHandoffData] = useState(null)
  const [loadingHandoff, setLoadingHandoff] = useState(false)
  const [copiedHandoff, setCopiedHandoff] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [copiedShare, setCopiedShare] = useState(false)
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
  const [bareActsModalOpen, setBareActsModalOpen] = useState(false)

  const latestMessageRef = useRef(null)

  // Container-isolated conversational scroll (ChatGPT & Gemini style)
  // ONLY scrolls the messages container — NEVER scrolls the window or page!
  useEffect(() => {
    if (!messages || messages.length === 0) return
    const lastMsg = messages[messages.length - 1]
    if (!messagesContainerRef.current) return

    if (lastMsg.role === 'user') {
      // User sent query -> smoothly scroll messages container to bottom
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth',
      })
    } else {
      // Assistant answered: smoothly position container at the top of the new assistant message
      if (latestMessageRef.current) {
        const container = messagesContainerRef.current
        const target = latestMessageRef.current
        const offset = target.offsetTop - container.offsetTop - 16
        container.scrollTo({
          top: Math.max(0, offset),
          behavior: 'smooth',
        })
      }
    }
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


  // ── Context Continuity & Handoff Prompt Handlers ──
  const handleOpenHandoff = async () => {
    if (!activeSessionId) {
      alert('Please start or select a case session first.')
      return
    }
    setHandoffModalOpen(true)
    setLoadingHandoff(true)
    try {
      const res = await apiGetHandoffPrompt(activeSessionId)
      setHandoffData(res.data)
    } catch (err) {
      console.error('Failed to generate handoff prompt:', err)
      setError('Could not generate context continuity brief for this session.')
    } finally {
      setLoadingHandoff(false)
    }
  }

  const handleContinueInNewChat = async () => {
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
  }

  const handleCopyHandoffPrompt = async () => {
    if (!handoffData?.handoff_prompt) return
    try {
      await navigator.clipboard.writeText(handoffData.handoff_prompt)
      setCopiedHandoff(true)
      setTimeout(() => setCopiedHandoff(false), 2500)
    } catch {
      setError('Could not copy continuation prompt to clipboard.')
    }
  }

  // Export Case Consultation to Court-Standard Print/PDF
  const handleExportPDF = () => {
    if (!messages || messages.length === 0) {
      alert('No messages in this case session to export.')
      return
    }
    document.body.classList.add('print-case-chat-active')
    const cleanup = () => {
      document.body.classList.remove('print-case-chat-active')
      window.removeEventListener('afterprint', cleanup)
    }
    window.addEventListener('afterprint', cleanup)
    window.print()
  }

  // Generate shareable case transcript text
  const getShareableTranscript = () => {
    const title = currentSession?.title || 'JurisAI Case Analysis'
    const header = `========================================\n${title}\nJurisAI Sovereign Legal Intelligence Report\nDate: ${new Date().toLocaleDateString('en-GB')}\n========================================\n\n`
    const body = messages
      .map((m) => {
        const sender = m.role === 'user' ? 'Client / Advocate' : 'JurisAI Sovereign Co-Pilot'
        return `[${sender}]:\n${m.content}\n`
      })
      .join('\n----------------------------------------\n\n')
    return `${header}${body}\n\nGenerated via JurisAI Legal Intelligence Suite`
  }

  const handleCopyTranscript = () => {
    const text = getShareableTranscript()
    navigator.clipboard.writeText(text)
    setCopiedShare(true)
    setTimeout(() => setCopiedShare(false), 2000)
  }

  const handleShareWhatsApp = () => {
    const text = getShareableTranscript()
    window.open(`https://wa.me/?text=${encodeURIComponent(text.slice(0, 1500) + '... (Full brief in JurisAI)')}`, '_blank')
  }

  const handleShareEmail = () => {
    const subject = encodeURIComponent(currentSession?.title || 'JurisAI Legal Case Consultation')
    const body = encodeURIComponent(getShareableTranscript())
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank')
  }

  const handleShareTelegram = () => {
    const text = encodeURIComponent(getShareableTranscript().slice(0, 1500))
    window.open(`https://t.me/share/url?url=https://jurisai.in&text=${text}`, '_blank')
  }

  const handleSendMessage = async (customText = null) => {
    const textToSend = (customText || inputMessage).trim()
    if (!textToSend || !activeSessionId || loading) return

    setInputMessage('')
    try {
      sessionStorage.removeItem('jurisai_draft_chat_' + (activeSessionId || 'general'))
    } catch {}
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
      const res = await apiSendChatMessage(activeSessionId, sanitizedText, tone, language, thinkMode)
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
    <div className="h-screen max-h-screen w-full max-w-full bg-[#060714] text-slate-200 flex flex-col lg:flex-row overflow-hidden">
      {/* ── LEFT SIDEBAR: CASE SESSIONS & ATTACHMENTS ── */}
      <AnimatePresence>
        {(sidebarOpen || window.innerWidth >= 1024) && (
          <aside
            className={`fixed lg:static inset-y-0 left-0 z-50 w-72 lg:w-72 h-full max-h-screen bg-[#090a1a] border-r border-indigo-500/15 flex flex-col shrink-0 overflow-hidden transition-transform ${
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
                <Plus className="w-4 h-4" /> New Assistant Session
              </button>
            </div>

            {/* Conversation Sessions List */}
            <div className="flex-1 min-h-0 overflow-y-auto px-3 py-2 space-y-1">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-2 block mb-2">
                Assistant Consultations ({sessions.length})
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
      <main className="flex-1 min-w-0 w-full max-w-full flex flex-col h-full max-h-screen overflow-hidden relative bg-[#050611]">
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
                <Breadcrumb
                  items={[
                    { label: 'Workspace', icon: <Scale className="w-3.5 h-3.5" />, href: '/dashboard' },
                    { label: 'Legal Suite' },
                    { label: currentSession?.title || 'Personal Legal Assistant', active: true },
                  ]}
                />
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

              {/* Continue in New Chat (Handoff & Context Continuity) */}
              <button
                onClick={handleOpenHandoff}
                className="flex items-center gap-1 text-xs text-indigo-200 hover:text-white bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/25 px-2.5 py-1.5 rounded-xl transition-all font-semibold shrink-0"
                title="Continue consultation in fresh new chat without losing established context or evidence"
              >
                <ArrowUpRight className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="hidden sm:inline">Continue in New Chat</span>
              </button>

              {/* Central Bare Acts Library */}
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
                onClick={handleExportPDF}
                className="flex items-center gap-1 text-xs text-indigo-200 hover:text-white bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/25 px-2.5 py-1.5 rounded-xl transition-all font-semibold shrink-0"
                title="Convert entire case conversation to court-ready PDF and download"
              >
                <FileDown className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="hidden sm:inline">Export PDF</span>
              </button>

              {/* Print Consultation Brief */}
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-1 text-xs text-indigo-200 hover:text-white bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/25 px-2.5 py-1.5 rounded-xl transition-all font-semibold shrink-0"
                title="Print pristine court legal opinion memo"
              >
                <Printer className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="hidden sm:inline">Print</span>
              </button>

              {/* Share Case Chat Button */}
              <button
                onClick={() => setShareModalOpen(true)}
                className="flex items-center gap-1 text-xs text-indigo-200 hover:text-white bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/25 px-2.5 py-1.5 rounded-xl transition-all font-semibold shrink-0"
                title="Share conversation via WhatsApp, Email, or Telegram"
              >
                <Share2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="hidden sm:inline">Share</span>
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

            {/* Smart Chronology & Fact Matrix Generator Button */}
            <button
              onClick={() => navigate('/limitation-chronology')}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 hover:border-indigo-400 text-indigo-300 text-[13px] sm:text-xs font-semibold transition-all shrink-0 whitespace-nowrap"
              title="Automated Case Chronology & Fact Matrix Generator"
            >
              <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>Chronology & Fact Matrix</span>
            </button>
          </div>
        </header>

        {/* Message Stream */}
        <div ref={messagesContainerRef} className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4">
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
          {messages.map((msg, idx) => {
            const isLatest = idx === messages.length - 1
            return (
            <motion.div
              key={msg.id || idx}
              ref={isLatest ? latestMessageRef : null}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex gap-3 max-w-3xl scroll-mt-6 ${msg.role === 'user' ? 'ml-auto justify-end' : 'mr-auto justify-start'}`}
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
          )})}

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

            {/* Deep Think Mode Toggle Switch */}
            <button
              type="button"
              onClick={() => setThinkMode(!thinkMode)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border shrink-0 ${
                thinkMode
                  ? 'bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 text-white border-violet-400 shadow-md shadow-violet-500/30 ring-1 ring-violet-400'
                  : 'bg-white/4 text-slate-400 border-white/10 hover:text-white hover:bg-white/8'
              }`}
              title="Toggle Deep Think Mode: Takes additional time for deep multi-step statutory research, contradiction checks, and Supreme Court precedent verification"
            >
              <Brain className={`w-3.5 h-3.5 ${thinkMode ? 'text-amber-300 animate-pulse' : 'text-slate-400'}`} />
              <span className="hidden sm:inline">{thinkMode ? 'Deep Think ON' : 'Deep Think'}</span>
              <span className="sm:hidden">{thinkMode ? 'Think' : 'Fast'}</span>
            </button>

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


      {/* ═══ SHARE CASE CONSULTATION MODAL ═══ */}
      <AnimatePresence>
        {shareModalOpen && (
          <div className="fixed inset-0 z-[100002] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0b0c24] border-2 border-indigo-500/40 rounded-2xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4 text-slate-100"
            >
              <div className="flex justify-between items-center border-b border-indigo-500/20 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Share Case Consultation</h4>
                    <p className="text-[11px] text-slate-400">{currentSession?.title || 'New Case Analysis'}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShareModalOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Export or dispatch this verified legal consultation brief to clients, senior advocates, or junior researchers:
              </p>

              {/* Share Channels */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={handleShareWhatsApp}
                  className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center gap-2 transition-all"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span>WhatsApp</span>
                </button>

                <button
                  onClick={handleShareEmail}
                  className="p-3 rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-xs font-bold flex items-center gap-2 transition-all"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
                  <span>Email</span>
                </button>

                <button
                  onClick={handleShareTelegram}
                  className="p-3 rounded-xl border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 text-xs font-bold flex items-center gap-2 transition-all"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                  <span>Telegram</span>
                </button>

                <button
                  onClick={handleExportPDF}
                  className="p-3 rounded-xl border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs font-bold flex items-center gap-2 transition-all"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                  <span>Save as PDF</span>
                </button>
              </div>

              {/* Copy Transcript Button */}
              <div className="pt-2 border-t border-indigo-500/20">
                <button
                  onClick={handleCopyTranscript}
                  className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white font-semibold flex items-center justify-center gap-2 transition-all"
                >
                  {copiedShare ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">Copied Full Transcript to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-indigo-400" />
                      <span>Copy Full Case Transcript</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── CONTEXT CONTINUITY & HANDOFF MODAL (ChatGPT / Gemini Style) ── */}
      <AnimatePresence>
        {handoffModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-[#0b0d1e] border border-indigo-500/30 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-md">
                    <ArrowUpRight className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Continue in New Chat & Context Handoff</h4>
                    <p className="text-[11px] text-indigo-300/80">Preserve all established facts, evidence & statutory positions</p>
                  </div>
                </div>
                <button
                  onClick={() => setHandoffModalOpen(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
                {loadingHandoff ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-7 h-7 text-indigo-400 animate-spin" />
                    <p className="text-slate-400">Synthesizing case context & continuity brief...</p>
                  </div>
                ) : (
                  <>
                    <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-3.5 space-y-2">
                      <p className="font-semibold text-indigo-200">
                        {handoffData?.summary || 'Executive context brief generated for your consultation.'}
                      </p>
                      {handoffData?.key_issues && handoffData.key_issues.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Established Inquiries:</p>
                          {handoffData.key_issues.map((issue, idx) => (
                            <p key={idx} className="text-slate-300 text-[11px]">
                              • {issue}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-300 uppercase tracking-wide">
                          Continuation Briefing Prompt (Ready for New Chat / External LLMs):
                        </span>
                        <span className="text-indigo-400 font-mono text-[10px]">Auto-Generated</span>
                      </div>
                      <div className="bg-black/60 border border-white/10 rounded-xl p-3.5 text-[11px] font-mono text-slate-300 max-h-48 overflow-y-auto leading-relaxed select-all whitespace-pre-wrap">
                        {handoffData?.handoff_prompt}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Modal Footer Actions */}
              <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row gap-2 shrink-0">
                <button
                  onClick={handleContinueInNewChat}
                  disabled={loadingHandoff}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-violet-600/30"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>1-Click Continue in Fresh Chat</span>
                </button>

                <button
                  onClick={handleCopyHandoffPrompt}
                  disabled={loadingHandoff}
                  className="py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all"
                >
                  {copiedHandoff ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-indigo-400" />
                      <span>Copy Prompt</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
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

      {/* ── CENTRAL BARE ACTS & STATUTORY REPOSITORY MODAL ── */}
      <BareActsModal
        isOpen={bareActsModalOpen}
        onClose={() => setBareActsModalOpen(false)}
        onSelectAct={(act) => {
          setBareActsModalOpen(false)
          setInputMessage((prev) =>
            prev
              ? `${prev}\n\nPlease analyze under ${act.title} (${act.year || ''}) and specify the statutory requirements and limitation:`
              : `Please analyze under ${act.title} (${act.year || ''}) and specify the statutory requirements, limitation, and remedies:`
          )
        }}
      />

      {/* ── DEDICATED COURT-STANDARD WHITE-PAPER PRINT PORTAL ── */}
      {createPortal(
        <div id="case-chat-official-print" className="font-serif text-black max-w-[195mm] mx-auto text-[10pt] leading-normal bg-white">
          {/* Top Court Header */}
          <div style={{ textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '8px', marginBottom: '14px' }}>
            <p style={{ fontSize: '8.5pt', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 'bold', margin: '0 0 2px 0', color: '#334155', fontFamily: 'sans-serif' }}>
              REPUBLIC OF INDIA • STATUTORY LEGAL OPINION & CASE BRIEF
            </p>
            <h1 style={{ fontSize: '13pt', fontWeight: 'bold', textTransform: 'uppercase', margin: '2px 0', color: '#0f172a', letterSpacing: '0.5px' }}>
              {currentSession?.title || 'Case Document Consultation Memorandum'}
            </h1>
            <p style={{ fontSize: '9pt', margin: '2px 0 0 0', color: '#475569', fontStyle: 'italic', fontFamily: 'sans-serif' }}>
              Matter Classification: Sovereign Document Case Study & Statutory Assessment
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8pt', color: '#64748b', marginTop: '6px', paddingTop: '4px', borderTop: '1px dashed #cbd5e1', fontFamily: 'sans-serif' }}>
              <span><strong>Advocate / Client:</strong> {user?.full_name || 'Counsel'} ({user?.email || 'N/A'})</span>
              <span><strong>Session ID:</strong> {currentSession?.id || 'JURIS-CC-2026'}</span>
              <span><strong>Date of Record:</strong> {new Date().toLocaleDateString('en-GB')} at {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>

          {/* Record of Ingested Case Documents */}
          {documents && documents.length > 0 && (
            <div style={{ marginBottom: '14px', padding: '6px 10px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '8.5pt', fontFamily: 'sans-serif' }}>
              <strong>RECORD OF INGESTED CASE DOCUMENTS:</strong>
              <div style={{ marginTop: '3px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {documents.map((d, di) => (
                  <span key={di} style={{ color: '#1e293b' }}>
                    • {d.filename} ({Math.round(d.file_size / 1024)} KB)
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Sequential Turn Excerpts */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {messages.map((m, idx) => {
              const isUser = m.role === 'user'
              return (
                <div
                  key={idx}
                  className={`print-turn-container ${isUser ? 'print-query-box' : 'print-response-box'}`}
                  style={{
                    padding: isUser ? '8pt 10pt' : '10pt 12pt',
                    backgroundColor: isUser ? '#f1f5f9' : '#ffffff',
                    border: isUser ? '1.5px solid #94a3b8' : '1.5px solid #0f172a',
                    borderRadius: '5px',
                    pageBreakInside: 'avoid',
                    breakInside: 'avoid',
                  }}
                >
                  {/* Turn Header */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderBottom: isUser ? '1px solid #cbd5e1' : '1px solid #94a3b8',
                      paddingBottom: '4px',
                      marginBottom: '6px',
                      fontFamily: 'sans-serif',
                      fontSize: '8.5pt',
                      fontWeight: 'bold',
                      color: isUser ? '#1e3a8a' : '#0f172a',
                    }}
                  >
                    <span>
                      {isUser
                        ? `[CLIENT / ADVOCATE LEGAL QUERY - Turn #${Math.floor(idx / 2) + 1}]`
                        : `[JURISAI SOVEREIGN STATUTORY ADVISORY & REASONING]`}
                    </span>
                    <span style={{ fontSize: '7.5pt', color: '#64748b', fontWeight: 'normal', fontFamily: 'monospace' }}>
                      {m.created_at ? new Date(m.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : `Turn #${idx + 1}`}
                    </span>
                  </div>

                  {/* Turn Body */}
                  <div
                    style={{
                      fontSize: '9.5pt',
                      lineHeight: '1.5',
                      color: '#000000',
                      whiteSpace: 'pre-wrap',
                      fontFamily: isUser ? 'sans-serif' : 'serif',
                    }}
                  >
                    {m.content}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Formal Court Footer */}
          <div style={{ marginTop: '20px', paddingTop: '8px', borderTop: '1.5px solid #0f172a', textAlign: 'center', fontSize: '7.5pt', color: '#475569', fontFamily: 'sans-serif' }}>
            <p style={{ margin: '0 0 2px 0', fontWeight: 'bold' }}>
              CONFIDENTIAL & PRIVILEGED LEGAL RESEARCH MEMORANDUM • PREPARED WITH JURISAI COURT ENGINE
            </p>
            <p style={{ margin: 0 }}>
              Governed under the Bharatiya Nyaya Sanhita (2023), Bharatiya Nagarik Suraksha Sanhita (2023), and Bharatiya Sakshya Adhiniyam (2023). Not a substitute for formal Vakalatnama representation in a Court of Law.
            </p>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
