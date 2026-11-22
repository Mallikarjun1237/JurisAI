/**
 * ContractAuditModal — Grounded Statutory Contract Clause & Loophole Auditor
 * Analyzes uploaded agreements against enacted Indian statutes:
 * - Indian Contract Act, 1872 (Sec 23, 27, 28, 73, 74)
 * - Arbitration and Conciliation Act, 1996 (Sec 12(5), Perkins Eastman)
 * - Consumer Protection Act, 2019 (Sec 2(46) Unfair Terms)
 * - DPDP Act, 2023 (Data Privacy Violations)
 * Provides quoted excerpts, SC precedent ratios, and attorney's recommended redline amendments.
 */
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, ShieldAlert, ShieldCheck, AlertTriangle, Scale,
  BookOpen, Check, Copy, Printer, FileText, ChevronDown,
  Sparkles, AlertCircle, ArrowRight, CornerDownRight, Info,
} from 'lucide-react'

export default function ContractAuditModal({ isOpen, onClose, auditData }) {
  const [copiedIndex, setCopiedIndex] = useState(null)
  const [copiedFull, setCopiedFull] = useState(false)

  if (!isOpen || !auditData) return null

  const clauses = auditData.audited_clauses || []
  const score = auditData.overall_health_score || 0
  const isHealthy = score >= 80
  const isModerate = score >= 60 && score < 80

  const handleCopyAmendment = (amendmentText, idx) => {
    navigator.clipboard.writeText(amendmentText)
    setCopiedIndex(idx)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const handleCopyFullAudit = () => {
    const text = `================================================
JURISAI CONTRACT CLAUSE RISK AUDIT REPORT
Document: ${auditData.document_name}
Overall Safety Score: ${score}/100 (${auditData.statutory_compliance_badge})
Critical Void Clauses: ${auditData.critical_risks_count}
High Risk Clauses: ${auditData.high_risks_count}
Moderate Risk Clauses: ${auditData.moderate_risks_count}
================================================
EXECUTIVE RISK SUMMARY:
${auditData.risk_summary}
================================================
AUDITED CLAUSES & ENFORCEABILITY ANALYSIS:

${clauses.map((c, i) => `[CLAUSE ${i + 1}] ${c.clause_title} (${c.risk_level})
QUOTED EXCERPT: "${c.quoted_excerpt}"
GOVERNING STATUTE: ${c.governing_statute}
JUDICIAL PRECEDENT: ${c.precedent_authority}
DANGER / LIABILITY: ${c.why_it_is_dangerous}
RECOMMENDED SAFE AMENDMENT:
${c.recommended_amendment}
------------------------------------------------`).join('\n\n')}

JurisAI Supreme Court & High Court Statutory Audit Suite`

    navigator.clipboard.writeText(text)
    setCopiedFull(true)
    setTimeout(() => setCopiedFull(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 14 }}
        className="relative w-full max-w-4xl bg-gradient-to-b from-[#141635] via-[#0c0e25] to-[#070818] border-2 border-indigo-500/50 rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95),0_0_45px_rgba(99,102,241,0.35)] ring-2 ring-indigo-400/20 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-indigo-500/15 bg-white/3 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-white shadow-lg shrink-0 ${
              auditData.critical_risks_count > 0
                ? 'bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/30'
                : 'bg-gradient-to-br from-indigo-500 to-violet-600 shadow-indigo-600/30'
            }`}>
              <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base md:text-lg font-bold text-white tracking-wide truncate">
                  Contract Clause Risk Audit
                </h2>
                <span className={`text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full font-bold border shrink-0 ${
                  auditData.critical_risks_count > 0
                    ? 'bg-red-500/15 border-red-500/30 text-red-300'
                    : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                }`}>
                  {auditData.statutory_compliance_badge || 'AUDITED'}
                </span>
              </div>
              <p className="hidden sm:block text-xs text-slate-400 truncate">
                Audited against Indian Contract Act 1872, Arbitration Act 1996, and Supreme Court precedent benchmarks
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-2.5 sm:px-3 py-1.5 rounded-xl transition-all"
              title="Print statutory audit report"
            >
              <Printer className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span className="hidden sm:inline">Print Audit</span>
              <span className="sm:hidden">Print</span>
            </button>

            <button
              onClick={handleCopyFullAudit}
              className="hidden sm:flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-xl transition-all"
            >
              {copiedFull ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-indigo-400" />}
              <span>{copiedFull ? 'Copied Report' : 'Copy Full Audit'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">

          {/* 1. Score & Metrics Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            {/* Safety Score Card (4 Cols) */}
            <div className="sm:col-span-4 bg-[#0d1029] border border-white/10 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Document Health
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className={`text-3xl font-black font-mono ${
                    isHealthy ? 'text-emerald-400' : isModerate ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    {score}
                  </span>
                  <span className="text-xs text-slate-500">/ 100</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {isHealthy ? 'Enforceable & Fair' : isModerate ? 'Moderate Liability Traps' : 'Contains Void Clauses'}
                </p>
              </div>

              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${
                isHealthy
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : isModerate
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  : 'bg-red-500/10 border-red-500/30 text-red-400'
              }`}>
                {isHealthy ? <ShieldCheck className="w-7 h-7" /> : <ShieldAlert className="w-7 h-7" />}
              </div>
            </div>

            {/* Metrics Breakdown (8 Cols) */}
            <div className="sm:col-span-8 grid grid-cols-3 gap-3">
              <div className="bg-[#0d1029] border border-red-500/20 rounded-2xl p-3 text-center">
                <span className="text-[10px] text-red-300 uppercase font-bold tracking-wider block">
                  Critical Void
                </span>
                <span className="text-2xl font-black text-red-400 font-mono mt-1 block">
                  {auditData.critical_risks_count}
                </span>
                <span className="text-[9px] text-slate-500">Unenforceable by law</span>
              </div>

              <div className="bg-[#0d1029] border border-amber-500/20 rounded-2xl p-3 text-center">
                <span className="text-[10px] text-amber-300 uppercase font-bold tracking-wider block">
                  High Risk
                </span>
                <span className="text-2xl font-black text-amber-400 font-mono mt-1 block">
                  {auditData.high_risks_count}
                </span>
                <span className="text-[9px] text-slate-500">Grossly one-sided</span>
              </div>

              <div className="bg-[#0d1029] border border-indigo-500/20 rounded-2xl p-3 text-center">
                <span className="text-[10px] text-indigo-300 uppercase font-bold tracking-wider block">
                  Moderate Risk
                </span>
                <span className="text-2xl font-black text-indigo-400 font-mono mt-1 block">
                  {auditData.moderate_risks_count}
                </span>
                <span className="text-[9px] text-slate-500">Ambiguous clauses</span>
              </div>
            </div>
          </div>

          {/* 2. Executive Risk Summary */}
          {auditData.risk_summary && (
            <div className="bg-white/3 border border-white/8 rounded-2xl p-4 text-xs text-slate-300 leading-relaxed flex items-start gap-3">
              <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-white block mb-0.5">Auditor's Executive Summary:</span>
                <p>{auditData.risk_summary}</p>
              </div>
            </div>
          )}

          {/* 3. Detailed Audited Clauses List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs uppercase font-bold tracking-wider text-slate-400 flex items-center gap-2">
                <Scale className="w-3.5 h-3.5 text-indigo-400" />
                <span>Identified Clauses & Enforceability Assessment ({clauses.length})</span>
              </h3>
              <span className="text-[11px] text-slate-500">Grounded in Supreme Court of India precedents</span>
            </div>

            {clauses.length === 0 ? (
              <div className="p-8 text-center bg-[#0d1029] border border-white/5 rounded-2xl">
                <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-white">No Void or High-Risk Clauses Detected</p>
                <p className="text-xs text-slate-400 mt-1">This agreement appears compliant with standard Indian statutory norms.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {clauses.map((clause, idx) => {
                  const isCritical = clause.risk_level?.includes('CRITICAL') || clause.risk_level?.includes('VOID')
                  const isHigh = clause.risk_level?.includes('HIGH')

                  return (
                    <div
                      key={idx}
                      className={`rounded-2xl border p-4.5 space-y-3 transition-all ${
                        isCritical
                          ? 'bg-red-950/20 border-red-500/35 shadow-lg shadow-red-950/20'
                          : isHigh
                          ? 'bg-amber-950/20 border-amber-500/35 shadow-lg shadow-amber-950/20'
                          : 'bg-[#0d1029] border-white/10'
                      }`}
                    >
                      {/* Clause Title & Risk Tag */}
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${
                            isCritical ? 'bg-red-500 animate-pulse' : isHigh ? 'bg-amber-400' : 'bg-indigo-400'
                          }`} />
                          <h4 className="text-sm font-bold text-white tracking-wide">
                            {clause.clause_title}
                          </h4>
                        </div>

                        <span className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border ${
                          isCritical
                            ? 'bg-red-500/20 border-red-500/40 text-red-300'
                            : isHigh
                            ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                            : 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                        }`}>
                          {isCritical ? 'VOID AB INITIO (ILLEGAL)' : isHigh ? 'HIGH RISK CLAUSE' : 'ADVISORY RISK'}
                        </span>
                      </div>

                      {/* Quoted Excerpt from document */}
                      {clause.quoted_excerpt && (
                        <div className="p-3 bg-black/40 border border-white/8 rounded-xl">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1">
                            Quoted Clause from Document:
                          </span>
                          <p className="text-xs text-slate-300 font-serif italic leading-relaxed">
                            "{clause.quoted_excerpt}"
                          </p>
                        </div>
                      )}

                      {/* Statutory & Precedent Audit Badges */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 bg-white/3 border border-white/6 rounded-xl">
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
                            Enacted Indian Statute:
                          </span>
                          <span className="font-semibold text-indigo-300 text-[11px] block mt-0.5">
                            {clause.governing_statute}
                          </span>
                        </div>

                        <div className="p-2.5 bg-white/3 border border-white/6 rounded-xl">
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
                            Supreme Court Precedent Ratio:
                          </span>
                          <span className="font-semibold text-purple-300 text-[11px] block mt-0.5 truncate">
                            {clause.precedent_authority}
                          </span>
                        </div>
                      </div>

                      {/* Real World Danger / Legal Consequence */}
                      {clause.why_it_is_dangerous && (
                        <div className="text-xs text-slate-300 leading-relaxed flex items-start gap-2">
                          <AlertTriangle className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                            isCritical ? 'text-red-400' : 'text-amber-400'
                          }`} />
                          <p>
                            <strong className="text-white">Why This Is Dangerous: </strong>
                            {clause.why_it_is_dangerous}
                          </p>
                        </div>
                      )}

                      {/* Recommended Attorney Redline Amendment */}
                      {clause.recommended_amendment && (
                        <div className="p-3.5 bg-emerald-950/25 border border-emerald-500/30 rounded-xl space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1.5">
                              <Sparkles className="w-3 h-3 text-emerald-400" />
                              <span>Attorney's Recommended Safe Amendment (Redline):</span>
                            </span>

                            <button
                              onClick={() => handleCopyAmendment(clause.recommended_amendment, idx)}
                              className="text-[11px] text-emerald-300 hover:text-white bg-emerald-500/15 hover:bg-emerald-500/30 border border-emerald-500/30 px-2 py-0.5 rounded-lg transition-all flex items-center gap-1"
                            >
                              {copiedIndex === idx ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-300" />
                                  <span>Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3 text-emerald-400" />
                                  <span>Copy Safe Clause</span>
                                </>
                              )}
                            </button>
                          </div>

                          <p className="text-xs font-mono text-emerald-200 leading-relaxed bg-black/30 p-2.5 rounded-lg border border-emerald-500/15">
                            {clause.recommended_amendment}
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-black/40 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5 text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Strict Indian Statutory Groundedness Verified · Non-Binding Legal Advisory</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all"
          >
            Close Audit
          </button>
        </div>
      </motion.div>
    </div>
  )
}
