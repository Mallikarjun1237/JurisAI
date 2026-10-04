import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  FileText,
  Upload,
  ArrowLeft,
  Scale,
  Plus,
  Trash2,
  Copy,
  Download,
  ShieldAlert,
  HelpCircle,
  Sparkles,
  BookOpen,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import {
  apiGetLimitationPresets,
  apiCalculateLimitation,
  apiExtractChronology,
  apiUploadAndExtractChronology,
} from '../api/client'

export default function LimitationChronology() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [activeTab, setActiveTab] = useState('limitation') // 'limitation' | 'chronology'

  // ── Limitation State ──
  const [presets, setPresets] = useState([])
  const [selectedPresetId, setSelectedPresetId] = useState('')
  const [causeDate, setCauseDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 10)
    return d.toISOString().split('T')[0]
  })
  const [limitationResult, setLimitationResult] = useState(null)
  const [limitationLoading, setLimitationLoading] = useState(false)
  const [limitationError, setLimitationError] = useState('')

  // ── Chronology State ──
  const [chronologyText, setChronologyText] = useState('')
  const [chronologyEvents, setChronologyEvents] = useState([
    {
      date: '10-08-2024',
      event: 'Commercial Supply Agreement executed between Petitioner and Respondent for delivery of hardware components.',
      annexure_tag: 'Annexure P-1',
      relevance: 'Contractual relationship established.',
    },
    {
      date: '15-11-2024',
      event: 'Cheque bearing No. 448201 for INR 12,50,000/- drawn on HDFC Bank was issued by Respondent towards outstanding payment.',
      annexure_tag: 'Annexure P-2',
      relevance: 'Negotiable instrument issued towards legally enforceable debt.',
    },
    {
      date: '18-11-2024',
      event: 'Bank Return Memo received by Petitioner stating cheque dishonoured due to "Funds Insufficient".',
      annexure_tag: 'Annexure P-3',
      relevance: 'Cause of action commences under Section 138 Negotiable Instruments Act.',
    },
  ])
  const [chronologyLoading, setChronologyLoading] = useState(false)
  const [chronologyFileName, setChronologyFileName] = useState('')
  const [copySuccess, setCopySuccess] = useState(false)

  // Load Presets
  useEffect(() => {
    async function loadPresets() {
      try {
        const res = await apiGetLimitationPresets()
        setPresets(res.data)
        if (res.data.length > 0) {
          setSelectedPresetId(res.data[0].id)
        }
      } catch (err) {
        console.error('Failed to load presets:', err)
      }
    }
    loadPresets()
  }, [])

  // Calculate Limitation on preset or date change
  useEffect(() => {
    if (!selectedPresetId || !causeDate) return
    let active = true

    async function doCalculate() {
      setLimitationLoading(true)
      setLimitationError('')
      try {
        const res = await apiCalculateLimitation({
          preset_id: selectedPresetId,
          cause_of_action_date: causeDate,
        })
        if (active) setLimitationResult(res.data)
      } catch (err) {
        if (active) setLimitationError(err?.response?.data?.detail || 'Calculation error.')
      } finally {
        if (active) setLimitationLoading(false)
      }
    }

    doCalculate()
    return () => {
      active = false
    }
  }, [selectedPresetId, causeDate])

  // Extract Chronology from text
  const handleExtractChronology = async () => {
    if (!chronologyText.trim()) return
    setChronologyLoading(true)
    try {
      const res = await apiExtractChronology(chronologyText)
      if (res.data?.events?.length) {
        setChronologyEvents(res.data.events)
      }
    } catch (err) {
      alert(err?.response?.data?.detail || 'Failed to extract chronology.')
    } finally {
      setChronologyLoading(false)
    }
  }

  // File Upload Chronology
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setChronologyFileName(file.name)
    setChronologyLoading(true)
    try {
      const res = await apiUploadAndExtractChronology(file)
      if (res.data?.events?.length) {
        setChronologyEvents(res.data.events)
      }
    } catch (err) {
      alert(err?.response?.data?.detail || 'Failed to parse file for chronology.')
    } finally {
      setChronologyLoading(false)
    }
  }

  // Add Manual Chronology Row
  const handleAddRow = () => {
    setChronologyEvents((prev) => [
      ...prev,
      {
        date: new Date().toISOString().split('T')[0],
        event: 'Describe the material factual occurrence or transaction...',
        annexure_tag: `Annexure P-${prev.length + 1}`,
        relevance: 'Material factual milestone.',
      },
    ])
  }

  // Delete Chronology Row
  const handleDeleteRow = (index) => {
    setChronologyEvents((prev) => prev.filter((_, idx) => idx !== index))
  }

  // Update Chronology Row
  const handleUpdateRow = (index, field, value) => {
    setChronologyEvents((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  // Copy Court-formatted Table to Clipboard
  const handleCopyCourtTable = () => {
    let tableText = 'IN THE HIGH COURT OF JUDICATURE\n'
    tableText += 'LIST OF DATES AND EVENTS (SYNOPTICAL NOTES)\n\n'
    tableText += '------------------------------------------------------------------------------------------------------------------\n'
    tableText += 'DATE\t\tANNEXURE\tMATERIAL EVENTS & RELEVANCE\n'
    tableText += '------------------------------------------------------------------------------------------------------------------\n'
    chronologyEvents.forEach((item) => {
      tableText += `${item.date}\t${item.annexure_tag}\t${item.event}\n\t\t\tSignificance: ${item.relevance || 'N/A'}\n\n`
    })
    tableText += '------------------------------------------------------------------------------------------------------------------\n'
    tableText += 'FILED BY PETITIONER / COUNSEL THROUGH JURISAI LEGAL SUITE'

    navigator.clipboard.writeText(tableText)
    setCopySuccess(true)
    setTimeout(() => setCopySuccess(false), 2500)
  }

  const selectedPreset = presets.find((p) => p.id === selectedPresetId)

  return (
    <div className="min-h-screen bg-[#060813] text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="border-b border-indigo-500/10 bg-[#060813]/80 backdrop-blur-md sticky top-0 z-30 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white flex items-center gap-2">
                <span>Court Limitation & Chronology Builder</span>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-semibold">
                  Limitation Act, 1963 & BNSS 2023
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Statutory deadline calculator & Court-standard "List of Dates and Events"
              </p>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setActiveTab('limitation')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'limitation'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Limitation Clock</span>
          </button>
          <button
            onClick={() => setActiveTab('chronology')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'chronology'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>List of Dates & Events</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6">
        {/* ================= TAB 1: LIMITATION CALCULATOR ================= */}
        {activeTab === 'limitation' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Controls */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-[#0b0e20] border border-indigo-500/20 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-white/5">
                  <Scale className="w-4 h-4 text-indigo-400" />
                  <h2 className="text-sm font-semibold text-white">Statutory Category Selection</h2>
                </div>

                {/* Preset Dropdown */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Select Cause of Action / Filing Type
                  </label>
                  <select
                    value={selectedPresetId}
                    onChange={(e) => setSelectedPresetId(e.target.value)}
                    className="w-full bg-[#12162d] border border-indigo-500/30 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-400 cursor-pointer"
                  >
                    {presets.map((preset) => (
                      <option key={preset.id} value={preset.id}>
                        {preset.title} ({preset.act})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selected Preset Details Box */}
                {selectedPreset && (
                  <div className="bg-indigo-950/30 border border-indigo-500/20 rounded-xl p-3 text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Statute:</span>
                      <span className="text-indigo-300 font-medium">{selectedPreset.act}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Governing Provision:</span>
                      <span className="text-white font-mono text-[11px]">{selectedPreset.section}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Statutory Window:</span>
                      <span className="text-amber-400 font-bold">
                        {selectedPreset.period_value} {selectedPreset.period_type}
                        {selectedPreset.cure_period_days > 0 && ` (+${selectedPreset.cure_period_days}d notice grace)`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Forum / Authority:</span>
                      <span className="text-slate-300 text-right">{selectedPreset.forum}</span>
                    </div>
                  </div>
                )}

                {/* Date Input */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    {selectedPreset?.cause_label || 'Date of Cause of Action'}
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={causeDate}
                      onChange={(e) => setCauseDate(e.target.value)}
                      className="w-full bg-[#12162d] border border-indigo-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Enter the exact date when the right to sue or file arose.
                  </p>
                </div>
              </div>

              {/* Informative Guidance Card */}
              <div className="bg-gradient-to-br from-indigo-950/40 to-slate-900/60 border border-indigo-500/20 rounded-2xl p-4 text-xs space-y-2 text-slate-300">
                <div className="flex items-center gap-1.5 text-indigo-400 font-semibold">
                  <BookOpen className="w-4 h-4" />
                  <span>The Limitation Act, 1963 Rules</span>
                </div>
                <p className="leading-relaxed text-slate-400">
                  <strong className="text-slate-200">Section 3:</strong> Courts are statutorily bound to dismiss any suit or appeal instituted after the limitation period, even if limitation is not set up as a defence.
                </p>
                <p className="leading-relaxed text-slate-400">
                  <strong className="text-slate-200">Section 4:</strong> Where the prescribed period expires on a day when the court is closed, the suit or appeal may be instituted on the reopening day.
                </p>
              </div>
            </div>

            {/* Right Output Dashboard */}
            <div className="lg:col-span-7 space-y-4">
              {limitationLoading && (
                <div className="bg-[#0b0e20] border border-indigo-500/20 rounded-2xl p-12 text-center">
                  <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-xs text-slate-400">Computing statutory limitation deadlines...</p>
                </div>
              )}

              {limitationError && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-xs text-red-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{limitationError}</span>
                </div>
              )}

              {!limitationLoading && limitationResult && (
                <div className="bg-[#0b0e20] border border-indigo-500/20 rounded-2xl p-6 shadow-2xl space-y-5">
                  {/* Status Banner */}
                  <div
                    className={`rounded-xl p-4 flex items-center justify-between border ${
                      limitationResult.urgency === 'SAFE'
                        ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                        : limitationResult.urgency === 'APPROACHING'
                        ? 'bg-amber-950/30 border-amber-500/30 text-amber-300'
                        : 'bg-red-950/30 border-red-500/30 text-red-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {limitationResult.urgency === 'SAFE' ? (
                        <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0" />
                      ) : limitationResult.urgency === 'APPROACHING' ? (
                        <Clock className="w-6 h-6 text-amber-400 shrink-0" />
                      ) : (
                        <ShieldAlert className="w-6 h-6 text-red-400 shrink-0" />
                      )}
                      <div>
                        <h3 className="font-bold text-sm tracking-wide">{limitationResult.status_label}</h3>
                        <p className="text-xs opacity-90">{limitationResult.title}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black font-mono">
                        {limitationResult.days_remaining >= 0
                          ? `${limitationResult.days_remaining}d`
                          : `${Math.abs(limitationResult.days_remaining)}d ago`}
                      </span>
                      <p className="text-[10px] uppercase font-semibold opacity-75">
                        {limitationResult.days_remaining >= 0 ? 'Remaining' : 'Overdue'}
                      </p>
                    </div>
                  </div>

                  {/* Statutory Milestone Timeline */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="bg-[#12162d] border border-white/5 rounded-xl p-3">
                      <p className="text-[11px] text-slate-400 mb-1">Cause of Action</p>
                      <p className="text-xs font-bold text-white">{limitationResult.cause_of_action_display}</p>
                    </div>
                    {limitationResult.cure_period_days > 0 && (
                      <div className="bg-[#12162d] border border-white/5 rounded-xl p-3">
                        <p className="text-[11px] text-slate-400 mb-1">Notice Grace Period</p>
                        <p className="text-xs font-bold text-amber-300">+{limitationResult.cure_period_days} Days</p>
                      </div>
                    )}
                    <div className="bg-[#12162d] border border-white/5 rounded-xl p-3">
                      <p className="text-[11px] text-slate-400 mb-1">Final Expiry Deadline</p>
                      <p className="text-xs font-bold text-indigo-300">{limitationResult.expiry_date_display}</p>
                    </div>
                  </div>

                  {/* Section 4 Court Closed Rule Callout */}
                  {limitationResult.court_closed_warning && (
                    <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-xl p-3 text-xs text-indigo-300 flex items-start gap-2">
                      <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                      <span>{limitationResult.court_closed_warning}</span>
                    </div>
                  )}

                  {/* Strategic Action Guidance */}
                  <div className="bg-white/3 border border-white/10 rounded-xl p-4 space-y-2">
                    <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                      Strategic Legal Advisory & Course of Action
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">{limitationResult.action_advice}</p>
                  </div>

                  {/* Section 5 Condonation & Landmark Precedent */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-white/5">
                    <div className="text-xs space-y-1">
                      <span className="text-slate-400 font-medium">Condonation of Delay (Section 5):</span>
                      <p className="text-slate-300">{limitationResult.condonation_statute}</p>
                    </div>
                    <div className="text-xs space-y-1">
                      <span className="text-slate-400 font-medium">Binding Precedent Ratio:</span>
                      <p className="text-indigo-300 italic">{limitationResult.landmark_ratios}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 2: CHRONOLOGY OF DATES & EVENTS ================= */}
        {activeTab === 'chronology' && (
          <div className="space-y-6">
            {/* Top Extraction Bar */}
            <div className="bg-[#0b0e20] border border-indigo-500/20 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
                <div>
                  <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span>Automated Chronology Extraction</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Paste case narrative or upload FIR/contract to generate High Court Synoptical Notes
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <label className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors">
                    <Upload className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Upload File</span>
                    <input
                      type="file"
                      accept=".pdf,.txt,.docx"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  {chronologyFileName && (
                    <span className="text-xs text-indigo-300 bg-indigo-950/60 px-2 py-1 rounded border border-indigo-500/30 truncate max-w-[150px]">
                      {chronologyFileName}
                    </span>
                  )}
                </div>
              </div>

              <textarea
                value={chronologyText}
                onChange={(e) => setChronologyText(e.target.value)}
                placeholder="Paste case statements, dispute facts, FIR narrative, or agreement history here..."
                rows={3}
                className="w-full bg-[#12162d] border border-indigo-500/30 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 resize-none"
              />

              <div className="flex justify-end gap-2">
                <button
                  onClick={handleExtractChronology}
                  disabled={chronologyLoading || !chronologyText.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 transition-colors shadow-md"
                >
                  {chronologyLoading ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Synthesizing Dates & Milestones...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Extract Chronology via AI</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Chronological Table */}
            <div className="bg-[#0b0e20] border border-indigo-500/20 rounded-2xl overflow-hidden shadow-2xl">
              <div className="p-4 bg-[#0e122b] border-b border-indigo-500/20 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white">List of Dates and Events (Synoptical Notes)</h3>
                  <p className="text-xs text-slate-400">
                    High Court / Supreme Court Format · Total Milestones: {chronologyEvents.length}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAddRow}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Milestone</span>
                  </button>
                  <button
                    onClick={handleCopyCourtTable}
                    className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-sm"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copySuccess ? 'Copied Court Format!' : 'Copy Table'}</span>
                  </button>
                </div>
              </div>

              {/* Table Body */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#12162d] text-slate-400 uppercase tracking-wider border-b border-white/5 text-[11px]">
                    <tr>
                      <th className="py-3 px-4 w-32">Date / Period</th>
                      <th className="py-3 px-4 w-36">Annexure Tag</th>
                      <th className="py-3 px-4">Material Facts & Legal Milestone</th>
                      <th className="py-3 px-4 w-48">Significance</th>
                      <th className="py-3 px-4 w-12 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {chronologyEvents.map((row, index) => (
                      <tr key={index} className="hover:bg-white/2 transition-colors">
                        <td className="py-3 px-4 align-top">
                          <input
                            type="text"
                            value={row.date}
                            onChange={(e) => handleUpdateRow(index, 'date', e.target.value)}
                            className="w-full bg-transparent border-b border-dashed border-slate-600 text-white font-mono text-xs focus:outline-none focus:border-indigo-400"
                          />
                        </td>
                        <td className="py-3 px-4 align-top">
                          <input
                            type="text"
                            value={row.annexure_tag}
                            onChange={(e) => handleUpdateRow(index, 'annexure_tag', e.target.value)}
                            className="w-full bg-indigo-950/40 border border-indigo-500/30 rounded px-2 py-1 text-indigo-300 font-semibold text-xs focus:outline-none"
                          />
                        </td>
                        <td className="py-3 px-4 align-top">
                          <textarea
                            value={row.event}
                            onChange={(e) => handleUpdateRow(index, 'event', e.target.value)}
                            rows={2}
                            className="w-full bg-transparent border border-transparent hover:border-white/10 rounded p-1 text-slate-200 text-xs leading-relaxed focus:bg-[#12162d] focus:border-indigo-400 focus:outline-none resize-none"
                          />
                        </td>
                        <td className="py-3 px-4 align-top">
                          <input
                            type="text"
                            value={row.relevance}
                            onChange={(e) => handleUpdateRow(index, 'relevance', e.target.value)}
                            className="w-full bg-transparent border-b border-dashed border-slate-700 text-slate-400 text-xs focus:outline-none focus:border-indigo-400"
                          />
                        </td>
                        <td className="py-3 px-4 align-top text-center">
                          <button
                            onClick={() => handleDeleteRow(index)}
                            className="text-slate-500 hover:text-red-400 p-1 transition-colors"
                            title="Delete Row"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
