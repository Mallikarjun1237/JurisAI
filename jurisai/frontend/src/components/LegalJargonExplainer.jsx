import React, { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Loader2, X } from 'lucide-react'
import { apiDefineJargon } from '../api/client'

// ── COMPREHENSIVE REPOSITORY OF SPECIFIC INDIAN LEGAL JARGON ──────────────────
export const LEGAL_JARGON_DICTIONARY = [
  // ── CRIMINAL LAW & PROCEDURE ──
  {
    id: 'cognizable',
    terms: ['cognizable offence', 'cognizable offense', 'cognizable'],
    label: 'Cognizable Offence (संज्ञेय अपराध)',
    definition: 'A serious category of criminal offence where a police officer has the legal authority to arrest the accused without an arrest warrant and is statutorily mandated to register an FIR immediately.',
    plainMeaning: 'Police cannot refuse to register your complaint or ask you to get a Magistrate order first. They must initiate investigation immediately.',
  },
  {
    id: 'non-cognizable',
    terms: ['non-cognizable offence', 'non-cognizable offense', 'non-cognizable', 'non cognizable'],
    label: 'Non-Cognizable Offence (असंज्ञेय अपराध)',
    definition: 'An offence where a police officer has no authority to arrest without a warrant from a Magistrate and cannot investigate without explicit judicial direction.',
    plainMeaning: 'Police record this in a Non-Cognizable Report (NCR). To prosecute (e.g., criminal defamation or simple hurt), you or your counsel must file a Private Complaint directly before the Magistrate.',
  },
  {
    id: 'bailable',
    terms: ['bailable offence', 'bailable offense', 'bailable'],
    label: 'Bailable Offence (जमानती अपराध)',
    definition: 'An offence where release on bail is an absolute statutory right of the accused upon furnishing solvent sureties or bail bonds.',
    plainMeaning: 'The police station or court cannot refuse release once standard bail bond formalities are completed; detention is legally impermissible.',
  },
  {
    id: 'non-bailable',
    terms: ['non-bailable offence', 'non-bailable offense', 'non-bailable', 'non bailable'],
    label: 'Non-Bailable Offence (गैर-जमानती अपराध)',
    definition: 'An offence where bail is not automatic. Grant of bail is at the sole judicial discretion of the court after hearing the Public Prosecutor.',
    plainMeaning: 'Police cannot grant bail at the police station. Your advocate must argue a formal bail application before the Sessions Court or High Court.',
  },
  {
    id: 'compoundable',
    terms: ['compoundable offence', 'compoundable offense', 'compoundable', 'compounded'],
    label: 'Compoundable Offence (शमनीय अपराध)',
    definition: 'An offence where the victim and the accused can lawfully enter into an amicable compromise or settlement, leading to a complete acquittal of the accused.',
    plainMeaning: 'You can resolve this out of court with the other party without undergoing a full criminal trial, completely dropping all charges.',
  },
  {
    id: 'zero-fir',
    terms: ['zero fir', 'zero-fir'],
    label: 'Zero FIR (शून्य प्राथमिकी)',
    definition: 'A First Information Report that can be registered at any police station in India, irrespective of the territorial jurisdiction where the crime took place.',
    plainMeaning: 'Police cannot turn you away by saying "this didn\'t happen in our jurisdiction." They must register it under number 0 and transfer the case to the correct station.',
  },
  {
    id: 'fir',
    terms: ['first information report', 'fir'],
    label: 'FIR (First Information Report / प्रथम सूचना रिपोर्ट)',
    definition: 'The initial statutory written document prepared by state police when they receive verified information disclosing the commission of a cognizable offence.',
    plainMeaning: 'The official starting gateway for all police investigations and state criminal proceedings in India.',
  },
  {
    id: 'anticipatory-bail',
    terms: ['anticipatory bail', 'pre-arrest bail'],
    label: 'Anticipatory Bail (अग्रिम जमानत)',
    definition: 'A pre-arrest judicial direction issued by the Sessions Court or High Court directing the immediate release of a person on bail in the event of their arrest.',
    plainMeaning: 'Advance protection granted by a judge before police can take you into custody, shielding you from arrest in false or retaliatory FIRs.',
  },
  {
    id: 'private-complaint',
    terms: ['private complaint', 'complaint to the magistrate', 'section 223 bnss', 'section 200 crpc'],
    label: 'Private Complaint (परिवाद / निजी शिकायत)',
    definition: 'A formal criminal complaint submitted directly to a Judicial Magistrate without police intervention, requesting the court to examine the complainant under oath and issue process.',
    plainMeaning: 'Filing a case straight before the judge when police refuse to register an FIR or when pursuing non-cognizable charges like defamation.',
  },
  {
    id: 'charge-sheet',
    terms: ['charge-sheet', 'chargesheet', 'police final report'],
    label: 'Charge-sheet (आरोप पत्र / Final Report)',
    definition: 'The final police investigation report submitted to the Magistrate under Section 193 BNSS / 173 CrPC detailing the evidence gathered against the accused and establishing a prima facie case for trial.',
    plainMeaning: 'The official police finding that concludes the investigation and asks the court to summon the accused and commence the criminal trial.',
  },
  {
    id: 'remand',
    terms: ['police remand', 'judicial custody', 'police custody', 'remand'],
    label: 'Remand & Custody (रिमांड / अभिरक्षा)',
    definition: 'An order of a Magistrate sending an arrested person back into custody—either police custody for interrogation (maximum 15 days) or judicial custody in jail.',
    plainMeaning: 'Court authorization deciding whether the suspect is interrogated by police or kept safely in judicial custody under jail administration.',
  },
  {
    id: 'discharge',
    terms: ['application for discharge', 'discharge petition', 'discharged from the case'],
    label: 'Discharge (उन्मोचन / आरोपमुक्ति)',
    definition: 'A judicial order dismissing criminal proceedings before charges are framed, when the court finds the allegations groundless or lacking prima facie evidence.',
    plainMeaning: 'Dropping the case before trial starts because the police allegations have no legal substance or evidence against you.',
  },
  {
    id: 'quash',
    terms: ['quash the fir', 'quashing of fir', 'quashing', 'section 482 petition', 'section 528 bnss'],
    label: 'Quashing (रद्दीकरण / Section 482 CrPC / 528 BNSS)',
    definition: 'Inherent powers of the High Court to nullify and cancel an FIR, charge-sheet, or criminal proceeding to prevent abuse of the process of law or secure the ends of justice.',
    plainMeaning: 'A High Court order completely striking down an illegal, motivated, or fabricated criminal proceeding against you.',
  },
  {
    id: 'plea-bargaining',
    terms: ['plea bargaining', 'plea bargain'],
    label: 'Plea Bargaining (अभिवाक समझौता)',
    definition: 'A pre-trial negotiation process where the accused pleads guilty in exchange for concessions from the prosecution such as reduced sentence or reduced charges.',
    plainMeaning: 'Settling a criminal case by admitting guilt in exchange for a lighter sentence or probation, avoiding a long trial.',
  },

  // ── CIVIL, PROPERTY & CONTRACT ──
  {
    id: 'injunction',
    terms: ['interlocutory injunction', 'temporary injunction', 'ad-interim injunction', 'ad interim injunction', 'injunction', 'stay order'],
    label: 'Injunction / Stay Order (निषेधाज्ञा / स्थगनादेश)',
    definition: 'A judicial restraining order prohibiting a party from carrying out a specific act (e.g. demolishing property, selling disputed land, or publishing defamatory content) pending final trial.',
    plainMeaning: 'An urgent emergency freeze order from the judge to stop the opposing party from causing irreversible harm while the suit is pending.',
  },
  {
    id: 'order-39',
    terms: ['order 39 rules 1-2', 'order 39 rules 1 and 2', 'order 39 cpc', 'order 39'],
    label: 'Order 39 CPC (अंतरिम व्यादेश नियम)',
    definition: 'The statutory civil procedure code governing temporary injunctions and interlocutory orders to preserve disputed property and maintain status quo.',
    plainMeaning: 'The civil court rules you invoke when filing for an emergency stay against eviction, demolition, or defamatory publication.',
  },
  {
    id: 'vakalatnama',
    terms: ['vakalatnama', 'vakalat'],
    label: 'Vakalatnama (वकालतनामा)',
    definition: 'A formal legal power of attorney executed by a client authorizing an advocate to represent, plead, file documents, and act on their behalf in a court of law.',
    plainMeaning: 'The mandatory agreement you sign to retain your legal counsel so they are legally permitted to speak and file applications for you before the judge.',
  },
  {
    id: 'limitation',
    terms: ['limitation period', 'statutory limitation', 'limitation act'],
    label: 'Limitation Period (परिसीमा काल)',
    definition: 'The legally prescribed time window within which a lawsuit, claim, or appeal must be instituted. Section 3 mandates dismissal of any suit filed after expiry.',
    plainMeaning: 'The legal countdown clock. If you fail to file your lawsuit before this deadline expires, you permanently forfeit your right to court relief.',
  },
  {
    id: 'condonation-delay',
    terms: ['condonation of delay', 'condone the delay', 'section 5 limitation'],
    label: 'Condonation of Delay (विलंब की माफी)',
    definition: 'The judicial discretion of a court under Section 5 of the Limitation Act to accept an appeal or application filed after the deadline upon proof of "sufficient cause".',
    plainMeaning: 'Requesting the judge to forgive a missed deadline because of medical hospitalization, genuine fraud, or unavoidable emergency.',
  },
  {
    id: 'res-judicata',
    terms: ['res judicata', 'doctrine of res judicata'],
    label: 'Res Judicata (प्राङ्न्याय)',
    definition: 'Section 11 CPC principle barring parties from relitigating a dispute or claim that has already been finally heard and decided by a competent court on merits.',
    plainMeaning: 'Once a case between the same parties is finally judged, neither party can file a fresh lawsuit on the same claim again.',
  },
  {
    id: 'sub-judice',
    terms: ['sub judice', 'sub-judice'],
    label: 'Sub Judice (न्यायाधीन)',
    definition: 'A legal matter currently under judicial consideration and trial before a court of law, restricting public debate or actions that may prejudice proceedings.',
    plainMeaning: 'The matter is currently being decided by the judge, so parties cannot take the law into their own hands or interfere with evidence.',
  },
  {
    id: 'caveat',
    terms: ['caveat petition', 'caveator', 'caveat'],
    label: 'Caveat Petition (कैविएट याचिका)',
    definition: 'A precautionary notice filed under Section 148A CPC requesting that no adverse order or stay be passed against the applicant without prior notice and hearing.',
    plainMeaning: 'An advance alert filed in court to stop the opposing party from getting an ex-parte stay order behind your back.',
  },
  {
    id: 'locus-standi',
    terms: ['locus standi', 'standing to sue'],
    label: 'Locus Standi (वाद दायर करने का अधिकार)',
    definition: 'The legal capacity and entitlement of a party to initiate or demonstrate sufficient connection to and harm from the law or action challenged.',
    plainMeaning: 'Your legal right to bring the case—you must show that your personal legal rights or property have been directly affected.',
  },
  {
    id: 'mesne-profits',
    terms: ['mesne profits', 'mesne profit'],
    label: 'Mesne Profits (मध्यवर्ती लाभ)',
    definition: 'Profits and damages that a person in wrongful possession of immovable property actually received or might have received, payable to the lawful owner.',
    plainMeaning: 'Financial compensation and rent damages owed by a tenant or trespasser who unlawfully refuses to vacate your property.',
  },
  {
    id: 'ex-parte',
    terms: ['ex-parte decree', 'ex parte decree', 'ex-parte', 'ex parte'],
    label: 'Ex-Parte Order / Decree (एकपक्षीय आदेश)',
    definition: 'A judicial proceeding conducted or order passed for the benefit of one party in the absence or default of appearance of the opposing party after due notice.',
    plainMeaning: 'Winning an order or case because the other party failed to appear in court after being served with summons.',
  },
  {
    id: 'specific-performance',
    terms: ['specific performance', 'suit for specific performance'],
    label: 'Specific Performance (विशिष्ट पालन)',
    definition: 'An equitable court order under the Specific Relief Act compelling a party to perform their exact contractual obligation rather than merely paying money damages.',
    plainMeaning: 'Legally forcing a property seller to execute the sale deed and transfer the land as promised in the contract.',
  },
  {
    id: 'lis-pendens',
    terms: ['lis pendens', 'doctrine of lis pendens'],
    label: 'Lis Pendens (लंबित वाद सिद्धांत)',
    definition: 'Section 52 Transfer of Property Act principle: property under active dispute in court cannot be transferred or sold so as to affect the rights of any party.',
    plainMeaning: 'Any sale or transfer of property made while a court lawsuit is pending is legally subject to the final outcome of that lawsuit.',
  },

  // ── COMMERCIAL, CHEQUE & CYBER ──
  {
    id: 'sec-138',
    terms: ['section 138 of the negotiable instruments act', 'section 138 ni act', 'section 138'],
    label: 'Section 138 NI Act (चैक अनादरण)',
    definition: 'Statutory penal provision criminalizing the dishonour (bounce) of a cheque for insufficiency of funds, punishable with up to 2 years imprisonment or fine up to twice the cheque amount.',
    plainMeaning: 'The law for bounced cheques. You must send a formal statutory demand notice within 30 days of receiving the bank memo, giving 15 days to pay.',
  },
  {
    id: 'interim-compensation',
    terms: ['interim compensation under section 143a', 'interim compensation', 'section 143a'],
    label: 'Interim Compensation (Section 143A NI Act)',
    definition: 'Power of court trying a Section 138 cheque bounce case to order the drawer to pay up to 20% of the cheque amount to the complainant as interim relief pending trial.',
    plainMeaning: 'Getting up to 20% of the bounced cheque amount paid into your account early while the court case is still ongoing.',
  },
  {
    id: 'safe-harbour',
    terms: ['safe-harbour', 'safe harbour', 'section 79 of the it act', 'section 79 it act', 'section 79'],
    label: 'Section 79 IT Act / Safe Harbour (मध्यवर्ती सुरक्षा)',
    definition: 'Statutory immunity exempting internet intermediaries (social media, platforms, hosts) from liability for user-generated content, conditional upon expeditious takedown upon formal notice.',
    plainMeaning: 'Platforms like Google or X are not liable for user posts unless you serve them a formal legal takedown notice and they fail to remove it within 24-36 hours.',
  },

  // ── CONSTITUTIONAL & LATIN MAXIMS ──
  {
    id: 'habeas-corpus',
    terms: ['habeas corpus', 'writ of habeas corpus'],
    label: 'Habeas Corpus (बंदी प्रत्यक्षीकरण)',
    definition: 'A prerogative constitutional writ commanding an authority holding a person in custody to bring them before the court to examine the lawful justification of their detention.',
    plainMeaning: 'The emergency constitutional remedy to immediately free someone who has been illegally arrested or held without grounds.',
  },
  {
    id: 'mandamus',
    terms: ['writ of mandamus', 'mandamus'],
    label: 'Mandamus (परमादेश)',
    definition: 'A judicial writ issued to a public official, government body, or court commanding the performance of a mandatory statutory public duty they have failed or refused to perform.',
    plainMeaning: 'A High Court or Supreme Court order commanding a government officer or department to do the duty required by law.',
  },
  {
    id: 'suo-motu',
    terms: ['suo motu', 'suo moto'],
    label: 'Suo Motu (स्वतः संज्ञान)',
    definition: 'Action taken by a court or authority on its own initiative without a formal complaint or petition being submitted by any party.',
    plainMeaning: 'When a court acts on its own after seeing news reports or gross injustice without waiting for someone to file a petition.',
  },
  {
    id: 'ratio-decidendi',
    terms: ['ratio decidendi', 'ratio'],
    label: 'Ratio Decidendi (निर्णय का मूल आधार)',
    definition: 'The legal principle or rationale upon which a court\'s decision is founded. The ratio of the Supreme Court of India is binding law on all Indian courts under Article 141.',
    plainMeaning: 'The core legal rule decided in a court case that all judges must follow in future similar cases.',
  },
  {
    id: 'obiter-dicta',
    terms: ['obiter dicta', 'obiter dictum'],
    label: 'Obiter Dicta (प्रसङ्गोक्त कथन)',
    definition: 'Observations or statements made by a judge in a judgment that are not essential to the determination of the legal issue and do not establish binding precedent.',
    plainMeaning: 'Incidental judicial remarks that offer legal guidance but are not strictly binding law on lower courts.',
  },
  {
    id: 'prima-facie',
    terms: ['prima facie', 'prima-facie'],
    label: 'Prima Facie (प्रथम दृष्टया)',
    definition: 'A legal determination based on initial impression; evidence that is sufficient to establish a fact or raise a presumption unless disproved or rebutted.',
    plainMeaning: '"At first look"—meaning the evidence on paper looks convincing enough to initiate trial or grant an interim stay order.',
  },
  {
    id: 'promissory-estoppel',
    terms: ['promissory estoppel', 'doctrine of estoppel', 'estoppel'],
    label: 'Promissory Estoppel (विबंध का सिद्धांत)',
    definition: 'Legal principle preventing a party from reneging on a clear promise where the other party reasonably relied on it and acted to their detriment.',
    plainMeaning: 'A party cannot break a formal promise if you already spent money or changed your position based on their commitment.',
  },
]

