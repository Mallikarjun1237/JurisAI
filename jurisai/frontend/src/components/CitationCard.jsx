import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  BookOpen, Landmark, Calendar, ShieldCheck, Check,
  Copy, Users, Scale
} from 'lucide-react'

export default function CitationCard({ item, type = 'statute', index = 0 }) {
  const [copied, setCopied] = useState(false)
  const isJudgment = type === 'judgment'

  const isSC = isJudgment && (!item.court || item.court.toLowerCase().includes('supreme court'))
  const statusLabel = item.status || (isSC ? 'Binding Precedent · Art. 141' : 'Enacted Statute')

  const handleCopyCitation = (e) => {
    e.stopPropagation()
    const citationSnippet = isJudgment
      ? `${item.title}, ${item.citation} (${item.court || 'Supreme Court of India'}, ${item.year || ''}) — Ratio: "${item.holding || item.excerpt || ''}"`
      : `${item.title} — ${item.citation || ''}: "${item.excerpt || item.holding || ''}"`

    navigator.clipboard.writeText(citationSnippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.2 }}
      className={`rounded-xl p-3 sm:p-3.5 transition-all duration-200 relative border ${
        isJudgment
          ? 'bg-gradient-to-b from-[#0e112c] to-[#07091a] border-violet-500/25 hover:border-violet-500/40'
          : 'bg-gradient-to-b from-[#0e112c] to-[#07091a] border-indigo-500/20 hover:border-indigo-500/35'
      }`}
    >
      {/* ── Compact Header: Type Tag & Authority ── */}
      <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
        <div className="flex items-center gap-1.5">
          {isJudgment ? (
            <Landmark className="w-3.5 h-3.5 text-violet-400 shrink-0" />
          ) : (
            <BookOpen className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          )}
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border tracking-wide uppercase ${
              isJudgment
                ? 'bg-violet-500/15 text-violet-300 border-violet-500/30'
                : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/25'
            }`}
          >
            {isJudgment ? 'Precedent' : item.doc_type?.toUpperCase() || 'STATUTE'}
          </span>
          <span className="text-[11px] font-mono font-semibold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">
            {item.citation}
          </span>
        </div>

        <div className="flex items-center gap-1 text-[10px] font-medium text-emerald-300/90 bg-emerald-950/40 border border-emerald-500/20 px-2 py-0.5 rounded-full">
          <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
          <span>Verified</span>
        </div>
      </div>

      {/* ── Section / Case Title ── */}
      <h4 className="text-xs sm:text-sm font-semibold text-white mb-1 leading-snug">
        {item.title}
      </h4>

      {/* ── Compact Quote (Clamped to 2 lines to save vertical space) ── */}
      <div className="py-1.5 px-2.5 bg-black/30 border-l-2 border-indigo-500/70 rounded-r-lg my-1.5">
        <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed font-sans line-clamp-2">
          "{isJudgment ? (item.holding || item.ratio_decidendi || item.excerpt) : item.excerpt}"
        </p>
      </div>

      {/* ── Compact Footer Row: Copy Button ── */}
      <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[11px]">
        <span className="text-[10px] text-slate-500 truncate max-w-[180px] sm:max-w-xs">
          {statusLabel}
        </span>

        <button
          onClick={handleCopyCitation}
          className="flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-indigo-300 hover:text-white bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 px-2 py-0.5 rounded transition-all shrink-0"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-300">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 text-indigo-400" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
    </motion.div>
  )
}
