import React from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Landmark, Calendar } from 'lucide-react'

export default function CitationCard({ item, type = 'statute', index = 0 }) {
  const isJudgment = type === 'judgment'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="glass-card rounded-xl p-4 hover:border-indigo-500/28 transition-all duration-300"
    >
      {/* Header row */}
      <div className="flex items-center gap-2 mb-2.5">
        {isJudgment ? (
          <div className="w-7 h-7 rounded-lg bg-violet-500/12 border border-violet-500/20 flex items-center justify-center shrink-0">
            <Landmark className="w-3.5 h-3.5 text-violet-400" />
          </div>
        ) : (
          <div className="w-7 h-7 rounded-lg bg-indigo-500/12 border border-indigo-500/20 flex items-center justify-center shrink-0">
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
          </div>
        )}
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
            isJudgment
              ? 'bg-violet-500/8 text-violet-400 border-violet-500/20'
              : 'bg-indigo-500/8 text-indigo-400 border-indigo-500/20'
          }`}
        >
          {isJudgment ? 'JUDGMENT' : item.doc_type?.toUpperCase() || 'STATUTE'}
        </span>
      </div>

      {/* Title */}
      <h4 className="text-sm font-semibold text-white mb-1 leading-snug">{item.title}</h4>

      {/* Citation badge */}
      <p className="text-xs font-mono text-indigo-300/60 mb-2.5 leading-tight">{item.citation}</p>

      {/* Court + Year (for judgments) */}
      {isJudgment && (item.court || item.year) && (
        <div className="flex items-center gap-3 mb-2.5 text-xs text-slate-500">
          {item.court && (
            <span className="flex items-center gap-1">
              <Landmark className="w-3 h-3" />
              {item.court}
            </span>
          )}
          {item.year && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {item.year}
            </span>
          )}
        </div>
      )}

      {/* Excerpt / Holding */}
      <p className="text-xs text-slate-400 leading-relaxed">
        {isJudgment ? item.holding : item.excerpt}
      </p>
    </motion.div>
  )
}
