import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, Sparkles, Users, Briefcase, Menu,
  Loader2, AlertTriangle, Scale, FileText, Zap,
  Plus, FolderOpen, ChevronLeft, Clock, MessageSquare,
  CheckCircle, ArrowRight, Download, Pencil, BookOpen, Calendar,
  Calculator, ShieldCheck, Printer, User,
  Share2, FileDown, Brain, Copy, Check, X,
  ArrowUpRight,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLanguage, LanguageSelector } from '../context/LanguageContext'
import { apiQuery, apiGetCase, apiTogglePro, apiTransferCaseToChat } from '../api/client'
import Sidebar from '../components/Sidebar'
import CitizenView from '../components/CitizenView'
import AdvocateView from '../components/AdvocateView'
import ProfileModal from '../components/ProfileModal'
import BNSConverterModal from '../components/BNSConverterModal'
import LegalDraftModal from '../components/LegalDraftModal'
import CourtFeeModal from '../components/CourtFeeModal'
import AdvocateDiaryModal from '../components/AdvocateDiaryModal'
import DPDPSecurityModal from '../components/DPDPSecurityModal'
import BareActsModal from '../components/BareActsModal'
import NotificationCenter from '../components/NotificationCenter'
import NotificationPermissionModal from '../components/NotificationPermissionModal'
import TelemetryCard from '../components/TelemetryCard'
import VoiceInputButton from '../components/VoiceInputButton'
import ComponentErrorBoundary from '../components/ComponentErrorBoundary'
import { generateCourtLegalReport } from '../utils/courtReportGenerator'

const SUGGESTIONS_MAP = {
  en: [
    'Online defamation on social media — what are my legal options?',
    'Landlord refusing to return security deposit after 2 months of vacating',
    'My employer withheld my salary and terminated me without notice',
    'Cheque bounced due to insufficient funds what is the notice period under 138',
    'Consumer complaint against e-commerce site for defective product delivery',
    'Right to privacy violation by a government authority collecting biometric data',
  ],
  kn: [
    'ಆನ್‌ಲೈನ್ ಸಾಮಾಜಿಕ ಜಾಲತಾಣಗಳಲ್ಲಿ ನಿಂದನೆ ಮತ್ತು ಮಾನನಷ್ಟ — ನನ್ನ ಕಾನೂನು ಆಯ್ಕೆಗಳೇನು?',
    'ಮನೆ ಖಾಲಿ ಮಾಡಿ 2 ತಿಂಗಳಾದರೂ ಮಾಲೀಕರು ಅಡ್ವಾನ್ಸ್ ಡೆಪಾಸಿಟ್ ಹಣ ಮರುಪಾವತಿಸುತ್ತಿಲ್ಲ',
    'ಕಂಪನಿಯು ನೋಟೀಸ್ ನೀಡದೆ ನನ್ನ ಸಂಬಳವನ್ನು ತಡೆಹಿಡಿದು ಕೆಲಸದಿಂದ ವಜಾಗೊಳಿಸಿದೆ',
    'ಖಾತೆಯಲ್ಲಿ ಹಣದ ಕೊರತೆಯಿಂದ ಚೆಕ್ ಬೌನ್ಸ್ ಆಗಿದೆ — ಸೆಕ್ಷನ್ 138 ರ ಅಡಿಯಲ್ಲಿ ಲೀಗಲ್ ನೋಟೀಸ್',
    'ದೋಷಯುಕ್ತ ಉತ್ಪನ್ನ ಡೆಲಿವರಿ ವಿರುದ್ಧ ಇ-ಕಾಮರ್ಸ್ ಸಂಸ್ಥೆಯ ಮೇಲೆ ಗ್ರಾಹಕರ ಆಯೋಗಕ್ಕೆ ದೂರು',
    'ಸರ್ಕಾರಿ ಪ್ರಾಧಿಕಾರದಿಂದ ಬಯೋಮೆಟ್ರಿಕ್ ಡೇಟಾ ಸಂಗ್ರಹಣೆ ಹಾಗೂ ವೈಯಕ್ತಿಕ ಗೌಪ್ಯತೆ ಹಕ್ಕು ಉಲ್ಲಂಘನೆ',
  ],
  hi: [
    'सोशल मीडिया पर ऑनलाइन मानहानि — मेरे विधिक अधिकार एवं विकल्प क्या हैं?',
    'मकान खाली करने के 2 माह बाद भी मकान मालिक सिक्योरिटी डिपॉजिट नहीं लौटा रहा है',
    'नियोक्ता ने बिना किसी नोटिस के वेतन रोककर नौकरी से बर्खास्त कर दिया',
    'अकाउंट में राशि न होने पर चेक बाउंस — धारा 138 NI Act के तहत विधिक नोटिस',
    'दोषपूर्ण उत्पाद डिलीवरी पर ई-कॉमर्स कंपनी के विरुद्ध उपभोक्ता आयोग में शिकायत',
    'बायोमेट्रिक डेटा संग्रह द्वारा सरकारी प्राधिकरण द्वारा निजता के अधिकार का उल्लंघन',
  ],
  te: [
    'సోషల్ మీడియాలో ఆన్‌లైన్ పరువు నష్టం — నా చట్టపరమైన పరిష్కారాలు ఏమిటి?',
    'ఇల్లు ఖాళీ చేసి 2 నెలలైనా యజమాని సెక్యూరిటీ డిపాజిట్ తిరిగి ఇవ్వడం లేదు',
    'యజమాని నోటీసు లేకుండా జీతం నిలిపివేసి ఉద్యోగం నుండి తొలగించారు',
    'ఖాతాలో డబ్బులు లేక చెక్ బౌన్స్ — సెక్షన్ 138 ప్రకారం లీగల్ నోటీసు',
    'లోపభూయిష్ట వస్తువు డెలివరీపై ఈ-కామర్స్ సైట్‌పై వినియోగదారుల కమిషన్‌లో ఫిర్యాదు',
    'బయోమెట్రిక్ డేటా సేకరణ ద్వారా ప్రభుత్వ అధికారి వ్యక్తిగత గోప్యతా హక్కు ఉల్లంఘన',
  ],
}

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.35 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
}

