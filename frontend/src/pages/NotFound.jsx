import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Scale, ArrowLeft, Home, MessageSquare, BookOpen, Clock } from 'lucide-react'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#070714] flex items-center justify-center p-6 text-slate-100 relative overflow-hidden">
      {/* Background ambient radial glow */}
      <div className="absolute inset-0 bg-radial-glow pointer-events-none opacity-60" />

      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-lg w-full glass-card rounded-3xl p-8 sm:p-10 border border-indigo-500/25 shadow-2xl relative z-10 text-center space-y-6"
      >
        {/* Crest & 404 Badge */}
        <div className="relative inline-flex items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-xl shadow-indigo-600/10">
            <Scale className="w-8 h-8" />
          </div>
          <span className="absolute -top-2 -right-3 px-2 py-0.5 rounded-full bg-indigo-500 text-white font-mono text-[11px] font-bold shadow-md shadow-indigo-500/30">
            404
          </span>
        </div>

        {/* Header & Reassuring Guidance */}
        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Case Record or Page Not Found
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm mx-auto">
            The requested judicial record, legal docket, or route could not be located in the JurisAI active registry. It may have been moved, renamed, or temporarily archived.
          </p>
        </div>

        {/* Quick Navigation Cards */}
        <div className="grid grid-cols-2 gap-2.5 text-left pt-2">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-3 rounded-xl bg-white/4 hover:bg-white/8 border border-white/10 hover:border-indigo-500/30 transition-all group flex items-start gap-2.5"
          >
            <Home className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
            <div>
              <div className="text-xs font-bold text-white">Research Hub</div>
              <div className="text-[10px] text-slate-400">Statutory co-pilot</div>
            </div>
          </button>

          <button
            onClick={() => navigate('/case-chat')}
            className="p-3 rounded-xl bg-white/4 hover:bg-white/8 border border-white/10 hover:border-indigo-500/30 transition-all group flex items-start gap-2.5"
          >
            <MessageSquare className="w-4 h-4 text-violet-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
            <div>
              <div className="text-xs font-bold text-white">Assistant Chat</div>
              <div className="text-[10px] text-slate-400">Document analysis</div>
            </div>
          </button>

          <button
            onClick={() => navigate('/precedents')}
            className="p-3 rounded-xl bg-white/4 hover:bg-white/8 border border-white/10 hover:border-indigo-500/30 transition-all group flex items-start gap-2.5"
          >
            <BookOpen className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
            <div>
              <div className="text-xs font-bold text-white">Precedents</div>
              <div className="text-[10px] text-slate-400">Landmark SC rulings</div>
            </div>
          </button>

          <button
            onClick={() => navigate('/limitation-chronology')}
            className="p-3 rounded-xl bg-white/4 hover:bg-white/8 border border-white/10 hover:border-indigo-500/30 transition-all group flex items-start gap-2.5"
          >
            <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
            <div>
              <div className="text-xs font-bold text-white">Limitation Calc</div>
              <div className="text-[10px] text-slate-400">Statutory deadlines</div>
            </div>
          </button>
        </div>

        {/* Primary Call to Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3 justify-center pt-2">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Return to Dashboard</span>
          </button>

          <button
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-white/10 transition-all flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Go Back</span>
          </button>
        </div>

        {/* Privacy & Security reassurance footer */}
        <div className="pt-2 border-t border-white/5 text-[11px] text-slate-500 font-mono">
          JurisAI Sovereign Legal Intelligence · All sessions encrypted & preserved
        </div>
      </motion.div>
    </div>
  )
}
