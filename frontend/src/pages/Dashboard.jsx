import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, Sparkles, Users, Briefcase, Menu,
  Loader2, AlertTriangle, Scale, FileText, Zap,
  Plus, FolderOpen, ChevronLeft, Clock, MessageSquare,
  CheckCircle, ArrowRight, Download, Pencil, BookOpen, Calendar,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLanguage, LanguageSelector } from '../context/LanguageContext'
import { apiQuery, apiGetCase, apiTogglePro } from '../api/client'
import Sidebar from '../components/Sidebar'
import CitizenView from '../components/CitizenView'
import AdvocateView from '../components/AdvocateView'
import ProfileModal from '../components/ProfileModal'
import BNSConverterModal from '../components/BNSConverterModal'
import LegalDraftModal from '../components/LegalDraftModal'
import TelemetryCard from '../components/TelemetryCard'
import VoiceInputButton from '../components/VoiceInputButton'
import { generateCourtLegalReport } from '../utils/courtReportGenerator'

const SUGGESTIONS = [
  'My employer withheld my salary and terminated me without notice',
  'Right to privacy violation by a government authority collecting biometric data',
  'Online defamation on social media — what are my legal options?',
  'Landlord refusing to return security deposit after 2 months of vacating',
  'Consumer complaint against e-commerce site for defective product delivery',
  'Sexual harassment complaint at workplace — POSH Act procedure',
]

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.35 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
}

