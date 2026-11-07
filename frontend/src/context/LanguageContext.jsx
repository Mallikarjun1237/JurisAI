import React, { createContext, useContext, useState, useEffect } from 'react'
import { Globe, Check, ChevronDown } from 'lucide-react'

export const SUPPORTED_LANGUAGES = [
  {
    code: 'en',
    label: 'English',
    nativeLabel: 'English',
    region: 'Central / High Court / SC',
    stateBadge: 'All-India',
    flag: '🇮🇳',
  },
  {
    code: 'hi',
    label: 'Hindi',
    nativeLabel: 'हिन्दी',
    region: 'उत्तर भारत एवं केन्द्रीय विधिक प्रणाली',
    stateBadge: 'National',
    flag: '🇮🇳',
  },
  {
    code: 'kn',
    label: 'Kannada',
    nativeLabel: 'ಕನ್ನಡ',
    region: 'ಕರ್ನಾಟಕ ನ್ಯಾಯಾಂಗ & ಹೈಕೋರ್ಟ್',
    stateBadge: 'ಕರ್ನಾಟಕ',
    flag: '🇮🇳',
  },
  {
    code: 'te',
    label: 'Telugu',
    nativeLabel: 'తెలుగు',
    region: 'తెలంగాణ & ఆంధ్రప్రదేశ్ న్యాయస్థానాలు',
    stateBadge: 'తెలంగాణ / AP',
    flag: '🇮🇳',
  },
]