export default function Dashboard() {
  const { user, logout, updateUser } = useAuth()
  const { language, t } = useLanguage()
  const suggestions = SUGGESTIONS_MAP[language] || SUGGESTIONS_MAP.en
  const navigate = useNavigate()
  const textareaRef = useRef(null)
  const followUpRef = useRef(null)

  const [query, setQuery] = useState('')
  const [followUpQuery, setFollowUpQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState(0)
  const abortControllerRef = useRef(null)
  const progressTimerRef = useRef(null)
  const watchdogTimerRef = useRef(null)
  const [generatingPdf, setGeneratingPdf] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [copiedShare, setCopiedShare] = useState(false)
  const [deepThink, setDeepThink] = useState(false)
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
  const [turnViews, setTurnViews] = useState({})

  // Modal dialog states
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [isBNSModalOpen, setIsBNSModalOpen] = useState(false)
  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false)
  const [isCourtFeeModalOpen, setIsCourtFeeModalOpen] = useState(false)
  const [isDiaryModalOpen, setIsDiaryModalOpen] = useState(false)
  const [isDPDPModalOpen, setIsDPDPModalOpen] = useState(false)
  const [isBareActsModalOpen, setIsBareActsModalOpen] = useState(false)
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false)

  const refreshSidebar = () => {
    if (window._jurisRefreshCases) window._jurisRefreshCases()
  }

  const showToast = useCallback((msg, type = 'error') => {
    setToast({ msg, type })
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 8000)
  }, [])

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort()
      if (progressTimerRef.current) clearInterval(progressTimerRef.current)
      if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current)
    }
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

  // Derive sequential conversation turns for this case (ChatGPT / Gemini stream)
  const caseTurns = useMemo(() => {
    if (caseView?.queries && caseView.queries.length > 0) {
      const parsed = caseView.queries.map(parseQueryResponse).filter(Boolean)
      if (
        result &&
        !parsed.some(
          (q) =>
            (q.query_id && q.query_id === result.query_id) ||
            (q.query_text === result.query_text && q.created_at === result.created_at)
        )
      ) {
        parsed.push(result)
      }
      return parsed
    }
    return result ? [result] : []
  }, [caseView, result])

  const latestTurn = caseTurns.length > 0 ? caseTurns[caseTurns.length - 1] : result

  const getTurnView = (turnId, idx) => {
    const key = turnId || `turn-${idx}`
    return turnViews[key] || activeTab
  }
  const setTurnView = (turnId, idx, view) => {
    const key = turnId || `turn-${idx}`
    setTurnViews((prev) => ({ ...prev, [key]: view }))
  }

  // Load a case's queries when user clicks it in sidebar
  const handleCaseSelect = useCallback(async (caseId) => {
    if (!caseId) {
      setActiveCaseId(null)
      setCaseView(null)
      setResult(null)
      setSelectedQueryId(null)
      setQuery('')
      window.scrollTo({ top: 0, behavior: 'instant' })
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
      window.scrollTo({ top: 0, behavior: 'instant' })
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
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
  }

  const handleQuery = async () => {
    const trimmed = query.trim()
    if (!trimmed || loading) return

    // Cancel any existing in-flight query to free network and server threads
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    const controller = new AbortController()
    abortControllerRef.current = controller

    setLoading(true)
    setLoadingStep(0)
    setError('')
    setLimitError(false)

    // Dynamic multi-stage progress ticker
    if (progressTimerRef.current) clearInterval(progressTimerRef.current)
    let step = 0
    progressTimerRef.current = setInterval(() => {
      step = Math.min(3, step + 1)
      setLoadingStep(step)
    }, 2200)

    // Client-side 45-second watchdog to prevent indefinite spinning
    if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current)
    watchdogTimerRef.current = setTimeout(() => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        setLoading(false)
        setError('Inference request timed out after 45 seconds. The server might be busy. Please try again.')
        showToast('Request timed out. Please try again.', 'error')
      }
    }, 45000)

    try {
      const res = await apiQuery({
        query_text: trimmed,
        language,
        case_id: activeCaseId || undefined,
        signal: controller.signal,
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
      if (err.name === 'CanceledError' || err.name === 'AbortError' || err.code === 'ERR_CANCELED') {
        return // Silently ignored if cancelled by user or replaced by newer request
      }
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
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current)
        progressTimerRef.current = null
      }
      if (watchdogTimerRef.current) {
        clearTimeout(watchdogTimerRef.current)
        watchdogTimerRef.current = null
      }
      abortControllerRef.current = null
    }
  }

  const handleFollowUpQuery = async () => {
    const trimmed = followUpQuery.trim()
    if (!trimmed || loading) return

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    const controller = new AbortController()
    abortControllerRef.current = controller

    setLoading(true)
    setLoadingStep(0)
    setError('')

    if (progressTimerRef.current) clearInterval(progressTimerRef.current)
    let step = 0
    progressTimerRef.current = setInterval(() => {
      step = Math.min(3, step + 1)
      setLoadingStep(step)
    }, 2200)

    if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current)
    watchdogTimerRef.current = setTimeout(() => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        setLoading(false)
        setError('Follow-up request timed out after 45 seconds. Please try again.')
        showToast('Request timed out. Please try again.', 'error')
      }
    }, 45000)

    try {
      const res = await apiQuery({
        query_text: trimmed,
        language,
        case_id: activeCaseId || (result ? result.case_id : undefined),
        signal: controller.signal,
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
      setTimeout(() => {
        followUpRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 150)
    } catch (err) {
      if (err.name === 'CanceledError' || err.name === 'AbortError' || err.code === 'ERR_CANCELED') {
        return // Silently ignored if cancelled by user
      }
      const status = err.response?.status
      const detail = err.response?.data?.detail || ''

      if (status === 429) {
        setLimitError(true)
      } else if (status === 401) {
        showToast('Your session has expired. Please sign in again.', 'error')
        logout()
        navigate('/login')
      } else {
        const msg = detail || t('errorGeneric') || 'Failed to process follow-up question. Please try again.'
        setError(msg)
        showToast(msg, 'error')
      }
    } finally {
      setLoading(false)
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current)
        progressTimerRef.current = null
      }
      if (watchdogTimerRef.current) {
        clearTimeout(watchdogTimerRef.current)
        watchdogTimerRef.current = null
      }
      abortControllerRef.current = null
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

  const handleUpgrade = async (updatedDataOrAction) => {
    // If passed a user object with is_pro from Sidebar's onUpgrade(res.data)
    if (updatedDataOrAction && typeof updatedDataOrAction === 'object' && 'is_pro' in updatedDataOrAction) {
      updateUser(updatedDataOrAction)
      setLimitError(false)
      showToast(
        updatedDataOrAction.is_pro
          ? 'Account upgraded to Pro! Unlimited legal queries unlocked.'
          : 'Plan switched to Free tier (5 queries/day).',
        'warning'
      )
      refreshSidebar()
      return
    }
    try {
      const action = typeof updatedDataOrAction === 'string' ? updatedDataOrAction : (user?.is_pro ? 'downgrade' : 'upgrade')
      const res = await apiTogglePro(action)
      updateUser(res.data)
      setLimitError(false)
      showToast(
        res.data.is_pro
          ? 'Account upgraded to Pro! Unlimited legal queries unlocked.'
          : 'Plan switched to Free tier (5 queries/day).',
        'warning'
      )
      refreshSidebar()
    } catch {
      showToast('Failed to switch plan. Please try again.', 'error')
    }
  }

  // 🏛️ Sovereign Court-Standard White-Paper Print & Vector PDF Export
  const handleTransferToChat = async () => {
    if (!activeCaseId) {
      navigate('/case-chat')
      return
    }
    try {
      await apiTransferCaseToChat(activeCaseId)
      showToast('Transferred case consultation to Personal Legal Assistant!', 'info')
      navigate('/case-chat')
    } catch (err) {
      console.error('Transfer case to chat error:', err)
      navigate('/case-chat')
    }
  }

  const handlePrintDashboard = () => {
    if (!caseTurns || caseTurns.length === 0) {
      showToast('No legal query results to print or export.', 'warning')
      return
    }
    document.body.classList.add('print-dashboard-active')
    const cleanup = () => {
      document.body.classList.remove('print-dashboard-active')
      window.removeEventListener('afterprint', cleanup)
    }
    window.addEventListener('afterprint', cleanup)
    window.print()
  }

  // ── Share Transcript Generator ──
  const getShareableDashboardTranscript = () => {
    const title = caseView?.name || 'JurisAI Statutory Legal Research'
    const header = `========================================\n${title}\nJurisAI Sovereign Legal Intelligence Report\nDate: ${new Date().toLocaleDateString('en-GB')}\n========================================\n\n`
    const body = (caseTurns || [])
      .map((t, idx) => {
        let block = `[CLIENT / ADVOCATE LEGAL QUERY #${idx + 1}]:\n${t.query_text}\n\n`
        block += `[SOVEREIGN STATUTORY ADVISORY]:\n${t.plain_english_summary || ''}\n\n`
        if (t.applicable_statutes && t.applicable_statutes.length > 0) {
          block += `Applicable Statutory Provisions:\n`
          t.applicable_statutes.forEach((s) => {
            const sTitle = s.title || (s.section ? `Section ${s.section}${s.act_title ? ` — ${s.act_title}` : ''}` : (s.act_title || s.act_name || 'Statutory Provision'))
            const sCite = s.citation ? ` [${s.citation}]` : ''
            const sText = s.excerpt || s.description || s.punishment || ''
            block += `• ${sTitle}${sCite}: ${sText}\n`
          })
          block += '\n'
        }
        if (t.relevant_precedents && t.relevant_precedents.length > 0) {
          block += `Judicial Precedents:\n`
          t.relevant_precedents.forEach((p) => {
            const pTitle = p.title || p.case_title || 'Judicial Precedent'
            const pYear = p.year ? `, ${p.year}` : ''
            const pRatio = p.holding || p.relevance || ''
            block += `• ${pTitle} (${p.court || 'Supreme Court of India'}${pYear}${p.citation ? ` | ${p.citation}` : ''}): ${pRatio}\n`
          })
          block += '\n'
        }
        if (t.suggested_next_steps && t.suggested_next_steps.length > 0) {
          block += `Actionable Next Steps:\n`
          t.suggested_next_steps.forEach((step, si) => {
            block += `${si + 1}. ${step}\n`
          })
          block += '\n'
        }
        return block
      })
      .join('----------------------------------------\n\n')
    return header + body
  }

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(getShareableDashboardTranscript().slice(0, 1500) + '...\n\n[Shared via JurisAI Sovereign Legal Intelligence]')
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank')
  }

  const handleShareEmail = () => {
    const subject = encodeURIComponent(`Legal Research Report: ${caseView?.name || 'JurisAI Statutory Legal Brief'}`)
    const body = encodeURIComponent(getShareableDashboardTranscript())
    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }

  const handleShareTelegram = () => {
    const text = encodeURIComponent(getShareableDashboardTranscript().slice(0, 1000) + '...')
    window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${text}`, '_blank')
  }

  const handleCopyTranscript = async () => {
    try {
      await navigator.clipboard.writeText(getShareableDashboardTranscript())
      setCopiedShare(true)
      setTimeout(() => setCopiedShare(false), 2500)
    } catch {
      showToast('Could not copy to clipboard.', 'error')
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
      className="min-h-screen text-slate-100 flex relative overflow-x-hidden w-full max-w-full"
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
        onOpenBareActs={() => setIsBareActsModalOpen(true)}
        activeCaseId={activeCaseId}
        open={sidebarOpen}
        onClose={handleCloseSidebar}
      />

      <main className="flex-1 min-w-0 w-full max-w-full lg:pl-64 flex flex-col min-h-screen relative overflow-x-hidden">
        <div className="max-w-5xl w-full min-w-0 mx-auto px-3.5 sm:px-4 lg:px-6 py-3.5 sm:py-5 flex flex-col flex-1">

          {/* Top Header Bar — Responsive Two-Tier Architecture */}
          <header className="flex flex-col gap-2 mb-5 sm:mb-6 border-b border-indigo-500/15 bg-white/3 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 relative z-40 w-full min-w-0 max-w-full">
            {/* Row 1: Identity & Primary Controls */}
            <div className="flex items-center justify-between gap-2 w-full">
              {/* Left: Mobile Menu & Active Case Context */}
              <div className="flex items-center gap-2 min-w-0">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden w-8 h-8 sm:w-9 sm:h-9 rounded-xl glass flex items-center justify-center text-slate-400 hover:text-white transition-colors shrink-0"
                  aria-label="Open Navigation"
                >
                  <Menu className="w-4 h-4" />
                </button>

                {activeCaseId && caseView ? (
                  <button
                    onClick={() => { setActiveCaseId(null); setCaseView(null); setResult(null); setSelectedQueryId(null) }}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-300 transition-colors bg-white/4 px-2.5 sm:px-3 py-1.5 rounded-xl border border-white/6 truncate max-w-[170px] xs:max-w-[220px] sm:max-w-xs"
                    title="Click to exit case view"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-slate-500">Case:</span>
                    <span className="font-semibold text-white truncate">
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

              {/* Right: Language Selector & Notifications */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <LanguageSelector compact={true} align="right" />
                <NotificationCenter
                  onOpenDiary={handleOpenDiary}
                  onOpenCourtFee={handleOpenCourtFee}
                  onOpenPro={() => handleUpgrade()}
                  onOpenBNS={handleOpenBNS}
                  onRequestPermissionModal={() => setIsNotifModalOpen(true)}
                  align="right"
                />
              </div>
            </div>

            {/* Row 2: Smooth Horizontal Scrollable Legal Suite Tools (Zero text clipping, zero single-character vertical stacking) */}
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none py-1 px-0.5 whitespace-nowrap -webkit-overflow-scrolling-touch w-full min-w-0 max-w-full border-t border-white/5">
              {/* Primary: Case Document Chat */}
              <button
                onClick={() => navigate('/case-chat')}
                className="flex items-center gap-1.5 text-[13px] sm:text-xs text-white bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded-xl transition-all font-semibold indigo-glow shrink-0 whitespace-nowrap shadow-sm"
                title="AI Co-Pilot for Case Documents & Contracts"
              >
                <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                <span>{t('chatNav') || 'Personal Legal Assistant'}</span>
              </button>

              {/* Advocate Diary */}
              <button
                onClick={handleOpenDiary}
                className="flex items-center gap-1.5 text-[13px] sm:text-xs text-slate-300 hover:text-white bg-white/4 hover:bg-white/8 border border-white/6 px-2.5 sm:px-3 py-1.5 rounded-xl transition-all font-semibold shrink-0 whitespace-nowrap"
                title="Advocate Digital Diary & Daily Cause List"
              >
                <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>{t('advocateDiary') || 'Advocate Diary'}</span>
              </button>

              {/* Court Fees Calculator */}
              <button
                onClick={handleOpenCourtFee}
                className="flex items-center gap-1.5 text-[13px] sm:text-xs text-slate-300 hover:text-white bg-white/4 hover:bg-white/8 border border-white/6 px-2.5 sm:px-3 py-1.5 rounded-xl transition-all font-semibold shrink-0 whitespace-nowrap"
                title="Section 10 Official Court Fee & Valuation Slip"
              >
                <Calculator className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>{t('courtFees') || 'Court Fees'}</span>
              </button>

              {/* IPC ⇄ BNS Tool */}
              <button
                onClick={() => setIsBNSModalOpen(true)}
                className="flex items-center gap-1.5 text-[13px] sm:text-xs text-slate-300 hover:text-white bg-white/4 hover:bg-white/8 border border-white/6 px-2.5 sm:px-3 py-1.5 rounded-xl transition-all font-medium shrink-0 whitespace-nowrap"
                title="IPC to BNS Statutory Concordance"
              >
                <Scale className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="flex items-center gap-1">
                  <span>IPC</span>
                  <span className="text-indigo-400 font-bold">⇄</span>
                  <span>BNS</span>
                </span>
              </button>

              {/* Central Bare Acts Repository */}
              <button
                onClick={() => setIsBareActsModalOpen(true)}
                className="flex items-center gap-1.5 text-[13px] sm:text-xs text-indigo-300 hover:text-white bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/25 px-2.5 sm:px-3 py-1.5 rounded-xl transition-all font-semibold shrink-0 whitespace-nowrap shadow-sm shadow-indigo-500/10"
                title="India Code Central Bare Acts & Statutory Library (71+ Acts, 124+ Provisions)"
              >
                <BookOpen className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>Bare Acts (71+)</span>
              </button>

              {/* DPDP Shield */}
              <button
                onClick={() => setIsDPDPModalOpen(true)}
                className="flex items-center gap-1.5 text-[13px] sm:text-xs text-emerald-300 hover:text-emerald-200 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 px-2.5 sm:px-3 py-1.5 rounded-xl transition-all font-semibold shrink-0 whitespace-nowrap"
                title="DPDP Act 2023 & Section 132 BSA Compliance Certificate"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{t('dpdpShield') || 'DPDP Shield'}</span>
              </button>
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
            <div className="glass-card rounded-2xl p-3.5 sm:p-4 mb-4 border border-indigo-500/20 w-full min-w-0">
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
                className="w-full bg-transparent text-white placeholder-slate-500 text-[15px] sm:text-sm resize-none focus:outline-none leading-relaxed"
              />
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5 gap-3">
                <div className="hidden sm:flex items-center gap-1.5 min-w-0 overflow-x-auto scrollbar-none whitespace-nowrap">
                  {showHero && suggestions.slice(0, 2).map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSuggestionClick(s)}
                      className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 hover:bg-indigo-500/20 hover:text-white transition-all truncate max-w-[200px] shrink-0"
                    >
                      {s.slice(0, 28)}…
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-auto">
                  {/* Deep Think Mode Toggle Switch */}
                  <button
                    type="button"
                    onClick={() => {
                      if (!user?.is_pro) {
                        showToast('Deep Think mode active in preview mode! Upgrade to Pro for unlimited multi-step analysis.', 'warning')
                      }
                      setDeepThink(!deepThink)
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border shrink-0 ${
                      deepThink
                        ? 'bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 text-white border-violet-400 shadow-md shadow-violet-500/30 ring-1 ring-violet-400'
                        : 'bg-white/4 text-slate-400 border-white/10 hover:text-white hover:bg-white/8'
                    }`}
                    title="Toggle Deep Think Mode: Multi-step statutory research, contradiction checks, and Supreme Court precedent verification"
                  >
                    <Brain className={`w-3.5 h-3.5 ${deepThink ? 'text-amber-300 animate-pulse' : 'text-slate-400'}`} />
                    <span className="hidden sm:inline">{deepThink ? 'Deep Think ON' : 'Deep Think'}</span>
                    <span className="sm:hidden">{deepThink ? 'Think' : 'Fast'}</span>
                    {!user?.is_pro && (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                        PRO
                      </span>
                    )}
                  </button>

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
                className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-8 w-full min-w-0"
              >
                {suggestions.map((s, i) => (
                  <motion.button
                    key={s}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.12 + i * 0.06 }}
                    onClick={() => handleSuggestionClick(s)}
                    className="glass-card rounded-xl p-3.5 sm:px-4 sm:py-3 text-left text-[13px] sm:text-xs text-slate-300 sm:text-slate-400 hover:text-white hover:border-indigo-500/28 transition-all group w-full min-w-0 leading-snug"
                  >
                    <Sparkles className="w-3 h-3 text-indigo-400 mb-1.5 group-hover:text-indigo-300 transition-colors" />
                    {s}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Multi-Stage Real-Time Progress Stepper */}
          <AnimatePresence>
            {loading && (
              <motion.div
                key="loading-stepper"
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.25 }}
                className="glass-card rounded-2xl p-6 mb-6 border border-indigo-500/30 shadow-2xl bg-gradient-to-b from-[#0e122b]/95 to-[#07091a]/95 backdrop-blur-xl relative overflow-hidden"
              >
                {/* Top Subtle Animated Progress Line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-white/5">
                  <motion.div
                    className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-emerald-400"
                    initial={{ width: '15%' }}
                    animate={{
                      width: loadingStep === 0 ? '28%' : loadingStep === 1 ? '58%' : loadingStep === 2 ? '82%' : '96%'
                    }}
                    transition={{ duration: 0.8, ease: 'easeInOut' }}
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                        <Scale className="w-5 h-5 animate-pulse" />
                      </div>
                      <div className="absolute -inset-1 rounded-xl border border-indigo-500/30 border-t-transparent animate-spin" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                          Sovereign Legal Intelligence
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-mono">
                          Live Research
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-white mt-0.5">
                        {loadingStep === 0 && 'Stage 1: Determining Jurisdiction & Substantive Law…'}
                        {loadingStep === 1 && 'Stage 2: Cross-referencing 800+ Central Acts & BNS…'}
                        {loadingStep === 2 && 'Stage 3: Retrieving Supreme Court Precedents (Art. 141)…'}
                        {loadingStep === 3 && 'Stage 4: Synthesizing Advisory & Procedural Roadmap…'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (abortControllerRef.current) abortControllerRef.current.abort()
                      setLoading(false)
                      showToast('Legal analysis cancelled.', 'warning')
                    }}
                    className="self-end sm:self-center px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all shrink-0"
                  >
                    Cancel
                  </button>
                </div>

                {/* 4 Interactive Sequential Milestones */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-4">
                  {[
                    { title: 'Jurisdiction & Acts', desc: 'Subject matter & forum' },
                    { title: 'BNS Concordance', desc: '2024-2026 penal codes' },
                    { title: 'SC Precedents', desc: 'Binding ratios (Art. 141)' },
                    { title: 'Court Advisory', desc: 'Verified layperson brief' },
                  ].map((st, idx) => {
                    const isDone = loadingStep > idx
                    const isActive = loadingStep === idx
                    return (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-xl border transition-all ${
                          isActive
                            ? 'bg-indigo-600/15 border-indigo-500/50 shadow-md shadow-indigo-600/10'
                            : isDone
                            ? 'bg-emerald-950/20 border-emerald-500/30'
                            : 'bg-white/3 border-white/5 opacity-40'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {isDone ? (
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          ) : isActive ? (
                            <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin shrink-0" />
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-full border border-slate-600 shrink-0" />
                          )}
                          <span className={`text-xs font-bold truncate ${isActive ? 'text-indigo-200' : isDone ? 'text-emerald-300' : 'text-slate-400'}`}>
                            {st.title}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate pl-5">
                          {st.desc}
                        </p>
                      </div>
                    )
                  })}
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
              FULL CONVERSATION STREAM INTERFACE (ChatGPT / Gemini style)
             ══════════════════════════════════════════════════════════════════════ */}
          <AnimatePresence>
            {caseTurns.length > 0 && !caseViewLoading && (
              <motion.div
                key={`case-stream-${activeCaseId || 'active'}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-6"
              >
                {/* Action Toolbar — Responsive Touch-Scrollable Ribbon (Zero Text Splitting) */}
                <div className="w-full flex items-center justify-between gap-2 overflow-x-auto scrollbar-none pb-1 whitespace-nowrap -webkit-overflow-scrolling-touch">
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setResult(null)
                        setQuery('')
                        setActiveCaseId(null)
                        setCaseView(null)
                        setSelectedQueryId(null)
                        window.scrollTo({ top: 0, behavior: 'instant' })
                      }}
                      className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white border border-white/10 hover:border-indigo-500/30 bg-white/4 hover:bg-white/8 px-3 py-1.5 rounded-lg transition-all shrink-0 whitespace-nowrap shadow-sm"
                    >
                      <Plus className="w-3 h-3 text-indigo-400" /> Start New Case
                    </button>
                    <button
                      onClick={() => { followUpRef.current?.scrollIntoView({ behavior: 'smooth' }) }}
                      className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white border border-white/10 hover:border-indigo-500/30 bg-white/4 hover:bg-white/8 px-3 py-1.5 rounded-lg transition-all shrink-0 whitespace-nowrap shadow-sm"
                    >
                      <MessageSquare className="w-3 h-3 text-indigo-400" /> Ask Follow-up
                    </button>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Official Legal Drafts Button */}
                    <button
                      onClick={() => setIsDraftModalOpen(true)}
                      className="flex items-center gap-1.5 text-xs text-white bg-indigo-600 hover:bg-indigo-500 border border-indigo-400/30 px-3 py-1.5 rounded-lg transition-all font-semibold indigo-glow shrink-0 whitespace-nowrap shadow-sm"
                    >
                      <FileText className="w-3.5 h-3.5 text-white" />
                      <span>{t('officialDrafts') || 'Legal Notice & Drafts'}</span>
                    </button>

                    {/* Court-Standard White-Paper PDF Export */}
                    <button
                      onClick={handlePrintDashboard}
                      className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg transition-all font-semibold shrink-0 whitespace-nowrap shadow-sm"
                      title="Export clean court-formatted memorandum as vector PDF (White background, black font)"
                    >
                      <FileDown className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{t('exportPdf') || 'Export PDF'}</span>
                    </button>

                    {/* Pristine Court Print */}
                    <button
                      onClick={handlePrintDashboard}
                      className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white border border-white/10 hover:border-white/20 bg-white/4 hover:bg-white/8 px-3 py-1.5 rounded-lg transition-all font-semibold shrink-0 whitespace-nowrap shadow-sm"
                      title="Print pristine court legal intelligence report"
                    >
                      <Printer className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{t('printReport') || 'Print'}</span>
                    </button>

                    {/* Share Legal Research */}
                    <button
                      onClick={() => setShareModalOpen(true)}
                      className="flex items-center gap-1.5 text-xs text-indigo-200 hover:text-white bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/25 px-3 py-1.5 rounded-lg transition-all font-semibold shrink-0 whitespace-nowrap shadow-sm"
                      title="Share legal research via WhatsApp, Email, or Telegram"
                    >
                      <Share2 className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Share</span>
                    </button>

                    {/* Continue in Case Document Chat */}
                    <button
                      onClick={handleTransferToChat}
                      className="flex items-center gap-1.5 text-xs text-indigo-200 hover:text-white bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/25 px-3 py-1.5 rounded-lg transition-all font-semibold shrink-0 whitespace-nowrap shadow-sm"
                      title="Continue this consultation in Personal Legal Assistant with inherited memory"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Continue in Personal Assistant</span>
                    </button>
                  </div>
                </div>

                {/* Sequential Stream of Case Turns (One Below Another) */}
                <div className="space-y-8">
                  {caseTurns.map((turn, idx) => {
                    const isInitial = idx === 0
                    const turnView = getTurnView(turn.query_id, idx)
                    return (
                      <div
                        key={turn.query_id || `turn-${idx}`}
                        className="space-y-5 pt-6 border-t border-indigo-500/20 first:border-t-0 first:pt-0"
                      >
                        {/* User Message Bubble (Right-aligned, ChatGPT / Gemini style) */}
                        <div className="flex justify-end mb-4">
                          <div className="max-w-[85%] sm:max-w-2xl bg-indigo-600 text-white rounded-2xl rounded-tr-sm px-5 py-3.5 shadow-lg shadow-indigo-950/40 border border-indigo-400/25">
                            <div className="flex items-center justify-between text-[11px] text-indigo-200/90 mb-1.5 gap-4">
                              <span className="font-semibold tracking-wide flex items-center gap-1.5 uppercase">
                                <User className="w-3.5 h-3.5" />
                                {isInitial ? 'Your Legal Query' : `Follow-up #${idx + 1}`}
                              </span>
                              {turn.created_at && (
                                <span className="flex items-center gap-1 text-[11px] text-indigo-200/80">
                                  <Clock className="w-3 h-3" />
                                  {new Date(turn.created_at).toLocaleTimeString('en-IN', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              )}
                            </div>
                            <p className="text-sm sm:text-base font-normal leading-relaxed whitespace-pre-wrap">
                              {turn.query_text}
                            </p>
                          </div>
                        </div>

                        {/* Assistant Response (Left-aligned, ChatGPT / Gemini style) */}
                        <div className="flex items-start gap-3 w-full">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-md mt-1">
                            <Scale className="w-4 h-4" />
                          </div>
                          <div className="flex-1 space-y-4 min-w-0">
                            {/* Statutory Verification Telemetry Card: ONLY on Initial Assessment (Turn 0) */}
                            {isInitial ? (
                              <TelemetryCard
                                telemetry={turn.telemetry}
                                confidenceScore={turn.confidence_score}
                                statutesCount={turn.applicable_statutes?.length || 0}
                                precedentsCount={turn.relevant_precedents?.length || 0}
                              />
                            ) : (
                              /* Clean, minimal verification badge for follow-ups (NO 3 repeating boxes!) */
                              <div className="flex items-center gap-2 text-xs text-indigo-300/80 bg-indigo-500/5 px-3 py-1.5 rounded-lg border border-indigo-500/15 w-fit">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                <span>Court-Verifiable Statutory Analysis</span>
                                {turn.telemetry?.groundedness_score && (
                                  <span className="text-slate-500">• {turn.telemetry.groundedness_score}% groundedness</span>
                                )}
                              </div>
                            )}

                            {/* Dual-View Switcher for this Turn */}
                            <div className="flex gap-1 glass rounded-xl p-1 w-fit border border-white/6">
                              <TabButton
                                active={turnView === 'citizen'}
                                onClick={() => setTurnView(turn.query_id, idx, 'citizen')}
                                icon={<Users className="w-3.5 h-3.5" />}
                                label={t('citizenView') || 'Citizen Guide'}
                              />
                              <TabButton
                                active={turnView === 'advocate'}
                                onClick={() => setTurnView(turn.query_id, idx, 'advocate')}
                                icon={<Briefcase className="w-3.5 h-3.5" />}
                                label={t('advocateView') || 'Advocate Brief'}
                              />
                            </div>

                            {/* Turn Content (Citizen vs Advocate) */}
                            <div>
                              <ComponentErrorBoundary name={turnView === 'citizen' ? 'CitizenView' : 'AdvocateView'}>
                                {turnView === 'citizen' ? (
                                  <CitizenView data={turn} />
                                ) : (
                                  <AdvocateView data={turn} isPro={user?.is_pro} />
                                )}
                              </ComponentErrorBoundary>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Follow-up Query Card right beneath the sequential stream */}
                <div ref={followUpRef} className="pt-6 border-t border-indigo-500/25">
                  <div className="glass-card rounded-2xl p-5 border border-indigo-500/25 shadow-2xl">
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
                      {/* Deep Think Mode Toggle in Follow-up */}
                      <button
                        type="button"
                        onClick={() => {
                          if (!user?.is_pro) {
                            showToast('Deep Think mode active in preview mode! Upgrade to Pro for unlimited multi-step analysis.', 'warning')
                          }
                          setDeepThink(!deepThink)
                        }}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border shrink-0 ${
                          deepThink
                            ? 'bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 text-white border-violet-400 shadow-md shadow-violet-500/30 ring-1 ring-violet-400'
                            : 'bg-white/4 text-slate-400 border-white/10 hover:text-white hover:bg-white/8'
                        }`}
                        title="Toggle Deep Think Mode: Multi-step statutory research, contradiction checks, and Supreme Court precedent verification"
                      >
                        <Brain className={`w-3.5 h-3.5 ${deepThink ? 'text-amber-300 animate-pulse' : 'text-slate-400'}`} />
                        <span className="hidden sm:inline">{deepThink ? 'Deep Think ON' : 'Deep Think'}</span>
                        <span className="sm:hidden">{deepThink ? 'Think' : 'Fast'}</span>
                        {!user?.is_pro && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                            PRO
                          </span>
                        )}
                      </button>

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

      <ComponentErrorBoundary name="BNSConverterModal">
        <BNSConverterModal
          isOpen={isBNSModalOpen}
          onClose={() => setIsBNSModalOpen(false)}
        />
      </ComponentErrorBoundary>

      <ComponentErrorBoundary name="LegalDraftModal">
        <LegalDraftModal
          isOpen={isDraftModalOpen}
          onClose={() => setIsDraftModalOpen(false)}
          result={latestTurn || result}
          user={user}
        />
      </ComponentErrorBoundary>

      <ComponentErrorBoundary name="CourtFeeModal">
        <CourtFeeModal
          isOpen={isCourtFeeModalOpen}
          onClose={() => setIsCourtFeeModalOpen(false)}
        />
      </ComponentErrorBoundary>

      <ComponentErrorBoundary name="AdvocateDiaryModal">
        <AdvocateDiaryModal
          isOpen={isDiaryModalOpen}
          onClose={() => setIsDiaryModalOpen(false)}
        />
      </ComponentErrorBoundary>

      <ComponentErrorBoundary name="BareActsModal">
        <BareActsModal
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
        />
      </ComponentErrorBoundary>

      <ComponentErrorBoundary name="DPDPSecurityModal">
        <DPDPSecurityModal
          isOpen={isDPDPModalOpen}
          onClose={() => setIsDPDPModalOpen(false)}
        />
      </ComponentErrorBoundary>

      <NotificationPermissionModal
        isOpen={isNotifModalOpen}
        onClose={() => setIsNotifModalOpen(false)}
        onPermissionGranted={() => showToast('🔔 System Notifications Activated! Court hearing & limitation reminders are now active.', 'warning')}
      />

      {/* ── SHARE LEGAL RESEARCH MODAL ── */}
      <AnimatePresence>
        {shareModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-[#0b0d1e] border border-indigo-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Share Legal Research</h4>
                    <p className="text-[11px] text-slate-400 truncate max-w-[240px]">{caseView?.name || 'Statutory Research Brief'}</p>
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
                Export or dispatch this verified legal statutory analysis to clients, senior advocates, or junior researchers:
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
                  onClick={() => {
                    setShareModalOpen(false)
                    handlePrintDashboard()
                  }}
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
                      <span>Copy Full Legal Transcript</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── DEDICATED COURT-STANDARD WHITE-PAPER PRINT PORTAL FOR DASHBOARD ── */}
      {createPortal(
        <div id="dashboard-official-print" className="font-serif text-black max-w-[195mm] mx-auto text-[10pt] leading-normal bg-white">
          {/* Top Court Header */}
          <div style={{ textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '8px', marginBottom: '14px' }}>
            <p style={{ fontSize: '8.5pt', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 'bold', margin: '0 0 2px 0', color: '#334155', fontFamily: 'sans-serif' }}>
              REPUBLIC OF INDIA • STATUTORY LEGAL OPINION & RESEARCH BRIEF
            </p>
            <h1 style={{ fontSize: '13pt', fontWeight: 'bold', textTransform: 'uppercase', margin: '2px 0', color: '#0f172a', letterSpacing: '0.5px' }}>
              {caseView?.name || 'Statutory Legal Research Memorandum'}
            </h1>
            <p style={{ fontSize: '9pt', margin: '2px 0 0 0', color: '#475569', fontStyle: 'italic', fontFamily: 'sans-serif' }}>
              JurisAI Sovereign Statutory Co-Pilot • Pre-Litigation Advisory Opinion
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8pt', color: '#64748b', marginTop: '6px', paddingTop: '4px', borderTop: '1px dashed #cbd5e1', fontFamily: 'sans-serif' }}>
              <span><strong>Counsel / User:</strong> {user?.full_name || 'Counsel'} ({user?.email || 'N/A'})</span>
              <span><strong>Case Reference:</strong> {activeCaseId ? `JURIS-CASE-#${activeCaseId}` : 'GENERAL RESEARCH'}</span>
              <span><strong>Date of Record:</strong> {new Date().toLocaleDateString('en-GB')} at {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>

          {/* Sequential Case Turns (Clear distinction between Client Query & Sovereign Statutory Advisory) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {caseTurns.map((turn, idx) => (
              <div key={turn.query_id || idx} className="print-turn-container" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                {/* User Query Block */}
                <div
                  className="print-query-box"
                  style={{
                    padding: '8pt 10pt',
                    backgroundColor: '#f1f5f9',
                    border: '1.5px solid #94a3b8',
                    borderRadius: '5px',
                    marginBottom: '8pt',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #cbd5e1', paddingBottom: '3px', marginBottom: '5px', fontSize: '8.5pt', fontWeight: 'bold', color: '#1e3a8a', fontFamily: 'sans-serif' }}>
                    <span>[CLIENT / ADVOCATE LEGAL QUERY - #{idx + 1}]</span>
                    <span style={{ fontSize: '7.5pt', color: '#64748b', fontWeight: 'normal', fontFamily: 'monospace' }}>
                      {turn.created_at ? new Date(turn.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : `Turn #${idx + 1}`}
                    </span>
                  </div>
                  <div style={{ fontSize: '9.5pt', color: '#000000', lineHeight: '1.45', fontFamily: 'sans-serif', whiteSpace: 'pre-wrap' }}>
                    {turn.query_text}
                  </div>
                </div>

                {/* Assistant Statutory Advisory Block */}
                <div
                  className="print-response-box"
                  style={{
                    padding: '10pt 12pt',
                    backgroundColor: '#ffffff',
                    border: '1.5px solid #0f172a',
                    borderRadius: '5px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #94a3b8', paddingBottom: '3px', marginBottom: '8px', fontSize: '8.5pt', fontWeight: 'bold', color: '#0f172a', fontFamily: 'sans-serif' }}>
                    <span>[JURISAI SOVEREIGN STATUTORY ADVISORY & JUDICIAL GROUNDS]</span>
                    <span style={{ fontSize: '7.5pt', color: '#166534', fontWeight: 'bold', fontFamily: 'sans-serif' }}>
                      {turn.telemetry?.groundedness_score ? `${turn.telemetry.groundedness_score}% Court Verifiable` : 'Verified Indian Law'}
                    </span>
                  </div>

                  {/* Plain Language Summary */}
                  <div style={{ marginBottom: '8pt' }}>
                    <div style={{ fontSize: '8.5pt', fontWeight: 'bold', textTransform: 'uppercase', color: '#334155', marginBottom: '2pt', fontFamily: 'sans-serif' }}>
                      1. Executive Legal Assessment
                    </div>
                    <div style={{ fontSize: '9.5pt', lineHeight: '1.5', color: '#000000', fontFamily: 'serif' }}>
                      {turn.plain_english_summary}
                    </div>
                  </div>

                  {/* Applicable Statutes — Official Court-Standard Table */}
                  {turn.applicable_statutes && turn.applicable_statutes.length > 0 && (
                    <div style={{ marginBottom: '10pt' }}>
                      <div style={{ fontSize: '8.5pt', fontWeight: 'bold', textTransform: 'uppercase', color: '#1e293b', marginBottom: '4pt', fontFamily: 'sans-serif', letterSpacing: '0.3px' }}>
                        2. Applicable Statutory Provisions & Punishments
                      </div>
                      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #0f172a', fontSize: '8pt', fontFamily: 'sans-serif', backgroundColor: '#ffffff' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1.5px solid #0f172a' }}>
                            <th style={{ width: '32%', padding: '5pt 6pt', textAlign: 'left', fontWeight: 'bold', color: '#0f172a', borderRight: '1px solid #cbd5e1', textTransform: 'uppercase', fontSize: '7.5pt' }}>
                              Statutory Provision & Act Citation
                            </th>
                            <th style={{ width: '50%', padding: '5pt 6pt', textAlign: 'left', fontWeight: 'bold', color: '#0f172a', borderRight: '1px solid #cbd5e1', textTransform: 'uppercase', fontSize: '7.5pt' }}>
                              Statutory Mandate, Offence & Penal Liability
                            </th>
                            <th style={{ width: '18%', padding: '5pt 6pt', textAlign: 'left', fontWeight: 'bold', color: '#0f172a', textTransform: 'uppercase', fontSize: '7.5pt' }}>
                              Classification / Forum
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {turn.applicable_statutes.map((s, si) => {
                            const statuteTitle = s.title || (s.section ? `Section ${s.section}${s.act_title ? ` — ${s.act_title}` : ''}` : (s.act_title || s.act_name || `Statutory Provision #${si + 1}`))
                            const statuteCitation = s.citation || s.act_title || s.act_name || 'Central Legislation'
                            const mandateText = s.excerpt || s.description || s.punishment || s.text || 'Statutory grounds applicable to the presented facts and actionable remedies.'
                            const forumScope = s.doc_type ? s.doc_type.toUpperCase() : (s.explanation || s.scope || 'CENTRAL STATUTE')
                            const isAltRow = si % 2 === 1

                            return (
                              <tr key={si} style={{ borderBottom: '1px solid #cbd5e1', backgroundColor: isAltRow ? '#f8fafc' : '#ffffff' }}>
                                <td style={{ padding: '5pt 6pt', borderRight: '1px solid #cbd5e1', verticalAlign: 'top' }}>
                                  <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '8pt', lineHeight: '1.3' }}>
                                    {statuteTitle}
                                  </div>
                                  <div style={{ color: '#475569', fontSize: '7.5pt', marginTop: '2pt', fontStyle: 'italic' }}>
                                    {statuteCitation}
                                  </div>
                                </td>
                                <td style={{ padding: '5pt 6pt', borderRight: '1px solid #cbd5e1', verticalAlign: 'top', color: '#1e293b', lineHeight: '1.4' }}>
                                  <div style={{ fontSize: '8pt' }}>
                                    {mandateText}
                                  </div>
                                  {s.punishment && s.excerpt && s.punishment !== s.excerpt && (
                                    <div style={{ marginTop: '3pt', fontSize: '7.5pt', color: '#b91c1c', fontWeight: 'bold' }}>
                                      Prescribed Penalty: {s.punishment}
                                    </div>
                                  )}
                                </td>
                                <td style={{ padding: '5pt 6pt', verticalAlign: 'top' }}>
                                  <span style={{ display: 'inline-block', padding: '1pt 4pt', backgroundColor: '#e2e8f0', color: '#0f172a', borderRadius: '3px', fontSize: '7pt', fontWeight: 'bold' }}>
                                    {forumScope}
                                  </span>
                                  {s.explanation && (
                                    <div style={{ color: '#475569', fontSize: '7pt', marginTop: '2pt', fontStyle: 'italic' }}>
                                      {s.explanation}
                                    </div>
                                  )}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Relevant Precedents */}
                  {turn.relevant_precedents && turn.relevant_precedents.length > 0 && (
                    <div style={{ marginBottom: '10pt' }}>
                      <div style={{ fontSize: '8.5pt', fontWeight: 'bold', textTransform: 'uppercase', color: '#1e293b', marginBottom: '4pt', fontFamily: 'sans-serif', letterSpacing: '0.3px' }}>
                        3. Supreme Court & High Court Precedents (Art. 141)
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4pt' }}>
                        {turn.relevant_precedents.map((p, pi) => {
                          const caseTitle = p.title || p.case_title || `Precedent #${pi + 1}`
                          const courtName = p.court || 'Supreme Court of India'
                          const yearText = p.year ? `(${p.year})` : ''
                          const citationText = p.citation || 'AIR / SCC'
                          const ratioText = p.holding || p.relevance || p.ratio_decidendi || p.excerpt || ''

                          return (
                            <div key={pi} style={{ padding: '5pt 7pt', border: '1px solid #94a3b8', borderRadius: '4px', backgroundColor: '#ffffff', fontSize: '8pt', fontFamily: 'sans-serif' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '1px solid #e2e8f0', paddingBottom: '2pt', marginBottom: '3pt' }}>
                                <span style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '8.5pt' }}>
                                  • {caseTitle} {yearText}
                                </span>
                                <span style={{ fontSize: '7.5pt', color: '#475569', fontStyle: 'italic', fontWeight: '600' }}>
                                  {courtName} | {citationText}
                                </span>
                              </div>
                              {ratioText && (
                                <div style={{ color: '#1e293b', fontSize: '8pt', lineHeight: '1.4' }}>
                                  <strong style={{ color: '#334155' }}>Ratio Decidendi / Judicial Holding:</strong> "{ratioText}"
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Suggested Next Steps */}
                  {turn.suggested_next_steps && turn.suggested_next_steps.length > 0 && (
                    <div>
                      <div style={{ fontSize: '8.5pt', fontWeight: 'bold', textTransform: 'uppercase', color: '#334155', marginBottom: '3pt', fontFamily: 'sans-serif' }}>
                        4. Actionable Next Steps & Procedural Roadmap
                      </div>
                      <ol style={{ margin: '0 0 0 16px', padding: 0, fontSize: '9pt', color: '#000000', fontFamily: 'sans-serif', lineHeight: '1.4' }}>
                        {turn.suggested_next_steps.map((st, sti) => (
                          <li key={sti} style={{ marginBottom: '2pt' }}>
                            {st}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              </div>
            ))}
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
