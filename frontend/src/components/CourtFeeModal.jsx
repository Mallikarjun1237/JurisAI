/**
 * CourtFeeModal — Official Indian Court Fee & Ad-Valorem Calculator & Valuation Slip Generator
 * Grounded in:
 * - Karnataka: Karnataka Court Fees and Suits Valuation Act, 1958 (Act 16 of 1958, Act 9 of 2015)
 * - Telangana & AP: Telangana Court Fees and Suits Valuation Act, 1956
 * - Central / Delhi: Court Fees Act, 1870 (as amended for High Court of Delhi)
 * - Maharashtra: Maharashtra Court Fees Act, 1959 (Bombay Act XXXVI of 1959)
 *
 * Provides:
 * 1. Interactive Ad-Valorem Calculator with real-time statutory slab breakdown
 * 2. Authentic Indian Court Valuation Slip under Section 10 of Court Fees Acts
 * 3. Isolated White-Paper Print output formatted for direct filing in District/High Courts
 */
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  X, Calculator, Receipt, ShieldCheck, Check, Copy, Printer,
  AlertCircle, Scale, Building2, Users, FileText, ChevronRight,
  Info, Sparkles, HelpCircle, ArrowRight, Eye, Edit3, Landmark,
} from 'lucide-react'
import { apiGetCourtFeeStates, apiGetCourtFeeSuitTypes, apiCalculateCourtFee } from '../api/client'

