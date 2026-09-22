import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, Sparkles, Users, Briefcase, Menu,
  Loader2, AlertTriangle, Scale, FileText, Zap,
  Plus, FolderOpen, ChevronLeft, Clock,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { apiQuery, apiGetCase, apiTogglePro } from '../api/client'
import Sidebar from '../components/Sidebar'
import CitizenView from '../components/CitizenView'
import AdvocateView from '../components/AdvocateView'

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
  const navigate = useNavigate()
  const textareaRef = useRef(null)

  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
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

  const refreshSidebar = () => {
    if (window._jurisRefreshCases) window._jurisRefreshCases()
  }

  const showToast = useCallback((msg, type = 'error') => {
    setToast({ msg, type })
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 8000)
  }, [])

  // Load a case's queries when user clicks it in sidebar
  const handleCaseSelect = useCallback(async (caseId) => {
    if (!caseId) {
      // "New case" — clear active case, show query box
      setActiveCaseId(null)
      setCaseView(null)
      setResult(null)
      setQuery('')
      return
    }
    setActiveCaseId(caseId)
    setResult(null)
    setCaseViewLoading(true)
    try {
      const res = await apiGetCase(caseId)
      setCaseView(res.data)
    } catch {
      setCaseView(null)
    } finally {
      setCaseViewLoading(false)
    }
  }, [])

  const handleQuery = async () => {
    const trimmed = query.trim()
    if (!trimmed || loading) return
    setError('')
    setLimitError(false)
    setResult(null)
    setLoading(true)

    try {
      const res = await apiQuery(trimmed, activeCaseId)
      const data = res.data
      setResult(data)
      setActiveTab('citizen')
      updateUser({ daily_query_count: (user?.daily_query_count || 0) + 1 })
      if (data.case_id) setActiveCaseId(data.case_id)
      refreshSidebar()
    } catch (err) {
      if (err.response?.status === 429) {
        setLimitError(true)
        showToast('Daily query limit reached. Upgrade to Pro for unlimited access.', 'warning')
      } else {
        const msg = err.response?.data?.detail || 'Something went wrong. Please try again.'
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

  const handleLogout = () => { logout(); navigate('/login') }

  const handleUpgrade = async () => {
    try {
      // Refetch user from /me to get updated is_pro
      const meRes = await apiTogglePro()
      updateUser({ is_pro: meRes.data.is_pro })
    } catch {
      // Optimistic toggle for demo
      updateUser({ is_pro: !user?.is_pro })
    }
    setLimitError(false)
  }

  const handleSuggestionClick = (s) => {
    setQuery(s)
    textareaRef.current?.focus()
  }

  const showHero = !result && !loading && !caseView && !caseViewLoading

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
        activeCaseId={activeCaseId}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col min-h-screen relative">
        <div className="max-w-3xl w-full mx-auto px-4 lg:px-6 py-6 flex flex-col flex-1">

          {/* Top bar */}
          <div className="flex items-center gap-3 mb-8">
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
                onClick={() => { setActiveCaseId(null); setCaseView(null); setResult(null) }}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-400 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                {caseView.name.length > 40 ? caseView.name.slice(0, 40) + '…' : caseView.name}
              </motion.button>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <motion.div
                className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-xs text-slate-600">Gemini 3.6 Flash · Active</span>
            </div>
          </div>

          {/* ── Case View: query history inside a case ── */}
          <AnimatePresence mode="wait">
            {caseViewLoading && (
              <motion.div
                key="caseLoading"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex justify-center py-16"
              >
                <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
              </motion.div>
            )}

            {caseView && !caseViewLoading && !result && (
              <motion.div
                key="caseView"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="mb-6"
              >
                <div className="flex items-center gap-2 mb-4">
                  <FolderOpen className="w-4 h-4 text-indigo-400" />
                  <h2 className="text-sm font-semibold text-white truncate">{caseView.name}</h2>
                  <span className="text-xs text-slate-600 ml-auto">
                    {caseView.queries?.length || 0} queries
                  </span>
                </div>

                {caseView.queries?.length === 0 ? (
                  <div className="text-center py-12 glass-card rounded-2xl">
                    <Clock className="w-8 h-8 text-slate-800 mx-auto mb-2" />
                    <p className="text-sm text-slate-600">No queries in this case yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {[...caseView.queries].reverse().map((q, i) => {
                      let parsed = null
                      try { parsed = JSON.parse(q.response_json) } catch { }
                      return (
                        <motion.div
                          key={q.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="glass-card rounded-xl p-4"
                        >
                          <p className="text-xs font-semibold text-indigo-300 mb-2 flex items-center gap-2">
                            <Send className="w-3 h-3" />
                            {q.query_text}
                          </p>
                          {parsed?.plain_english_summary && (
                            <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                              {parsed.plain_english_summary}
                            </p>
                          )}
                          <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
                            <span className="text-[10px] text-slate-700">
                              {new Date(q.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}
                            </span>
                            <button
                              onClick={() => {
                                setQuery(q.query_text)
                                setCaseView(null)
                                setResult(null)
                                textareaRef.current?.focus()
                              }}
                              className="text-[10px] text-indigo-500 hover:text-indigo-400 transition-colors"
                            >
                              Ask again →
                            </button>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hero header */}
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
                <h1 className="text-3xl lg:text-4xl font-bold text-gradient mb-2">JurisAI</h1>
                <p className="text-slate-400 text-sm max-w-sm mx-auto leading-relaxed">
                  Describe your legal situation. Get verified statutes, landmark precedents,
                  and actionable guidance — instantly.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Query input card */}
          {!caseView && (
            <motion.div layout="position" className="glass-card rounded-2xl p-4 mb-4">
              {activeCaseId && !caseView && (
                <div className="flex items-center gap-1.5 mb-2 px-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  <span className="text-xs text-indigo-400/70">
                    Adding to current case
                  </span>
                  <button
                    onClick={() => setActiveCaseId(null)}
                    className="ml-auto text-[10px] text-slate-600 hover:text-slate-400"
                  >
                    New case instead
                  </button>
                </div>
              )}
              <textarea
                ref={textareaRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={'Describe your legal scenario in plain language…\n\nPress Ctrl + Enter to submit.'}
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
                <motion.button
                  onClick={handleQuery}
                  disabled={loading || !query.trim()}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-35 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors indigo-glow shrink-0"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {loading ? 'Analyzing…' : 'Analyze'}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Suggestion grid */}
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

          {/* Loading state */}
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
                  <p className="text-xs text-slate-600">Retrieving statutes · Searching precedents · Verifying citations</p>
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

          {/* Error / Limit alerts */}
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
                      You've used all 3 free queries for today. Upgrade to Pro for unlimited
                      access + Supreme Court precedents.
                    </p>
                    <button
                      onClick={handleUpgrade}
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

          {/* Results */}
          <AnimatePresence>
            {result && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* New case / continue buttons */}
                <div className="flex items-center gap-2 mb-4">
                  <button
                    onClick={() => { setResult(null); setQuery(''); setActiveCaseId(null) }}
                    className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-400 border border-white/5 hover:border-indigo-500/20 px-3 py-1.5 rounded-lg transition-all"
                  >
                    <Plus className="w-3 h-3" /> New case
                  </button>
                  <button
                    onClick={() => { setResult(null); setQuery('') }}
                    className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-400 border border-white/5 hover:border-indigo-500/20 px-3 py-1.5 rounded-lg transition-all"
                  >
                    <Send className="w-3 h-3" /> Follow-up query
                  </button>
                </div>

                {/* Tab switcher */}
                <div className="flex gap-1 glass rounded-xl p-1 mb-5 w-fit">
                  <TabButton active={activeTab === 'citizen'} onClick={() => setActiveTab('citizen')}
                    icon={<Users className="w-3.5 h-3.5" />} label="Citizen View" />
                  <TabButton active={activeTab === 'advocate'} onClick={() => setActiveTab('advocate')}
                    icon={<Briefcase className="w-3.5 h-3.5" />} label="Advocate View" />
                </div>

                <AnimatePresence mode="wait">
                  {activeTab === 'citizen'
                    ? <CitizenView key="citizen" data={result} />
                    : <AdvocateView key="advocate" data={result} isPro={user?.is_pro} />
                  }
                </AnimatePresence>

                {user?.is_pro && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                    className="mt-5 flex justify-end">
                    <button
                      onClick={() => alert('PDF Export — Coming in v2.1!\n\nWill generate a formatted legal brief with all citations.')}
                      className="flex items-center gap-2 text-xs text-slate-500 hover:text-white border border-slate-800 hover:border-indigo-500/30 px-4 py-2 rounded-xl transition-all"
                    >
                      <FileText className="w-3.5 h-3.5" /> Export PDF (Pro)
                    </button>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </motion.div>
  )
}

function TabButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
        active ? 'text-white' : 'text-slate-500 hover:text-slate-300'
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
