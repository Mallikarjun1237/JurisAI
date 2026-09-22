import React from 'react'
import { motion } from 'framer-motion'
import { Zap, Shield } from 'lucide-react'

export default function PlanBadge({ isPro }) {
  if (isPro) {
    return (
      <motion.span
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-400 shrink-0"
      >
        <Zap className="w-3 h-3" />
        PRO
      </motion.span>
    )
  }
  return (
    <motion.span
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-800/60 border border-slate-700/40 text-slate-400 shrink-0"
    >
      <Shield className="w-3 h-3" />
      FREE
    </motion.span>
  )
}