export default function Dashboard() {
  const { user, logout, updateUser } = useAuth()
  const { language, t } = useLanguage()
  const navigate = useNavigate()
  const textareaRef = useRef(null)
  const followUpRef = useRef(null)

  const [query, setQuery] = useState('')
  const [followUpQuery, setFollowUpQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [generatingPdf, setGeneratingPdf] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [limitError, setLimitError] = useState(false)
  const [activeTab, setActiveTab] = useState('citizen')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [toast, setToast] = useState(null)   // { msg, type: 'error'|'warning' }
  const toastTimer = useRef(null)

  // Cases state
  const [activeCaseId, setActiveCaseId] = useState(null)   // selected case in sidebar
  const [caseView, setCaseView] = useState(null)            // loaded case detail
  const [caseViewLoading, setCaseViewLoading] = useState(false)
  const [selectedQueryId, setSelectedQueryId] = useState(null)

  // Modal dialog states
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [isBNSModalOpen, setIsBNSModalOpen] = useState(false)
  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false)

  const refreshSidebar = () => {
    if (window._jurisRefreshCases) window._jurisRefreshCases()
  }

  const showToast = useCallback((msg, type = 'error') => {
    setToast({ msg, type })
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 8000)
  }, [])

  // Safely parse JSON from query log
  const parseQueryResponse = (q) => {
    if (!q) return null
    let parsed = null
    try {
      parsed = typeof q.response_json === 'string' ? JSON.parse(q.response_json) : q.response_json
    } catch (e) {
      console.error('Error parsing response_json:', e)
    }
    if (!parsed) return null
    return {
      ...parsed,
      query_text: q.query_text,
      query_id: q.id,
      case_id: q.case_id,
      created_at: q.created_at,
    }
  }

  // Load a case's queries when user clicks it in sidebar
  const handleCaseSelect = useCallback(async (caseId) => {
    if (!caseId) {
      // "New case" — clear active case, show fresh query box
      setActiveCaseId(null)
      setCaseView(null)
      setResult(null)
      setSelectedQueryId(null)
      setQuery('')
      return
    }
    setActiveCaseId(caseId)
    setCaseViewLoading(true)
    setError('')
    try {
      const res = await apiGetCase(caseId)
      setCaseView(res.data)
      // Automatically load the latest query result into the complete interface!
      if (res.data?.queries && res.data.queries.length > 0) {
        const latestQ = res.data.queries[res.data.queries.length - 1]
        const fullResult = parseQueryResponse(latestQ)
        if (fullResult) {
          setResult(fullResult)
          setSelectedQueryId(latestQ.id)
          setActiveTab('citizen')
        }
      } else {
        setResult(null)
        setSelectedQueryId(null)
      }
    } catch {
      setCaseView(null)
      setResult(null)
      setSelectedQueryId(null)
    } finally {
      setCaseViewLoading(false)
    }
  }, [])

  // Load a specific query from History into the complete search result interface
  const handleHistorySelect = useCallback(async (historyItem) => {
    if (!historyItem) return
    setError('')
    const fullResult = parseQueryResponse(historyItem)
    if (fullResult) {
      setResult(fullResult)
      setSelectedQueryId(historyItem.id)
      setActiveTab('citizen')
      if (historyItem.case_id) {
        setActiveCaseId(historyItem.case_id)
        apiGetCase(historyItem.case_id)
          .then((res) => setCaseView(res.data))
          .catch(() => {})
      } else {
        setActiveCaseId(null)
        setCaseView(null)
      }
    }
  }, [])

  const executeQuery = async (queryText, targetCaseId = null) => {
    const trimmed = queryText.trim()
    if (!trimmed || loading) return
    setError('')
    setLimitError(false)
    setLoading(true)

    try {
      const res = await apiQuery(trimmed, targetCaseId, language)
      const data = res.data
      setResult({
        ...data,
        query_text: trimmed,
        created_at: new Date().toISOString(),
      })
      setSelectedQueryId(data.query_id)
      setActiveTab('citizen')
      setQuery('')
      setFollowUpQuery('')
      updateUser({ daily_query_count: (user?.daily_query_count || 0) + 1 })

      if (data.case_id) {
        setActiveCaseId(data.case_id)
        apiGetCase(data.case_id)
          .then((cRes) => setCaseView(cRes.data))
          .catch(() => {})
      }
      refreshSidebar()
    } catch (err) {
      if (err.response?.status === 429) {
        setLimitError(true)
        showToast('Daily query limit reached (5/5). Upgrade to Pro for unlimited access.', 'warning')
      } else {
        const msg = err.response?.data?.detail || 'Something went wrong. Please try again.'
        setError(msg)
        showToast(msg, 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleQuery = () => executeQuery(query, activeCaseId)
  const handleFollowUpQuery = () => executeQuery(followUpQuery, activeCaseId)

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleQuery()
    }
  }

  const handleFollowUpKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleFollowUpQuery()
    }
  }

  const handleLogout = () => { logout(); navigate('/login') }

  const handleUpgrade = async (updatedUser) => {
    if (updatedUser) {
      updateUser(updatedUser)
      setLimitError(false)
      showToast(
        updatedUser.is_pro
          ? '🎉 Upgraded to Pro Plan! Unlimited queries & Supreme Court precedents unlocked.'
          : 'Switched to Free Plan (5 queries/day).',
        'warning'
      )
      return
    }
    // If called directly from the limit banner button
    try {
      const res = await apiTogglePro('upgrade')
      updateUser(res.data)
      setLimitError(false)
      showToast('🎉 Upgraded to Pro Plan! Unlimited queries & Supreme Court precedents unlocked.', 'warning')
    } catch (err) {
      console.error('Upgrade failed:', err)
      showToast('Failed to upgrade plan. Please try again.', 'error')
    }
  }

  const handleSuggestionClick = (s) => {
    setQuery(s)
    textareaRef.current?.focus()
  }

  const showHero = !result && !loading && (!caseView || (caseView.queries && caseView.queries.length === 0)) && !caseViewLoading

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-screen bg-[#05050f] bg-grid flex"
    >
      <div className="fixed inset-0 bg-radial-glow pointer-events-none" />

      {/* ── Top Toast Banner — always visible without scrolling ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            transition={{ type: 'spring', damping: 22, stiffness: 280 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3
              px-5 py-3.5 rounded-2xl shadow-2xl border max-w-[92vw] w-full sm:max-w-lg
              ${toast.type === 'warning'
                ? 'bg-amber-950/95 border-amber-500/40 text-amber-200'
                : 'bg-red-950/95 border-red-500/40 text-red-200'
              } backdrop-blur-md`}
          >
            <AlertTriangle className={`w-4 h-4 shrink-0 ${toast.type === 'warning' ? 'text-amber-400' : 'text-red-400'}`} />
            <p className="text-sm flex-1 leading-snug">{toast.msg}</p>
            <button
              onClick={() => setToast(null)}
              className="shrink-0 opacity-60 hover:opacity-100 transition-opacity text-lg leading-none"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <Sidebar
        user={user}
        onLogout={handleLogout}
        onUpgrade={handleUpgrade}
        onCaseSelect={handleCaseSelect}
        onHistorySelect={handleHistorySelect}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenBNS={() => setIsBNSModalOpen(true)}
        activeCaseId={activeCaseId}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col min-h-screen relative">
        <div className="max-w-3xl w-full mx-auto px-4 lg:px-6 py-6 flex flex-col flex-1">

          {/* Top Bar with Profile Pill & Quick BNS Tool */}
          <div className="flex items-center gap-2 sm:gap-3 mb-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden w-9 h-9 rounded-xl glass flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* Case breadcrumb */}
            {activeCaseId && caseView && (
              <motion.button
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => { setActiveCaseId(null); setCaseView(null); setResult(null); setSelectedQueryId(null) }}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-400 transition-colors bg-white/4 px-3 py-1.5 rounded-lg border border-white/6"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="text-slate-500">Case:</span>
                <span className="font-semibold text-white truncate max-w-[180px] sm:max-w-[240px]">
                  {caseView.name}
                </span>
              </motion.button>
            )}

            <div className="flex items-center gap-2 ml-auto">
              {/* Vernacular Language Switcher */}
              <LanguageSelector compact={false} />

              {/* Case Document Chatbot Quick Trigger */}
              <button
                onClick={() => navigate('/case-chat')}
                className="flex items-center gap-1.5 text-xs text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 px-3 py-1.5 rounded-xl transition-all font-semibold shadow-md shadow-indigo-600/20 shrink-0"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Case Document Chat</span>
                <span className="sm:hidden">Chat</span>
              </button>

              {/* Court Limitation Tool */}
              <button
                onClick={() => navigate('/limitation-chronology')}
                className="hidden md:flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-2.5 py-1.5 rounded-xl transition-all font-medium"
                title="Court Limitation Clock & List of Dates"
              >
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>Limitation</span>
              </button>

              {/* Landmark Precedents */}
              <button
                onClick={() => navigate('/precedents')}
                className="hidden md:flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-2.5 py-1.5 rounded-xl transition-all font-medium"
                title="Supreme Court Landmark Precedents & Citations"
              >
                <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                <span>Precedents</span>
              </button>

              {/* BNS Tool Quick Trigger */}
              <button
                onClick={() => setIsBNSModalOpen(true)}
                className="flex items-center gap-1.5 text-xs text-indigo-300 hover:text-white bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/25 px-2.5 py-1.5 rounded-xl transition-all font-medium"
              >
                <Scale className="w-3.5 h-3.5 text-indigo-400" />
                <span className="flex items-center gap-1">
                  <span>IPC</span>
                  <span className="text-indigo-400 font-bold">⇄</span>
                  <span>BNS</span>
                </span>
              </button>

              {/* Live engine badge */}
              <div className="hidden lg:flex items-center gap-1.5 pl-1">
                <motion.div
                  className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="text-[11px] text-slate-500">Legal Intelligence Engine</span>
              </div>
            </div>
          </div>

          {/* Loading spinner for case selection */}
          <AnimatePresence>
            {caseViewLoading && (
              <motion.div
                key="caseLoading"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-16 gap-3"
              >
                <Loader2 className="w-7 h-7 text-indigo-400 animate-spin" />
                <p className="text-xs text-slate-500">Loading case intelligence...</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hero header — shown when no query/result is active */}
          <AnimatePresence>
            {showHero && (
              <motion.div
                key="hero"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16, transition: { duration: 0.2 } }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="text-center mb-8"
              >
                <div className="flex justify-center mb-5">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center indigo-glow-lg animate-float">
                    <Scale className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold text-gradient mb-2">{t('appTitle') || 'JurisAI'}</h1>
                <p className="text-slate-400 text-sm max-w-sm mx-auto leading-relaxed">
                  {t('appSubtitle') || 'Describe your legal situation. Get verified statutes, landmark precedents, and actionable guidance — instantly.'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Initial Query input card — shown when no result is displayed */}
          {!result && !caseViewLoading && (
            <motion.div layout="position" className="glass-card rounded-2xl p-4 mb-4">
              {activeCaseId && (
                <div className="flex items-center gap-1.5 mb-2 px-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  <span className="text-xs text-indigo-400/80 font-medium">
                    Adding to current case
                  </span>
                  <button
                    onClick={() => { setActiveCaseId(null); setCaseView(null) }}
                    className="ml-auto text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    Start new case instead
                  </button>
                </div>
              )}
              <textarea
                ref={textareaRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('searchPlaceholder') || 'Describe your legal scenario in plain language…\n\nPress Ctrl + Enter to submit.'}
                rows={4}
                className="w-full bg-transparent text-white placeholder-slate-700 text-sm resize-none focus:outline-none leading-relaxed"
              />
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-indigo-500/10 gap-3">
                <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                  {showHero && SUGGESTIONS.slice(0, 2).map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSuggestionClick(s)}
                      className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/8 border border-indigo-500/18 text-indigo-300/70 hover:text-indigo-300 hover:bg-indigo-500/14 transition-all truncate max-w-[160px]"
                    >
                      {s.slice(0, 22)}…
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {/* Voice Input Button — Vernacular dictation */}
                  <VoiceInputButton
                    language={language}
                    onTranscript={(text) => setQuery((prev) => (prev ? prev + ' ' + text : text))}
                    onError={(msg) => showToast(msg, 'error')}
                    size="md"
                  />
                  <motion.button
                    onClick={handleQuery}
                    disabled={loading || !query.trim()}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-35 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors indigo-glow shrink-0"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {loading ? 'Analyzing…' : (t('searchBtn') || 'Analyze')}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Suggestion grid — shown only in hero state */}
          <AnimatePresence>
            {showHero && (
              <motion.div
                key="suggestions"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
                transition={{ delay: 0.1, duration: 0.35 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-8"
              >
                {SUGGESTIONS.map((s, i) => (
                  <motion.button
                    key={s}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.12 + i * 0.06 }}
                    onClick={() => handleSuggestionClick(s)}
                    className="glass-card rounded-xl px-4 py-3 text-left text-xs text-slate-500 hover:text-slate-200 hover:border-indigo-500/25 transition-all group"
                  >
                    <Sparkles className="w-3 h-3 text-indigo-600 mb-1.5 group-hover:text-indigo-400 transition-colors" />
                    {s}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading state during query analysis */}
          <AnimatePresence>
            {loading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="glass-card rounded-2xl p-10 flex flex-col items-center gap-5 mb-5"
              >
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-600/15 border border-indigo-500/25 flex items-center justify-center">
                    <Scale className="w-6 h-6 text-indigo-400" />
                  </div>
                  <motion.div
                    className="absolute -inset-1.5 rounded-2xl border border-indigo-500/25"
                    animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-white mb-1">Analyzing your legal scenario…</p>
                  <p className="text-xs text-slate-500">Retrieving statutes · Searching precedents · Verifying citations</p>
                </div>
                <div className="flex gap-1.5">
                  {[0, 1, 2, 3].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 h-1.5 bg-indigo-500 rounded-full"
                      animate={{ scale: [1, 1.6, 1], opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18 }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error & Limit alerts */}
          <AnimatePresence>
            {limitError && (
              <motion.div
                key="limit"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="glass-card rounded-xl p-5 mb-5 border-amber-500/20"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white mb-1">Daily limit reached</p>
                    <p className="text-xs text-slate-400 mb-3">
                      You've used all 5 free queries for today. Upgrade to Pro for unlimited
                      access + Supreme Court precedents.
                    </p>
                    <button
                      onClick={() => handleUpgrade()}
                      className="text-xs bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500/25 text-amber-300 px-4 py-2 rounded-lg transition-all font-semibold"
                    >
                      Upgrade to Pro — Free Demo
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3 glass-card rounded-xl p-4 mb-5 border-red-500/18"
              >
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <p className="text-sm text-red-300">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ══════════════════════════════════════════════════════════════════════
              FULL SEARCH RESULT INTERFACE (For Both New Search & Case History)
             ══════════════════════════════════════════════════════════════════════ */}
          <AnimatePresence>
            {result && !caseViewLoading && (
              <motion.div
                key={`result-${result.query_id || 'active'}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-5"
              >
                {/* Action Toolbar: New Case / Follow-up / Court-PDF / Drafts */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setResult(null); setQuery(''); setActiveCaseId(null); setCaseView(null); setSelectedQueryId(null) }}
                      className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white border border-white/6 hover:border-indigo-500/30 bg-white/4 px-3 py-1.5 rounded-lg transition-all"
                    >
                      <Plus className="w-3 h-3 text-indigo-400" /> Start New Case
                    </button>
                    <button
                      onClick={() => { followUpRef.current?.scrollIntoView({ behavior: 'smooth' }) }}
                      className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white border border-white/6 hover:border-indigo-500/30 bg-white/4 px-3 py-1.5 rounded-lg transition-all"
                    >
                      <MessageSquare className="w-3 h-3 text-indigo-400" /> Ask Follow-up
                    </button>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Official Legal Drafts Button */}
                    <button
                      onClick={() => setIsDraftModalOpen(true)}
                      className="flex items-center gap-1.5 text-xs text-indigo-300 hover:text-white border border-indigo-500/30 hover:border-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 rounded-lg transition-all font-semibold"
                    >
                      <FileText className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{t('officialDrafts') || 'Legal Notice & Drafts'}</span>
                    </button>

                    {/* Official Court-Standard PDF Export */}
                    <button
                      onClick={() => {
                        setGeneratingPdf(true)
                        try {
                          generateCourtLegalReport({ result, user, caseName: caseView?.name })
                          showToast('Court-Standard Legal Report downloaded successfully!', 'warning')
                        } catch (e) {
                          console.error(e)
                          showToast('Failed to generate PDF. Please try again.', 'error')
                        } finally {
                          setGeneratingPdf(false)
                        }
                      }}
                      disabled={generatingPdf}
                      className="flex items-center gap-1.5 text-xs text-amber-300 hover:text-white border border-amber-500/30 hover:border-amber-400 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded-lg transition-all font-semibold shadow-sm"
                    >
                      {generatingPdf ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5 text-amber-400" />
                      )}
                      <span>{t('exportPdf') || 'Court-Standard PDF'}</span>
                    </button>
                  </div>
                </div>

                {/* Case Queries Switcher — when case has multiple questions */}
                {caseView?.queries && caseView.queries.length > 1 && (
                  <div className="glass-card rounded-xl p-3 border border-indigo-500/15">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                      <span className="font-semibold uppercase tracking-wider text-[11px] text-slate-400 flex items-center gap-1.5">
                        <FolderOpen className="w-3.5 h-3.5 text-indigo-400" /> Questions in this Case ({caseView.queries.length})
                      </span>
                      <span className="text-[10px] text-slate-500">Click any question to view its full advice</span>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                      {caseView.queries.map((q, idx) => {
                        const isSelected = selectedQueryId === q.id || result.query_id === q.id
                        return (
                          <button
                            key={q.id}
                            onClick={() => {
                              const parsed = parseQueryResponse(q)
                              if (parsed) {
                                setResult(parsed)
                                setSelectedQueryId(q.id)
                              }
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-2 border ${
                              isSelected
                                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
                                : 'bg-white/4 text-slate-400 hover:text-slate-200 border-white/6 hover:bg-white/8'
                            }`}
                          >
                            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              isSelected ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                            }`}>
                              {idx + 1}
                            </span>
                            <span className="truncate max-w-[220px]">{q.query_text}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Scenario Banner — Displays the full question that was analyzed */}
                <div className="glass-card rounded-2xl p-5 border border-indigo-500/20 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span className="flex items-center gap-1.5 font-semibold text-indigo-400">
                      <Scale className="w-3.5 h-3.5" /> Legal Scenario Analyzed
                    </span>
                    {result.created_at && (
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(result.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                  </div>
                  <p className="text-sm sm:text-base font-medium text-white leading-relaxed">
                    {result.query_text || query}
                  </p>
                </div>

                {/* Hallucination & Faithfulness Telemetry + Fast Query Caching Badge */}
                <TelemetryCard
                  telemetry={result.telemetry}
                  confidenceScore={result.confidence_score}
                  statutesCount={result.applicable_statutes?.length || 0}
                  precedentsCount={result.relevant_precedents?.length || 0}
                />

                {/* Dual-View Tab Switcher */}
                <div className="flex gap-1 glass rounded-xl p-1 w-fit border border-white/6">
                  <TabButton
                    active={activeTab === 'citizen'}
                    onClick={() => setActiveTab('citizen')}
                    icon={<Users className="w-3.5 h-3.5" />}
                    label={t('citizenView') || 'Citizen View'}
                  />
                  <TabButton
                    active={activeTab === 'advocate'}
                    onClick={() => setActiveTab('advocate')}
                    icon={<Briefcase className="w-3.5 h-3.5" />}
                    label={t('advocateView') || 'Advocate View'}
                  />
                </div>

                {/* Full Tab Content — Citizen View vs Advocate View with all citations */}
                <AnimatePresence mode="wait">
                  {activeTab === 'citizen' ? (
                    <CitizenView key="citizen" data={result} />
                  ) : (
                    <AdvocateView key="advocate" data={result} isPro={user?.is_pro} />
                  )}
                </AnimatePresence>

                {/* Follow-up Query Card right beneath the complete advice */}
                <div ref={followUpRef} className="pt-4 border-t border-indigo-500/15">
                  <div className="glass-card rounded-2xl p-4 border border-indigo-500/20">
                    <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-slate-300">
                      <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Ask a Follow-up Question in this Case</span>
                    </div>
                    <textarea
                      value={followUpQuery}
                      onChange={(e) => setFollowUpQuery(e.target.value)}
                      onKeyDown={handleFollowUpKeyDown}
                      placeholder="Ask a clarifying question or explore legal next steps in detail… (Ctrl + Enter to send)"
                      rows={3}
                      className="w-full bg-transparent text-white placeholder-slate-600 text-sm resize-none focus:outline-none leading-relaxed"
                    />
                    <div className="flex items-center justify-end mt-2 pt-2 border-t border-white/5 gap-2">
                      {/* Voice for follow-up */}
                      <VoiceInputButton
                        language={language}
                        onTranscript={(text) => setFollowUpQuery((prev) => (prev ? prev + ' ' + text : text))}
                        onError={(msg) => showToast(msg, 'error')}
                        size="sm"
                      />
                      <motion.button
                        onClick={handleFollowUpQuery}
                        disabled={loading || !followUpQuery.trim()}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-35 disabled:cursor-not-allowed text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all indigo-glow"
                      >
                        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        {loading ? 'Analyzing…' : 'Send Follow-up'}
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </main>

      {/* ── MODALS ── */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={user}
        onUserUpdated={(updated) => updateUser(updated)}
      />

      <BNSConverterModal
        isOpen={isBNSModalOpen}
        onClose={() => setIsBNSModalOpen(false)}
      />

      <LegalDraftModal
        isOpen={isDraftModalOpen}
        onClose={() => setIsDraftModalOpen(false)}
        result={result}
        user={user}
      />
    </motion.div>
  )
}

function TabButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
        active ? 'text-white' : 'text-slate-400 hover:text-slate-200'
      }`}
    >
      {active && (
        <motion.div
          layoutId="activeTabIndicator"
          className="absolute inset-0 bg-indigo-600 rounded-lg indigo-glow"
          transition={{ type: 'spring', damping: 32, stiffness: 340 }}
        />
      )}
      <span className="relative flex items-center gap-1.5 z-10">{icon}{label}</span>
    </button>
  )
}
