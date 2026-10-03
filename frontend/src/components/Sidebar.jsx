import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Scale, LogOut, ChevronRight, Sparkles, X, TrendingUp,
  Plus, Folder, FolderOpen, Pencil, Trash2, Check, MoreHorizontal,
  ArrowDownCircle, History, Clock, MessageSquare,
} from 'lucide-react'
import PlanBadge from './PlanBadge'
import { apiListCases, apiRenameCase, apiDeleteCase, apiTogglePro, apiGetHistory } from '../api/client'

export default function Sidebar({
  user, onLogout, onUpgrade, onCaseSelect, onHistorySelect, activeCaseId, open, onClose,
}) {
  const [cases, setCases] = useState([])
  const [historyList, setHistoryList] = useState([])
  const [sidebarTab, setSidebarTab] = useState('cases') // 'cases' | 'history'
  const [togglingPro, setTogglingPro] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')
  const [menuOpenId, setMenuOpenId] = useState(null)

  const loadData = useCallback(async () => {
    try {
      const [casesRes, historyRes] = await Promise.all([
        apiListCases(),
        apiGetHistory().catch(() => ({ data: [] })),
      ])
      setCases(casesRes.data || [])
      setHistoryList(historyRes.data || [])
    } catch (err) {
      console.error('Failed to load sidebar data:', err)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // Refresh cases only when sidebar is opened (open transitions to true)
  useEffect(() => { if (open) loadData() }, [open, loadData])

  // Allow parent to trigger a refresh
  useEffect(() => {
    window._jurisRefreshCases = loadData
  }, [loadData])

  const handleTogglePro = async () => {
    setTogglingPro(true)
    try {
      const action = user?.is_pro ? 'downgrade' : 'upgrade'
      const res = await apiTogglePro(action)
      if (onUpgrade) onUpgrade(res.data)
    } catch (err) {
      console.error('Toggle pro failed:', err)
    } finally {
      setTogglingPro(false)
    }
  }

  const startEdit = (c, e) => {
    e.stopPropagation()
    setEditingId(c.id)
    setEditingName(c.name)
    setMenuOpenId(null)
  }

  const commitEdit = async (id) => {
    const trimmed = editingName.trim()
    if (!trimmed) { setEditingId(null); return }
    try {
      await apiRenameCase(id, trimmed)
      setCases((prev) => prev.map((c) => c.id === id ? { ...c, name: trimmed } : c))
    } catch { /* ignore */ }
    setEditingId(null)
  }

  const handleDelete = async (id, e) => {
    e.stopPropagation()
    if (!confirm('Delete this legal case and all its queries?')) return
    try {
      await apiDeleteCase(id)
      setCases((prev) => prev.filter((c) => c.id !== id))
      if (activeCaseId === id) onCaseSelect(null)
    } catch { /* ignore */ }
    setMenuOpenId(null)
  }

  const dailyUsed = user?.daily_query_count || 0
  const dailyPct = Math.min(100, (dailyUsed / 5) * 100)

  const SidebarContent = () => (
    <div className="h-full flex flex-col overflow-hidden">

      {/* ── Logo ── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-indigo-500/10 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center indigo-glow">
            <Scale className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-gradient text-base">JurisAI</span>
        </div>
        <button onClick={onClose} className="lg:hidden text-slate-500 hover:text-white transition-colors p-1">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ── User Card ── */}
      <div className="px-4 py-4 border-b border-indigo-500/10 shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
            {(user?.full_name || user?.email || 'U')[0].toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white truncate">{user?.full_name || 'User'}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
          <PlanBadge isPro={user?.is_pro} />
        </div>

        {!user?.is_pro && (
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-500">Today's queries</span>
              <span className={`font-semibold ${dailyUsed >= 5 ? 'text-red-400' : 'text-indigo-400'}`}>
                {dailyUsed} / 5
              </span>
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${dailyUsed >= 5 ? 'bg-red-500' : 'bg-indigo-500'}`}
                initial={{ width: 0 }}
                animate={{ width: `${dailyPct}%` }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </div>
        )}

        {user?.is_pro && (
          <div className="flex items-center gap-1.5 text-xs text-amber-400/70">
            <TrendingUp className="w-3 h-3" />
            <span>{user?.query_count || 0} total · Unlimited</span>
          </div>
        )}
      </div>

      {/* ── Sidebar Tabs: Cases vs Recent History ── */}
      <div className="px-3 pt-3 pb-1 shrink-0">
        <div className="grid grid-cols-2 gap-1 bg-white/4 p-1 rounded-xl border border-white/6">
          <button
            onClick={() => setSidebarTab('cases')}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              sidebarTab === 'cases'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Folder className="w-3.5 h-3.5" />
            <span>Cases</span>
            {cases.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${sidebarTab === 'cases' ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-800 text-slate-400'}`}>
                {cases.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setSidebarTab('history')}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              sidebarTab === 'history'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>History</span>
            {historyList.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${sidebarTab === 'history' ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-800 text-slate-400'}`}>
                {historyList.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Content List: Cases or History ── */}
      <div className="flex-1 overflow-y-auto px-3 py-2 min-h-0">
        {sidebarTab === 'cases' ? (
          <div>
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                Legal Cases
              </span>
              <button
                onClick={() => { onCaseSelect(null); onClose() }}
                title="Start new case"
                className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 px-1.5 py-0.5 rounded hover:bg-indigo-500/10 transition-all"
              >
                <Plus className="w-3 h-3" /> New
              </button>
            </div>

            {cases.length === 0 ? (
              <div className="text-center py-8 px-2">
                <FolderOpen className="w-7 h-7 text-slate-800 mx-auto mb-2" />
                <p className="text-xs text-slate-700">No legal cases yet</p>
                <p className="text-xs text-slate-800 mt-1">Cases are created automatically when you search</p>
              </div>
            ) : (
              <div className="space-y-0.5">
                {cases.map((c, i) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="relative group"
                  >
                    {editingId === c.id ? (
                      <div className="flex items-center gap-1 px-2 py-1.5">
                        <input
                          autoFocus
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') commitEdit(c.id)
                            if (e.key === 'Escape') setEditingId(null)
                          }}
                          className="flex-1 bg-white/5 border border-indigo-500/30 rounded px-2 py-0.5 text-xs text-white focus:outline-none"
                        />
                        <button
                          onClick={() => commitEdit(c.id)}
                          className="text-emerald-400 hover:text-emerald-300 p-0.5"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { onCaseSelect(c.id); onClose() }}
                        className={`w-full text-left px-3 py-2.5 rounded-lg transition-all text-xs flex items-center gap-2
                          ${activeCaseId === c.id
                            ? 'bg-indigo-500/15 text-white border border-indigo-500/20'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-indigo-500/6'
                          }`}
                      >
                        <ChevronRight className={`w-3 h-3 shrink-0 transition-colors
                          ${activeCaseId === c.id ? 'text-indigo-400' : 'text-slate-600 group-hover:text-indigo-400'}`}
                        />
                        <span className="truncate flex-1 font-medium">{c.name}</span>
                        {c.query_count > 0 && (
                          <span className="text-slate-600 text-[10px] shrink-0 bg-white/5 px-1.5 py-0.5 rounded">
                            {c.query_count}
                          </span>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === c.id ? null : c.id) }}
                          className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-500 hover:text-slate-200 transition-all"
                        >
                          <MoreHorizontal className="w-3 h-3" />
                        </button>
                      </button>
                    )}

                    {/* Context menu */}
                    <AnimatePresence>
                      {menuOpenId === c.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9, y: -4 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.12 }}
                          className="absolute right-0 top-full mt-0.5 z-50 bg-[#0f0f1e] border border-white/10 rounded-lg shadow-xl overflow-hidden w-32"
                        >
                          <button
                            onClick={(e) => startEdit(c, e)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                          >
                            <Pencil className="w-3 h-3" /> Rename
                          </button>
                          <button
                            onClick={(e) => handleDelete(c.id, e)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" /> Delete
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                Recent Queries
              </span>
            </div>

            {historyList.length === 0 ? (
              <div className="text-center py-8 px-2">
                <Clock className="w-7 h-7 text-slate-800 mx-auto mb-2" />
                <p className="text-xs text-slate-700">No search history yet</p>
                <p className="text-xs text-slate-800 mt-1">Queries will appear here automatically</p>
              </div>
            ) : (
              <div className="space-y-1">
                {historyList.map((item, i) => (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.02 }}
                    onClick={() => {
                      if (onHistorySelect) onHistorySelect(item)
                      onClose()
                    }}
                    className="w-full text-left p-2.5 rounded-lg hover:bg-indigo-500/10 border border-transparent hover:border-indigo-500/20 transition-all text-xs group"
                  >
                    <div className="flex items-start gap-2">
                      <MessageSquare className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-300 group-hover:text-white font-medium truncate">
                          {item.query_text}
                        </p>
                        <p className="text-[10px] text-slate-600 mt-1">
                          {new Date(item.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Pro / Downgrade CTA ── */}
      <div className="px-4 pb-3 shrink-0">
        {!user?.is_pro ? (
          <motion.button
            onClick={handleTogglePro}
            disabled={togglingPro}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="w-full bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-500/25 hover:border-amber-500/40 rounded-xl px-4 py-3 text-left transition-all"
          >
            <div className="flex items-center gap-2 mb-0.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-semibold text-amber-300">
                {togglingPro ? 'Switching…' : 'Upgrade to Pro — Free'}
              </span>
            </div>
            <p className="text-xs text-amber-400/50 ml-5">Unlimited queries + SC precedents</p>
          </motion.button>
        ) : (
          <button
            onClick={handleTogglePro}
            disabled={togglingPro}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs text-slate-400 hover:text-slate-200 bg-white/4 hover:bg-white/8 border border-white/6 rounded-xl transition-all font-medium"
          >
            <ArrowDownCircle className="w-3.5 h-3.5 text-slate-400" />
            {togglingPro ? 'Switching…' : 'Switch to Free Plan (5 queries/day)'}
          </button>
        )}
      </div>

      {/* ── Logout ── */}
      <div className="px-4 pb-4 pt-1 border-t border-indigo-500/8 shrink-0">
        <button
          onClick={onLogout}
          className="flex items-center gap-2 text-xs text-slate-500 hover:text-red-400 transition-colors px-2 py-2 rounded-lg hover:bg-red-500/6 w-full"
        >
          <LogOut className="w-3.5 h-3.5" /> Sign out
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop: fixed */}
      <aside className="hidden lg:flex w-64 flex-col glass border-r border-indigo-500/10 h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* Mobile: slide-in overlay */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              onClick={onClose}
            />
            <motion.aside
              key="sidebar"
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed left-0 top-0 bottom-0 w-72 glass z-50 lg:hidden flex flex-col border-r border-indigo-500/10"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