// Local in-memory / storage cache for dynamically defined terms
const DYNAMIC_JARGON_CACHE = {}

// ── VS CODE STYLE CLEAN FLOATING TOOLTIP ──────────────────────────────────────
function VSCodeJargonTooltip({
  jargon,
  onClose,
  position,
  loading,
  isPinned,
  triggerRef,
  onMouseEnter,
  onMouseLeave,
}) {
  const popoverRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target) &&
        (!triggerRef?.current || !triggerRef.current.contains(e.target))
      ) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose, triggerRef])

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const isTop = position.placement === 'top'

  const content = (
    <motion.div
      ref={popoverRef}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      initial={{ opacity: 0, y: isTop ? 6 : -6, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.12, ease: 'easeOut' }}
      style={{
        position: 'fixed',
        ...(isTop ? { bottom: `${position.bottom}px` } : { top: `${position.top}px` }),
        left: `${position.left}px`,
        width: '330px',
        maxWidth: 'calc(100vw - 24px)',
        zIndex: 99999,
        pointerEvents: 'auto',
      }}
      className={`bg-[#0b0e24]/98 border border-indigo-500/50 rounded-2xl shadow-2xl p-4 text-left text-slate-200 text-xs backdrop-blur-2xl ring-1 ring-white/10 relative select-text ${
        isTop
          ? 'before:content-[""] before:absolute before:-bottom-3 before:left-0 before:right-0 before:h-3 before:bg-transparent'
          : 'before:content-[""] before:absolute before:-top-3 before:left-0 before:right-0 before:h-3 before:bg-transparent'
      }`}
    >
      {/* Title & Actions Bar */}
      <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-white/10">
        <h4 className="text-[13px] font-bold text-white truncate flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
          <span className="truncate">{jargon.label || jargon.term}</span>
        </h4>
        <div className="flex items-center gap-1 shrink-0">
          {isPinned && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-indigo-500/25 text-indigo-300 border border-indigo-500/35">
              Pinned
            </span>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Close explainer"
            aria-label="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-4 flex items-center justify-center gap-2 text-indigo-300">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-xs">Consulting Legal Intelligence…</span>
        </div>
      ) : (
        <>
          {/* Definition */}
          <p className="text-[12px] text-slate-300 leading-relaxed font-sans mb-3">
            {jargon.definition}
          </p>

          {/* Practical Meaning Box */}
          {jargon.plainMeaning && (
            <div className="bg-gradient-to-r from-indigo-950/70 to-purple-950/70 border-l-2 border-indigo-400 p-2.5 rounded-r-xl shadow-inner">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-300 uppercase tracking-wider mb-1">
                <Sparkles className="w-2.5 h-2.5 text-indigo-400 shrink-0" />
                <span>What this means for you</span>
              </div>
              <p className="text-[11.5px] text-slate-200 leading-snug font-sans">
                {jargon.plainMeaning}
              </p>
            </div>
          )}
        </>
      )}

      {/* Micro Footer Notice */}
      <div className="mt-2.5 pt-1.5 border-t border-white/5 flex items-center justify-between text-[9.5px] text-slate-400 font-mono">
        <span>JurisAI Legal Intelligence</span>
        <span className="text-indigo-400/80">
          {isPinned ? 'Click outside to close' : 'Click word to pin • Esc to close'}
        </span>
      </div>
    </motion.div>
  )

  return createPortal(content, document.body)
}