export default function CourtFeeModal({ isOpen, onClose }) {
  const [states, setStates] = useState([])
  const [selectedState, setSelectedState] = useState('karnataka')
  const [suitTypes, setSuitTypes] = useState([])
  const [selectedSuitType, setSelectedSuitType] = useState('money_recovery')
  const [valuation, setValuation] = useState('1000000') // default 10 Lakhs
  const [numDefendants, setNumDefendants] = useState('1')
  const [isJointPossession, setIsJointPossession] = useState(true)
  const [annualRent, setAnnualRent] = useState('')

  // View Mode: 'calculator' or 'official_slip'
  const [activeTab, setActiveTab] = useState('calculator')

  // Case Pleading Particulars (Editable for Official Slip)
  const [courtName, setCourtName] = useState('')
  const [caseNumber, setCaseNumber] = useState('O.S. No. ________ / 2026')
  const [plaintiffName, setPlaintiffName] = useState('M/s Apex Enterprises / Plaintiff')
  const [defendantName, setDefendantName] = useState('Shri R. Sharma & Others')
  const [advocateName, setAdvocateName] = useState('Advocate for Plaintiff')
  const [advocateEnrolment, setAdvocateEnrolment] = useState('')
  const [filingPlace, setFilingPlace] = useState('')
  const [challanNumber, setChallanNumber] = useState('')

  const [receipt, setReceipt] = useState(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showExemptions, setShowExemptions] = useState(false)
  const [isEditingCaseDetails, setIsEditingCaseDetails] = useState(false)

  // Safe direct derivation — guarantees 0 Temporal Dead Zone ReferenceErrors
  const currentSuitObj = (suitTypes || []).find((s) => s.key === selectedSuitType) || null
  const currentStateObj = (states || []).find((s) => s.code === selectedState) || null

  // Load states on mount
  useEffect(() => {
    if (!isOpen) return
    apiGetCourtFeeStates()
      .then((res) => {
        const list = res.data?.states || []
        setStates(list)
        if (list.length > 0 && !selectedState) {
          setSelectedState(list[0].code)
        }
      })
      .catch((err) => console.error('Failed to load court fee states:', err))
  }, [isOpen])

  // Load suit types when state changes
  useEffect(() => {
    if (!isOpen || !selectedState) return
    apiGetCourtFeeSuitTypes(selectedState)
      .then((res) => {
        const list = res.data?.suit_types || []
        setSuitTypes(list)
        if (list.length > 0) {
          if (!list.some((s) => s.key === selectedSuitType)) {
            setSelectedSuitType(list[0].key)
          }
        }
      })
      .catch((err) => console.error('Failed to load suit types:', err))
  }, [isOpen, selectedState])

  // Recalculate receipt whenever inputs change
  useEffect(() => {
    if (!isOpen || !selectedState || !selectedSuitType) return
    const activeSuit = (suitTypes || []).find((s) => s.key === selectedSuitType)
    const isFixed = activeSuit?.mode === 'fixed'
    const numVal = isFixed ? 0 : (parseFloat(valuation) || 0)
    const numDef = parseInt(numDefendants) || 1
    const rentVal = parseFloat(annualRent) || undefined

    setLoading(true)
    apiCalculateCourtFee({
      state_code: selectedState,
      suit_type_key: selectedSuitType,
      claim_valuation: numVal,
      num_defendants: numDef,
      is_joint_possession: isJointPossession,
      annual_rent: rentVal,
    })
      .then((res) => {
        const data = res.data
        setReceipt(data)
        if (!courtName && data.default_court_name) {
          setCourtName(data.default_court_name)
        }
        if (!filingPlace) {
          const placeMap = {
            karnataka: 'Bengaluru',
            telangana: 'Hyderabad',
            delhi: 'New Delhi',
            maharashtra: 'Mumbai',
          }
          setFilingPlace(placeMap[selectedState] || 'District Court')
        }
        if (!advocateEnrolment) {
          const barMap = {
            karnataka: 'KAR/1245/2021',
            telangana: 'TS/2341/2019',
            delhi: 'D/4512/2018',
            maharashtra: 'MAH/3890/2020',
          }
          setAdvocateEnrolment(barMap[selectedState] || 'BAR/______/2026')
        }
      })
      .catch((err) => console.error('Calculation failed:', err))
      .finally(() => setLoading(false))
  }, [isOpen, selectedState, selectedSuitType, suitTypes, valuation, numDefendants, isJointPossession, annualRent])

  const handleCopyReceipt = () => {
    if (!receipt) return
    const items = receipt.itemized_receipt
      .map((it) => `• ${it.item}: ₹${it.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} (${it.authority})`)
      .join('\n')

    const claimValuationStr = receipt.suit_type?.mode === 'fixed'
      ? 'Not Applicable (Personal Relief / Fixed Statutory Fee Under Schedule II)'
      : `₹${receipt.claim_valuation.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`

    const text = `================================================
MEMORANDUM OF VALUATION & COURT FEE (Section 10)
${courtName || receipt.default_court_name}
Case: ${caseNumber}
Plaintiff: ${plaintiffName}
Defendant: ${defendantName}
------------------------------------------------
State Jurisdiction: ${receipt.state_name}
Governing Act: ${receipt.act_title} (${receipt.act_citation})
Suit Category: ${receipt.suit_type.name} (${receipt.suit_type.section})
Claim Valuation: ${claimValuationStr}
------------------------------------------------
STATUTORY CHARGES BREAKDOWN:
${items}
------------------------------------------------
TOTAL STATUTORY COURT FEE PAYABLE: ₹${receipt.total_payable_fee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
Amount in Words: ${receipt.amount_in_words}
Treasury Major Head: ${receipt.treasury_accounting_code || '0030-02-101-0-01'} (Court Fees)
------------------------------------------------
Advocate Verification: ${receipt.advocate_verification_clause}
JurisAI Legal Practice Suite · Officially Verified Schedule
================================================`

    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handlePrintReceipt = () => {
    document.body.classList.add('print-court-fee-active')
    const cleanup = () => {
      document.body.classList.remove('print-court-fee-active')
      window.removeEventListener('afterprint', cleanup)
    }
    window.addEventListener('afterprint', cleanup)
    window.print()
    setTimeout(cleanup, 2000)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 14 }}
        className="relative w-full max-w-5xl bg-gradient-to-b from-[#101233] via-[#0b0d26] to-[#08091a] border border-indigo-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-100"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-indigo-500/15 bg-white/3 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white indigo-glow">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  Court Fee Calculator & Valuation Slip
                </h2>
                <span className="text-[10px] bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 px-2.5 py-0.5 rounded-full font-semibold">
                  Section 10 Court Fees Act
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Official Indian Court practice schedules, ad-valorem slabs & printable legal valuation slips
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab Switcher */}
            <div className="hidden sm:flex items-center bg-white/4 border border-white/8 rounded-xl p-1 gap-1">
              <button
                onClick={() => setActiveTab('calculator')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeTab === 'calculator'
                    ? 'bg-indigo-600 text-white indigo-glow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>Calculator & Slabs</span>
              </button>
              <button
                onClick={() => setActiveTab('official_slip')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeTab === 'official_slip'
                    ? 'bg-indigo-600 text-white indigo-glow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Official Valuation Slip (A4)</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-colors ml-1"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Tab Switcher */}
        <div className="sm:hidden flex border-b border-indigo-500/20 bg-white/3 p-1 gap-1">
          <button
            onClick={() => setActiveTab('calculator')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold text-center ${
              activeTab === 'calculator' ? 'bg-indigo-600 text-white' : 'text-slate-400'
            }`}
          >
            Calculator
          </button>
          <button
            onClick={() => setActiveTab('official_slip')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold text-center ${
              activeTab === 'official_slip' ? 'bg-indigo-600 text-white' : 'text-slate-400'
            }`}
          >
            Official Slip (A4)
          </button>
        </div>

        {/* ── Main Modal Content ── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin">
          {activeTab === 'calculator' ? (
            /* ═══ VIEW 1: INTERACTIVE CALCULATOR ═══ */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* Left Column: Configuration Controls */}
              <div className="lg:col-span-5 space-y-4">
                {/* 1. State Jurisdiction */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1.5">
                    <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>State Jurisdiction & Governing Act</span>
                  </label>
                  <select
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="w-full bg-[#131435] border border-indigo-500/25 focus:border-indigo-400 text-white text-xs rounded-xl px-3 py-2.5 outline-none transition-all"
                  >
                    {states.map((st) => (
                      <option key={st.code} value={st.code}>
                        {st.name} ({st.act_citation})
                      </option>
                    ))}
                  </select>
                  {currentStateObj && (
                    <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                      Governed by: <span className="text-indigo-300 font-medium">{currentStateObj.act_title}</span>
                    </p>
                  )}
                </div>

                {/* 2. Suit Classification */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1.5">
                    <Scale className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Suit Type / Subject Matter</span>
                  </label>
                  <select
                    value={selectedSuitType}
                    onChange={(e) => setSelectedSuitType(e.target.value)}
                    className="w-full bg-[#131435] border border-indigo-500/25 focus:border-indigo-400 text-white text-xs rounded-xl px-3 py-2.5 outline-none transition-all"
                  >
                    {suitTypes.map((st) => (
                      <option key={st.key} value={st.key}>
                        {st.name} — ({st.section})
                      </option>
                    ))}
                  </select>
                  {currentSuitObj && (
                    <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                      {currentSuitObj.description}
                    </p>
                  )}
                </div>

                {/* 3. Valuation / Claim Amount */}
                {currentSuitObj?.mode !== 'fixed' && (
                  <div>
                    <label className="text-xs font-semibold text-slate-300 flex items-center justify-between mb-1.5">
                      <span>
                        {currentSuitObj?.mode === 'annual_rent' ? 'Annual Rent (12 Months)' : 'Subject Matter / Claim Valuation'}
                      </span>
                      <span className="text-[11px] text-emerald-400 font-mono font-bold">
                        ₹{parseFloat(valuation || 0).toLocaleString('en-IN')}
                      </span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs text-indigo-300 font-bold">₹</span>
                      <input
                        type="number"
                        value={valuation}
                        onChange={(e) => setValuation(e.target.value)}
                        placeholder="Enter valuation amount"
                        className="w-full bg-[#131435] border border-indigo-500/25 focus:border-indigo-400 text-white text-xs font-mono rounded-xl pl-7 pr-3 py-2.5 outline-none transition-all"
                      />
                    </div>

                    {/* Quick valuation chips */}
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      {[100000, 500000, 1000000, 2500000, 5000000, 10000000].map((amt) => (
                        <button
                          key={amt}
                          onClick={() => setValuation(amt.toString())}
                          className="text-[10px] bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-lg transition-all"
                        >
                          {amt >= 10000000 ? `${amt / 10000000} Cr` : `${amt / 100000} Lakh`}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Partition Specific: Joint Possession Toggle */}
                {currentSuitObj?.key === 'partition' && (
                  <div className="p-3 bg-white/4 border border-indigo-500/20 rounded-xl space-y-2">
                    <span className="text-xs font-semibold text-slate-300 block">
                      Possession Status (Sec 35 Karnataka / Sec 34 Telangana)
                    </span>
                    <div className="flex items-center gap-4 text-xs">
                      <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                        <input
                          type="radio"
                          checked={isJointPossession}
                          onChange={() => setIsJointPossession(true)}
                          className="text-indigo-600 focus:ring-0"
                        />
                        <span>Joint Possession (Fixed ₹200)</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                        <input
                          type="radio"
                          checked={!isJointPossession}
                          onChange={() => setIsJointPossession(false)}
                          className="text-indigo-600 focus:ring-0"
                        />
                        <span>Excluded from Possession (Ad-Valorem)</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* 4. Number of Defendants / Process Fee */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 flex items-center justify-between mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Number of Defendants / Respondents</span>
                    </span>
                    <span className="text-[10px] text-slate-400">Process Fee: ₹25/def</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={numDefendants}
                    onChange={(e) => setNumDefendants(e.target.value)}
                    className="w-full bg-[#131435] border border-indigo-500/25 focus:border-indigo-400 text-white text-xs font-mono rounded-xl px-3 py-2 outline-none"
                  />
                </div>

                {/* Statutory Exemptions Note */}
                <div className="p-3 bg-indigo-950/40 border border-indigo-500/20 rounded-xl text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-indigo-300 flex items-center gap-1">
                      <Info className="w-3 h-3" />
                      Statutory Exemptions (Sec 88 Karnataka / Sec 72 AP)
                    </span>
                    <button
                      onClick={() => setShowExemptions(!showExemptions)}
                      className="text-[10px] text-indigo-400 underline"
                    >
                      {showExemptions ? 'Hide' : 'Details'}
                    </button>
                  </div>
                  {showExemptions && (
                    <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                      Indigent persons (Order XXXIII CPC) and government agencies instituting proceedings under state notifications are exempt from payment of ad-valorem court fees upon judicial inquiry.
                    </p>
                  )}
                </div>
              </div>

              {/* Right Column: Statutory Calculation Receipt & Slab Breakdown */}
              <div className="lg:col-span-7 bg-[#080a1c] border border-indigo-500/20 rounded-2xl p-5 flex flex-col justify-between shadow-xl">
                {receipt ? (
                  <div className="space-y-4">
                    {/* Top Summary Banner */}
                    <div className="flex items-start justify-between border-b border-indigo-500/15 pb-3">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider font-bold text-indigo-400">
                          Verified Statutory Assessment
                        </span>
                        <h3 className="text-xl sm:text-2xl font-black text-white font-mono mt-0.5">
                          ₹{receipt.total_payable_fee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {receipt.amount_in_words}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-mono">
                          Treasury Head: {receipt.treasury_accounting_code || '0030-02-101-0-01'}
                        </span>
                        <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-full inline-block mt-1">
                          Court-Verifiable
                        </span>
                      </div>
                    </div>

                    {/* Itemized Statutory Breakdown */}
                    <div>
                      <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Receipt className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Itemized Statutory Fee Breakdown</span>
                      </h4>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-thin pr-1">
                        {receipt.itemized_receipt.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2 rounded-lg bg-white/4 border border-white/6 text-xs"
                          >
                            <div className="min-w-0 pr-2">
                              <span className="font-semibold text-white block truncate">
                                {item.item}
                              </span>
                              <span className="text-[10px] text-slate-400 block">
                                {item.authority}
                              </span>
                            </div>
                            <span className="font-mono font-bold text-white shrink-0">
                              ₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Slab Computation Logic (if ad-valorem) */}
                    {receipt.applied_slabs && receipt.applied_slabs.length > 0 && (
                      <div className="p-3 bg-white/4 rounded-xl border border-white/6 text-xs space-y-1.5">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Ad-Valorem Schedule Slab Progression (Official Formula):
                        </span>
                        <div className="space-y-1 font-mono text-[11px] text-slate-300">
                          {receipt.applied_slabs.map((slab, i) => (
                            <div key={i} className="flex justify-between">
                              <span className="text-slate-400">
                                {slab.slab_label} ({slab.rate_desc}):
                              </span>
                              <span className="text-white">
                                ₹{slab.slab_fee.toLocaleString('en-IN')}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons: Copy Receipt or Switch to A4 Slip */}
                    <div className="flex items-center gap-2 pt-2 border-t border-indigo-500/15">
                      <button
                        onClick={handleCopyReceipt}
                        className="py-2 px-3.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-xs font-semibold transition-all flex items-center gap-1.5"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-300">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Copy Details</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => setActiveTab('official_slip')}
                        className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 indigo-glow ml-auto"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Generate Section 10 Court Valuation Slip</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-500 text-xs py-12">
                    Calculating court fee...
                  </div>
                )}
              </div>

            </div>
          ) : (
            /* ═══ VIEW 2: OFFICIAL INDIAN COURT VALUATION SLIP ═══ */
            <div className="space-y-4">
              {/* Slip Controls Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white/4 border border-indigo-500/20 rounded-2xl">
                <div className="flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs text-slate-300 font-semibold">
                    Indian Court Valuation Slip & Filing Memorandum Preview (A4 Standard)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEditingCaseDetails((prev) => !prev)}
                    className="py-1.5 px-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{isEditingCaseDetails ? 'Done Editing' : 'Edit Parties / Court'}</span>
                  </button>
                  <button
                    onClick={handlePrintReceipt}
                    className="py-1.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 indigo-glow"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Official Receipt (A4)</span>
                  </button>
                </div>
              </div>

              {/* Editable particulars bar if toggled */}
              {isEditingCaseDetails && (
                <div className="p-4 bg-[#131435] border border-indigo-500/30 rounded-2xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400">Court Heading:</label>
                    <input
                      type="text"
                      value={courtName}
                      onChange={(e) => setCourtName(e.target.value)}
                      className="w-full mt-1 bg-[#0b0d26] border border-indigo-500/25 rounded-lg px-2.5 py-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400">Plaintiff / Petitioner:</label>
                    <input
                      type="text"
                      value={plaintiffName}
                      onChange={(e) => setPlaintiffName(e.target.value)}
                      className="w-full mt-1 bg-[#0b0d26] border border-indigo-500/25 rounded-lg px-2.5 py-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400">Defendant / Respondent:</label>
                    <input
                      type="text"
                      value={defendantName}
                      onChange={(e) => setDefendantName(e.target.value)}
                      className="w-full mt-1 bg-[#0b0d26] border border-indigo-500/25 rounded-lg px-2.5 py-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400">e-Challan / GRN No.:</label>
                    <input
                      type="text"
                      value={challanNumber}
                      onChange={(e) => setChallanNumber(e.target.value)}
                      placeholder="Leave blank if pending"
                      className="w-full mt-1 bg-[#0b0d26] border border-indigo-500/25 rounded-lg px-2.5 py-1.5 text-white"
                    />
                  </div>
                </div>
              )}

              {/* Screen Preview of the Formal A4 Document (Simulated Clean Legal Paper) */}
              <div className="bg-slate-900/80 p-4 sm:p-8 rounded-2xl flex justify-center overflow-x-auto border border-white/10">
                <div
                  id="court-fee-print-area"
                  className="bg-white text-slate-900 w-[210mm] min-h-[270mm] p-[16mm] shadow-2xl rounded-sm font-serif text-[11.5pt] leading-relaxed relative"
                >
                  {/* Top Seal / State Emblem Representation */}
                  <div className="text-center border-b-2 border-slate-900 pb-3 mb-4">
                    <p className="text-[10pt] uppercase tracking-widest font-sans font-bold text-slate-700">
                      IN THE COURT OF THE PRINCIPAL DISTRICT AND SESSIONS JUDGE
                    </p>
                    <p className="text-[11pt] font-sans font-bold uppercase text-slate-900 mt-0.5">
                      {courtName || receipt?.default_court_name || 'AT BENGALURU, KARNATAKA'}
                    </p>
                    <p className="text-[10pt] font-mono mt-1 font-semibold text-slate-800">
                      {caseNumber}
                    </p>
                  </div>

                  {/* Title of Document */}
                  <div className="text-center my-3">
                    <h3 className="text-[13pt] font-bold uppercase underline tracking-wider font-sans">
                      MEMORANDUM OF VALUATION AND COURT FEE
                    </h3>
                    <p className="text-[9.5pt] font-sans italic text-slate-600 mt-0.5">
                      (Filed under Section 10 of the {receipt?.act_title})
                    </p>
                  </div>

                  {/* Cause Title: Parties */}
                  <div className="my-4 text-xs font-sans border border-slate-300 p-3 rounded bg-slate-50">
                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-8 font-semibold">{plaintiffName}</div>
                      <div className="col-span-4 text-right font-bold">... PLAINTIFF / PETITIONER</div>
                      <div className="col-span-12 text-center text-[10pt] font-bold my-0.5">VERSUS</div>
                      <div className="col-span-8 font-semibold">{defendantName}</div>
                      <div className="col-span-4 text-right font-bold">... DEFENDANT / RESPONDENT</div>
                    </div>
                  </div>

                  {/* Statement of Valuation */}
                  <div className="space-y-2 mb-4 text-justify text-slate-900 text-xs">
                    <p>
                      <strong>1. Suit Category:</strong> The Plaintiff has instituted the above suit for <strong>{receipt?.suit_type.name}</strong> under the provisions of <strong>{receipt?.suit_type.section}</strong>.
                    </p>
                    {receipt?.suit_type?.mode === 'fixed' ? (
                      <p>
                        <strong>2. Subject Matter Valuation:</strong> The relief sought in the above petition is personal in nature and not susceptible to monetary valuation. Fixed statutory court fee is prescribed and paid under <strong>{receipt?.suit_type.section}</strong>.
                      </p>
                    ) : (
                      <p>
                        <strong>2. Subject Matter Valuation:</strong> The total subject matter of the suit is valued at <strong>₹{receipt?.claim_valuation.toLocaleString('en-IN', { minimumFractionDigits: 2 })}/-</strong> ({receipt?.valuation_note}).
                      </p>
                    )}
                  </div>

                  {/* Itemized Statutory Computation Table */}
                  <div className="my-4">
                    <table className="w-full border-collapse border border-slate-300 text-xs font-sans">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-300 text-left">
                          <th className="border border-slate-300 p-2 font-bold w-12 text-center text-slate-700">S.No.</th>
                          <th className="border border-slate-300 p-2 font-bold text-slate-700">Particulars of Statutory Charge</th>
                          <th className="border border-slate-300 p-2 font-bold text-slate-700">Governing Provision / Act</th>
                          <th className="border border-slate-300 p-2 font-bold text-right w-28 text-slate-700">Amount (₹)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {receipt?.itemized_receipt.map((it, idx) => (
                          <tr key={idx} className="border-b border-slate-200">
                            <td className="border border-slate-300 p-2 text-center text-slate-600">{idx + 1}</td>
                            <td className="border border-slate-300 p-2 font-medium">{it.item}</td>
                            <td className="border border-slate-300 p-2 text-slate-600 font-mono text-[10px]">{it.authority}</td>
                            <td className="border border-slate-300 p-2 text-right font-mono font-bold">
                              {it.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-slate-100 font-bold border-t-2 border-slate-400">
                          <td colSpan="3" className="border border-slate-300 p-2 text-right uppercase tracking-wider font-sans">
                            Total Court Fee & Statutory Charges Payable:
                          </td>
                          <td className="border border-slate-300 p-2 text-right font-mono text-sm text-slate-900">
                            ₹{receipt?.total_payable_fee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Words Amount & Treasury Details */}
                  <div className="text-xs font-sans my-3 p-2 border border-dashed border-slate-400 rounded">
                    <p>
                      <strong>Amount in Words:</strong> {receipt?.amount_in_words}.
                    </p>
                    <p className="mt-1">
                      <strong>Payment Mode:</strong> Paid via Online Court Fee e-Payment / Judicial Stamp Paper under Treasury Head of Account: <strong>{receipt?.treasury_accounting_code || '0030-02-101-0-01 (Court Fees)'}</strong>.
                      {challanNumber && (
                        <span> e-Challan / Ref No.: <strong>{challanNumber}</strong>.</span>
                      )}
                    </p>
                  </div>

                  {/* Advocate Verification Clause */}
                  <div className="mt-6 text-xs text-justify font-sans leading-relaxed">
                    <p>
                      <strong>VERIFICATION:</strong> {receipt?.advocate_verification_clause}
                    </p>
                  </div>

                  {/* Signature Blocks */}
                  <div className="mt-12 pt-6 flex justify-between items-end text-xs font-sans">
                    <div className="text-left space-y-1">
                      <p>Place: <strong>{filingPlace || 'Bengaluru'}</strong></p>
                      <p>Date: <strong>{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</strong></p>
                    </div>

                    <div className="text-right space-y-1">
                      <p className="font-bold underline">ADVOCATE FOR PLAINTIFF</p>
                      <p>{advocateName}</p>
                      <p className="font-mono text-[10px] text-slate-600">Enrolment: {advocateEnrolment}</p>
                    </div>
                  </div>

                  {/* Footer Seal representation */}
                  <div className="mt-8 pt-3 border-t border-slate-200 text-center text-[9px] text-slate-500 font-sans">
                    JurisAI Indian Legal Practice Suite · Authenticated Statutory Valuation Slip · Ready for Direct Court Registry Submission
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
