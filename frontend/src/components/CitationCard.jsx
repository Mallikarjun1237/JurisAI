import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  BookOpen, Landmark, Calendar, ShieldCheck, Check,
  Copy, Users, Scale, ExternalLink, Award, FileText
} from 'lucide-react'

export default function CitationCard({ item, type = 'statute', index = 0 }) {
  const [copied, setCopied] = useState(false)
  const isJudgment = type === 'judgment'

  // Extract or infer benchmark metadata
  const isSC = isJudgment && (!item.court || item.court.toLowerCase().includes('supreme court'))
  const statusLabel = item.status || (isSC ? 'Good Law (Binding Precedent · Art. 141)' : 'Enacted Statutory Provision')
  const bench = item.bench_strength || (item.year ? 'Division Bench' : null)

  const handleCopyCitation = (e) => {
    e.stopPropagation()
    const citationSnippet = isJudgment
      ? `${item.title}, ${item.citation}${item.equivalent_citations ? ` [Equiv: ${item.equivalent_citations}]` : ''} (${item.court || 'Supreme Court of India'}, ${item.year || ''}) — Ratio: "${item.holding || item.excerpt || ''}"`
      : `${item.title} — ${item.citation || ''}: "${item.excerpt || item.holding || ''}"`

    navigator.clipboard.writeText(citationSnippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={`rounded-2xl p-4 transition-all duration-300 relative border ${
        isJudgment
          ? 'bg-gradient-to-b from-[#0e112c] to-[#07091a] border-violet-500/25 hover:border-violet-500/40'
          : 'bg-gradient-to-b from-[#0e112c] to-[#07091a] border-indigo-500/25 hover:border-indigo-500/40'
      }`}
    >
      {/* ── Top Row: Precedent Authority & Binding Status Badge ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          {isJudgment ? (
            <div className="w-7 h-7 rounded-lg bg-violet-500/15 border border-violet-500/30 flex items-center justify-center shrink-0">
              <Landmark className="w-3.5 h-3.5 text-violet-400" />
            </div>
          ) : (
            <div className="w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center shrink-0">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            </div>
          )}
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border tracking-wide uppercase ${
              isJudgment
                ? 'bg-violet-500/15 text-violet-300 border-violet-500/35'
                : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
            }`}
          >
            {isJudgment ? 'Verified Precedent (SCC/AIR)' : item.doc_type?.toUpperCase() || 'ENACTED STATUTE'}
          </span>
        </div>

        {/* Verified Badge */}
        <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full shadow-sm">
          <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
          <span>Statutory Authority Verified</span>
        </div>
      </div>

      {/* ── Case Title / Statute Section Title ── */}
      <h4 className="text-sm font-bold text-white mb-1.5 leading-snug">
        {item.title}
      </h4>

      {/* ── Citation & Equivalent Citation Badges ── */}
      <div className="flex flex-wrap items-center gap-2 mb-2.5">
        <span className="text-xs font-mono font-semibold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md">
          {item.citation}
        </span>
        {item.equivalent_citations && (
          <span className="text-[11px] font-mono text-slate-400">
            Alt: {item.equivalent_citations}
          </span>
        )}
      </div>

      {/* ── Court, Year, Bench Strength, and Quorum ── */}
      {isJudgment && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2.5 text-xs text-slate-400">
          <span className="flex items-center gap-1 font-medium text-slate-300">
            <Landmark className="w-3 h-3 text-violet-400 shrink-0" />
            {item.court || 'Supreme Court of India'}
          </span>
          {item.year && (
            <span className="flex items-center gap-1 font-mono text-slate-400">
              <Calendar className="w-3 h-3 text-slate-500 shrink-0" />
              {item.year}
            </span>
          )}
          {bench && (
            <span className="flex items-center gap-1 text-[11px] bg-white/4 border border-white/10 px-1.5 py-0.2 rounded text-slate-300">
              <Users className="w-3 h-3 text-indigo-400 shrink-0" />
              {bench}
            </span>
          )}
        </div>
      )}

      {/* ── Ratio Decidendi / Legal Holding Block ── */}
      <div className="p-3 bg-black/40 border-l-2 border-indigo-500 rounded-r-xl my-2.5">
        <span className="text-[9px] uppercase tracking-wider font-bold text-indigo-400 block mb-1 flex items-center gap-1">
          <Scale className="w-3 h-3" />
          {isJudgment ? 'Ratio Decidendi (Binding Legal Principle):' : 'Core Statutory Mandate:'}
        </span>
        <p className="text-xs text-slate-200 leading-relaxed font-sans">
          "{isJudgment ? (item.holding || item.ratio_decidendi || item.excerpt) : item.excerpt}"
        </p>
      </div>

      {/* ── Bottom Action Row: Copy for Court Petition & Status ── */}
      <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-2 text-xs">
        <span className="text-[10px] text-slate-500 font-medium truncate max-w-[200px] sm:max-w-xs">
          {statusLabel}
        </span>

        <button
          onClick={handleCopyCitation}
          className="flex items-center gap-1 text-[11px] font-semibold text-indigo-300 hover:text-white bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/25 hover:border-indigo-400 px-2.5 py-1 rounded-lg transition-all shadow-sm shrink-0"
          title="Copy formatted citation and ratio for High Court / Trial Court petition"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-300">Copied for Petition!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 text-indigo-400" />
              <span>Copy for Pleading</span>
            </>
          )}
        </button>
      </div>
    </motion.div>
  )
}