// ── INTERACTIVE HOVER TOKEN ──────────────────────────────────────────────────
function JargonToken({ text, initialJargon }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPinned, setIsPinned] = useState(false)
  const [position, setPosition] = useState({ top: 0, bottom: 0, left: 0, placement: 'top' })
  const [jargonData, setJargonData] = useState(initialJargon)
  const [loading, setLoading] = useState(false)
  const tokenRef = useRef(null)
  const closeTimerRef = useRef(null)

  const cancelCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }

  const scheduleClose = () => {
    cancelCloseTimer()
    if (isPinned) return
    closeTimerRef.current = setTimeout(() => {
      setIsOpen(false)
    }, 240)
  }

  const updatePosition = useCallback(() => {
    if (!tokenRef.current) return
    const rect = tokenRef.current.getBoundingClientRect()
    const tooltipWidth = 330
    const margin = 12

    let left = rect.left + rect.width / 2 - tooltipWidth / 2
    if (left < margin) left = margin
    if (left + tooltipWidth > window.innerWidth - margin) {
      left = window.innerWidth - tooltipWidth - margin
    }

    const spaceAbove = rect.top
    const spaceBelow = window.innerHeight - rect.bottom
    const placement = spaceAbove >= 240 || spaceAbove > spaceBelow ? 'top' : 'bottom'

    // Anchor bottom if placement is top: bottom distance from viewport bottom to trigger top + 8px
    const bottom = window.innerHeight - rect.top + 8
    const top = rect.bottom + 8

    setPosition({ top, bottom, left, placement })
  }, [])

  // Keep position accurate if viewport scrolls or resizes
  useEffect(() => {
    if (!isOpen) return
    const handleScrollOrResize = () => {
      updatePosition()
    }
    window.addEventListener('scroll', handleScrollOrResize, true)
    window.addEventListener('resize', handleScrollOrResize)
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true)
      window.removeEventListener('resize', handleScrollOrResize)
    }
  }, [isOpen, updatePosition])

  // Ensure definition is populated; fetch dynamically via LLM if not present
  const ensureDefinition = async () => {
    if (jargonData && jargonData.definition) return

    const key = text.trim().toLowerCase()
    if (DYNAMIC_JARGON_CACHE[key]) {
      setJargonData(DYNAMIC_JARGON_CACHE[key])
      return
    }

    try {
      const stored = localStorage.getItem(`juris_jargon_${key}`)
      if (stored) {
        const parsed = JSON.parse(stored)
        DYNAMIC_JARGON_CACHE[key] = parsed
        setJargonData(parsed)
        return
      }
    } catch {}

    // Fetch dynamically from LLM backend
    setLoading(true)
    try {
      const res = await apiDefineJargon(text.trim())
      const data = res.data
      DYNAMIC_JARGON_CACHE[key] = data
      setJargonData(data)
      try {
        localStorage.setItem(`juris_jargon_${key}`, JSON.stringify(data))
      } catch {}
    } catch {
      setJargonData({
        label: text,
        definition: 'A specific Indian statutory or procedural legal concept.',
        plainMeaning: 'Consult with an advocate to understand the specific implications for your case.',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleMouseEnter = () => {
    cancelCloseTimer()
    updatePosition()
    setIsOpen(true)
    ensureDefinition()
  }

  const handleMouseLeave = () => {
    scheduleClose()
  }

  const handleClick = (e) => {
    e.stopPropagation()
    cancelCloseTimer()
    updatePosition()
    setIsPinned((prev) => !prev)
    setIsOpen(true)
    ensureDefinition()
  }

  const handleClose = () => {
    cancelCloseTimer()
    setIsOpen(false)
    setIsPinned(false)
  }

  return (
    <>
      <span
        ref={tokenRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        className={`cursor-help inline-block px-0.5 rounded transition-all underline decoration-indigo-400 decoration-dashed underline-offset-4 font-medium text-indigo-200 hover:text-white hover:bg-indigo-500/20 ${
          isOpen ? 'bg-indigo-500/25 text-white' : ''
        }`}
        title="View plain legal explanation"
      >
        {text}
      </span>

      <AnimatePresence>
        {isOpen && (
          <VSCodeJargonTooltip
            jargon={jargonData || { label: text, definition: 'Analyzing legal term…' }}
            position={position}
            loading={loading}
            isPinned={isPinned}
            triggerRef={tokenRef}
            onClose={handleClose}
            onMouseEnter={cancelCloseTimer}
            onMouseLeave={scheduleClose}
          />
        )}
      </AnimatePresence>
    </>
  )
}

// ── MAIN PARSER & HIGHLIGHTER COMPONENT ───────────────────────────────────────
/**
 * LegalJargonExplainer:
 * Scans plain text, matches specific Indian legal jargon terms,
 * and renders clean VS Code-style hover explainers without overflowing tabs.
 */
export default function LegalJargonExplainer({ text }) {
  if (!text || typeof text !== 'string') {
    return text || null
  }

  // Pre-sort dictionary entries by descending term length
  const flatTerms = []
  LEGAL_JARGON_DICTIONARY.forEach((entry) => {
    entry.terms.forEach((term) => {
      flatTerms.push({
        term,
        jargon: entry,
      })
    })
  })
  flatTerms.sort((a, b) => b.term.length - a.term.length)

  const escapedTerms = flatTerms.map((t) => t.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const regex = new RegExp(`\\b(${escapedTerms.join('|')})\\b`, 'gi')

  const parts = []
  let lastIndex = 0
  let match

  while ((match = regex.exec(text)) !== null) {
    const matchIndex = match.index
    const matchedText = match[0]

    if (matchIndex > lastIndex) {
      parts.push(text.slice(lastIndex, matchIndex))
    }

    const matchedLower = matchedText.toLowerCase()
    const matchedEntry = flatTerms.find((t) => t.term.toLowerCase() === matchedLower)?.jargon || {
      label: matchedText,
      terms: [matchedLower],
    }

    parts.push(
      <JargonToken
        key={`jargon-${matchIndex}-${matchedLower}`}
        text={matchedText}
        initialJargon={matchedEntry}
      />
    )

    lastIndex = matchIndex + matchedText.length
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return <span>{parts}</span>
}
