/**
 * AdvocateDiaryModal — Digital Diary & Daily Cause List Hearing Planner for Advocates
 * 
 * Features:
 * - 3 Priority Tiers with distinct signature colors:
 *   🔴 Must Do / Immediate (Red)
 *   🟡 Intermediate / Regular (Supreme Court Gold / Amber)
 *   🔵 Optional / Administrative (Sovereign Blue / Indigo)
 * - Date Segregation: Today's Hearings, This Week's Cause List, This Month, All Records
 * - Interactive Checkbox with instant status toggle & visual strike-through
 * - Real-world Indian Court attributes: Case No., Court Hall No., Cause List Item No., Stage of Case
 * - One-click Adjournment (NDOH - Next Date of Hearing) rollover
 * - Formatted Daily Cause List WhatsApp / Print export for juniors & clients
 * - Multi-tenant isolation: strictly saved per authenticated user in backend database
 */
import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Calendar, Clock, CheckSquare, Square, Plus, Trash2,
  AlertCircle, Scale, Building2, User, Phone, FileText, Check,
  Copy, Printer, ChevronRight, Filter, Sparkles, AlertTriangle,
  Flame, CheckCircle2, RefreshCw, ArrowRight, Bookmark,
} from 'lucide-react'
import {
  apiGetDiaryEntries,
  apiGetDiaryStats,
  apiCreateDiaryEntry,
  apiToggleDiaryComplete,
  apiAdjournDiaryEntry,
  apiDeleteDiaryEntry,
} from '../api/client'
import { notificationService } from '../services/notificationService'

const COURT_STAGES = [
  'Summons / Notice Returnable',
  'Filing of Written Statement / Objections',
  'Framing of Issues / Charge',
  'Interlocutory Application (IA) Hearing',
  'Plaintiff Evidence (PW-1 Cross)',
  'Defendant Evidence (DW-1 Cross)',
  'Final Arguments',
  'Judgment / Pronouncement of Orders',
  'Bail / Anticipatory Bail Hearing',
  'Admission / Preliminary Hearing',
  'Settlement / Mediation Reference',
  'Execution Petition (EP) Steps',
]

