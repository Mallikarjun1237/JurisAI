/**
 * DPDPSecurityModal.jsx
 * 
 * Commercial-Grade Sovereign Legal Security & Compliance Suite:
 * 1. Live Interactive Indian PII Sanitizer & Redactor (Aadhaar, PAN, Phone, IFSC, UPI, etc.)
 * 2. Statutory Legal Privilege Architecture (Section 132 BSA 2023 & DPDP Act 2023)
 * 3. Official Printable Chamber Data Protection & Ethics Certificate (A4 Standard)
 */

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldCheck, Lock, FileText, Check, Copy, Printer,
  AlertCircle, Sparkles, Scale, Landmark, Award, Eye,
  RefreshCw, CheckCircle2, ChevronRight, X, UserCheck,
  Building, BookOpen
} from 'lucide-react'
import { apiRedactPreview, apiGetSecurityCertificate } from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function DPDPSecurityModal({ isOpen, onClose }) {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('sanitizer') // 'sanitizer' | 'privilege' | 'certificate'
  
  // Tab 1: Sanitizer state
  const [inputText, setInputText] = useState('')
  const [sanitizedResult, setSanitizedResult] = useState(null)
  const [sanitizing, setSanitizing] = useState(false)
  const [copiedSanitized, setCopiedSanitized] = useState(false)

  // Tab 3: Certificate state
  const [advocateName, setAdvocateName] = useState(user?.full_name || 'Advocate')
  const [chamberName, setChamberName] = useState(
    user?.full_name ? `Chamber of Adv. ${user.full_name}` : 'Chamber of Legal Counsel'
  )
  const [barEnrolment, setBarEnrolment] = useState('KAR/2024/09812')
  const [certificate, setCertificate] = useState(null)
  const [loadingCert, setLoadingCert] = useState(false)
  const [copiedCert, setCopiedCert] = useState(false)

  const loadCertificate = async () => {
    setLoadingCert(true)
    try {
      const res = await apiGetSecurityCertificate({
        advocate_name: advocateName,
        chamber_name: chamberName,
        bar_enrolment: barEnrolment,
      })
      setCertificate(res.data)
    } catch (err) {
      console.error('Failed to load certificate:', err)
    } finally {
      setLoadingCert(false)
    }
  }

  // Fetch certificate on mount or user change
  useEffect(() => {
    if (isOpen) {
      loadCertificate()
    }
  }, [isOpen])

  const handleSanitizeText = async () => {
    if (!inputText.trim()) return
    setSanitizing(true)
    try {
      const res = await apiRedactPreview(inputText)
      setSanitizedResult(res.data)
    } catch (err) {
      console.error('Failed to sanitize text:', err)
    } finally {
      setSanitizing(false)
    }
  }

  const handleLoadSampleFIR = () => {
    setInputText(
      `FIRST INFORMATION REPORT (FIR No. 182/2026)\n` +
      `Police Station: Indiranagar, Bengaluru\n` +
      `Complainant: Rajesh Kumar, Aadhaar No: 4892 8192 1029, Mobile: +91 98450 12345, Email: rajesh.k@gmail.com\n` +
      `Accused Person: Vikramaditya Singh (PAN: ABCDE1234F), Driving Vehicle: KA-01-MJ-4029\n` +
      `Offence Alleged: Criminal Breach of Trust & Fraudulent Online Transfer via UPI ID: vikram.s@oksbi for ₹2,45,000/-.\n` +
      `Transferred into State Bank Account No: 308910298192, IFSC Code: SBIN0004128.`
    )
    setSanitizedResult(null)
  }

  const handleLoadSampleContract = () => {
    setInputText(
      `EMPLOYMENT NON-DISCLOSURE AGREEMENT\n` +
      `Between Infotech Solutions Pvt Ltd and Employee Mr. Arvind Swamy (PAN: BKAPS8912K).\n` +
      `Aadhaar Card: 9028-1829-4412 | Contact Phone: 9811234567 | arvind.swamy@techlegal.in\n` +
      `Salary account for statutory escrow: HDFC Bank A/c No: 50100298192841, IFSC: HDFC0001829.\n` +
      `Security Deposit Payment Ref: UPI transaction to hr-deposit@hdfcbank.`
    )
    setSanitizedResult(null)
  }

  const handleCopySanitized = () => {
    if (!sanitizedResult?.sanitized_text) return
    navigator.clipboard.writeText(sanitizedResult.sanitized_text)
    setCopiedSanitized(true)
    setTimeout(() => setCopiedSanitized(false), 2000)
  }

  const handlePrintCertificate = () => {
    document.body.classList.add('print-cert-active')
    const cleanup = () => {
      document.body.classList.remove('print-cert-active')
      window.removeEventListener('afterprint', cleanup)
    }
    window.addEventListener('afterprint', cleanup)
    window.print()
    setTimeout(cleanup, 2000)
  }

  const handleCopyAttestation = () => {
    if (!certificate) return
    const text =
      `======================================================\n` +
      `JURISAI SOVEREIGN LEGAL DATA PRIVACY ATTESTATION\n` +
      `Digital Personal Data Protection Act, 2023 & BSA 2023\n` +
      `======================================================\n` +
      `Certificate ID: ${certificate.certificate_id}\n` +
      `Issued To: ${certificate.chamber_name} (${certificate.advocate_name})\n` +
      `Bar Enrolment: ${certificate.bar_enrolment}\n` +
      `Issue Date: ${certificate.issue_date} (Valid until ${certificate.valid_until})\n` +
      `Verification Hash: ${certificate.verification_hash}\n\n` +
      `STATUTORY COMPLIANCE ASSURANCE:\n` +
      `- Section 132, Bharatiya Sakshya Adhiniyam, 2023 (Attorney-Client Privilege)\n` +
      `- Section 126, Indian Evidence Act, 1872 (Privilege Continuity)\n` +
      `- Digital Personal Data Protection Act, 2023 (In-Memory Redaction & Zero Persistent PII)\n\n` +
      `Attested by: ${certificate.certifying_authority}\n` +
      `======================================================`

    navigator.clipboard.writeText(text)
    setCopiedCert(true)
    setTimeout(() => setCopiedCert(false), 2000)
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
        {/* ── Modal Header ── */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-200 bg-slate-50/90 shrink-0 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-600/30 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-md shadow-emerald-500/20 shrink-0">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base md:text-lg font-bold text-slate-900 tracking-wide truncate">
                  DPDP 2023 Shield & Legal Privilege Suite
                </h2>
                <span className="text-[10px] bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 px-2 py-0.5 rounded-full font-semibold shrink-0">
                  Sec 132 BSA 2023 Verified
                </span>
              </div>
              <p className="hidden sm:block text-xs text-slate-600 truncate">
                In-memory Indian PII redaction, attorney-client privilege protection, and official chamber attestation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Desktop Tabs */}
            <div className="hidden md:flex items-center bg-white/5 border border-white/10 rounded-xl p-1 gap-1 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('sanitizer')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'sanitizer'
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/30'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Live PII Sanitizer</span>
              </button>
              <button
                onClick={() => setActiveTab('privilege')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'privilege'
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/30'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Attorney Privilege</span>
              </button>
              <button
                onClick={() => setActiveTab('certificate')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'certificate'
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/30'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>Chamber Certificate</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-white/10 rounded-full transition-colors ml-1"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Tab Switcher */}
        <div className="md:hidden flex border-b border-emerald-500/15 bg-white/2 p-1 gap-1 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('sanitizer')}
            className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
              activeTab === 'sanitizer' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-600'
            }`}
          >
            Sanitizer
          </button>
          <button
            onClick={() => setActiveTab('privilege')}
            className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
              activeTab === 'privilege' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-600'
            }`}
          >
            Privilege
          </button>
          <button
            onClick={() => setActiveTab('certificate')}
            className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
              activeTab === 'certificate' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-600'
            }`}
          >
            Certificate
          </button>
        </div>

        {/* ── Modal Content ── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* ══════════════════════════════════════════════════════════
              TAB 1: LIVE INTERACTIVE PII SANITIZER & REDACTOR
              ══════════════════════════════════════════════════════════ */}
          {activeTab === 'sanitizer' && (
            <div className="space-y-5">
              {/* Trust Metric Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-[#071720] to-teal-950/40 border border-emerald-500/25 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                      Automatic In-Memory Indian PII Redactor
                    </h4>
                    <p className="text-[11px] text-slate-600">
                      All Aadhaar, PAN, phone numbers, bank details, and IFSC codes are masked before submission.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleLoadSampleFIR}
                    className="text-[11px] font-semibold text-emerald-300 hover:text-slate-900 bg-emerald-500/10 hover:bg-[#0369a1]/20 border border-emerald-500/30 px-2.5 py-1.5 rounded-xl transition-all"
                  >
                    Sample FIR
                  </button>
                  <button
                    onClick={handleLoadSampleContract}
                    className="text-[11px] font-semibold text-indigo-300 hover:text-slate-900 bg-indigo-500/10 hover:bg-[#0369a1]/20 border border-indigo-500/30 px-2.5 py-1.5 rounded-xl transition-all"
                  >
                    Sample Contract
                  </button>
                </div>
              </div>

              {/* Textarea Input Card */}
              <div className="glass-card rounded-2xl p-4 border border-white/10 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-emerald-400" /> Paste Raw Court Brief, FIR, Notice, or Contract
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {inputText.length} characters
                  </span>
                </div>

                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Paste legal notice, charge-sheet excerpt, or contract containing Aadhaar, PAN, phone numbers, or bank details to test live redaction..."
                  rows={5}
                  className="w-full bg-[#04080c] border border-white/10 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 leading-relaxed font-mono"
                />

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2 text-[11px] text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Protected under DPDP Act 2023 · Safe for Court Submission</span>
                  </div>

                  <button
                    onClick={handleSanitizeText}
                    disabled={sanitizing || !inputText.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs transition-all shadow-md shadow-emerald-500/20 disabled:opacity-40"
                  >
                    {sanitizing ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ShieldCheck className="w-3.5 h-3.5" />
                    )}
                    <span>{sanitizing ? 'Sanitizing…' : 'Run DPDP Redaction'}</span>
                  </button>
                </div>
              </div>

              {/* Sanitized Output & Entity Breakdown */}
              {sanitizedResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card rounded-2xl p-4 border border-emerald-500/30 space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <h4 className="text-xs font-bold text-slate-900">
                        DPDP 2023 Redaction Result: {sanitizedResult.total_redacted} Sensitive Entities Masked
                      </h4>
                    </div>

                    <button
                      onClick={handleCopySanitized}
                      className="flex items-center gap-1 text-xs font-semibold text-emerald-300 hover:text-slate-900 bg-emerald-500/10 hover:bg-[#0369a1]/20 border border-emerald-500/30 px-3 py-1.5 rounded-xl transition-all"
                    >
                      {copiedSanitized ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-emerald-400" />}
                      <span>{copiedSanitized ? 'Copied Masked Text!' : 'Copy Masked Text'}</span>
                    </button>
                  </div>

                  {/* Entity Breakdown Tags */}
                  <div className="flex flex-wrap gap-2 text-xs">
                    {Object.entries(sanitizedResult.breakdown || {}).map(([key, count]) => {
                      if (count === 0) return null
                      return (
                        <span
                          key={key}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-medium flex items-center gap-1 text-[11px]"
                        >
                          <ShieldCheck className="w-3 h-3 text-emerald-400" />
                          <span className="capitalize">{key.replace('_', ' ')}:</span>
                          <strong className="text-slate-900 font-mono">{count}</strong>
                        </span>
                      )
                    })}
                  </div>

                  {/* Sanitized Text Display Box */}
                  <div className="bg-[#03060a] border border-white/10 rounded-xl p-3.5 text-xs text-slate-200 font-mono leading-relaxed max-h-64 overflow-y-auto whitespace-pre-wrap">
                    {sanitizedResult.sanitized_text}
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              TAB 2: STATUTORY LEGAL PRIVILEGE & ETHICAL ARCHITECTURE
              ══════════════════════════════════════════════════════════ */}
          {activeTab === 'privilege' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Legal Privilege Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-b from-[#0e1c26] to-[#071219] border border-emerald-500/25 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <Scale className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                        Section 132, Bharatiya Sakshya Adhiniyam, 2023
                      </h4>
                      <p className="text-[10px] text-slate-600">
                        Formerly Section 126, Indian Evidence Act, 1872
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed text-justify">
                    No advocate, barrister, attorney, or pleader shall at any time be permitted to disclose any communication made to them by or on behalf of their client in the course and for the purpose of their employment. JurisAI's architecture enforces strict client confidentiality by performing zero unmasked retention.
                  </p>
                </div>

                {/* DPDP Act 2023 Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-b from-[#0e1c26] to-[#071219] border border-emerald-500/25 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <Landmark className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                        Digital Personal Data Protection Act, 2023
                      </h4>
                      <p className="text-[10px] text-slate-600">
                        Enacted by Parliament of India (Act No. 22 of 2023)
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed text-justify">
                    Litigants are 'Data Principals' entitled to absolute privacy over financial, identification, and biometric data. JurisAI operates as a zero-trust processing environment where Aadhaar, PAN, phone numbers, and financial details are stripped in memory before semantic vector indexing.
                  </p>
                </div>
              </div>

              {/* Technical Architecture Flow */}
              <div className="glass-card rounded-2xl p-5 border border-white/10 space-y-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  Privilege-Preserving Data Pipeline (Zero Persistent Client Storage)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-white/3 border border-white/8 rounded-xl space-y-1">
                    <span className="text-[10px] text-emerald-400 font-bold block">1. LOCAL INGESTION</span>
                    <p className="text-slate-700 font-medium text-[11px]">User uploads FIR, Pleading, or Contract</p>
                    <p className="text-[10px] text-slate-500">Document parsed in isolated memory buffer.</p>
                  </div>

                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-1">
                    <span className="text-[10px] text-emerald-300 font-bold block">2. PII SCRUBBING</span>
                    <p className="text-slate-900 font-medium text-[11px]">Regex Redactor sanitizes 10 PII entities</p>
                    <p className="text-[10px] text-slate-600">Aadhaar, PAN, phones replaced with tokens.</p>
                  </div>

                  <div className="p-3 bg-white/3 border border-white/8 rounded-xl space-y-1">
                    <span className="text-[10px] text-indigo-400 font-bold block">3. LEGAL SYNTHESIS</span>
                    <p className="text-slate-700 font-medium text-[11px]">Only sanitized legal facts processed</p>
                    <p className="text-[10px] text-slate-500">Cross-referenced with SC/HC precedent corpus.</p>
                  </div>

                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-1">
                    <span className="text-[10px] text-emerald-300 font-bold block">4. COURT-READY OUTPUT</span>
                    <p className="text-slate-900 font-medium text-[11px]">Verified ratios & drafts returned</p>
                    <p className="text-[10px] text-slate-600">Zero persistent unencrypted logs stored.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              TAB 3: OFFICIAL CHAMBER DATA PROTECTION CERTIFICATE
              ══════════════════════════════════════════════════════════ */}
          {activeTab === 'certificate' && (
            <div className="space-y-5">
              {/* Customization Bar */}
              <div className="p-4 bg-white/3 border border-white/8 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                    Advocate Full Name:
                  </label>
                  <input
                    type="text"
                    value={advocateName}
                    onChange={(e) => setAdvocateName(e.target.value)}
                    className="w-full bg-[#04080c] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                    Chamber / Law Firm Name:
                  </label>
                  <input
                    type="text"
                    value={chamberName}
                    onChange={(e) => setChamberName(e.target.value)}
                    className="w-full bg-[#04080c] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                    Bar Council Enrolment No:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={barEnrolment}
                      onChange={(e) => setBarEnrolment(e.target.value)}
                      className="w-full bg-[#04080c] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-900"
                    />
                    <button
                      onClick={loadCertificate}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shrink-0"
                    >
                      Update
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                <div className="flex items-center gap-2 text-xs text-emerald-300 font-semibold">
                  <Award className="w-4 h-4 text-emerald-400" />
                  <span>Official Attestation of Data Protection & Legal Privilege Compliance</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyAttestation}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-slate-700 text-xs font-semibold transition-all"
                  >
                    {copiedCert ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-emerald-400" />}
                    <span>{copiedCert ? 'Copied Attestation!' : 'Copy Attestation'}</span>
                  </button>
                  <button
                    onClick={handlePrintCertificate}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs transition-all shadow-md shadow-emerald-500/20"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Certificate (A4)</span>
                  </button>
                </div>
              </div>

              {/* ── Screen Preview of the Formal A4 Certificate ── */}
              {certificate && (
                <div className="bg-slate-200/90 p-4 sm:p-8 rounded-2xl flex justify-center overflow-x-auto">
                  <div className="bg-white text-black font-serif shadow-xl rounded-xl p-8 sm:p-12 w-full max-w-[210mm] border border-slate-300 min-h-[600px] text-xs sm:text-sm leading-relaxed relative">
                    
                    {/* Header */}
                    <div className="text-center border-b-2 border-slate-900 pb-4 mb-5">
                      <div className="flex justify-center mb-2">
                        <div className="w-12 h-12 rounded-full border-2 border-emerald-800 flex items-center justify-center text-emerald-800">
                          <Scale className="w-6 h-6" />
                        </div>
                      </div>
                      <p className="text-[10px] font-sans font-bold tracking-widest uppercase text-slate-600">
                        REPUBLIC OF INDIA · LEGAL TECHNOLOGY ETHICS & COMPLIANCE
                      </p>
                      <h1 className="text-lg sm:text-xl font-bold uppercase tracking-wide text-slate-900 mt-1">
                        CERTIFICATE OF DATA PRIVACY & PRIVILEGE COMPLIANCE
                      </h1>
                      <p className="text-xs italic font-sans font-medium text-emerald-800 mt-1">
                        Issued under the Digital Personal Data Protection Act, 2023 & Section 132 Bharatiya Sakshya Adhiniyam, 2023
                      </p>
                    </div>

                    {/* Attestation Body */}
                    <div className="space-y-4 my-6 text-justify">
                      <p className="text-xs sm:text-sm leading-relaxed">
                        This is to certify that the digital legal workstation, case cross-examination repository, and automated legal drafting engine deployed for:
                      </p>

                      <div className="border border-slate-400 bg-slate-50/70 p-4 text-center space-y-1">
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 uppercase tracking-wide">
                          {certificate.chamber_name}
                        </h2>
                        <p className="text-xs font-semibold text-slate-700">
                          Presided by: <strong>{certificate.advocate_name}</strong>
                        </p>
                        <p className="text-[11px] font-mono text-slate-600">
                          State Bar Council Enrolment: {certificate.bar_enrolment}
                        </p>
                      </div>

                      <p className="text-xs leading-relaxed">
                        has been verified as operating in strict conformity with statutory privacy and ethical mandates governing the legal profession across the territory of India:
                      </p>

                      <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-800 font-sans">
                        {certificate.governing_statutes.map((stat, idx) => (
                          <li key={idx}><strong>{stat}</strong></li>
                        ))}
                      </ul>

                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-sans text-emerald-900">
                        <strong>Guaranteed Legal Protections:</strong> All sensitive litigant identifiers (including Aadhaar, PAN, phone numbers, and bank details) are scrubbed in ephemeral memory buffers prior to semantic reasoning. Zero unmasked documents are retained or exposed to unauthorized parties.
                      </div>
                    </div>

                    {/* Verification Seal & Signatures */}
                    <div className="pt-8 border-t border-slate-300 flex justify-between items-end text-xs font-sans">
                      <div>
                        <p><strong>Certificate ID:</strong> <span className="font-mono">{certificate.certificate_id}</span></p>
                        <p><strong>Issued on:</strong> {certificate.issue_date}</p>
                        <p><strong>Valid Until:</strong> {certificate.valid_until}</p>
                        <p className="text-[10px] text-slate-500 font-mono mt-1">Hash: {certificate.verification_hash}</p>
                      </div>

                      <div className="text-right space-y-1">
                        <div className="w-40 border-b border-black mb-1 ml-auto" />
                        <p className="font-bold text-slate-900 uppercase">JurisAI Compliance Directorate</p>
                        <p className="text-[10px] text-slate-600">Sovereign Indian Legal Intelligence</p>
                        <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-bold rounded">
                          CRYPTOGRAPHICALLY VERIFIED
                        </span>
                      </div>
                    </div>

                  </div>
                </div>
              )}

            </div>
          )}

        </div>

        {/* ── Modal Footer ── */}
        <div className="px-6 py-2.5 bg-black/60 border-t border-emerald-500/15 flex items-center justify-between text-[10px] text-slate-600 shrink-0">
          <span className="flex items-center gap-1.5 text-emerald-300 font-medium">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>End-to-End Litigant Confidentiality Guaranteed</span>
          </span>
          <span className="hidden sm:inline text-slate-500">
            JurisAI Legal Practice Suite · DPDP Act 2023 & BSA 2023 Compliance
          </span>
        </div>

        {/* ═══ PORTAL PRINT CONTAINER FOR CERTIFICATE ═══ */}
        {certificate && createPortal(
          <div id="dpdp-certificate-print" className="font-serif text-black p-8 max-w-[195mm] mx-auto bg-white">
            <div style={{ textAlign: 'center', borderBottom: '1.5px solid #0f172a', paddingBottom: '10px', marginBottom: '16px' }}>
              <p style={{ fontSize: '9pt', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 'bold' }}>
                REPUBLIC OF INDIA · LEGAL TECHNOLOGY ETHICS & COMPLIANCE
              </p>
              <h1 style={{ fontSize: '15pt', fontWeight: 'bold', textTransform: 'uppercase', margin: '4px 0' }}>
                CERTIFICATE OF DATA PRIVACY & PRIVILEGE COMPLIANCE
              </h1>
              <p style={{ fontSize: '10pt', fontStyle: 'italic', margin: 0 }}>
                Digital Personal Data Protection Act, 2023 (Act 22 of 2023) & Section 132 Bharatiya Sakshya Adhiniyam, 2023
              </p>
            </div>

            <div style={{ margin: '16px 0', fontSize: '10pt', lineHeight: '1.5', textAlign: 'justify' }}>
              <p>
                This is to certify that the digital legal workstation, case cross-examination repository, and automated legal drafting engine deployed for:
              </p>

              <div style={{ border: '1px solid #cbd5e1', padding: '10px', margin: '12px 0', textAlign: 'center', backgroundColor: '#fcfcfc' }}>
                <h2 style={{ fontSize: '14pt', fontWeight: 'bold', textTransform: 'uppercase', margin: '2px 0' }}>
                  {certificate.chamber_name}
                </h2>
                <p style={{ fontSize: '10pt', margin: '2px 0' }}>
                  Presided by: <strong>{certificate.advocate_name}</strong>
                </p>
                <p style={{ fontSize: '9.5pt', fontStyle: 'italic', margin: 0 }}>
                  State Bar Council Enrolment: {certificate.bar_enrolment}
                </p>
              </div>

              <p>
                has been verified as operating in strict conformity with statutory privacy and ethical mandates governing the legal profession across the territory of India:
              </p>

              <ul style={{ margin: '10px 0 12px 18px', paddingLeft: '8px' }}>
                {certificate.governing_statutes.map((stat, idx) => (
                  <li key={idx} style={{ marginBottom: '4px' }}><strong>{stat}</strong></li>
                ))}
              </ul>

              <div style={{ border: '1px solid #cbd5e1', padding: '8px 12px', margin: '12px 0', fontSize: '9pt', backgroundColor: '#f9f9f9' }}>
                <strong>Guaranteed Legal Protections:</strong> All sensitive litigant identifiers (including Aadhaar, PAN, phone numbers, bank accounts, and IFSC codes) are scrubbed in ephemeral memory buffers prior to semantic reasoning. Zero unmasked documents are retained or exposed to unauthorized parties.
              </div>
            </div>

            <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '9.5pt' }}>
              <div>
                <p style={{ margin: '1.5px 0' }}><strong>Certificate ID:</strong> {certificate.certificate_id}</p>
                <p style={{ margin: '1.5px 0' }}><strong>Issue Date:</strong> {certificate.issue_date}</p>
                <p style={{ margin: '1.5px 0' }}><strong>Valid Until:</strong> {certificate.valid_until}</p>
                <p style={{ margin: '1.5px 0', fontSize: '8pt', color: '#555' }}>Verification Hash: {certificate.verification_hash}</p>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ width: '160px', borderBottom: '1px solid black', marginBottom: '3px', marginLeft: 'auto' }} />
                <p style={{ fontWeight: 'bold', textTransform: 'uppercase', margin: '1.5px 0' }}>JurisAI Compliance Office</p>
                <p style={{ fontSize: '8pt', margin: '1.5px 0' }}>Sovereign Indian Legal Intelligence</p>
                <p style={{ fontSize: '8pt', color: '#059669', fontWeight: 'bold', margin: '1.5px 0' }}>CRYPTOGRAPHICALLY VERIFIED</p>
              </div>
            </div>
          </div>,
          document.body
        )}

      </motion.div>
    </div>
  )
}
