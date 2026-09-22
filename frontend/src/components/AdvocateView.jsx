import React from 'react'
import { motion } from 'framer-motion'
import { Landmark, BookOpen, Activity, Lock } from 'lucide-react'
import CitationCard from './CitationCard'

export default function AdvocateView({ data, isPro }) {
  if (!data) return null

  const confidencePct = Math.round((data.confidence_score || 0) * 100)
  const confidenceColor =
    confidencePct >= 70 ? 'text-emerald-400' : confidencePct >= 40 ? 'text-amber-400' : 'text-red-400'
  const barColor =
    confidencePct >= 70 ? 'bg-emerald-500' : confidencePct >= 40 ? 'bg-amber-500' : 'bg-red-500'
  const confidenceLabel =
    confidencePct >= 70 ? 'High Confidence' : confidencePct >= 40 ? 'Moderate' : 'Low Match'

  return (
    <motion.div
      key="advocate"
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-4"
    >
      {/* Confidence Score Card */}
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/12 border border-indigo-500/20 flex items-center justify-center">
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <h3 className="text-sm font-semibold text-white">Retrieval Confidence</h3>
          <span
            className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full border ${
              confidencePct >= 70
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : confidencePct >= 40
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                : 'bg-red-500/10 text-red-400 border-red-500/20'
            }`}
          >
            {confidenceLabel}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1 h-2 bg-slate-800/80 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${barColor}`}
              initial={{ width: 0 }}
              animate={{ width: `${confidencePct}%` }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
            />
          </div>
          <span className={`text-sm font-bold font-mono w-10 text-right ${confidenceColor}`}>
            {confidencePct}%
          </span>
        </div>
        <p className="text-xs text-slate-600 mt-2">
          Semantic similarity score between your query and the retrieved legal corpus entries.
        </p>
      </div>

      {/* Applicable Statutes */}
      {data.applicable_statutes?.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-slate-300">
              Applicable Statutes
              <span className="ml-2 text-xs text-slate-600 font-normal">
                ({data.applicable_statutes.length})
              </span>
            </h3>
          </div>
          <div className="grid gap-3">
            {data.applicable_statutes.map((s, i) => (
              <CitationCard key={`statute-adv-${i}`} item={s} type="statute" index={i} />
            ))}
          </div>
        </div>
      )}

      {/* Case Precedents */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Landmark className="w-4 h-4 text-violet-400" />
          <h3 className="text-sm font-semibold text-slate-300">Supreme Court Precedents</h3>
          {!isPro && (
            <span className="ml-auto text-xs text-amber-400 bg-amber-500/8 border border-amber-500/20 px-2 py-0.5 rounded-full">
              Pro only
            </span>
          )}
        </div>

        {isPro && data.relevant_precedents?.length > 0 ? (
          <div className="grid gap-3">
            {data.relevant_precedents.map((p, i) => (
              <CitationCard key={`prec-${i}`} item={p} type="judgment" index={i} />
            ))}
          </div>
        ) : !isPro ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card rounded-xl p-6 flex flex-col items-center text-center gap-3 border-amber-500/12"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Lock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white mb-1">Unlock SC & HC Precedents</p>
              <p className="text-xs text-slate-400 max-w-xs">
                Upgrade to Pro for deep analysis with landmark Supreme Court and High Court judgments
                including citations, holdings, and year.
              </p>
            </div>
          </motion.div>
        ) : (
          <p className="text-sm text-slate-600 italic px-1">
            No directly relevant precedents found for this query in the corpus.
          </p>
        )}
      </div>
    </motion.div>
  )
}
