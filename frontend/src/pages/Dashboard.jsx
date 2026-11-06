import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, Sparkles, Users, Briefcase, Menu,
  Loader2, AlertTriangle, Scale, FileText, Zap,
  Plus, FolderOpen, ChevronLeft, Clock, MessageSquare,
  CheckCircle, ArrowRight, Download, Pencil, BookOpen, Calendar,
  Calculator, ShieldCheck, Printer,
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
import CourtFeeModal from '../components/CourtFeeModal'
import AdvocateDiaryModal from '../components/AdvocateDiaryModal'
import DPDPSecurityModal from '../components/DPDPSecurityModal'
import NotificationCenter from '../components/NotificationCenter'
import NotificationPermissionModal from '../components/NotificationPermissionModal'
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
  const [isCourtFeeModalOpen, setIsCourtFeeModalOpen] = useState(false)
  const [isDiaryModalOpen, setIsDiaryModalOpen] = useState(false)
  const [isDPDPModalOpen, setIsDPDPModalOpen] = useState(false)
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false)

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
    } catch (err) {
      console.error('Failed to load case:', err)
      showToast('Could not load case details.', 'error')
    } finally {
      setCaseViewLoading(false)
    }
  }, [showToast])

  // Select a historical query from sidebar history tab
  const handleHistorySelect = (historyItem) => {
    setActiveCaseId(historyItem.case_id || null)
    setCaseView(null)
    const fullResult = parseQueryResponse(historyItem)
    if (fullResult) {
      setResult(fullResult)
      setSelectedQueryId(historyItem.id)
      setActiveTab('citizen')
    }
  }

  const handleQuery = async () => {
    const trimmed = query.trim()
    if (!trimmed || loading) return

    setLoading(true)
    setError('')
    setLimitError(false)

    try {
      const res = await apiQuery({
        query_text: trimmed,
        language,
        case_id: activeCaseId || undefined,
      })

      const queryResult = res.data
      setResult(queryResult)

      if (queryResult.case_id) {
        setActiveCaseId(queryResult.case_id)
        apiGetCase(queryResult.case_id)
          .then((cRes) => setCaseView(cRes.data))
          .catch(() => {})
      }

      setQuery('')
      refreshSidebar()
    } catch (err) {
      const status = err.response?.status
      const detail = err.response?.data?.detail || ''

      if (status === 429) {
        setLimitError(true)
      } else if (status === 401) {
        showToast('Your session has expired. Please sign in again.', 'error')
        logout()
        navigate('/login')
      } else {
        const msg = detail || t('errorGeneric') || 'Failed to analyze scenario. Please try again.'
        setError(msg)
        showToast(msg, 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleFollowUpQuery = async () => {
    const trimmed = followUpQuery.trim()
    if (!trimmed || loading) return

    setLoading(true)
    setError('')

    try {
      const res = await apiQuery({
        query_text: trimmed,
        language,
        case_id: activeCaseId || (result ? result.case_id : undefined),
      })

      const queryResult = res.data
      setResult(queryResult)
      setFollowUpQuery('')

      if (queryResult.case_id) {
        setActiveCaseId(queryResult.case_id)
        apiGetCase(queryResult.case_id)
          .then((cRes) => setCaseView(cRes.data))
          .catch(() => {})
      }

      refreshSidebar()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      const status = err.response?.status
      const detail = err.response?.data?.detail || ''

      if (status === 429) {
        setLimitError(true)
      } else if (status === 401) {
        showToast('Your session has expired. Please sign in again.', 'error')
        logout()
        navigate('/login')
      } else {
        const msg = detail || 'Failed to process follow-up question. Please try again.'
        setError(msg)
        showToast(msg, 'error')
      }
    } finally {
      setLoading(false)
    }
  }

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

  const handleSuggestionClick = (text) => {
    setQuery(text)
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }

  const handleVoiceTranscript = (transcriptText) => {
    setQuery((prev) => (prev ? prev + ' ' + transcriptText : transcriptText))
  }

  const handleFollowUpVoiceTranscript = (transcriptText) => {
    setFollowUpQuery((prev) => (prev ? prev + ' ' + transcriptText : transcriptText))
  }

  const handleVoiceError = (errorMsg) => {
    showToast(errorMsg, 'error')
  }

  const handleUpgrade = async () => {
    try {
      const res = await apiTogglePro('upgrade')
      updateUser(res.data)
      setLimitError(false)
      showToast('Account upgraded to Pro! Unlimited legal queries unlocked.', 'warning')
      refreshSidebar()
    } catch {
      showToast('Failed to switch plan. Please try again.', 'error')
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleOpenProfile = useCallback(() => setIsProfileModalOpen(true), [])
  const handleOpenBNS = useCallback(() => setIsBNSModalOpen(true), [])
  const handleOpenCourtFee = useCallback(() => setIsCourtFeeModalOpen(true), [])
  const handleOpenDiary = useCallback(() => setIsDiaryModalOpen(true), [])
  const handleCloseSidebar = useCallback(() => setSidebarOpen(false), [])

  const showHero = !result && !loading && (!caseView || (caseView.queries && caseView.queries.length === 0)) && !caseViewLoading

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-screen text-slate-100 flex relative overflow-x-hidden"
    >
      <div className="fixed inset-0 bg-radial-glow pointer-events-none" />

      {/* ── Top Toast Banner ── */}
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
        onOpenProfile={handleOpenProfile}
        onOpenBNS={handleOpenBNS}
        onOpenCourtFee={handleOpenCourtFee}
        onOpenDiary={handleOpenDiary}
        onOpenDPDP={() => setIsDPDPModalOpen(true)}
        activeCaseId={activeCaseId}
        open={sidebarOpen}
        onClose={handleCloseSidebar}
      />

      <main className="flex-1 flex flex-col min-h-screen relative">
        <div className="max-w-5xl w-full mx-auto px-4 lg:px-6 py-5 flex flex-col flex-1">

          {/* Top Header Bar — Dark Indigo Glass Theme */}
          <header className="flex flex-wrap items-center justify-between gap-2.5 mb-6 pb-3 border-b border-indigo-500/15 bg-white/3 backdrop-blur-md rounded-2xl px-4 py-2">
            {/* Left: Mobile Menu & Active Case Context */}
            <div className="flex items-center gap-2 min-w-0">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden w-9 h-9 rounded-xl glass flex items-center justify-center text-slate-400 hover:text-white transition-colors shrink-0"
                aria-label="Open Navigation"
              >
                <Menu className="w-4 h-4" />
              </button>

              {activeCaseId && caseView ? (
                <button
                  onClick={() => { setActiveCaseId(null); setCaseView(null); setResult(null); setSelectedQueryId(null) }}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-300 transition-colors bg-white/4 px-3 py-1.5 rounded-xl border border-white/6 truncate"
                  title="Click to exit case view"
                >
                  <ChevronLeft className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-slate-500">Case:</span>
                  <span className="font-semibold text-white truncate max-w-[160px] sm:max-w-[220px]">
                    {caseView.name}
                  </span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 indigo-glow">
                    <Scale className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold text-gradient tracking-wide">
                    JurisAI
                  </span>
                </div>
              )}
            </div>

            {/* Right: Quick Tools */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 ml-auto justify-end">
              {/* Primary: Case Document Chat */}
              <button
                onClick={() => navigate('/case-chat')}
                className="flex items-center gap-1.5 text-xs text-white bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded-xl transition-all font-semibold indigo-glow shrink-0"
                title="AI Co-Pilot for Case Documents & Contracts"
              >
                <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Case Document Chat</span>
                <span className="sm:hidden">Chat</span>
              </button>

              {/* Advocate Diary */}
              <button
                onClick={handleOpenDiary}
                className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-white/4 hover:bg-white/8 border border-white/6 px-2.5 py-1.5 rounded-xl transition-all font-semibold shrink-0"
                title="Advocate Digital Diary & Daily Cause List"
              >
                <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="hidden sm:inline">Advocate Diary</span>
                <span className="sm:hidden">Diary</span>
              </button>

              {/* Court Fees Calculator */}
              <button
                onClick={handleOpenCourtFee}
                className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-white/4 hover:bg-white/8 border border-white/6 px-2.5 py-1.5 rounded-xl transition-all font-semibold shrink-0"
                title="Section 10 Official Court Fee & Valuation Slip"
              >
                <Calculator className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="hidden sm:inline">Court Fees</span>
                <span className="sm:hidden">Fees</span>
              </button>

              {/* IPC ⇄ BNS Tool */}
              <button
                onClick={() => setIsBNSModalOpen(true)}
                className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-white/4 hover:bg-white/8 border border-white/6 px-2.5 py-1.5 rounded-xl transition-all font-medium shrink-0"
                title="IPC to BNS Statutory Concordance"
              >
                <Scale className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="flex items-center gap-1">
                  <span>IPC</span>
                  <span className="text-indigo-400 font-bold">⇄</span>
                  <span>BNS</span>
                </span>
              </button>

              {/* DPDP Shield */}
              <button
                onClick={() => setIsDPDPModalOpen(true)}
                className="flex items-center gap-1.5 text-xs text-emerald-300 hover:text-emerald-200 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 px-2.5 py-1.5 rounded-xl transition-all font-semibold shrink-0"
                title="DPDP Act 2023 & Section 132 BSA Compliance Certificate"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="hidden md:inline">DPDP Shield</span>
                <span className="md:hidden">DPDP</span>
              </button>

              {/* Divider */}
              <div className="h-4 w-px bg-white/10 hidden sm:block mx-0.5" />

              {/* Vernacular Language Selector */}
              <LanguageSelector compact={false} align="right" />

              {/* Notification Center */}
              <NotificationCenter
                onOpenDiary={handleOpenDiary}
                onOpenCourtFee={handleOpenCourtFee}
                onOpenPro={() => handleUpgrade()}
                onOpenBNS={handleOpenBNS}
                onRequestPermissionModal={() => setIsNotifModalOpen(true)}
                align="right"
              />
            </div>
          </header>

          {/* Loading spinner for case selection */}
          <AnimatePresence>
            {caseViewLoading && (
              <motion.div
                key="caseLoading"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-16 gap-3"
              >
                <Loader2 className="w-7 h-7 text-indigo-400 animate-spin" />
                <p className="text-xs text-slate-400">Loading case intelligence...</p>
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
                  <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center indigo-glow text-white animate-float">
                    <Scale className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight mb-2 text-gradient">
                  JurisAI
                </h1>
                <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
                  {t('appSubtitle') || 'Sovereign Legal Intelligence for Indian Courts · Verified statutes, landmark precedents & authentic valuation slips.'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Initial Query input card — shown when no result is displayed */}
          {!result && !caseViewLoading && (
            <div className="glass-card rounded-2xl p-4 mb-4 border border-indigo-500/20">
              {activeCaseId && (
                <div className="flex items-center gap-1.5 mb-2 px-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  <span className="text-xs text-indigo-300 font-medium">
                    Adding to current case
                  </span>
                  <button
                    onClick={() => { setActiveCaseId(null); setCaseView(null) }}
                    className="ml-auto text-[10px] text-slate-400 hover:text-white transition-colors"
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
                className="w-full bg-transparent text-white placeholder-slate-500 text-sm resize-none focus:outline-none leading-relaxed"
              />
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5 gap-3">
                <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                  {showHero && SUGGESTIONS.slice(0, 2).map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSuggestionClick(s)}
                      className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 hover:bg-indigo-500/20 hover:text-white transition-all truncate max-w-[160px]"
                    >
                      {s.slice(0, 22)}…
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <VoiceInputButton
                    language={language}
                    onTranscript={handleVoiceTranscript}
                    onError={handleVoiceError}
                    size="md"
                  />
                  <motion.button
                    onClick={handleQuery}
                    disabled={loading || !query.trim()}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-35 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all indigo-glow shrink-0"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {loading ? 'Analyzing…' : (t('searchBtn') || 'Analyze')}
                  </motion.button>
                </div>
              </div>
            </div>
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
                    className="glass-card rounded-xl px-4 py-3 text-left text-xs text-slate-400 hover:text-white hover:border-indigo-500/28 transition-all group"
                  >
                    <Sparkles className="w-3 h-3 text-indigo-400 mb-1.5 group-hover:text-indigo-300 transition-colors" />
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
                className="glass-card rounded-2xl p-10 flex flex-col items-center gap-5 mb-5 border border-indigo-500/20"
              >
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white indigo-glow">
                    <Scale className="w-6 h-6 text-white" />
                  </div>
                  <motion.div
                    className="absolute -inset-1.5 rounded-2xl border border-indigo-400/30"
                    animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-white mb-1">Analyzing your legal scenario…</p>
                  <p className="text-xs text-slate-400">Retrieving statutes · Searching precedents · Verifying citations</p>
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
                className="glass-card rounded-xl p-5 mb-5 border border-amber-500/20"
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
                className="flex items-center gap-3 glass-card rounded-xl p-4 mb-5 border border-red-500/20"
              >
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <p className="text-sm text-red-300">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ══════════════════════════════════════════════════════════════════════
              FULL SEARCH RESULT INTERFACE
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
                {/* Action Toolbar */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setResult(null); setQuery(''); setActiveCaseId(null); setCaseView(null); setSelectedQueryId(null) }}
                      className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white border border-white/10 hover:border-indigo-500/30 bg-white/4 hover:bg-white/8 px-3 py-1.5 rounded-lg transition-all"
                    >
                      <Plus className="w-3 h-3 text-indigo-400" /> Start New Case
                    </button>
                    <button
                      onClick={() => { followUpRef.current?.scrollIntoView({ behavior: 'smooth' }) }}
                      className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white border border-white/10 hover:border-indigo-500/30 bg-white/4 hover:bg-white/8 px-3 py-1.5 rounded-lg transition-all"
                    >
                      <MessageSquare className="w-3 h-3 text-indigo-400" /> Ask Follow-up
                    </button>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Official Legal Drafts Button */}
                    <button
                      onClick={() => setIsDraftModalOpen(true)}
                      className="flex items-center gap-1.5 text-xs text-white bg-indigo-600 hover:bg-indigo-500 border border-indigo-400/30 px-3 py-1.5 rounded-lg transition-all font-semibold indigo-glow"
                    >
                      <FileText className="w-3.5 h-3.5 text-white" />
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
                      className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg transition-all font-semibold shrink-0"
                    >
                      {generatingPdf ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5 text-indigo-400" />
                      )}
                      <span className="hidden xs:inline">{t('exportPdf') || 'Court-Standard PDF'}</span>
                      <span className="xs:hidden">PDF</span>
                    </button>

                    {/* Print Legal Advisory Report */}
                    <button
                      onClick={() => window.print()}
                      className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white border border-white/10 hover:border-white/20 bg-white/4 hover:bg-white/8 px-3 py-1.5 rounded-lg transition-all font-semibold shrink-0"
                      title="Print pristine court legal intelligence report"
                    >
                      <Printer className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="hidden xs:inline">{t('printReport') || 'Print Report'}</span>
                      <span className="xs:hidden">Print</span>
                    </button>
                  </div>
                </div>

                {/* Case Queries Switcher */}
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
                                ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30'
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

                {/* Scenario Banner */}
                <div className="glass-card rounded-2xl p-5 border border-indigo-500/20 relative overflow-hidden shadow-lg">
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

                {/* Statutory Verification & Authority Telemetry */}
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

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                  {activeTab === 'citizen' ? (
                    <CitizenView key="citizen" data={result} />
                  ) : (
                    <AdvocateView key="advocate" data={result} isPro={user?.is_pro} />
                  )}
                </AnimatePresence>

                {/* Follow-up Query Card */}
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
                      className="w-full bg-transparent text-white placeholder-slate-500 text-sm resize-none focus:outline-none leading-relaxed"
                    />
                    <div className="flex items-center justify-end mt-2 pt-2 border-t border-white/5 gap-2">
                      <VoiceInputButton
                        language={language}
                        onTranscript={handleFollowUpVoiceTranscript}
                        onError={handleVoiceError}
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

      <CourtFeeModal
        isOpen={isCourtFeeModalOpen}
        onClose={() => setIsCourtFeeModalOpen(false)}
      />

      <AdvocateDiaryModal
        isOpen={isDiaryModalOpen}
        onClose={() => setIsDiaryModalOpen(false)}
      />

      <DPDPSecurityModal
        isOpen={isDPDPModalOpen}
        onClose={() => setIsDPDPModalOpen(false)}
      />

      <NotificationPermissionModal
        isOpen={isNotifModalOpen}
        onClose={() => setIsNotifModalOpen(false)}
        onPermissionGranted={() => showToast('🔔 System Notifications Activated! Court hearing & limitation reminders are now active.', 'warning')}
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