const UI_TRANSLATIONS = {
  en: {
    appTitle: 'JurisAI',
    appSubtitle: 'Sovereign Legal Intelligence for Indian Courts · Verified statutes, landmark precedents & authentic valuation slips.',
    searchPlaceholder: 'Describe your legal dispute, FIR issue, contract breach, or statutory question...',
    searchBtn: 'Analyze Case',
    chatNav: 'Case Document Chat',
    limitationNav: 'Limitation & Chronology',
    precedentsNav: 'Supreme Court Precedents',
    bnsNav: 'IPC ⇄ BNS Converter',
    officialDrafts: 'Official Legal Drafts',
    exportPdf: 'Court Brief PDF',
    casesTitle: 'Legal Cases',
    historyTitle: 'Recent Research',
    citizenView: 'Citizen Guide',
    advocateView: 'Advocate Brief',
    statutesFound: 'Applicable Statutory Provisions',
    precedentsFound: 'Binding Precedent Ratios',
    nextSteps: 'Actionable Next Steps & Remedies',
    confidenceScore: 'Confidence Rating',
    riskLevel: 'Legal Risk Level',
    jurisdictionBadge: 'Republic of India Jurisdiction',
    legalSuite: 'Legal Suite',
    advocateDiary: 'Advocate Diary',
    courtFees: 'Court Fees Calculator',
    dpdpShield: 'DPDP Shield',
    newCase: 'New Case',
    upgradePro: 'Upgrade to Pro — Unlimited',
    dailyQueries: 'Daily Queries',
    errorGeneric: 'Something went wrong. Please try again in a moment.',
  },
  hi: {
    appTitle: 'JurisAI (ज्यूरिस एआई)',
    appSubtitle: 'भारतीय न्यायालयीन विधिक अनुसंधान एवं कार्यप्रणाली सुइट · प्रामाणिक अधिनियम, दृष्टांत एवं न्यायालय शुल्क',
    searchPlaceholder: 'अपने विधिक विवाद, प्राथमिकी (FIR), संविदा उल्लंघन या चेक बाउंस का विवरण दें...',
    searchBtn: 'विधिक विश्लेषण करें',
    chatNav: 'प्रकरण दस्तावेज संवाद (Case Chat)',
    limitationNav: 'परिसीमा एवं घटनाक्रम (Limitation)',
    precedentsNav: 'उच्चतम न्यायालय दृष्टांत (Precedents)',
    bnsNav: 'IPC ⇄ BNS परिवर्तक',
    officialDrafts: 'न्यायालयीन विधिक प्रारूप (Legal Drafts)',
    exportPdf: 'न्यायालयीन संक्षेपिका (Court PDF)',
    casesTitle: 'विधिक प्रकरण (Cases)',
    historyTitle: 'अनुसंधान इतिहास (History)',
    citizenView: 'नागरिक सहायता (Citizen Guide)',
    advocateView: 'अधिवक्ता संक्षेपिका (Advocate Brief)',
    statutesFound: 'लागू होने वाले सांविधिक प्रावधान',
    precedentsFound: 'बाध्यकारी न्यायिक निर्णय एवं दृष्टांत',
    nextSteps: 'कार्यवाही के अग्रिम विधिक चरण',
    confidenceScore: 'विधिक प्रमाणिकता स्तर',
    riskLevel: 'विधिक जोखिम स्तर',
    jurisdictionBadge: 'भारतीय न्यायपालिका क्षेत्राधिकार',
    legalSuite: 'विधिक सुइट (Legal Suite)',
    advocateDiary: 'अधिवक्ता डायरी (Advocate Diary)',
    courtFees: 'न्यायालय शुल्क गणक (Court Fees)',
    dpdpShield: 'DPDP शील्ड (डेटा सुरक्षा)',
    newCase: 'नया प्रकरण (New Case)',
    upgradePro: 'प्रो में अपग्रेड करें — असीमित',
    dailyQueries: 'दैनिक प्रश्न सीमा',
    errorGeneric: 'कुछ समस्या आई। कृपया थोड़ी देर बाद पुनः प्रयास करें।',
  },
  kn: {
    appTitle: 'JurisAI (ಜ್ಯೂರಿಸ್ ಎಐ)',
    appSubtitle: 'ಕರ್ನಾಟಕ ನ್ಯಾಯಾಂಗ & ಭಾರತೀಯ ಕಾನೂನು ಮಾಹಿತಿ ಸೂಟ್ · ಅಧಿಕೃತ ಶಾಸನಗಳು, ಹೈಕೋರ್ಟ್ ತೀರ್ಪುಗಳು & ಶುಲ್ಕ ಲೆಕ್ಕಾಚಾರ',
    searchPlaceholder: 'ನಿಮ್ಮ ಕಾನೂನು ವಿವಾದ, ಎಫ್.ಐ.ಆರ್ (FIR), ಒಪ್ಪಂದ ಉಲ್ಲಂಘನೆ ಅಥವಾ ಚೆಕ್ ಬೌನ್ಸ್ ಬಗ್ಗೆ ವಿವರಿಸಿ...',
    searchBtn: 'ಕಾನೂನು ವಿಶ್ಲೇಷಣೆ',
    chatNav: 'ಪ್ರಕರಣ ದಾಖಲೆ ಚಾಟ್ (Case Co-Pilot)',
    limitationNav: 'ಕಾಲಮಿತಿ & ದಿನಾಂಕಗಳ ಪಟ್ಟಿ (Limitation)',
    precedentsNav: 'ಸರ್ವೋಚ್ಚ ನ್ಯಾಯಾಲಯದ ತೀರ್ಪುಗಳು (Precedents)',
    bnsNav: 'IPC ⇄ BNS ಪರಿವರ್ತಕ',
    officialDrafts: 'ಅಧಿಕೃತ ಕಾನೂನು ಕರಡುಗಳು (Legal Drafts)',
    exportPdf: 'ನ್ಯಾಯಾಲಯ ವರದಿ PDF (Court Brief)',
    casesTitle: 'ಕಾನೂನು ಪ್ರಕರಣಗಳು (Cases)',
    historyTitle: 'ಇತ್ತೀಚಿನ ಹುಡುಕಾಟಗಳು (History)',
    citizenView: 'ಸಾರ್ವಜನಿಕ ಮಾರ್ಗದರ್ಶಿ (Citizen Guide)',
    advocateView: 'ವಕೀಲರ ಸಾರಾಂಶ (Advocate Brief)',
    statutesFound: 'ಅನ್ವಯವಾಗುವ ಶಾಸನಬದ್ಧ ಕಲಮುಗಳು',
    precedentsFound: 'ಉಚ್ಚ ನ್ಯಾಯಾಲಯದ ಪ್ರಮುಖ ತೀರ್ಪುಗಳು',
    nextSteps: 'ಮುಂದಿನ ಕ್ರಮಗಳು ಮತ್ತು ಕಾನೂನು ಪರಿಹಾರಗಳು',
    confidenceScore: 'ಕಾನೂನು ನಿಖರತೆಯ ಮಟ್ಟ',
    riskLevel: 'ಕಾನೂನು ಅಪಾಯದ ಮಟ್ಟ',
    jurisdictionBadge: 'ಕರ್ನಾಟಕ ರಾಜ್ಯ ನ್ಯಾಯಾಂಗ & ಭಾರತೀಯ ಕಾನೂನು',
    legalSuite: 'ಕಾನೂನು ಪರಿಕರಗಳು (Legal Suite)',
    advocateDiary: 'ವಕೀಲರ ದಿನಚರಿ (Advocate Diary)',
    courtFees: 'ನ್ಯಾಯಾಲಯ ಶುಲ್ಕ ಲೆಕ್ಕಾಚಾರ (Court Fees)',
    dpdpShield: 'DPDP ರಕ್ಷಣೆ (ಡೇಟಾ ಭದ್ರತೆ)',
    newCase: 'ಹೊಸ ಪ್ರಕರಣ (New Case)',
    upgradePro: 'ಪ್ರೋ ಗೆ ಅಪ್‌ಗ್ರೇಡ್ ಮಾಡಿ — ಅನಿಯಮಿತ',
    dailyQueries: 'ದೈನಂದಿನ ಬಳಕೆ',
    errorGeneric: 'ಏನೋ ತಪ್ಪಾಗಿದೆ. ದಯವಿಟ್ಟು ಸ್ವಲ್ಪ ಸಮಯದ ನಂತರ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.',
  },
  te: {
    appTitle: 'JurisAI (జ్యురిస్ AI)',
    appSubtitle: 'తెలంగాణ & భారతీయ న్యాయ పరిశోధనా వేదిక · అధికారిక చట్టాలు, తీర్పులు & కోర్టు ఫీజుల కాలిక్యులేటర్',
    searchPlaceholder: 'మీ చట్టపరమైన వివాదం, FIR సమస్య, ఒప్పంద ఉల్లంఘన లేదా చెక్ బౌన్స్ వివరాలు నమోదు చేయండి...',
    searchBtn: 'చట్టపరమైన విశ్లేషణ',
    chatNav: 'కేస్ డాక్యుమెంట్ చాట్ (Case Co-Pilot)',
    limitationNav: 'కాలపరిమితి & తేదీల జాబితా (Limitation)',
    precedentsNav: 'సుప్రీంకోర్టు మార్గదర్శక తీర్పులు (Precedents)',
    bnsNav: 'IPC ⇄ BNS కన్వర్టర్',
    officialDrafts: 'అధికారిక లీగಲ್ డ్రాఫ్ట్‌లు (Legal Drafts)',
    exportPdf: 'కోర్టు రిపోర్ట్ PDF (Court Brief)',
    casesTitle: 'న్యాయ వివాదాలు (Cases)',
    historyTitle: 'పరిశోధన చరిత్ర (History)',
    citizenView: 'పౌర సహాయకుడు (Citizen Guide)',
    advocateView: 'న్యాయవాది బ్రీఫ్ (Advocate Brief)',
    statutesFound: 'వర్తించే చట్టబద్ధమైన సెక్షన్లు',
    precedentsFound: 'సుప్రీంకోర్టు & హైకోర్టు మార్గదర్శక తీర్పులు',
    nextSteps: 'తదుపరి చట్టపరమైన చర్యలు & పరిష్కారాలు',
    confidenceScore: 'విశ్వసనీయత రేటింగ్',
    riskLevel: 'న్యాయపరమైన రిస్క్ స్థాయి',
    jurisdictionBadge: 'తెలంగాణ & ఆంధ్రప్రదేశ్ న్యాయవ్యవస్థ',
    legalSuite: 'న్యాయ సాధనాలు (Legal Suite)',
    advocateDiary: 'న్యాయవాది డైరీ (Advocate Diary)',
    courtFees: 'కోర్టు ఫీజుల కాలిక్యులేటర్ (Court Fees)',
    dpdpShield: 'DPDP షీల్డ్ (డేటా రక్షణ)',
    newCase: 'కొత్త కేస్ (New Case)',
    upgradePro: 'ప్రో కి అప్‌గ్రేడ్ చేయండి — అపరిమితం',
    dailyQueries: 'రోజువారీ ప్రశ్నలు',
    errorGeneric: 'ఏదో సమస్య ఎదురైంది. దయచేసి కాసేపటి తర్వాత మళ్లీ ప్రయత్నించండి.',
  },
}

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('jurisai_language') || 'en'
  })

  const setLanguage = (langCode) => {
    localStorage.setItem('jurisai_language', langCode)
    setLanguageState(langCode)
  }

  const t = (key) => {
    const dict = UI_TRANSLATIONS[language] || UI_TRANSLATIONS.en
    return dict[key] || UI_TRANSLATIONS.en[key] || key
  }

  const currentLangObj =
    SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0]

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, currentLangObj }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return ctx
}