export default function AdvocateDiaryModal({
  isOpen,
  onClose,
  initialDocChatId = null,
  initialCaseTitle = '',
}) {
  const [filter, setFilter] = useState('today') // 'today' | 'this_week' | 'this_month' | 'all' | 'must_do'
  const [entries, setEntries] = useState([])
  const [stats, setStats] = useState({
    total_entries: 0,
    today_count: 0,
    this_week_count: 0,
    must_do_pending: 0,
    completed_count: 0,
  })
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  // New Entry Form State
  const [showAddForm, setShowAddForm] = useState(false)
  const [caseNumber, setCaseNumber] = useState('')
  const [courtName, setCourtName] = useState('')
  const [parties, setParties] = useState(initialCaseTitle || '')
  const [hearingDate, setHearingDate] = useState(new Date().toISOString().split('T')[0])
  const [hearingTime, setHearingTime] = useState('10:30 AM')
  const [itemNumber, setItemNumber] = useState('')
  const [stage, setStage] = useState(COURT_STAGES[0])
  const [priority, setPriority] = useState('must_do') // 'must_do' | 'intermediate' | 'optional'
  const [taskNotes, setTaskNotes] = useState('')
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')

  // Adjourn / NDOH Modal State
  const [adjournTarget, setAdjournTarget] = useState(null)
  const [nextDate, setNextDate] = useState('')
  const [nextStage, setNextStage] = useState('')
  const [orderSummary, setOrderSummary] = useState('')

  const loadEntriesAndStats = async () => {
    setLoading(true)
    try {
      const [entriesRes, statsRes] = await Promise.all([
        apiGetDiaryEntries(filter, initialDocChatId),
        apiGetDiaryStats(),
      ])
      const fetched = entriesRes.data || []
      setEntries(fetched)
      setStats(statsRes.data || {})
      // Auto-sync today's hearings with notification engine
      notificationService.syncDiaryHearings(fetched)
    } catch (err) {
      console.error('Failed to load advocate diary entries:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadEntriesAndStats()
      if (initialCaseTitle && !parties) {
        setParties(initialCaseTitle)
      }
    }
  }, [isOpen, filter, initialDocChatId])

  const handleCreateEntry = async (e) => {
    e.preventDefault()
    if (!caseNumber.trim() || !courtName.trim() || !hearingDate) return

    try {
      await apiCreateDiaryEntry({
        case_number: caseNumber.trim(),
        court_name: courtName.trim(),
        parties: parties.trim() || 'Parties Not Specified',
        hearing_date: hearingDate,
        hearing_time: hearingTime || '10:30 AM',
        item_number: itemNumber.trim() || undefined,
        stage: stage,
        priority: priority,
        task_notes: taskNotes.trim() || undefined,
        client_name: clientName.trim() || undefined,
        client_phone: clientPhone.trim() || undefined,
        doc_chat_id: initialDocChatId || undefined,
      })

      // Register hearing notification & schedule alert
      notificationService.addNotification({
        type: 'hearing',
        priority: priority === 'must_do' ? 'high' : 'normal',
        title: `Court Hearing Scheduled: ${caseNumber.trim()}`,
        body: `${hearingDate} (${hearingTime || '10:30 AM'}) in ${courtName.trim()} — ${parties.trim() || 'Parties'}. Stage: ${stage}.`,
        action: 'open_diary',
        actionLabel: 'View in Diary',
        metadata: { case_number: caseNumber.trim() },
      })

      // Reset form
      setCaseNumber('')
      setItemNumber('')
      setTaskNotes('')
      setShowAddForm(false)
      loadEntriesAndStats()
    } catch (err) {
      console.error('Failed to create diary entry:', err)
    }
  }

  const handleToggleComplete = async (id) => {
    try {
      await apiToggleDiaryComplete(id)
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, is_completed: !e.is_completed } : e))
      )
      loadEntriesAndStats()
    } catch (err) {
      console.error('Failed to toggle completion:', err)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Remove this case hearing from your digital diary?')) return
    try {
      await apiDeleteDiaryEntry(id)
      setEntries((prev) => prev.filter((e) => e.id !== id))
      loadEntriesAndStats()
    } catch (err) {
      console.error('Failed to delete entry:', err)
    }
  }

  const handleAdjournSubmit = async (e) => {
    e.preventDefault()
    if (!adjournTarget || !nextDate) return

    try {
      await apiAdjournDiaryEntry(adjournTarget.id, {
        next_hearing_date: nextDate,
        next_stage: nextStage || adjournTarget.stage,
        order_summary: orderSummary.trim() || undefined,
      })

      // Register adjournment NDOH notification
      notificationService.addNotification({
        type: 'hearing',
        priority: 'normal',
        title: `Hearing Adjourned (NDOH): ${adjournTarget.case_number}`,
        body: `Next date set to ${nextDate}. Stage: ${nextStage || adjournTarget.stage}. ${orderSummary.trim() ? `Order: ${orderSummary.trim()}` : ''}`,
        action: 'open_diary',
        actionLabel: 'View in Diary',
      })

      setAdjournTarget(null)
      setNextDate('')
      setOrderSummary('')
      loadEntriesAndStats()
    } catch (err) {
      console.error('Failed to adjourn entry:', err)
    }
  }

  const handleCopyCauseList = () => {
    if (entries.length === 0) return
    const formatted = entries
      .map(
        (e, idx) =>
          `${idx + 1}. [${e.item_number ? `Item ${e.item_number}` : 'Daily'}] ${e.case_number} — ${e.parties}\n` +
          `   Court: ${e.court_name} (${e.hearing_time || '10:30 AM'})\n` +
          `   Stage: ${e.stage} | Priority: ${e.priority.toUpperCase()}\n` +
          `   Task: ${e.task_notes || 'Routine attendance'}\n` +
          `   Status: ${e.is_completed ? '✅ Completed / Attended' : '⏳ Pending Hearing'}`
      )
      .join('\n\n')

    const dateHeader =
      filter === 'today'
        ? `TODAY'S CAUSE LIST (${new Date().toLocaleDateString('en-GB')})`
        : `ADVOCATE CAUSE LIST & HEARING SCHEDULE (${filter.toUpperCase()})`

    const text = `========================================\n${dateHeader}\nJurisAI Advocate Digital Diary\n========================================\n\n${formatted}\n\n========================================\nGenerated via JurisAI Commercial Legal Suite`

    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handlePrintCauseList = () => {
    document.body.classList.add('print-diary-active')
    const cleanup = () => {
      document.body.classList.remove('print-diary-active')
      window.removeEventListener('afterprint', cleanup)
    }
    window.addEventListener('afterprint', cleanup)
    window.print()
    setTimeout(cleanup, 2000)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 14 }}
        className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-3xl shadow-[0_20px_50px_rgba(10,37,64,0.15)] overflow-hidden flex flex-col max-h-[92vh] text-slate-800"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 bg-slate-50/90 shrink-0 gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-600/30 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-md shadow-emerald-500/10 shrink-0">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base md:text-lg font-bold text-slate-900 tracking-wide truncate">
                  Advocate Digital Diary
                </h2>
                <span className="text-[9px] sm:text-[10px] bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 px-1.5 sm:px-2 py-0.5 rounded-full font-semibold shrink-0">
                  Daily Planner
                </span>
                {initialDocChatId && (
                  <span className="hidden md:inline text-[10px] bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded-full shrink-0">
                    Case Linked
                  </span>
                )}
              </div>
              <p className="hidden sm:block text-xs text-slate-600 truncate">
                Track court appearances, cause list items, statutory stages & priority deadlines
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={() => setShowAddForm((prev) => !prev)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs transition-all shadow-md shadow-emerald-500/20"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>{showAddForm ? 'View Schedule' : 'Add Hearing'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 text-slate-600 hover:text-slate-900 hover:bg-white/10 rounded-full transition-colors ml-0.5 sm:ml-1"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── Subheader Stats & Date Filters ── */}
        <div className="px-4 sm:px-6 py-2.5 sm:py-3 border-b border-emerald-500/15 bg-white/2 flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 shrink-0">
          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-3 sm:gap-4 text-xs font-medium overflow-x-auto scrollbar-none py-0.5">
            <div className="flex items-center gap-1.5 text-slate-700 shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Today:</span>
              <span className="font-bold text-slate-900 font-mono">{stats.today_count || 0}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-700 shrink-0">
              <span className="w-2 h-2 rounded-full bg-red-400" />
              <span>Must Do:</span>
              <span className="font-bold text-red-300 font-mono">{stats.must_do_pending || 0}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-700 shrink-0">
              <span className="w-2 h-2 rounded-full bg-indigo-400" />
              <span>This Week:</span>
              <span className="font-bold text-slate-900 font-mono">{stats.this_week_count || 0}</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-slate-600 shrink-0">
              <span>Completed:</span>
              <span className="font-bold text-emerald-400 font-mono">{stats.completed_count || 0}</span>
            </div>
          </div>

          {/* Date Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-50 border border-white/10 rounded-xl p-1 text-xs">
            <button
              onClick={() => setFilter('today')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                filter === 'today'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setFilter('this_week')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                filter === 'this_week'
                  ? 'bg-indigo-600 text-white indigo-glow shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setFilter('this_month')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                filter === 'this_month'
                  ? 'bg-indigo-600 text-white indigo-glow shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setFilter('must_do')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                filter === 'must_do'
                  ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Must Do (High)
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                filter === 'all'
                  ? 'bg-white/10 text-slate-900'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
          </div>
        </div>

        {/* ── Content Body ── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {showAddForm ? (
            /* ═══ FORM: ADD NEW CASE HEARING / DIARY ENTRY ═══ */
            <motion.form
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleCreateEntry}
              className="bg-white border border-emerald-500/25 rounded-2xl p-5 sm:p-6 max-w-2xl mx-auto space-y-4"
            >
              <div className="border-b border-white/10 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Scale className="w-4 h-4 text-emerald-400" />
                    <span>Enter Case Hearing & Daily Task</span>
                  </h3>
                  <p className="text-[11px] text-slate-600">
                    Record into your persistent advocate cause list
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-xs text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
              </div>

              {/* 3 Priority Buttons (The 3 distinct colors requested) */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Priority & Urgency Level (Select Color):
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPriority('must_do')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      priority === 'must_do'
                        ? 'bg-red-500/25 border-red-500 text-red-200 shadow-lg shadow-red-500/20'
                        : 'bg-white/3 border-red-500/25 text-red-400 hover:bg-red-500/10'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400 animate-pulse" />
                    <span>🔴 Must Do (Immediate)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPriority('intermediate')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      priority === 'intermediate'
                        ? 'bg-amber-500/25 border-amber-400 text-amber-200 shadow-lg shadow-amber-500/20'
                        : 'bg-white/3 border-amber-500/25 text-amber-400 hover:bg-amber-500/10'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span>🟡 Intermediate (Regular)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPriority('optional')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      priority === 'optional'
                        ? 'bg-indigo-600/30 border-indigo-400 text-indigo-200 shadow-lg shadow-indigo-600/20'
                        : 'bg-white/3 border-indigo-500/25 text-indigo-400 hover:bg-[#0369a1]/10'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
                    <span>🔵 Optional (Admin)</span>
                  </button>
                </div>
              </div>

              {/* Case No. & Court Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Case Number / CNR <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={caseNumber}
                    onChange={(e) => setCaseNumber(e.target.value)}
                    placeholder="e.g. O.S. 412/2026 or WP 14022/2026"
                    className="w-full bg-[#0e1c26] border border-emerald-500/25 rounded-xl px-3 py-2 text-slate-900 text-xs outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Court & Hall Number <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={courtName}
                    onChange={(e) => setCourtName(e.target.value)}
                    placeholder="e.g. City Civil Court Hall 14 / HC Court 3"
                    className="w-full bg-[#0e1c26] border border-emerald-500/25 rounded-xl px-3 py-2 text-slate-900 text-xs outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              {/* Parties Title */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Cause Title (Plaintiff vs. Defendant)
                </label>
                <input
                  type="text"
                  value={parties}
                  onChange={(e) => setParties(e.target.value)}
                  placeholder="e.g. Apex Technologies Ltd vs Union of India"
                  className="w-full bg-[#0e1c26] border border-emerald-500/25 rounded-xl px-3 py-2 text-slate-900 text-xs outline-none focus:border-emerald-400"
                />
              </div>

              {/* Hearing Date, Time & Item No. */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Hearing Date <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={hearingDate}
                    onChange={(e) => setHearingDate(e.target.value)}
                    className="w-full bg-[#0e1c26] border border-emerald-500/25 rounded-xl px-3 py-2 text-slate-900 text-xs outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Hearing Time
                  </label>
                  <input
                    type="text"
                    value={hearingTime}
                    onChange={(e) => setHearingTime(e.target.value)}
                    placeholder="10:30 AM"
                    className="w-full bg-[#0e1c26] border border-emerald-500/25 rounded-xl px-3 py-2 text-slate-900 text-xs outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Cause List Item No.
                  </label>
                  <input
                    type="text"
                    value={itemNumber}
                    onChange={(e) => setItemNumber(e.target.value)}
                    placeholder="e.g. Item 14 (Motion)"
                    className="w-full bg-[#0e1c26] border border-emerald-500/25 rounded-xl px-3 py-2 text-slate-900 text-xs outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              {/* Case Stage */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Court Hearing Stage
                </label>
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value)}
                  className="w-full bg-[#0e1c26] border border-emerald-500/25 rounded-xl px-3 py-2 text-slate-900 text-xs outline-none focus:border-emerald-400"
                >
                  {COURT_STAGES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              {/* Actionable Notes / Tasks for Hearing */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Actionable Hearing Notes / Tasks for the Day
                </label>
                <textarea
                  rows={2}
                  value={taskNotes}
                  onChange={(e) => setTaskNotes(e.target.value)}
                  placeholder="e.g. Bring original lease agreement; cross-examine PW-1 on receipt voucher; file rejoinder affidavit."
                  className="w-full bg-[#0e1c26] border border-emerald-500/25 rounded-xl px-3 py-2 text-slate-900 text-xs outline-none focus:border-emerald-400 resize-none"
                />
              </div>

              {/* Client Follow-up Contact */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Client Name
                  </label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Client Contact"
                    className="w-full bg-[#0e1c26] border border-emerald-500/25 rounded-xl px-3 py-2 text-slate-900 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Client Phone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-[#0e1c26] border border-emerald-500/25 rounded-xl px-3 py-2 text-slate-900 text-xs outline-none"
                  />
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs transition-all shadow-md shadow-emerald-500/20"
                >
                  Save to Daily Diary
                </button>
              </div>
            </motion.form>
          ) : (
            /* ═══ LIST: ADVOCATE DAILY CAUSE LIST & ENTRIES ═══ */
            <div className="space-y-3">
              {/* Action Toolbar */}
              <div className="flex items-center justify-between gap-3 text-xs text-slate-600 mb-2">
                <span>
                  Showing <strong>{entries.length}</strong> hearing{entries.length !== 1 ? 's' : ''} for{' '}
                  <span className="text-emerald-400 font-bold uppercase">{filter.replace('_', ' ')}</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrintCauseList}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 hover:border-emerald-400/40 bg-white/4 hover:bg-white/8 text-slate-700 text-xs transition-all"
                    title="Print cause list for court hall / notice board"
                  >
                    <Printer className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="hidden sm:inline">Print Cause List</span>
                    <span className="sm:hidden">Print</span>
                  </button>
                  <button
                    onClick={handleCopyCauseList}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 hover:border-emerald-400/40 bg-white/4 hover:bg-white/8 text-slate-700 text-xs transition-all"
                    title="Copy formatted cause list for WhatsApp / Clerk"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied List!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copy Cause List</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-16 text-slate-600 text-xs">
                  Loading hearing cause list...
                </div>
              ) : entries.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl bg-white/2 space-y-3">
                  <Calendar className="w-10 h-10 text-slate-600 mx-auto" />
                  <div>
                    <p className="text-sm font-semibold text-slate-700">No hearings found for this period</p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                      No court appearances recorded under {filter.replace('_', ' ')}. Add hearings to keep your daily timetable organized.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md"
                  >
                    + Add Hearing Entry
                  </button>
                </div>
              ) : (
                entries.map((entry) => {
                  const isMustDo = entry.priority === 'must_do'
                  const isIntermediate = entry.priority === 'intermediate'

                  const priorityBorder = isMustDo
                    ? 'border-l-4 border-l-red-500'
                    : isIntermediate
                    ? 'border-l-4 border-l-amber-500'
                    : 'border-l-4 border-l-indigo-500'

                  return (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`bg-white border border-emerald-500/20 ${priorityBorder} rounded-2xl p-4 transition-all shadow-md ${
                        entry.is_completed ? 'opacity-60 bg-slate-50' : 'hover:border-emerald-400/40'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Checkbox */}
                        <button
                          onClick={() => handleToggleComplete(entry.id)}
                          className="mt-0.5 text-slate-600 hover:text-emerald-400 transition-colors shrink-0"
                          title={entry.is_completed ? 'Mark Pending' : 'Mark Completed'}
                        >
                          {entry.is_completed ? (
                            <CheckSquare className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <Square className="w-5 h-5 text-slate-500 hover:text-emerald-400" />
                          )}
                        </button>

                        {/* Main Entry Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span
                              className={`text-xs font-mono font-bold ${
                                entry.is_completed ? 'line-through text-slate-600' : 'text-slate-900'
                              }`}
                            >
                              {entry.case_number}
                            </span>

                            {entry.item_number && (
                              <span className="text-[10px] font-mono bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded font-bold">
                                {entry.item_number}
                              </span>
                            )}

                            {/* Priority Badge */}
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                isMustDo
                                   ? 'bg-red-500/15 text-red-300 border-red-500/30'
                                   : isIntermediate
                                   ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                   : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                              }`}
                            >
                              {isMustDo
                                ? '🔴 MUST DO'
                                : isIntermediate
                                ? '🟡 INTERMEDIATE'
                                : '🔵 OPTIONAL'}
                            </span>

                            {/* Stage Badge */}
                            <span className="text-[10px] bg-white/5 border border-white/10 text-slate-700 px-2 py-0.5 rounded font-medium">
                              {entry.stage}
                            </span>

                            {entry.is_completed && (
                              <span className="text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-semibold">
                                ✓ ATTENDED
                              </span>
                            )}

                            {entry.disposal_status === 'adjourned' && entry.next_hearing_date && (
                              <span className="text-[10px] bg-purple-500/15 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded font-semibold">
                                ↳ NDOH: {entry.next_hearing_date}
                              </span>
                            )}
                          </div>

                          {/* Cause Title & Court Hall */}
                          <p
                            className={`text-xs font-semibold ${
                              entry.is_completed ? 'line-through text-slate-500' : 'text-slate-200'
                            }`}
                          >
                            {entry.parties}
                          </p>

                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600 mt-1">
                            <span className="flex items-center gap-1 text-slate-700">
                              <Building2 className="w-3 h-3 text-emerald-400" />
                              <span>{entry.court_name}</span>
                            </span>
                            <span className="flex items-center gap-1 text-slate-600">
                              <Calendar className="w-3 h-3 text-indigo-400" />
                              <span>{entry.hearing_date}</span>
                            </span>
                            {entry.hearing_time && (
                              <span className="flex items-center gap-1 text-slate-600 font-mono">
                                <Clock className="w-3 h-3" />
                                <span>{entry.hearing_time}</span>
                              </span>
                            )}
                            {entry.client_phone && (
                              <span className="flex items-center gap-1 text-slate-600">
                                <Phone className="w-3 h-3 text-emerald-400" />
                                <span>{entry.client_phone}</span>
                              </span>
                            )}
                          </div>

                          {/* Actionable Notes / Tasks */}
                          {entry.task_notes && (
                            <div className="mt-2 p-2.5 bg-black/30 border border-white/5 rounded-xl text-xs text-slate-700 font-sans whitespace-pre-wrap">
                              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-0.5">
                                Hearing Notes & Task:
                              </span>
                              {entry.task_notes}
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Adjourn / NDOH Button */}
                          <button
                            onClick={() => {
                              setAdjournTarget(entry)
                              setNextDate('')
                              setNextStage(entry.stage)
                            }}
                            className="text-[11px] px-2.5 py-1 rounded-lg border border-emerald-400/30 hover:border-emerald-400 bg-emerald-500/10 hover:bg-[#0369a1]/20 text-emerald-300 transition-all font-semibold flex items-center gap-1"
                            title="Record Adjournment & Next Date of Hearing"
                          >
                            <span>Adjourn (NDOH)</span>
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDelete(entry.id)}
                            className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                            title="Delete hearing"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )
                })
              )}
            </div>
          )}
        </div>

        {/* ═══ ADJOURNMENT / NDOH POPUP MODAL ═══ */}
        {adjournTarget && (
          <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white border-2 border-emerald-400/40 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  <span>Adjourn Hearing: {adjournTarget.case_number}</span>
                </h4>
                <button
                  onClick={() => setAdjournTarget(null)}
                  className="text-slate-600 hover:text-slate-900"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-700">
                Mark today's hearing as attended/adjourned and automatically create the next hearing entry in your diary.
              </p>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Next Date of Hearing (NDOH) <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={nextDate}
                  onChange={(e) => setNextDate(e.target.value)}
                  className="w-full bg-[#0e1c26] border border-emerald-400/40 rounded-xl px-3 py-2 text-slate-900 text-xs outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Next Stage in Court
                </label>
                <select
                  value={nextStage}
                  onChange={(e) => setNextStage(e.target.value)}
                  className="w-full bg-[#0e1c26] border border-white/15 rounded-xl px-3 py-2 text-slate-900 text-xs outline-none"
                >
                  {COURT_STAGES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Court Order / Daily Proceedings Summary
                </label>
                <textarea
                  rows={2}
                  value={orderSummary}
                  onChange={(e) => setOrderSummary(e.target.value)}
                  placeholder="e.g. Plaintiff completed cross examination; adjourned on defendant's counsel request for DW-1 affidavit."
                  className="w-full bg-[#0e1c26] border border-white/15 rounded-xl px-3 py-2 text-slate-900 text-xs outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setAdjournTarget(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdjournSubmit}
                  disabled={!nextDate}
                  className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md"
                >
                  Confirm NDOH Rollover
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="px-6 py-2.5 bg-black/60 border-t border-emerald-500/15 flex items-center justify-between text-[10px] text-slate-600">
          <span className="flex items-center gap-1.5 text-emerald-300">
            <Bookmark className="w-3.5 h-3.5 text-emerald-400" />
            <span>Digital Vakil Diary · Isolated per user account with SQLite backend</span>
          </span>
          <span className="hidden sm:inline text-slate-500">
            Advocate Cause List Suite · JurisAI 2026
          </span>
        </div>

        {/* ═══ PORTAL PRINT CONTAINER FOR CAUSE LIST ═══ */}
        {createPortal(
          <div id="advocate-diary-print" className="font-serif text-black max-w-[195mm] mx-auto text-[8.5pt] leading-tight bg-white">
            {/* Header */}
            <div style={{ textAlign: 'center', borderBottom: '1.5px solid #0f172a', paddingBottom: '3px', marginBottom: '6px' }}>
              <p style={{ fontSize: '7.5pt', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold', margin: '0 0 1px 0', color: '#334155' }}>
                DISTRICT & SESSIONS JUDICIARY · ADVOCATE COURT DIARY
              </p>
              <h1 style={{ fontSize: '11pt', fontWeight: 'bold', textTransform: 'uppercase', margin: '1px 0', color: '#0f172a' }}>
                DAILY CAUSE LIST & HEARING SCHEDULE
              </h1>
              <p style={{ fontSize: '8pt', fontStyle: 'italic', margin: 0, color: '#475569' }}>
                Date: {new Date().toLocaleDateString('en-GB')} | Scope: {filter.toUpperCase()} ({entries.length} Listed Matters)
              </p>
            </div>

            {/* Cause List Table */}
            {entries.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '16px', border: '1px solid #cbd5e1', color: '#64748b' }}>
                No court hearings recorded under {filter.toUpperCase()}.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8pt' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9' }}>
                    <th style={{ border: '1px solid #94a3b8', padding: '2.5px 4px', textAlign: 'center', width: '26px' }}>#</th>
                    <th style={{ border: '1px solid #94a3b8', padding: '2.5px 4px', textAlign: 'center', width: '36px' }}>Item</th>
                    <th style={{ border: '1px solid #94a3b8', padding: '2.5px 5px', textAlign: 'left', width: '95px' }}>Case Number</th>
                    <th style={{ border: '1px solid #94a3b8', padding: '2.5px 5px', textAlign: 'left' }}>Parties / Cause Title</th>
                    <th style={{ border: '1px solid #94a3b8', padding: '2.5px 5px', textAlign: 'left', width: '100px' }}>Court & Hall</th>
                    <th style={{ border: '1px solid #94a3b8', padding: '2.5px 5px', textAlign: 'left', width: '100px' }}>Stage</th>
                    <th style={{ border: '1px solid #94a3b8', padding: '2.5px 5px', textAlign: 'left', width: '120px' }}>Counsel Notes & Tasks</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e, idx) => (
                    <tr key={e.id} style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                      <td style={{ border: '1px solid #cbd5e1', padding: '2.5px 4px', textAlign: 'center' }}>{idx + 1}</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '2.5px 4px', textAlign: 'center', fontWeight: 'bold' }}>{e.item_number || '-'}</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '2.5px 5px', fontWeight: 'bold' }}>{e.case_number}</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '2.5px 5px' }}>{e.parties}</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '2.5px 5px' }}>{e.court_name} {e.hearing_time ? `(${e.hearing_time})` : ''}</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '2.5px 5px' }}>{e.stage}</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '2.5px 5px', fontSize: '7.5pt' }}>
                        {e.task_notes || 'Attendance / Regular'}
                        {e.next_hearing_date && ` [NDOH: ${e.next_hearing_date}]`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Footer Signature Block */}
            <div style={{ marginTop: '10px', paddingTop: '4px', borderTop: '1px solid #94a3b8', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '7.5pt', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
              <div>
                <p style={{ margin: '1px 0' }}>Printed on: {new Date().toLocaleDateString('en-GB')} at {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                <p style={{ margin: '1px 0', color: '#64748b' }}>Verified against Cause List Records · JurisAI Digital Practice Suite</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ width: '130px', borderBottom: '1px solid #000000', marginBottom: '2px', marginLeft: 'auto' }} />
                <p style={{ fontWeight: 'bold', margin: '1px 0', textTransform: 'uppercase' }}>Advocate / Law Chamber</p>
                <p style={{ fontSize: '7pt', color: '#64748b', margin: 0 }}>Counsel Signature</p>
              </div>
            </div>
          </div>,
          document.body
        )}
      </motion.div>
    </div>
  )
}
