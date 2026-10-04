import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Scale, Search, X, ArrowRight, ShieldAlert,
  BookOpen, Check, Copy, AlertCircle, FileText,
} from 'lucide-react'
import { BNS_TRANSITION_DATA } from '../data/bnsMappings'

export default function BNSConverterModal({ isOpen, onClose }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [copiedId, setCopiedId] = useState(null)

  const categories = ['All', 'BNS vs IPC', 'BNSS vs CrPC', 'BSA vs Evidence Act']

  const filteredData = useMemo(() => {
    return BNS_TRANSITION_DATA.filter((item) => {
      const matchesCat = activeCategory === 'All' || item.category === activeCategory
      const query = searchTerm.toLowerCase().trim()
      if (!query) return matchesCat

      const matchesSearch =
        item.offence.toLowerCase().includes(query) ||
        item.oldAct.toLowerCase().includes(query) ||
        item.newAct.toLowerCase().includes(query) ||
        item.keyChange.toLowerCase().includes(query) ||
        item.punishment.toLowerCase().includes(query)

      return matchesCat && matchesSearch
    })
  }, [searchTerm, activeCategory])

  const handleCopy = (item, idx) => {
    const text = `[Legal Reference] ${item.offence} — Old Law: ${item.oldAct} | New Law: ${item.newAct} (${item.punishment})`
    navigator.clipboard.writeText(text)
    setCopiedId(idx)
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/75 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 16 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-4xl bg-[#0c0d1e] border border-indigo-500/25 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-indigo-500/15 bg-indigo-950/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                <Scale className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white flex items-center gap-1.5">
                    <span>IPC</span>
                    <span className="text-indigo-400 font-bold">⇄</span>
                    <span>BNS Statutory Law Converter</span>
                  </h2>
                  <span className="text-[10px] bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold px-2 py-0.5 rounded-full">
                    Official Reform 2024–2026
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Government of India statutory concordance table for BNS, BNSS & BSA
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search & Category Filter Toolbar */}
          <div className="p-5 border-b border-white/5 bg-[#0a0a1a] space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by section (e.g. 420, 302, 318) or offence (e.g. cheating, theft, bail, murder)..."
                className="w-full bg-[#12132a] border border-indigo-500/20 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Category tabs */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    activeCategory === cat
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                      : 'bg-white/4 text-slate-400 hover:text-white border border-white/6'
                  }`}
                >
                  {cat === 'All' ? 'All Transitions' : cat}
                </button>
              ))}
              <span className="ml-auto text-xs text-slate-500 self-center">
                Showing {filteredData.length} statutory mappings
              </span>
            </div>
          </div>

          {/* Cards List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3.5 divide-y divide-white/5">
            {filteredData.length === 0 ? (
              <div className="text-center py-16">
                <AlertCircle className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                <p className="text-sm text-slate-400 font-medium">No matching legal provisions found</p>
                <p className="text-xs text-slate-600 mt-1">
                  Try searching for another section number, crime name, or select "All Transitions".
                </p>
              </div>
            ) : (
              filteredData.map((item, idx) => (
                <motion.div
                  key={`${item.newAct}-${idx}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  className="pt-3 first:pt-0"
                >
                  <div className="bg-[#101229] border border-white/8 rounded-xl p-4 hover:border-indigo-500/30 transition-all group">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Old Act Badge */}
                        <div className="bg-red-500/10 border border-red-500/25 px-2.5 py-1 rounded-md text-red-300 font-mono text-xs font-semibold flex items-center gap-1.5">
                          <span className="text-[10px] text-red-400 uppercase tracking-wider">Old:</span>
                          {item.oldAct}
                        </div>

                        <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />

                        {/* New Act Badge */}
                        <div className="bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 rounded-md text-emerald-300 font-mono text-xs font-bold flex items-center gap-1.5">
                          <span className="text-[10px] text-emerald-400 uppercase tracking-wider">New:</span>
                          {item.newAct}
                        </div>

                        <span className="text-[10px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-full font-medium">
                          {item.category}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 self-end sm:self-auto">
                        <button
                          onClick={() => handleCopy(item, idx)}
                          title="Copy Citation"
                          className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white px-2.5 py-1 rounded-md bg-white/4 hover:bg-white/8 border border-white/6 transition-all"
                        >
                          {copiedId === idx ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <h3 className="text-sm font-semibold text-white mb-2 leading-snug">
                      {item.offence}
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2 border-y border-white/5 text-xs text-slate-300 mb-2.5">
                      <div>
                        <span className="text-slate-500 text-[11px] block">Punishment:</span>
                        <span className="font-medium text-slate-200">{item.punishment}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[11px] block">Bailability:</span>
                        <span
                          className={`font-medium ${
                            item.bailability.includes('Non-Bailable') ? 'text-red-400' : 'text-emerald-400'
                          }`}
                        >
                          {item.bailability}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[11px] block">Cognizability:</span>
                        <span className="font-medium text-slate-300">{item.cognizability}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed flex items-start gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-slate-300">Statutory Reform Note: </strong>
                        {item.keyChange}
                      </span>
                    </p>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Footer note */}
          <div className="px-6 py-3.5 border-t border-white/5 bg-[#090a16] flex items-center justify-between text-xs text-slate-500">
            <span>Enacted under Acts 45, 46 & 47 of 2023, Ministry of Home Affairs, Govt. of India.</span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium text-xs transition-colors"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