export function LanguageSelector({ compact = false, fullWidth = false, align = 'right' }) {
  const { language, setLanguage, currentLangObj } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)

  // Close dropdown on outside click
  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e) => {
      if (!e.target.closest('.language-selector-root')) {
        setIsOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [isOpen])

  const dropdownAlignClass = fullWidth
    ? 'left-0 right-0 w-full'
    : align === 'left'
    ? 'left-0 w-64 max-w-[calc(100vw-1.5rem)]'
    : 'right-0 sm:right-0 max-sm:fixed max-sm:left-4 max-sm:right-4 max-sm:w-auto w-64 max-w-[calc(100vw-1.5rem)]'

  return (
    <div className={`relative language-selector-root ${fullWidth ? 'w-full' : 'inline-block text-left shrink-0'}`}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 transition-all hover:border-indigo-500/40 shadow-sm shrink-0 ${
          fullWidth ? 'w-full justify-between' : ''
        }`}
        title="Select Court & Regional Language (English, हिन्दी, ಕನ್ನಡ, తెలుగు)"
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[10px] font-black text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-1 py-0.5 rounded leading-none shrink-0 tracking-wide">
            IN
          </span>
          <span className="font-semibold text-white whitespace-nowrap text-[13px] sm:text-xs shrink-0">{currentLangObj.nativeLabel}</span>
          {!compact && (
            <span className="hidden sm:inline text-[10px] text-indigo-300 bg-indigo-950/60 px-1.5 py-0.2 rounded border border-indigo-500/30 shrink-0">
              {currentLangObj.stateBadge}
            </span>
          )}
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className={`absolute ${dropdownAlignClass} mt-1.5 rounded-xl bg-[#0c1026] border border-indigo-500/30 shadow-2xl z-[999] overflow-hidden py-1 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100`}>
          <div className="px-3 py-1.5 border-b border-white/5 flex items-center justify-between">
            <p className="text-[9px] uppercase font-bold tracking-wider text-slate-400">
              Judiciary Jurisdiction
            </p>
            <span className="text-[9px] text-indigo-400 font-medium">4 Languages</span>
          </div>

          <div className="divide-y divide-white/5">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = language === lang.code
              return (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code)
                    setIsOpen(false)
                  }}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'bg-indigo-950/60 text-indigo-300'
                      : 'hover:bg-white/5 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                    <span className="text-[10px] font-black text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-1 py-0.5 rounded leading-none shrink-0 tracking-wide">
                      IN
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-white truncate">{lang.nativeLabel}</span>
                        <span className="text-[10px] text-slate-400 truncate">({lang.label})</span>
                      </div>
                      <p className="text-[9px] text-slate-400 truncate">{lang.region}</p>
                    </div>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
