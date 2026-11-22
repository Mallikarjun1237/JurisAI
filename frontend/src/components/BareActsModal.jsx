import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, BookOpen, Search, ShieldCheck, CheckCircle2,
  Calendar, Layers, Sparkles, ArrowRight, RefreshCw,
  Scale, Gavel, FileText, Copy, Check, MessageSquare,
  ArrowLeft, Info, Landmark, AlertCircle
} from 'lucide-react'
import { apiGetBareActsCatalog, apiGetBareActDetail } from '../api/client'

export default function BareActsModal({ isOpen, onClose, onSelectAct }) {
  const [loading, setLoading] = useState(true)
  const [catalog, setCatalog] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDomain, setSelectedDomain] = useState('All')

  // Selected Act Detail State for Pop-up Library View
  const [selectedAct, setSelectedAct] = useState(null)
  const [actDetail, setActDetail] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [detailTab, setDetailTab] = useState('overview') // 'overview' | 'applications' | 'provisions'
  const [copiedSummary, setCopiedSummary] = useState(false)
  const [copiedSectionId, setCopiedSectionId] = useState(null)
  const [sectionFilter, setSectionFilter] = useState('')

  useEffect(() => {
    if (!isOpen) return
    setLoading(true)
    apiGetBareActsCatalog()
      .then((res) => {
        setCatalog(res.data)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to load Bare Acts Catalog:', err)
        setLoading(false)
      })
  }, [isOpen])

  // Fetch full details whenever an act is selected
  const handleOpenActDetail = async (act) => {
    setSelectedAct(act)
    setLoadingDetail(true)
    setActDetail(null)
    setDetailTab('overview')
    setSectionFilter('')
    setCopiedSummary(false)

    try {
      const res = await apiGetBareActDetail(act.act_id)
      setActDetail(res.data)
    } catch (err) {
      console.error('Failed to load act details:', err)
      // Fallback object so pop-up still renders cleanly
      setActDetail({
        act_id: act.act_id,
        title: act.title,
        year: act.year,
        domain: act.domain,
        effective: act.effective || 'Enacted Indian Law',
        repeals: act.repeals,
        overview: `${act.title} is an enacted statute of the Republic of India governing the ${act.domain} statutory framework. It establishes substantive rights, obligations, and procedural remedies before District Courts, High Courts, and the Supreme Court of India.`,
        key_applications: [
          `Filing statutory petitions and original suits under ${act.domain}.`,
          'Drafting legal notices, statutory claims, and procedural representations.',
          'Assessing compliance, contractual validity, and liability under Indian law.',
          'Formulating litigation strategy, evidence submission, and appeals.'
        ],
        provisions: []
      })
    } finally {
      setLoadingDetail(false)
    }
  }

  const handleCloseActDetail = () => {
    setSelectedAct(null)
    setActDetail(null)
  }

  const handleCopySummary = () => {
    if (!actDetail && !selectedAct) return
    const current = actDetail || selectedAct
    const apps = (actDetail?.key_applications || [])
      .map((app, idx) => `${idx + 1}. ${app}`)
      .join('\n')

    const text = `================================================
REPUBLIC OF INDIA • BARE ACT STATUTORY PROFILE
Act Title: ${current.title}
Enacted Year: ${current.year} | Act ID: ${current.act_id}
Domain: ${current.domain}
${current.repeals ? `Repeals / Replaces: ${current.repeals}\n` : ''}------------------------------------------------
WHAT IT STATES (STATUTORY OVERVIEW):
${actDetail?.overview || 'Central enacted legislation under India Code.'}
------------------------------------------------
WHEN & IN WHICH CASES TO USE THIS ACT:
${apps || 'General court litigation and legal compliance under Indian law.'}
------------------------------------------------
Verified by JurisAI Indian Law Intelligence Repository
================================================`

    navigator.clipboard.writeText(text)
    setCopiedSummary(true)
    setTimeout(() => setCopiedSummary(false), 2000)
  }

  const handleCopySection = (provision) => {
    const text = `================================================
${actDetail?.title || 'CENTRAL BARE ACT'}
${provision.section_number}: ${provision.marginal_heading}
Citation: ${provision.citation || actDetail?.title}
------------------------------------------------
${provision.text}
================================================`
    navigator.clipboard.writeText(text)
    setCopiedSectionId(provision.id || provision.section_number)
    setTimeout(() => setCopiedSectionId(null), 2000)
  }

  const handleAskJurisAI = (act) => {
    const targetAct = act || actDetail || selectedAct
    if (!targetAct) return
    if (onSelectAct) {
      onSelectAct(targetAct)
    }
    onClose()
  }

  if (!isOpen) return null

  const acts = catalog?.acts || []
  const domains = ['All', ...(catalog?.domains || [])]

  const filteredActs = acts.filter((act) => {
    const matchesDomain = selectedDomain === 'All' || act.domain === selectedDomain
    const matchesSearch =
      searchQuery.trim() === '' ||
      act.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.act_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (act.repeals && act.repeals.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesDomain && matchesSearch
  })

  // Filter provisions inside detail view
  const displayProvisions = (actDetail?.provisions || []).filter((p) => {
    if (!sectionFilter.trim()) return true
    const term = sectionFilter.toLowerCase()
    return (
      p.section_number?.toLowerCase().includes(term) ||
      p.marginal_heading?.toLowerCase().includes(term) ||
      p.text?.toLowerCase().includes(term)
    )
  })

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Main Catalog View (Shown when no act is selected) */}
          {!selectedAct ? (
            <>
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      Central Bare Acts & Statutory Repository
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 font-semibold">
                        India Code Mirror
                      </span>
                    </h2>
                    <p className="text-xs text-slate-400">
                      Click any enactment to view statutory mandate, year of enactment, practical litigation cases, and section provisions
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  title="Close Library"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Stats Bar */}
              <div className="px-6 py-3 bg-slate-950/50 border-b border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-slate-400">Central Enactments:</span>
                  <strong className="text-white font-semibold">{catalog?.total_acts || 71} Acts</strong>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-indigo-400" />
                  <span className="text-slate-400">Active Provisions:</span>
                  <strong className="text-white font-semibold">{catalog?.total_provisions || 124} Sections</strong>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-violet-400" />
                  <span className="text-slate-400">Practice Domains:</span>
                  <strong className="text-white font-semibold">{catalog?.total_domain_catalogs || 14} Domains</strong>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300 font-semibold">Sovereign Law RAG Active</span>
                </div>
              </div>

              {/* Filters & Search */}
              <div className="p-6 border-b border-slate-800/80 bg-slate-900/60 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search by act title, section, repealed law (e.g., BNS, NI Act 138, Cheque bounce, POCSO, RTI, Companies)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-950/90 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    />
                  </div>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-xs text-slate-400 hover:text-white px-3 py-2 bg-slate-800 rounded-lg transition"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Domain Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-700">
                  {domains.map((dom) => (
                    <button
                      key={dom}
                      onClick={() => setSelectedDomain(dom)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                        selectedDomain === dom
                          ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                          : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      {dom}
                    </button>
                  ))}
                </div>
              </div>

              {/* Acts Grid / List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
                    <p className="text-sm font-medium">Connecting to Sovereign Bare Acts Registry...</p>
                  </div>
                ) : filteredActs.length === 0 ? (
                  <div className="text-center py-16 text-slate-400">
                    <p className="text-sm font-semibold">No Central Acts match: "{searchQuery}"</p>
                    <p className="text-xs text-slate-500 mt-1">Try searching keywords like "murder", "divorce", "cheque", "tax", "trademark", or "bail".</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {filteredActs.map((act) => (
                      <div
                        key={act.act_id}
                        onClick={() => handleOpenActDetail(act)}
                        className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-indigo-500/50 hover:bg-slate-800/50 transition flex flex-col justify-between group cursor-pointer shadow-sm hover:shadow-indigo-500/10"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                              {act.domain}
                            </span>
                            <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono font-medium">
                              <Calendar className="w-3 h-3 text-slate-500" />
                              {act.year}
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-slate-100 group-hover:text-indigo-300 transition line-clamp-2">
                            {act.title}
                          </h3>
                          {act.repeals && (
                            <p className="text-xs text-emerald-400 font-medium mt-1.5 flex items-center gap-1">
                              <span className="text-slate-500 font-normal">Replaces:</span> {act.repeals}
                            </p>
                          )}
                        </div>

                        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                          <span className="text-[11px] text-slate-500 font-mono">
                            ID: {act.act_id}
                          </span>
                          <span className="text-[11px] font-semibold text-indigo-400 group-hover:text-indigo-300 flex items-center gap-1">
                            <span>View Details & Provisions</span>
                            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
                <span>
                  Showing <strong className="text-white">{filteredActs.length}</strong> of{' '}
                  <strong className="text-white">{acts.length}</strong> Central Acts
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-slate-500 hidden sm:inline">Official India Code Mirror (Ministry of Law & Justice)</span>
                  <button
                    onClick={onClose}
                    className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition shadow-md shadow-indigo-600/20"
                  >
                    Close Library
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Pop-up: Comprehensive Bare Act Details Library View */
            <div className="flex flex-col h-full max-h-[92vh] overflow-hidden bg-slate-900">
              {/* Pop-up Header */}
              <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/90 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <button
                    onClick={handleCloseActDetail}
                    className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/25 transition"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Acts Library</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopySummary}
                      className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition font-medium"
                      title="Copy statutory overview & applications"
                    >
                      {copiedSummary ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400 font-bold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                          <span>Copy Summary</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleAskJurisAI(actDetail || selectedAct)}
                      className="flex items-center gap-1.5 text-xs text-white bg-indigo-600 hover:bg-indigo-500 px-3.5 py-1.5 rounded-lg font-semibold transition shadow-md shadow-indigo-600/20"
                      title="Prompt JurisAI about this act"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Ask JurisAI</span>
                    </button>

                    <button
                      onClick={handleCloseActDetail}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition ml-1"
                      title="Close"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Title & Badges */}
                <div className="mt-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span className="text-xs px-2.5 py-0.5 rounded-md bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-semibold">
                      {actDetail?.domain || selectedAct?.domain}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono font-medium border border-slate-700">
                      ID: {actDetail?.act_id || selectedAct?.act_id}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 font-medium border border-emerald-500/20 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Enacted {actDetail?.year || selectedAct?.year}
                    </span>
                    {(actDetail?.repeals || selectedAct?.repeals) && (
                      <span className="text-xs px-2.5 py-0.5 rounded-md bg-violet-500/10 text-violet-300 font-medium border border-violet-500/20">
                        Replaces: {actDetail?.repeals || selectedAct?.repeals}
                      </span>
                    )}
                  </div>
                  <h1 className="text-lg sm:text-xl font-black text-white leading-snug">
                    {actDetail?.title || selectedAct?.title}
                  </h1>
                </div>

                {/* Pop-up Navigation Tabs */}
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-800/80">
                  <button
                    onClick={() => setDetailTab('overview')}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                      detailTab === 'overview'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Statutory Overview & What It States</span>
                  </button>

                  <button
                    onClick={() => setDetailTab('applications')}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                      detailTab === 'applications'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <Gavel className="w-3.5 h-3.5" />
                    <span>When & In Which Cases We Can Use This Act</span>
                    {actDetail?.key_applications?.length > 0 && (
                      <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-white">
                        {actDetail.key_applications.length}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => setDetailTab('provisions')}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                      detailTab === 'provisions'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <Scale className="w-3.5 h-3.5" />
                    <span>Ingested Provisions & Sections</span>
                    {actDetail?.provisions?.length > 0 && (
                      <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300">
                        {actDetail.provisions.length}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Pop-up Body Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {loadingDetail ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                    <RefreshCw className="w-7 h-7 animate-spin text-indigo-400" />
                    <p className="text-sm font-semibold text-slate-300">Retrieving official statutory profile from India Code...</p>
                    <p className="text-xs text-slate-500">Mapping legislative scope, court jurisdictions, and section records</p>
                  </div>
                ) : detailTab === 'overview' ? (
                  /* ── TAB 1: OVERVIEW & WHAT IT STATES ── */
                  <div className="space-y-6">
                    {/* What It States Banner */}
                    <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-xl space-y-3">
                      <div className="flex items-center gap-2 text-indigo-400">
                        <BookOpen className="w-4 h-4" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                          Legislative Overview & Statutory Mandate
                        </h3>
                      </div>
                      <p className="text-sm text-slate-200 leading-relaxed font-normal">
                        {actDetail?.overview}
                      </p>
                    </div>

                    {/* Statutory Fast Facts Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                      <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                          Year of Enactment
                        </span>
                        <p className="text-base font-bold text-white font-mono flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-indigo-400" />
                          {actDetail?.year || selectedAct?.year}
                        </p>
                        <span className="text-[10px] text-slate-500">Parliament / Sovereign Assembly</span>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                          Sovereign Territory
                        </span>
                        <p className="text-base font-bold text-white flex items-center gap-1.5">
                          <Landmark className="w-4 h-4 text-emerald-400" />
                          Whole of India
                        </p>
                        <span className="text-[10px] text-slate-500">Central Enactment Jurisdiction</span>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                          Adjudicating Forums
                        </span>
                        <p className="text-sm font-bold text-white flex items-center gap-1.5">
                          <Scale className="w-4 h-4 text-violet-400" />
                          District & High Courts
                        </p>
                        <span className="text-[10px] text-slate-500">Supreme Court of India</span>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                          Statutory Validity
                        </span>
                        <p className="text-base font-bold text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          Active Law
                        </p>
                        <span className="text-[10px] text-slate-500">Enforceable across India</span>
                      </div>
                    </div>

                    {/* Strategic Usage Advisory */}
                    <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/25 flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                      <div className="text-xs space-y-1">
                        <h4 className="font-bold text-indigo-300">How to Leverage This Act with JurisAI</h4>
                        <p className="text-slate-300 leading-relaxed">
                          You can ask JurisAI specific scenario questions mentioning this Act, such as drafting a legal notice, calculating limitation periods under Section 138/Limitation Act, drafting written statements, or assessing compoundability of offenses.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : detailTab === 'applications' ? (
                  /* ── TAB 2: WHEN & IN WHICH CASES TO USE THIS ACT ── */
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          <Gavel className="w-4 h-4 text-indigo-400" />
                          Practical Litigation Scenarios & Causes of Action
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Concrete dispute contexts and court proceedings where an advocate or citizen invokes this statute:
                        </p>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/25 font-bold">
                        {actDetail?.key_applications?.length || 0} Core Applications
                      </span>
                    </div>

                    <div className="space-y-3">
                      {(actDetail?.key_applications || []).map((appText, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition flex items-start gap-3.5 group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition">
                            {idx + 1}
                          </div>
                          <div className="space-y-1 flex-1">
                            <p className="text-sm text-slate-100 font-medium leading-relaxed">
                              {appText}
                            </p>
                            <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400">
                              <span className="flex items-center gap-1 text-slate-400">
                                <Scale className="w-3 h-3 text-indigo-400" /> Applicable in Trial & Appellate Courts
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Practice Notice */}
                    <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                      <Info className="w-4 h-4 text-slate-500 shrink-0" />
                      <span>
                        Advocate Advice: When instituting proceedings, ensure compliance with statutory conditions precedent (e.g. 15-day statutory notice for cheque dishonour, mandatory conciliation for commercial suits, or Section 35 BNSS appearance notices).
                      </span>
                    </div>
                  </div>
                ) : (
                  /* ── TAB 3: STATUTORY PROVISIONS & SECTIONS ── */
                  <div className="space-y-4">
                    {/* Provisions Filter */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="relative flex-1">
                        <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Filter sections by section number or text (e.g. 138, 318, arrest, cheque, fine)..."
                          value={sectionFilter}
                          onChange={(e) => setSectionFilter(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 bg-slate-950/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <span className="text-xs text-slate-400 whitespace-nowrap">
                        Showing <strong className="text-white">{displayProvisions.length}</strong> provisions
                      </span>
                    </div>

                    {displayProvisions.length === 0 ? (
                      <div className="p-10 text-center rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                        <Scale className="w-8 h-8 text-slate-600 mx-auto" />
                        <p className="text-sm font-semibold text-slate-300">
                          {actDetail?.provisions?.length === 0
                            ? 'Provisions Ingestion Pending for This Enactment'
                            : `No provisions match "${sectionFilter}"`}
                        </p>
                        <p className="text-xs text-slate-500 max-w-md mx-auto">
                          {actDetail?.provisions?.length === 0
                            ? 'This Central Act is fully cataloged in the Sovereign India Code Registry. You can ask JurisAI to retrieve and synthesize any section under this Act directly in the chat.'
                            : 'Try searching for a different section number or keyword.'}
                        </p>
                        {actDetail?.provisions?.length === 0 && (
                          <button
                            onClick={() => handleAskJurisAI(actDetail)}
                            className="mt-3 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
                          >
                            Ask JurisAI About Sections in This Act
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {displayProvisions.map((prov) => {
                          const isCopied = copiedSectionId === (prov.id || prov.section_number)
                          return (
                            <div
                              key={prov.id || prov.section_number}
                              className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2 hover:border-slate-700 transition"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-mono">
                                      {prov.section_number}
                                    </span>
                                    {prov.citation && (
                                      <span className="text-[11px] text-slate-400 font-medium">
                                        {prov.citation}
                                      </span>
                                    )}
                                  </div>
                                  <h4 className="text-sm font-bold text-white mt-1">
                                    {prov.marginal_heading}
                                  </h4>
                                </div>

                                <button
                                  onClick={() => handleCopySection(prov)}
                                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-700 transition shrink-0 font-medium"
                                  title="Copy statutory section text"
                                >
                                  {isCopied ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-400" />
                                      <span className="text-emerald-400 font-bold">Copied</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" />
                                      <span>Copy</span>
                                    </>
                                  )}
                                </button>
                              </div>

                              <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800/90 text-xs text-slate-200 leading-relaxed font-mono whitespace-pre-wrap">
                                {prov.text}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Pop-up Action Footer */}
              <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/90 flex flex-wrap items-center justify-between gap-3 text-xs">
                <button
                  onClick={handleCloseActDetail}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium transition"
                >
                  ← Back to Acts Catalog
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopySummary}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-800 text-slate-300 hover:text-white font-medium border border-slate-700 transition"
                  >
                    {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                    <span>{copiedSummary ? 'Summary Copied!' : 'Copy Statutory Profile'}</span>
                  </button>

                  <button
                    onClick={() => handleAskJurisAI(actDetail || selectedAct)}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition shadow-md shadow-indigo-600/30"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Ask JurisAI About This Act</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
