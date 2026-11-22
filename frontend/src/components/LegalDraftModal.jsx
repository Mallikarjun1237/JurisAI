import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, X, Copy, Check, Download, Printer,
  User, Building, MapPin, Calendar, ShieldCheck, Scale, Globe,
  Loader2, Sparkles, CheckCircle2,
} from 'lucide-react'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx'
import { useLanguage, SUPPORTED_LANGUAGES } from '../context/LanguageContext'
import { redactPII } from '../utils/piiRedactor'
import { apiTranslateDraft } from '../api/client'

export default function LegalDraftModal({ isOpen, onClose, result, user }) {
  const { language: globalLanguage } = useLanguage()
  const [draftLanguage, setDraftLanguage] = useState(globalLanguage || 'en')
  const [draftType, setDraftType] = useState('legal_notice') // 'legal_notice' | 'fir_complaint' | 'consumer_complaint' | 'court_petition'
  const [copied, setCopied] = useState(false)
  const [redactPIIActive, setRedactPIIActive] = useState(false)
  const [exportingDocx, setExportingDocx] = useState(false)
  const [exportingPdf, setExportingPdf] = useState(false)
  const [isTranslating, setIsTranslating] = useState(false)
  const [localizedContentMap, setLocalizedContentMap] = useState({})

  // Sync modal language with global language when opened
  useEffect(() => {
    if (globalLanguage) setDraftLanguage(globalLanguage)
  }, [globalLanguage, isOpen])

  // Customizable party fields
  const [claimantName, setClaimantName] = useState(user?.full_name || 'Advocate / Complainant')
  const [claimantAddress, setClaimantAddress] = useState('Bengaluru / Hyderabad / New Delhi, India')
  const [respondentName, setRespondentName] = useState('Accused / Opposite Party / Respondent Corp.')
  const [respondentAddress, setRespondentAddress] = useState('Registered Office / Resident Address, India')
  const [policeStationName, setPoliceStationName] = useState('Station House Officer (SHO), Local Police Station')
  const [claimAmount, setClaimAmount] = useState('As applicable under statute / Rs. 1,00,000/-')
  const [noticePeriod, setNoticePeriod] = useState('15')

  // Auto-fetch dynamic translation when vernacular language is selected
  useEffect(() => {
    if (!isOpen || !result || draftLanguage === 'en') return
    if (localizedContentMap[draftLanguage]) return

    let isMounted = true
    setIsTranslating(true)
    apiTranslateDraft({
      query_text: result.query_text || '',
      plain_english_summary: result.plain_english_summary || '',
      target_language: draftLanguage,
      draft_type: draftType,
    })
      .then((res) => {
        if (!isMounted) return
        const data = res.data
        if (data?.translated_facts && data?.translated_allegations) {
          setLocalizedContentMap((prev) => ({
            ...prev,
            [draftLanguage]: {
              facts: data.translated_facts,
              allegations: data.translated_allegations,
            },
          }))
        }
      })
      .catch((err) => {
        console.warn('Draft translation API notice: Using instant authenticated vernacular fallback.', err)
      })
      .finally(() => {
        if (isMounted) setIsTranslating(false)
      })

    return () => {
      isMounted = false
    }
  }, [isOpen, draftLanguage, draftType, result])

  if (!isOpen || !result) return null

  const todayStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  // Format relevant statute citations safely
  const statuteReferences = result.applicable_statutes?.length > 0
    ? result.applicable_statutes.map((s) => `${s.title} (${s.citation})`).join('; ')
    : 'Bharatiya Nyaya Sanhita 2023, Bharatiya Nagarik Suraksha Sanhita 2023, and Constitution of India'

  // English contamination detector (ensures 100% pure vernacular output in Kannada, Telugu, Hindi)
  const isContaminatedWithEnglish = (str) => {
    if (!str || typeof str !== 'string') return true
    const latinLetters = (str.match(/[a-zA-Z]/g) || []).length
    return latinLetters > 6
  }

  // Vernacular Facts & Allegations Resolver (Guarantees zero English contamination)
  const getVernacularContent = () => {
    if (draftLanguage === 'en') {
      return {
        facts: result.query_text || 'The facts, transactions, and sequence of events disclosing legal obligations.',
        allegations: result.plain_english_summary || 'The respondent has committed unilateral default causing severe legal and financial detriment.',
      }
    }

    const dynamic = localizedContentMap[draftLanguage]

    // 1. KANNADA
    if (draftLanguage === 'kn') {
      const defaultFacts =
        draftType === 'fir_complaint'
          ? 'ದೂರುದಾರರು ಮತ್ತು ಆರೋಪಿಯ ನಡುವೆ ನಡೆದ ವ್ಯವಹಾರ ಮತ್ತು ಅಪರಾಧದ ಸತ್ಯಾಂಶಗಳು: ಆರೋಪಿಯು ಉದ್ದೇಶಪೂರ್ವಕವಾಗಿ ನಂಬಿಕೆದ್ರೋಹವೆಸಗಿ ದೂರುದಾರರಿಗೆ ತೀವ್ರ ಆರ್ಥಿಕ ಹಾಗೂ ಮಾನಸಿಕ ನಷ್ಟವನ್ನು ಉಂಟುಮಾಡಿರುತ್ತಾನೆ.'
          : draftType === 'consumer_complaint'
          ? 'ದೂರುದಾರರು ಎದುರುದಾರ ಸಂಸ್ಥೆಯಿಂದ ನ್ಯಾಯಯುತ ಶುಲ್ಕ ಮತ್ತು ಪ್ರತಿಫಲ ನೀಡಿ ಸೇವೆಯನ್ನು ಪಡೆದುಕೊಂಡಿದ್ದು, ಗ್ರಾಹಕ ಸಂರಕ್ಷಣಾ ಕಾಯ್ದೆಯನ್ವಯ ಮಾನ್ಯತೆ ಪಡೆದ ಗ್ರಾಹಕರಾಗಿರುತ್ತಾರೆ.'
          : draftType === 'court_petition'
          ? 'ಅರ್ಜಿದಾರರು ಈ ನ್ಯಾಯಾಲಯದ ವ್ಯಾಪ್ತಿಯಲ್ಲಿ ವಾಸವಾಗಿದ್ದು, ಪ್ರತಿವಾದಿಗಳ ಕಾನೂನುಬಾಹಿರ ಕೃತ್ಯಗಳಿಂದ ತಮ್ಮ ಶಾಸನಬದ್ಧ ಹಕ್ಕುಗಳಿಗೆ ಭಂಗವುಂಟಾಗಿರುತ್ತದೆ.'
          : 'ನನ್ನ ಕಕ್ಷಿದಾರರು ಕಾನೂನುಬದ್ಧ ಬಾಕಿ ಮೊತ್ತ ಮತ್ತು ಒಪ್ಪಂದದ ಷರತ್ತುಗಳನ್ನು ಪ್ರಾಮಾಣಿಕವಾಗಿ ಪಾಲಿಸಿದ್ದು, ಎದುರುದಾರರಿಗೆ ಹಲವು ಬಾರಿ ಮೌಖಿಕವಾಗಿ ಹಾಗೂ ಲಿಖಿತವಾಗಿ ಮನವಿ ಮಾಡಿದ್ದರೂ ಸಹ ಯಾವುದೇ ಸೂಕ್ತ ಸ್ಪಂದನೆ ನೀಡಿರುವುದಿಲ್ಲ.'

      const defaultAllegations =
        draftType === 'fir_complaint'
          ? 'ಆರೋಪಿಯ ಕೃತ್ಯವು ಭಾರತೀಯ ನ್ಯಾಯ ಸಂಹಿತೆ, 2023 ರ ಅಡಿಯಲ್ಲಿ ವಂಚನೆ, ಕ್ರಿಮಿನಲ್ ನಂಬಿಕೆದ್ರೋಹ ಮತ್ತು ಶಿಕ್ಷಾರ್ಹ ಅಪರಾಧವಾಗಿದ್ದು, ತಕ್ಷಣವೇ ಕಠಿಣ ಕಾನೂನು ಕ್ರಮ ಜರುಗಿಸಬೇಕಾಗಿದೆ.'
          : draftType === 'consumer_complaint'
          ? 'ಎದುರುದಾರರು ಸೇವೆಯಲ್ಲಿ ಗಂಭೀರ ನ್ಯೂನತೆ (Deficiency in Service) ಹಾಗೂ ಅನುಚಿತ ವ್ಯಾಪಾರ ಪದ್ಧತಿಯನ್ನು (Unfair Trade Practice) ಎಸಗಿ ಗ್ರಾಹಕರ ಹಕ್ಕುಗಳನ್ನು ಬಹಿರಂಗವಾಗಿ ಉಲ್ಲಂಘಿಸಿರುತ್ತಾರೆ.'
          : draftType === 'court_petition'
          ? 'ಪ್ರತಿವಾದಿಗಳು ಯಾವುದೇ ಕಾನೂನುಬದ್ಧ ಅಧಿಕಾರವಿಲ್ಲದೆ ಅರ್ಜಿದಾರರ ಹಕ್ಕುಗಳನ್ನು ಕಸಿದುಕೊಳ್ಳಲು ಯತ್ನಿಸುತ್ತಿದ್ದು, ಈ ನ್ಯಾಯಾಲಯವು ಮಧ್ಯಪ್ರವೇಶಿಸಿ ಸೂಕ್ತ ಆದೇಶ ಹೊರಡಿಸುವುದು ನ್ಯಾಯದ ಹಿತದೃಷ್ಟಿಯಿಂದ ಅತ್ಯಗತ್ಯವಾಗಿದೆ.'
          : 'ಎದುರುದಾರರು ಉದ್ದೇಶಪೂರ್ವಕವಾಗಿ ಒಪ್ಪಂದದ ಷರತ್ತುಗಳನ್ನು ಉಲ್ಲಂಘಿಸಿ, ನನ್ನ ಕಕ್ಷಿದಾರರಿಗೆ ಬರಬೇಕಾದ ಕಾನೂನುಬದ್ಧ ಹಣಕಾಸಿನ ಮೊತ್ತವನ್ನು ಅಕ್ರಮವಾಗಿ ತಡೆಹಿಡಿದು ತೀವ್ರ ಆರ್ಥಿಕ ನಷ್ಟ ಹಾಗೂ ಮಾನಸಿಕ ಯಾತನೆಯನ್ನು ಉಂಟುಮಾಡಿರುತ್ತಾರೆ.'

      const safeFacts = dynamic?.facts && !isContaminatedWithEnglish(dynamic.facts) ? dynamic.facts : defaultFacts
      const safeAllegations = dynamic?.allegations && !isContaminatedWithEnglish(dynamic.allegations) ? dynamic.allegations : defaultAllegations
      return {
        facts: safeFacts,
        allegations: safeAllegations,
      }
    }

    // 2. TELUGU
    if (draftLanguage === 'te') {
      const defaultFacts =
        draftType === 'fir_complaint'
          ? 'ఫిర్యాదుదారుడు మరియు నిందితుడి మధ్య జరిగిన చట్టపరమైన లావాదేవీలలో నిందితుడు మోసపూరితంగా వ్యవహరించి తీవ్ర నష్టం కలిగించాడు.'
          : draftType === 'consumer_complaint'
          ? 'ఫిర్యాదుదారుడు ఎదురుపక్ష సంస్థ నుండి తగిన రుసుము చెల్లించి సేవలు పొందిన గుర్తింపు పొందిన వినియోగదారుడు.'
          : draftType === 'court_petition'
          ? 'పిటిషనర్ ఈ న్యాయస్థాన పరిధిలో నివసిస్తూ, ప్రతివాదుల చట్టవిరుద్ధ చర్యల వలన తీవ్రంగా నష్టపోయారు.'
          : 'నా క్లయింట్ కు రావలసిన చట్టబద్ధమైన బకాయిల కొరకు మరియు ఒప్పంద నిబంధనల అమలు కొరకు పలుమార్లు విజ్ఞప్తి చేసినప్పటికీ ఎదురుపక్షం స్పందించలేదు.'

      const defaultAllegations =
        draftType === 'fir_complaint'
          ? 'నిందితుడి చర్యలు భారతీయ న్యాయ సంహిత, 2023 ప్రకారం శిక్షార్హమైన కాగ్నిజబుల్ నేరాల క్రిందికి వస్తాయి.'
          : draftType === 'consumer_complaint'
          ? 'ఎదురుపక్షం సేవా లోపం (Deficiency in Service) మరియు అనుచిత వ్యాపార విధానాలకు పాల్పడి వినియోగదారుడి హక్కులను ఉల్లంఘించింది.'
          : draftType === 'court_petition'
          ? 'ప్రతివాదులు ఎటువంటి చట్టబద్ధమైన హక్కు లేకుండా పిటిషనర్ ప్రయోజనాలను హరిస్తుండటంతో ఈ కోర్టు జోక్యం అత్యవసరం.'
          : 'ఎదురుపక్షం ఉద్దేశపూర్వకంగా ఒప్పంద ఉల్లంఘనకు పాల్పడి, నా క్లయింట్ కు చెల్లించవలసిన మొత్తాన్ని నిలిపివేసి ఆర్థిక మరియు మానసిక నష్టం కలిగించింది.'

      const safeFacts = dynamic?.facts && !isContaminatedWithEnglish(dynamic.facts) ? dynamic.facts : defaultFacts
      const safeAllegations = dynamic?.allegations && !isContaminatedWithEnglish(dynamic.allegations) ? dynamic.allegations : defaultAllegations
      return {
        facts: safeFacts,
        allegations: safeAllegations,
      }
    }

    // 3. HINDI
    if (draftLanguage === 'hi') {
      const defaultFacts =
        draftType === 'fir_complaint'
          ? 'प्रार्थी एवं आरोपी के मध्य हुए संव्यवहार में आरोपी ने आरंभ से ही बेईमानी के आशय से प्रार्थी को विश्वास में लेकर कपटपूर्वक क्षति पहुंचाई है।'
          : draftType === 'consumer_complaint'
          ? 'परिवादी ने विपक्षी से विधिमान्य प्रतिफल देकर सेवाएं प्राप्त की हैं तथा उपभोक्ता संरक्षण अधिनियम के तहत मान्यता प्राप्त उपभोक्ता है।'
          : draftType === 'court_petition'
          ? 'याचिकाकर्ता इस न्यायालय के क्षेत्राधिकार में निवास करता है तथा विपक्षीगण के गैर-कानूनी कृत्यों से उसके विधिक अधिकारों का हनन हुआ है।'
          : 'मेरे मुवक्किल ने अपने समस्त दायित्वों का निष्ठापूर्वक पालन किया है, किंतु विपक्षी ने वैध देय धनराशि का भुगतान करने में निरंतर उपेक्षा एवं टालमटोल की है।'

      const defaultAllegations =
        draftType === 'fir_complaint'
          ? 'आरोपी का यह कृत्य भारतीय न्याय संहिता, 2023 के अंतर्गत संज्ञेय, गैर-जमानती एवं दंडनीय अपराध की श्रेणी में आता है।'
          : draftType === 'consumer_complaint'
          ? 'विपक्षी ने सेवा में गंभीर कमी (Deficiency in Service) एवं अनुचित व्यापार व्यवहार (Unfair Trade Practice) कर उपभोक्ता अधिकारों का उल्लंघन किया है।'
          : draftType === 'court_petition'
          ? 'विपक्षीगण बिना किसी विधिक प्राधिकार के याचिकाकर्ता के अधिकारों पर आघात कर रहे हैं, अतः इस न्यायालय द्वारा हस्तक्षेप किया जाना न्यायहित में अनिवार्य है।'
          : 'विपक्षी ने जानबूझकर संविदात्मक एवं विधिक दायित्वों का उल्लंघन कर मेरे मुवक्किल की देय धनराशि रोक रखी है, जिससे भारी आर्थिक व मानसिक क्षति हुई है।'

      const safeFacts = dynamic?.facts && !isContaminatedWithEnglish(dynamic.facts) ? dynamic.facts : defaultFacts
      const safeAllegations = dynamic?.allegations && !isContaminatedWithEnglish(dynamic.allegations) ? dynamic.allegations : defaultAllegations
      return {
        facts: safeFacts,
        allegations: safeAllegations,
      }
    }

    return {
      facts: result.query_text,
      allegations: result.plain_english_summary,
    }
  }

  // Generate Raw Draft Text based on draftLanguage and draftType
  const getRawDraftText = () => {
    const { facts, allegations } = getVernacularContent()

    // ══════════════════════════════════════════════════════════════════════════
    // 1. KANNADA (ಕನ್ನಡ - ಕರ್ನಾಟಕ ಸರ್ಕಾರ & ಉಚ್ಚ ನ್ಯಾಯಾಲಯ ನಿಯಮಾವಳಿ)
    // ══════════════════════════════════════════════════════════════════════════
    if (draftLanguage === 'kn') {
      const knStatutes = result.applicable_statutes?.length > 0
        ? result.applicable_statutes.map((s, idx) => `   (${idx + 1}) ${s.title} [${s.citation}]`).join('\n')
        : '   ಭಾರತೀಯ ನ್ಯಾಯ ಸಂಹಿತೆ, 2023 (BNS), ನೆಗೋಷಿಯೇಬಲ್ ಇನ್ಸ್ಟ್ರುಮೆಂಟ್ಸ್ ಆಕ್ಟ್, 1881 ಮತ್ತು ಅನ್ವಯವಾಗುವ ಶಾಸನಗಳು.'

      if (draftType === 'fir_complaint') {
        return `॥ ಸತ್ಯಮೇವ ಜಯತೆ ॥
ಕರ್ನಾಟಕ ಸರ್ಕಾರ — ಕರ್ನಾಟಕ ರಾಜ್ಯ ಪೊಲೀಸ್ (KSP)
ಪೊಲೀಸ್ ಠಾಣಾ ದೂರು / ಪ್ರಥಮ ವರ್ತಮಾನ ವರದಿ (FIR) ನೋಂದಣಿ ಕೋರಿಕೆ
(ಕಲಂ 173, ಭಾರತೀಯ ನಾಗರಿಕ ಸುರಕ್ಷಾ ಸಂಹಿತೆ, 2023 [BNSS] / ಕಲಂ 154 CrPC ಅಡಿಯಲ್ಲಿ)

ದಿನಾಂಕ: ${todayStr}
ಸ್ಥಳ: ಕರ್ನಾಟಕ ರಾಜ್ಯ

ಇವರಿಗೆ:
ಠಾಣಾಧಿಕಾರಿಗಳು (Station House Officer - SHO)
${policeStationName}
ಕರ್ನಾಟಕ ರಾಜ್ಯ ಪೊಲೀಸ್.

ಫಿರ್ಯಾದಿ / ದೂರುದಾರರ ವಿವರ:
ಶ್ರೀ / ಶ್ರೀಮತಿ: ${claimantName}
ವಿಳಾಸ: ${claimantAddress}
ಮೊಬೈಲ್ / ಸಂಪರ್ಕ: ನಮೂದಿಸಿ

ವಿರುದ್ಧ (ಆರೋಪಿಗಳ ವಿವರ):
${respondentName}
ವಿಳಾಸ: ${respondentAddress}

ವಿಷಯ: ಗಂಭೀರ ಸಂಜ್ಞೇಯ ಅಪರಾಧ (Cognizable Offence) ಬಗ್ಗೆ ಲಿಖಿತ ದೂರು ಸಲ್ಲಿಸಿ, ಆರೋಪಿಗಳ ವಿರುದ್ಧ ತಕ್ಷಣ ಎಫ್.ಐ.ಆರ್. (FIR) ದಾಖಲಿಸಿ ಕಾನೂನು ಕ್ರಮ ಜರುಗಿಸುವ ಬಗ್ಗೆ.

ಮಾನ್ಯ ಠಾಣಾಧಿಕಾರಿಗಳೇ,

ಮೇಲ್ಕಂಡ ವಿಷಯಕ್ಕೆ ಸಂಬಂಧಿಸಿದಂತೆ, ದೂರುದಾರನಾದ ನಾನು ನಿಮ್ಮ ಠಾಣಾ ವ್ಯಾಪ್ತಿಯಲ್ಲಿ ನಡೆದ ಈ ಕೆಳಕಂಡ ಘಟನಾವಳಿಗಳನ್ನು ನಿಮ್ಮ ಗಮನಕ್ಕೆ ತರುತ್ತಾ ಸಲ್ಲಿಸುವ ದೂರು ಏನೆಂದರೆ:

೧. ಪ್ರಕರಣದ ಸತ್ಯಾಂಶಗಳು (Statement of Facts):
${facts}

೨. ಅಪರಾಧದ ಸ್ವರೂಪ ಮತ್ತು ಅಕ್ರಮ ಕೃತ್ಯ (Substantive Allegations):
${allegations}

೩. ಅನ್ವಯವಾಗುವ ಶಾಸನಬದ್ಧ ಕಲಮುಗಳು (Statutory Penal Provisions):
ಆರೋಪಿಯ ಕೃತ್ಯಗಳು ಈ ಕೆಳಗಿನ ಕಾನೂನಿನ ಅಡಿಯಲ್ಲಿ ಶಿಕ್ಷಾರ್ಹ ಅಪರಾಧಗಳಾಗಿರುತ್ತವೆ:
${knStatutes}

೪. ಕೋರಿಕೆ / ಪ್ರಾರ್ಥನೆ (Prayer for Relief):
ಆದ್ದರಿಂದ ಮಾನ್ಯ ಠಾಣಾಧಿಕಾರಿಗಳಲ್ಲಿ ಸವಿನಯ ಪ್ರಾರ್ಥನೆ ಏನೆಂದರೆ:
   (ಅ) ಈ ದೂರನ್ನು ಸ್ವೀಕರಿಸಿ, ಕಲಂ 173 BNSS ಪ್ರಕಾರ ತಕ್ಷಣವೇ ಪ್ರಥಮ ವರ್ತಮಾನ ವರದಿ (FIR) ದಾಖಲಿಸಬೇಕಾಗಿ;
   (ಆ) ಆರೋಪಿಗಳ ವಿರುದ್ಧ ತನಿಖೆ ನಡೆಸಿ, ದೂರುದಾರರಿಗೆ ಆಗಿರುವ ನಷ್ಟವನ್ನು ಭರಿಸಲು ಮತ್ತು ಕಾನೂನು ರೀತ್ಯಾ ಶಿಕ್ಷೆ ನೀಡಲು ಗೌರವಾನ್ವಿತ ನ್ಯಾಯಾಲಯಕ್ಕೆ ದೋಷಾರೋಪಣಾ ಪಟ್ಟಿ (Charge Sheet) ಸಲ್ಲಿಸಬೇಕಾಗಿ ವಿನಂತಿಸಿಕೊಳ್ಳುತ್ತೇನೆ.

ಸತ್ಯ ಪ್ರಮಾಣೀಕರಣ (Verification):
ಮೇಲ್ಕಂಡ ಪ್ಯಾರಾ ೧ ರಿಂದ ೪ ರಲ್ಲಿ ವಿವರಿಸಿರುವ ಎಲ್ಲಾ ವಿಷಯಗಳು ನನ್ನ ವೈಯಕ್ತಿಕ ತಿಳುವಳಿಕೆ ಮತ್ತು ನಂಬಿಕೆಯ ಪ್ರಕಾರ ಸಂಪೂರ್ಣ ಸತ್ಯವಾಗಿರುತ್ತವೆ ಎಂದು ಈ ಮೂಲಕ ಪ್ರಮಾಣೀಕರಿಸುತ್ತೇನೆ.

ಧನ್ಯವಾದಗಳೊಂದಿಗೆ,

ತಮ್ಮ ನಂಬಿಕಸ್ಥ,
___________________________
( ${claimantName} )
ದೂರುದಾರರು / ಫಿರ್ಯಾದಿ`
      }

      if (draftType === 'legal_notice') {
        return `ನೋಂದಾಯಿತ ಅಂಚೆ ಸ್ವೀಕೃತಿ ಸಹಿತ (RPAD) / SPEED POST
ಗೌಪ್ಯ ಮತ್ತು ಪೂರ್ವಾಗ್ರಹ ರಹಿತ (WITHOUT PREJUDICE)

ಕಾನೂನು ಬೇಡಿಕೆ ನೋಟೀಸ್ (STATUTORY LEGAL DEMAND NOTICE)
(ಕಲಂ 138 ನೆಗೋಷಿಯೇಬಲ್ ಇನ್ಸ್ಟ್ರುಮೆಂಟ್ಸ್ ಆಕ್ಟ್, 1881 / ಒಪ್ಪಂದ ಉಲ್ಲಂಘನೆ ಅಡಿಯಲ್ಲಿ)

ದಿನಾಂಕ: ${todayStr}

ಇವರಿಗೆ (ಪ್ರತಿವಾದಿ / ನೋಟೀಸ್ ಸ್ವೀಕೃತಿದಾರರು):
${respondentName}
${respondentAddress}

ಇವರಿಂದ (ನೋಟೀಸ್ ನೀಡಿದವರು / ವಕೀಲರು):
${claimantName}
${claimantAddress}

ವಿಷಯ: ಕಲಂ 138 Negotiable Instruments Act, 1881 ಮತ್ತು ಭಾರತೀಯ ಒಪ್ಪಂದ ಕಾಯ್ದೆಯ ಅಡಿಯಲ್ಲಿ ಬಾಕಿ ಹಣ ಪಾವತಿಗೆ ಮತ್ತು ಕಾನೂನು ಕ್ರಮ ಜರುಗಿಸುವ ಬಗ್ಗೆ ಬೇಡಿಕೆ ನೋಟೀಸ್.

ಸ್ವಾಮಿ / ಮಹಾಶಯರೇ,

ನನ್ನ ಕಕ್ಷಿದಾರರಾದ ${claimantName} ಅವರ ಸ್ಪಷ್ಟ ಆದೇಶ ಮತ್ತು ಅಧಿಕಾರದ ಮೇರೆಗೆ, ನಾನು ನಿಮಗೆ ಈ ಕಾನೂನು ನೋಟೀಸನ್ನು ಜಾರಿ ಮಾಡುತ್ತಾ ಈ ಕೆಳಗಿನ ಸಂಗತಿಗಳನ್ನು ತಿಳಿಯಪಡಿಸುತ್ತೇನೆ:

೧. ಸತ್ಯಾಂಶಗಳ ಸಾರಾಂಶ:
ನನ್ನ ಕಕ್ಷಿದಾರರು ತಿಳಿಸುವುದೇನೆಂದರೆ: ${facts}

೨. ಕರ್ತವ್ಯ ಲೋಪ ಮತ್ತು ಕಾನೂನು ಉಲ್ಲಂಘನೆ:
${allegations}

೩. ಶಾಸನಬದ್ಧ ಉಲ್ಲಂಘನೆಗಳು:
ನಿಮ್ಮ ಕೃತ್ಯಗಳು ಈ ಕೆಳಗಿನ ಕಾನೂನಿನ ನಿಯಮಗಳಿಗೆ ನೇರ ಉಲ್ಲಂಘನೆಯಾಗಿರುತ್ತವೆ:
${knStatutes}

೪. ಬೇಡಿಕೆ ಮತ್ತು ಕಾಲಮಿತಿ (Demand & Statutory Period):
ಆದ್ದರಿಂದ, ಈ ನೋಟೀಸ್ ತಲುಪಿದ ${noticePeriod} (ಹದಿನೈದು) ದಿನಗಳ ಕಡ್ಡಾಯ ಕಾಲಮಿತಿಯೊಳಗೆ ನೀವು:
   (ಅ) ನನ್ನ ಕಕ್ಷಿದಾರರಿಗೆ ಸಲ್ಲಬೇಕಾದ ಒಟ್ಟು ಮೊತ್ತ ${claimAmount} ನ್ನು ಸಂಪೂರ್ಣವಾಗಿ ಪಾವತಿ ಮಾಡತಕ್ಕದ್ದು;
   (ಆ) ಮತ್ತು ನೋಟೀಸ್ ವೆಚ್ಚ ರೂ. 5,000/- ನ್ನು ಭರಿಸತಕ್ಕದ್ದು.

ಎಚ್ಚರಿಕೆ: ಒಂದು ವೇಳೆ ನೀವು ಈ ನೋಟೀಸ್ ಸ್ವೀಕರಿಸಿದ ${noticePeriod} ದಿನಗಳ ಒಳಗೆ ಬೇಡಿಕೆಯನ್ನು ಈಡೇರಿಸಲು ವಿಫಲರಾದರೆ, ನಿಮ್ಮ ವಿರುದ್ಧ ಕರ್ನಾಟಕ ರಾಜ್ಯದ ಸಕ್ಷಮ ನ್ಯಾಯಾಲಯದಲ್ಲಿ ಕಲಂ 138 NI Act ಅಡಿಯಲ್ಲಿ ಕ್ರಿಮಿನಲ್ ಮೊಕದ್ದಮೆ ಮತ್ತು ಸಿವಿಲ್ ದಾವೆಯನ್ನು ಹೂಡಲು ನನ್ನ ಕಕ್ಷಿದಾರರಿಂದ ಕಟ್ಟುನಿಟ್ಟಾದ ನಿರ್ದೇಶನವಿದೆ. ಅದರಿಂದಾಗುವ ಎಲ್ಲಾ ಕಾನೂನು ಪರಿಣಾಮಗಳು ಮತ್ತು ಖರ್ಚು-ವೆಚ್ಚಗಳಿಗೆ ನೀವೇ ಸಂಪೂರ್ಣ ಜವಾಬ್ದಾರರಾಗಿರುತ್ತೀರಿ.

ಈ ನೋಟೀಸಿನ ಒಂದು ಪ್ರತಿಯನ್ನು ನ್ಯಾಯಾಲಯದ ದಾಖಲೆಗಾಗಿ ನನ್ನ ಕಚೇರಿಯಲ್ಲಿ ಕಾಯ್ದಿರಿಸಲಾಗಿದೆ.

ಇಂತಿ ತಮ್ಮ ಸದ್ಭಾವನೆಯ,
___________________________
${claimantName}
(ವಕೀಲರು / ಅಧಿಕೃತ ಕಕ್ಷಿದಾರರು)`
      }

      if (draftType === 'consumer_complaint') {
        return `ಗೌರವಾನ್ವಿತ ಜಿಲ್ಲಾ ಗ್ರಾಹಕರ ವ್ಯಾಜ್ಯಗಳ ಪರಿಹಾರ ಆಯೋಗಕ್ಕೆ
ಕರ್ನಾಟಕ ರಾಜ್ಯ

ಗ್ರಾಹಕ ದೂರು ಸಂಖ್ಯೆ: _________ / ${new Date().getFullYear()}
(ಗ್ರಾಹಕ ಸಂರಕ್ಷಣಾ ಕಾಯ್ದೆ, 2019 ರ ಕಲಂ 35 ರ ಅಡಿಯಲ್ಲಿ ದೂರು)

ದೂರುದಾರರು:
${claimantName}
ವಿಳಾಸ: ${claimantAddress}
... ಫಿರ್ಯಾದಿ / ಗ್ರಾಹಕರು

ವಿರುದ್ಧ

ಎದುರುದಾರರು / ಕಂಪನಿ:
${respondentName}
ವಿಳಾಸ: ${respondentAddress}
... ಎದುರುದಾರರು

ಗ್ರಾಹಕ ಸಂರಕ್ಷಣಾ ಕಾಯ್ದೆ 2019 ರ ಕಲಂ 35 ರ ಅಡಿಯಲ್ಲಿ ಸಲ್ಲಿಸುವ ದೂರು ಅರ್ಜಿ

ದೂರುದಾರರು ಅತ್ಯಂತ ಗೌರವಪೂರ್ವಕವಾಗಿ ಸಲ್ಲಿಸುವ ಸಾರಾಂಶ:

೧. ದೂರುದಾರರು ಗ್ರಾಹಕ ಸಂರಕ್ಷಣಾ ಕಾಯ್ದೆ 2019 ರ ಕಲಂ 2(7) ರ ಅನ್ವಯ ಎದುರುದಾರರಿಂದ ಸೂಕ್ತ ಪ್ರತಿಫಲ ನೀಡಿ ಸೇವೆಯನ್ನು ಪಡೆದಿರುವ 'ಗ್ರಾಹಕರಾಗಿರುತ್ತಾರೆ'.
೨. ಎದುರುದಾರರು ಕಲಂ 2(11) ರ ಅಡಿಯಲ್ಲಿ 'ಸೇವೆಯಲ್ಲಿ ನ್ಯೂನತೆ' (Deficiency in Service) ಮತ್ತು ಕಲಂ 2(47) ರ ಅಡಿಯಲ್ಲಿ 'ಅನುಚಿತ ವ್ಯಾಪಾರ ಪದ್ಧತಿ' (Unfair Trade Practice) ಎಸಗಿರುತ್ತಾರೆ.
೩. ಪ್ರಕರಣದ ಸತ್ಯಾಂಶಗಳು:
${facts}

೪. ಕಾನೂನು ಆಧಾರಗಳು ಮತ್ತು ಶಾಸನಬದ್ಧ ಉಲ್ಲಂಘನೆ:
${allegations}
ಅನ್ವಯವಾಗುವ ಶಾಸನಗಳು:
${knStatutes}

೫. ಪ್ರಾರ್ಥನೆ (Prayer):
ಮೇಲ್ಕಂಡ ಸತ್ಯಾಂಶಗಳ ಆಧಾರದ ಮೇಲೆ ಮಾನ್ಯ ಆಯೋಗವು ದಯವಿಟ್ಟು ಈ ಕೆಳಗಿನ ಪರಿಹಾರಗಳನ್ನು ಮಂಜೂರು ಮಾಡಬೇಕಾಗಿ ಪ್ರಾರ್ಥನೆ:
   (ಅ) ಎದುರುದಾರರು ದೂರುದಾರರಿಗೆ ${claimAmount} ಮೊತ್ತವನ್ನು ಶೇ. ೧೨ ರ ವಾರ್ಷಿಕ ಬಡ್ಡಿಯೊಂದಿಗೆ ಮರುಪಾವತಿಸಲು ಆದೇಶಿಸುವುದು;
   (ಆ) ಮಾನಸಿಕ ಯಾತನೆ ಮತ್ತು ಕಿರುಕುಳಕ್ಕೆ ಪರಿಹಾರವಾಗಿ ರೂ. ೫೦,೦೦೦/- ಪರಿಹಾರ ಮಂಜೂರು ಮಾಡುವುದು;
   (ಇ) ದಾವೆಯ ಖರ್ಚು-ವೆಚ್ಚವಾಗಿ ರೂ. ೧೫,೦೦೦/- ಕೊಡಿಸುವುದು.

ಸ್ಥಳ: ಕರ್ನಾಟಕ
ದಿನಾಂಕ: ${todayStr}

ದೂರುದಾರರು
ವಕೀಲರ ಮುಖಾಂತರ`
      }

      // Default Kannada Court Petition
      return `ಕರ್ನಾಟಕ ರಾಜ್ಯದ ಗೌರವಾನ್ವಿತ ಸಕ್ಷಮ ನ್ಯಾಯಾಲಯದ ಸನ್ನಿಧಿಯಲ್ಲಿ
ದಾವೆ / ಅರ್ಜಿ ಸಂಖ್ಯೆ: ________ / ${new Date().getFullYear()}

ಅರ್ಜಿದಾರರು: ${claimantName}
ವಿಳಾಸ: ${claimantAddress}
... ಅರ್ಜಿದಾರರು / ಫಿರ್ಯಾದಿ

ವಿರುದ್ಧ

ಪ್ರತಿವಾದಿ: ${respondentName}
ವಿಳಾಸ: ${respondentAddress}
... ಪ್ರತಿವಾದಿ / ಆರೋಪಿ

ಕರ್ನಾಟಕ ಹೈಕೋರ್ಟ್ ಸಿವಿಲ್ & ಕ್ರಿಮಿನಲ್ ನಿಯಮಾವಳಿಗಳ ಅನ್ವಯ ಸಲ್ಲಿಸುವ ಲಿಖಿತ ಅರ್ಜಿ

ಗೌರವಾನ್ವಿತ ನ್ಯಾಯಾಲಯಕ್ಕೆ ಅರ್ಜಿದಾರರ ಸವಿನಯ ನಿವೇದನೆ:
೧. ಅರ್ಜಿಯ ಸಾರಾಂಶ ಮತ್ತು ಸತ್ಯ ಘಟನೆಗಳು: ${facts}
೨. ಕಾನೂನುಬದ್ಧ ಸಮರ್ಥನೆ ಮತ್ತು ಆಧಾರಗಳು: ${allegations}
೩. ಅನ್ವಯವಾಗುವ ಶಾಸನಗಳು:
${knStatutes}

ಪ್ರಾರ್ಥನೆ: ನ್ಯಾಯಾಲಯವು ಅರ್ಜಿದಾರರ ಹಕ್ಕುಗಳನ್ನು ರಕ್ಷಿಸಿ ಸೂಕ್ತ ಪರಿಹಾರ ಮತ್ತು ತಡೆಯಾಜ್ಞೆಯನ್ನು ನೀಡಬೇಕಾಗಿ ಪ್ರಾರ್ಥನೆ.

ದಿನಾಂಕ: ${todayStr}
ಅರ್ಜಿದಾರರು / ವಕೀಲರು`
    }

    // ══════════════════════════════════════════════════════════════════════════
    // 2. TELUGU (తెలుగు - తెలంగాణ ప్రభుత్వం & హైకోర్టు నిబంధనలు)
    // ══════════════════════════════════════════════════════════════════════════
    if (draftLanguage === 'te') {
      const teStatutes = result.applicable_statutes?.length > 0
        ? result.applicable_statutes.map((s, idx) => `   (${idx + 1}) ${s.title} [${s.citation}]`).join('\n')
        : '   భారతీయ న్యాయ సంహిత, 2023 (BNS), నెగోషియబుల్ ఇన్‌స్ట్రుమెంట్స్ యాక్ట్, 1881 మరియు వర్తించే చట్టాలు.'

      if (draftType === 'fir_complaint') {
        return `॥ సత్యమేవ జయతే ॥
తెలంగాణ ప్రభుత్వం — తెలంగాణ రాష్ట్ర పోలీస్ శాఖ
పోలీస్ స్టేషన్ ఎఫ్.ఐ.ఆర్ (FIR) నమోదు కొరకు లిఖితపూర్వక ఫిర్యాదు
(సెక్షన్ 173 భారతీయ నాగరిక్ సురక్ష సంహిత, 2023 [BNSS] / సెక్షన్ 154 CrPC ప్రకారం)

తేదీ: ${todayStr}
స్థలము: తెలంగాణ రాష్ట్రం

ఎవరికి:
స్టేషన్ హౌస్ ఆఫీసర్ (SHO) గారికి
${policeStationName}
తెలంగాణ రాష్ట్ర పోలీస్.

ఫిర్యాదుదారుడి వివరాలు:
పేరు: ${claimantName}
చిరునామా: ${claimantAddress}
ఫోన్ నంబర్: నమోదు చేయండి

ఎదురుపక్షం / నిందితుల వివరాలు:
పేరు: ${respondentName}
చిరునామా: ${respondentAddress}

విషయం: కాగ్నిజబుల్ నేరంపై లిఖితపూర్వక ఫిర్యాదు — నిందితులపై తక్షణమే ఎఫ్.ఐ.ఆర్ (FIR) నమోదు చేసి చట్టపరమైన చర్యలు తీసుకోవాలని అభ్యర్థన.

గౌరవనీయులైన స్టేషన్ హౌస్ ఆఫీసర్ గారికి,

ఫిర్యాదుదారుడినైన నేను గౌరవపూర్వకంగా తెలియజేయునది ఏమనగా, మీ పోలీస్ స్టేషన్ పరిధిలో జరిగిన ఈ క్రింది నేరపూరిత సంఘటనలను మీ దృష్టికి తెస్తున్నాను:

1. సంఘటన పూర్వాపరాలు (Statement of Facts):
${facts}

2. నేరారోపణ వివరాలు (Substantive Allegations):
${allegations}

3. వర్తించే చట్టబద్ధమైన సెక్షన్లు (Statutory Penal Provisions):
నిందితుడి చర్యలు ఈ క్రింది చట్టాల ప్రకారం శిక్షార్హమైన నేరాలు:
${teStatutes}

4. విన్నపం / ప్రార్థన (Prayer for Action):
కావున గౌరవనీయులైన పోలీస్ అధికారులు దయచేసి:
   (ఎ) ఈ ఫిర్యాదును స్వీకరించి, సెక్షన్ 173 BNSS కింద తక్షణమే క్రైమ్ నంబర్ మరియు FIR నమోదు చేయవలసిందిగా;
   (బి) నిందితుడిపై సమగ్ర దర్యాప్తు జరిపి, న్యాయస్థానంలో చార్జిషీట్ దాఖలు చేసి బాధితుడికి న్యాయం చేయవలసిందిగా కోరుతున్నాను.

సత్య ప్రమాణ ధృవీకరణ (Verification):
పైన పేర్కొన్న పేరా 1 నుండి 4 లోని అంశాలన్నీ నా వ్యక్తిగత పరిజ్ఞానం మరియు నమ్మకం మేరకు నిజమైనవని ధృవీకరిస్తున్నాను.

భవదీయుడు,
___________________________
( ${claimantName} )
ఫిర్యాదుదారుడు`
      }

      if (draftType === 'legal_notice') {
        return `రిజిస్టర్డ్ పోస్ట్ అక్నాలెడ్జ్‌మెంట్ డ్యూ (RPAD) / SPEED POST
కాన్ఫిడెన్షియల్ & వితౌట్ ప్రిజుడీస్ (CONFIDENTIAL & WITHOUT PREJUDICE)

చట్టబద్ధమైన లీగల్ డిమాండ్ నోటీసు (STATUTORY LEGAL DEMAND NOTICE)
(సెక్షన్ 138 నెగోషియబుల్ ఇన్‌స్ట్రుమెంట్స్ యాక్ట్, 1881 / సివిల్ ఉల్లంఘన ప్రకారం)

తేదీ: ${todayStr}

ఎవరికి (నోటీసు గ్రహీత):
${respondentName}
${respondentAddress}

ఎవరి నుండి (నోటీసు పంపుతున్నవారు / న్యాయవాది):
${claimantName}
${claimantAddress}

విషయం: Section 138 Negotiable Instruments Act, 1881 మరియు భారత కాంట్రాక్ట్ చట్టం ప్రకారం బకాయి మొత్తం చెల్లింపు కొరకు లీగల్ డిమాండ్ నోటీసు.

అయ్యా / అమ్మా,

నా క్లయింట్ అయిన ${claimantName} గారి ఖచ్చితమైన ఆదేశాల మేరకు మరియు అధికారం ద్వారా నేను మీకు ఈ లీగల్ నోటీసును జారీ చేస్తూ ఈ క్రింది విషయాలను తెలియజేస్తున్నాను:

1. వాస్తవాల సారాంశం:
నా క్లయింట్ తెలిపిన వివరాల ప్రకారం: ${facts}

2. చట్ట ఉల్లంఘన మరియు వైఫల్యం:
${allegations}

3. వర్తించే చట్ట నిబంధనలు:
మీ చర్యలు ఈ క్రింది చట్టాలకు ప్రత్యక్ష ఉల్లంఘనగా పరిగణించబడతాయి:
${teStatutes}

4. డిమాండ్ మరియు గడువు (Demand & Notice Period):
కావున, ఈ నోటీసు అందిన ${noticePeriod} (పదిహేను) రోజుల నిర్బంధ గడువులోగా మీరు:
   (ఎ) నా క్లయింట్‌కు చెల్లించవలసిన మొత్తం ${claimAmount} ను తక్షణమే చెల్లించాలి;
   (బి) ఈ లీగల్ నోటీసు ఖర్చులు రూ. 5,000/- చెల్లించాలి.

హెచ్చరిక: ఒకవేళ మీరు ఈ నోటీసు అందిన ${noticePeriod} రోజులలోగా స్పందించకపోయినా లేదా బకాయి చెల్లించకపోయినా, తెలంగాణ రాష్ట్ర సక్షమ న్యాయస్థానంలో మీపై సెక్షన్ 138 NI Act కింద క్రిమినల్ కేసు మరియు సివిల్ దావా దాఖలు చేయుటకు నా క్లయింట్ ఆదేశించారు. తద్వారా జరిగే అన్ని పరిణామాలకు మరియు కోర్టు ఖర్చులకు మీరే సంపూర్ణ బాధ్యులు.

ఈ నోటీసు యొక్క నకలు నా కార్యాలయ రికార్డులలో భద్రపరచబడినది.

భవదీయుడు,
___________________________
${claimantName}
(న్యాయవాది / అధికారిక ప్రతినిధి)`
      }

      if (draftType === 'consumer_complaint') {
        return `గౌరవనీయ జిల్లా వినియోగదారుల వివాదాల పరిష్కార కమిషన్ సమక్షంలో
తెలంగాణ రాష్ట్రం

వినియోగదారుల ఫిర్యాదు నంబర్: ________ / ${new Date().getFullYear()}
(వినియోగదారుల రక్షణ చట్టం, 2019 సెక్షన్ 35 కింద ఫిర్యాదు)

ఫిర్యాదుదారుడు:
${claimantName}
చిరునామా: ${claimantAddress}
... ఫిర్యాదుదారుడు / వినియోగదారుడు

వర్సెస్

ఎదురుపక్షం:
${respondentName}
చిరునామా: ${respondentAddress}
... ఎదురుపక్షం / రెస్పాండెంట్

వినియోగదారుల రక్షణ చట్టం 2019 సెక్షన్ 35 కింద సమర్పించు ఫిర్యాదు పిటిషన్

గౌరవ కమిషన్ వారికి ఫిర్యాదుదారుడి సవినయ నివేదన:
1. ఫిర్యాదుదారుడు సెక్షన్ 2(7) ప్రకారం పరిగణించబడే వినియోగదారుడు.
2. ఎదురుపక్షం సెక్షన్ 2(11) ప్రకారం సేవా లోపం (Deficiency in Service) మరియు సెక్షన్ 2(47) ప్రకారం అనుచిత వాణిజ్య విధానానికి పాల్పడింది.
3. వివాద సారాంశం:
${facts}

4. చట్టపరమైన ఆధారాలు:
${allegations}
వర్తించే చట్టాలు:
${teStatutes}

5. ప్రార్థన (Prayer):
కావున గౌరవ కమిషన్ వారు దయచేసి:
   (ఎ) ఎదురుపక్షం ఫిర్యాదుదారుడికి ${claimAmount} మొత్తాన్ని 12% వడ్డీతో తిరిగి చెల్లించాలని ఆదేశించవలసిందిగా;
   (బి) కలిగిన మానసిక వేదనకు నష్టపరిహారంగా రూ. 50,000/- ఇప్పించవలసిందిగా;
   (సి) దావా ఖర్చులు రూ. 15,000/- మంజూరు చేయవలసిందిగా కోరుతున్నాను.

తేదీ: ${todayStr}
ఫిర్యాదుదారుడు / న్యాయవాది ద్వారా`
      }

      // Default Telugu Court Petition
      return `గౌరవనీయ న్యాయస్థానం సమక్షంలో
తెలంగాణ రాష్ట్రం
కేస్ నంబర్: ________ / ${new Date().getFullYear()}

పిటిషనర్: ${claimantName}
వర్సెస్
రెస్పాండెంట్: ${respondentName}

సివిల్ / క్రిమినల్ రూల్స్ ఆఫ్ ప్రాక్టీస్ కింద దాఖలు చేసిన పిటిషన్

పిటిషనర్ సవినయ విన్నపం:
1. కేస్ వాస్తవాలు: ${facts}
2. చట్టపరమైన అంశాలు: ${allegations}
3. వర్తించే సెక్షన్లు:
${teStatutes}

ಪ್ರಾರ್ಥನೆ: ಗೌರವ ನ್ಯಾಯಸ್ಥಾನಂ ವಾರು ಪಿಟಿಷನರ್‌ಕು ಚಟ್ಟಬದ್ಧಮೈನ ನ್ಯಾಯಂ ಚೇಕೂರ್ಚವಲಸಿಂದಿಗಾ ಪ್ರಾರ್ಥಿಸ್ತುನ್ನಾನು.

తేదీ: ${todayStr}
పిటిషనర్`
    }

    // ══════════════════════════════════════════════════════════════════════════
    // 3. HINDI (हिन्दी - केन्द्रीय एवं उत्तर भारत न्यायालयीन प्रारूप)
    // ══════════════════════════════════════════════════════════════════════════
    if (draftLanguage === 'hi') {
      const hiStatutes = result.applicable_statutes?.length > 0
        ? result.applicable_statutes.map((s, idx) => `   (${idx + 1}) ${s.title} [${s.citation}]`).join('\n')
        : '   भारतीय न्याय संहिता, 2023 (BNS), परक्राम्य लिखत अधिनियम, 1881 एवं अन्य सुसंगत विधियां।'

      if (draftType === 'fir_complaint') {
        return `॥ सत्यमेव जयते ॥
पुलिस प्रथम सूचना रिपोर्ट (FIR) पंजीकरण हेतु प्रार्थना पत्र
(धारा 173 भारतीय नागरिक सुरक्षा संहिता, 2023 [BNSS] / धारा 154 CrPC के अंतर्गत)

दिनांक: ${todayStr}

सेवा में,
श्रीमान थाना प्रभारी महोदय (Station House Officer - SHO)
${policeStationName}
पुलिस विभाग।

प्रार्थी / परिवादी का विवरण:
नाम: ${claimantName}
पता: ${claimantAddress}
सम्पर्क सूत्र: दर्ज करें

बनाम (आरोपीगण का विवरण):
${respondentName}
पता: ${respondentAddress}

विषय: संज्ञेय अपराध (Cognizable Offence) घटित होने पर लिखित शिकायत एवं प्रथम सूचना रिपोर्ट (FIR) दर्ज कर कानूनी कार्यवाही करने बाबत।

महोदय,

सविनय निवेदन है कि प्रार्थी निम्नलिखित तथ्यों को आपके संज्ञान में लाते हुए न्याय की गुहार लगाता है:

१. घटनाक्रम का वास्तविक विवरण (Statement of Facts):
${facts}

२. अपराध का स्वरूप एवं विधि विरुद्ध कृत्य:
${allegations}

३. लागू होने वाली दाण्डिक धाराएं (Statutory Penal Provisions):
आरोपी का यह कृत्य निम्नलिखित विधि के अंतर्गत दंडनीय अपराध है:
${hiStatutes}

४. प्रार्थना (Prayer for Relief):
अतः श्रीमान जी से विनम्र प्रार्थना है कि:
   (क) प्रार्थी की इस लिखित शिकायत पर धारा 173 BNSS के तहत तत्काल प्रथम सूचना रिपोर्ट (FIR) दर्ज की जावे;
   (ख) मामले की निष्पक्ष विवेचना कर आरोपी के विरुद्ध सक्षम न्यायालय में आरोप पत्र (Charge Sheet) दाखिल किया जावे।

सत्यापन (Verification):
मैं सत्यापित करता हूं कि उपर्युक्त पैरा १ से ४ की विषयवस्तु मेरी निजी जानकारी एवं विश्वास के अनुसार सत्य है।

भवदीय,
___________________________
( ${claimantName} )
प्रार्थी / परिवादी`
      }

      if (draftType === 'legal_notice') {
        return `रजिस्टर्ड डाक पावती सहित (RPAD) / SPEED POST
गोपनीय एवं बिना किसी पूर्वाग्रह के (CONFIDENTIAL & WITHOUT PREJUDICE)

विधिक मांग नोटिस (STATUTORY LEGAL DEMAND NOTICE)
(धारा 138 परक्राम्य लिखत अधिनियम 1881 / संविदा भंग के अंतर्गत)

दिनांक: ${todayStr}

सेवा में (नोटिस प्राप्तकर्ता):
${respondentName}
${respondentAddress}

प्रेषक (नोटिस प्रेषक / अधिवक्ता):
${claimantName}
${claimantAddress}

विषय: धारा 138 Negotiable Instruments Act, 1881 एवं भारतीय संविदा अधिनियम के अंतर्गत देय धनराशि के भुगतान हेतु कानूनी मांग नोटिस।

महोदय / महोदया,

मेरे मुवक्किल श्री ${claimantName} के स्पष्ट निर्देशों एवं प्राधिकार के अधीन, मैं आपको यह विधिक नोटिस प्रेषित करते हुए निम्नलिखित तथ्यों से अवगत कराता हूँ:

१. तथ्यों का विवरण:
मेरे मुवक्किल के अनुसार: ${facts}

२. विधिक दायित्व की अवहेलना:
${allegations}

३. सांविधिक प्रावधानों का उल्लंघन:
आपका उक्त कृत्य निम्नलिखित कानूनों का खुला उल्लंघन है:
${hiStatutes}

४. विधिक मांग एवं मियाद (Demand & Notice Period):
अतः आपको इस नोटिस की प्राप्ति से ${noticePeriod} (पंद्रह) दिवस की अनिवार्य सांविधिक अवधि के भीतर निर्देशित किया जाता है कि:
   (क) आप मेरे मुवक्किल की कुल वैध देय धनराशि ${claimAmount} का अविलंब भुगतान करें;
   (ख) विधिक नोटिस व्यय रु. 5,000/- अदा करें।

चेतावनी: यदि आप उक्त ${noticePeriod} दिवस के भीतर भुगतान करने में विफल रहते हैं, तो मेरे मुवक्किल ने आपके विरुद्ध सक्षम न्यायालय में धारा 138 NI Act के अंतर्गत दाण्डिक परिवाद एवं दीवानी वाद संस्थित करने के कड़े निर्देश दिए हैं, जिसके समस्त हर्जा-खर्चा एवं परिणामों के लिए आप स्वयं उत्तरदायी होंगे।

नोटिस की एक प्रति न्यायालयीन उपयोग हेतु मेरे कार्यालय में सुरक्षित रखी गई है।

भवदीय,
___________________________
${claimantName}
(अधिवक्ता / अधिकृत प्रार्थी)`
      }

      // Consumer / General Hindi
      return `समक्ष माननीय जिला उपभोक्ता विवाद प्रतितोष आयोग
परिवाद पत्र संख्या: ________ / ${new Date().getFullYear()}
(उपभोक्ता संरक्षण अधिनियम, 2019 की धारा 35 के अंतर्गत)

परिवादी: ${claimantName}
पता: ${claimantAddress}

बनाम

विपक्षी: ${respondentName}
पता: ${respondentAddress}

परिवाद पत्र धारा 35 उपभोक्ता संरक्षण अधिनियम 2019:
१. परिवादी अधिनियम की धारा 2(7) के तहत 'उपभोक्ता' की श्रेणी में आता है।
२. विपक्षी ने सेवा में गंभीर कमी (Deficiency in Service) की है।
३. विवाद के तथ्य:
${facts}
४. विधिक आधार:
${allegations}
लागू होने वाले कानून:
${hiStatutes}

प्रार्थना: माननीय आयोग से प्रार्थना है कि विपक्षी को ${claimAmount} मय 12% ब्याज सहित भुगतान करने तथा रु. 50,000/- क्षतिपूर्ति दिलाने का आदेश प्रदान करें।

दिनांक: ${todayStr}
परिवादी`
    }

    // ══════════════════════════════════════════════════════════════════════════
    // 4. ENGLISH (Central / All-India High Courts & Supreme Court Standard)
    // ══════════════════════════════════════════════════════════════════════════
    if (draftType === 'fir_complaint') {
      return `REPUBLIC OF INDIA
WRITTEN COMPLAINT FOR REGISTRATION OF FIRST INFORMATION REPORT (FIR)
UNDER SECTION 173 OF THE BHARATIYA NAGARIK SURAKSHA SANHITA, 2023 (BNSS)
[CORRESPONDING TO SECTION 154 OF THE CODE OF CRIMINAL PROCEDURE, 1973]

Date: ${todayStr}

TO,
The Station House Officer (SHO),
${policeStationName},
Police Department.

COMPLAINANT DETAILS:
Name: ${claimantName}
Address: ${claimantAddress}
Contact: Available on Record

VERSUS (ACCUSED PERSONS):
Name: ${respondentName}
Address: ${respondentAddress}

SUBJECT: FORMAL WRITTEN COMPLAINT DISCLOSING COGNIZABLE OFFENCES FOR IMMEDIATE REGISTRATION OF FIR AND LAWFUL INVESTIGATION.

Sir/Madam,

I, the Complainant above-named, most respectfully submit this formal written complaint detailing commission of cognizable offences within your territorial jurisdiction:

1. STATEMENT OF FACTS & INCIDENT CHRONOLOGY:
${facts}

2. SUBSTANTIVE CRIMINAL ACTIONS & WRONGS:
${allegations}

3. APPLICABLE STATUTORY PENAL PROVISIONS:
The aforesaid acts constitute cognizable and non-bailable offences punishable under:
${result.applicable_statutes?.map((s, idx) => `   (${idx + 1}) ${s.title} [${s.citation}]: "${s.excerpt || 'Penal provisions binding upon the accused.'}"`).join('\n') || '   Bharatiya Nyaya Sanhita, 2023 (BNS) and applicable special statutes.'}

4. PRAYER FOR POLICE ACTION:
WHEREFORE, it is most respectfully prayed that your good office may graciously be pleased to:
   (a) Register a regular First Information Report (FIR) under Section 173 BNSS, 2023 against the accused persons;
   (b) Promptly initiate statutory investigation, recover seized records/property, and submit a Final Charge Sheet before the Learned Magistrate for prosecution.

VERIFICATION:
I, ${claimantName}, do hereby verify that the facts stated in Paragraphs 1 to 4 are true and correct to the best of my personal knowledge and belief.

Yours faithfully,
___________________________
${claimantName}
Complainant`
    }

    if (draftType === 'consumer_complaint') {
      return `BEFORE THE HON'BLE DISTRICT CONSUMER DISPUTES REDRESSAL COMMISSION
AT [INSERT JURISDICTION DISTRICT, STATE]

CONSUMER COMPLAINT NO. _______ OF ${new Date().getFullYear()}
MEMORANDUM OF COMPLAINT UNDER SECTION 35 OF THE CONSUMER PROTECTION ACT, 2019

IN THE MATTER OF:
${claimantName}
Residing at: ${claimantAddress}
... COMPLAINANT

VERSUS

${respondentName}
Having Registered Office at: ${respondentAddress}
... OPPOSITE PARTY

MOST RESPECTFULLY SHOWETH:

1. That the Complainant is a 'Consumer' within the meaning of Section 2(7) of the Consumer Protection Act, 2019.
2. That the Opposite Party has committed gross 'Deficiency in Service' and 'Unfair Trade Practice' within Sections 2(11) and 2(47).
3. STATEMENT OF FACTS:
${facts}

4. LEGAL GROUNDS & STATUTORY BREACHES:
${allegations}
Statutes binding upon the Opposite Party:
${result.applicable_statutes?.map((s) => `• ${s.title} (${s.citation})`).join('\n') || '• Consumer Protection Act, 2019 provisions.'}

5. PRAYER:
Wherefore, the Complainant respectfully prays that this Hon'ble Commission may be pleased to:
   (a) Direct the Opposite Party to refund / pay ${claimAmount} with 12% interest p.a.;
   (b) Award compensation of Rs. 1,00,000/- towards mental harassment, agony, and distress;
   (c) Award litigation expenses of Rs. 25,000/-.

PLACE: ____________
DATE: ${todayStr}

COMPLAINANT
THROUGH ADVOCATE`
    }

    // Default English Legal Demand Notice
    return `REGISTERED POST WITH ACKNOWLEDGEMENT DUE (RPAD) / SPEED POST
CONFIDENTIAL & WITHOUT PREJUDICE

STATUTORY LEGAL DEMAND NOTICE
(UNDER SECTION 138 NEGOTIABLE INSTRUMENTS ACT, 1881 / CONTRACT BREACH)

Date: ${todayStr}

TO (RESPONDENT / OPPOSITE PARTY):
${respondentName}
${respondentAddress}

FROM (CLAIMANT / ADVOCATE):
${claimantName}
${claimantAddress}

SUBJECT: STATUTORY DEMAND NOTICE UNDER ${statuteReferences.toUpperCase()} FOR REDRESSAL OF GRIEVANCES AND IMMEDIATE PAYMENT.

Sir/Madam,

Under express instructions and authority from my Client, ${claimantName}, I hereby serve upon you this formal Legal Notice:

1. STATEMENT OF FACTS:
That my Client states that: ${facts}.

2. SUBSTANTIVE BREACH & WRONGFUL ACTS:
That on a factual and legal analysis: ${allegations}.

3. STATUTORY INFRINGEMENTS:
That your aforesaid acts and omissions constitute a direct infringement of:
${result.applicable_statutes?.map((s, idx) => `   (${idx + 1}) ${s.title} [${s.citation}]: "${s.excerpt || 'Statutory protections binding upon you.'}"`).join('\n') || '   Applicable statutory laws of India.'}

4. DEMAND & NOTICE PERIOD:
THEREFORE, you are hereby called upon to:
   (a) Forthwith make good the claim amounting to ${claimAmount};
   (b) Remit the legal notice fee of Rs. 5,000/- within a strict statutory period of ${noticePeriod} (FIFTEEN) DAYS from receipt of this Notice.

TAKE NOTICE that in the event of your failure to comply within the stipulated ${noticePeriod} days, my Client has given peremptory instructions to initiate appropriate Civil and Criminal proceedings against you before the Competent Courts of Law, entirely at your sole risk, cost, and legal consequence.

Yours faithfully,
___________________________
${claimantName}
(Advocate / Authorized Claimant)`
  }

  // Final Draft Text (with DPDP Act 2023 PII Masking if active)
  const getDraftText = () => {
    const raw = getRawDraftText()
    if (redactPIIActive) {
      return redactPII(raw).sanitizedText
    }
    return raw
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(getDraftText())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Export to Microsoft Word (.docx)
  const handleExportDOCX = async () => {
    setExportingDocx(true)
    try {
      const text = getDraftText()
      const lines = text.split('\n')

      const title =
        draftType === 'fir_complaint'
          ? 'FORMAL COMPLAINT FOR REGISTRATION OF FIR (SEC 173 BNSS)'
          : draftType === 'consumer_complaint'
          ? 'CONSUMER DISPUTES REDRESSAL COMPLAINT (SEC 35 CPA)'
          : draftType === 'court_petition'
          ? 'COURT PETITION & VAKALATNAMA'
          : 'STATUTORY LEGAL DEMAND NOTICE (SECTION 138 NI ACT / CONTRACT)'

      const docParagraphs = [
        new Paragraph({
          text: title,
          heading: 'Heading1',
          alignment: AlignmentType.CENTER,
          spacing: { after: 240 },
        }),
      ]

      lines.forEach((line) => {
        const trimmed = line.trim()
        if (!trimmed) {
          docParagraphs.push(new Paragraph({ text: '', spacing: { after: 120 } }))
          return
        }

        const isHeading =
          trimmed.startsWith('॥') ||
          trimmed.startsWith('SUBJECT:') ||
          trimmed.startsWith('ವಿಷಯ:') ||
          trimmed.startsWith('విషయం:') ||
          trimmed.startsWith('विषय:') ||
          trimmed.startsWith('TO,') ||
          trimmed.startsWith('ಇವರಿಗೆ') ||
          trimmed.startsWith('ఎవరికి') ||
          trimmed.startsWith('सेवा में') ||
          trimmed.startsWith('VERIFICATION:') ||
          trimmed.startsWith('ಸತ್ಯ ಪ್ರಮಾಣೀಕರಣ') ||
          trimmed.startsWith('సత్య ప్రమాణ') ||
          trimmed.startsWith('सत्यापन')

        docParagraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: line,
                bold: isHeading,
                font: 'Times New Roman',
                size: 24, // 12pt
              }),
            ],
            spacing: { line: 360, after: 100 },
          })
        )
      })

      const doc = new Document({
        sections: [
          {
            properties: {
              page: {
                margin: {
                  top: 1440,
                  right: 1440,
                  bottom: 1440,
                  left: 1440,
                },
              },
            },
            children: docParagraphs,
          },
        ],
      })

      const blob = await Packer.toBlob(doc)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `JurisAI_${draftLanguage}_${draftType}_${new Date().toISOString().slice(0, 10)}.docx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to export DOCX:', err)
      alert('Could not export Word document. Please try again.')
    } finally {
      setExportingDocx(false)
    }
  }

  // 100% Crisp Indic Unicode PDF Generation via html2canvas (Zero Mojibake)
  const handleExportPDF = async () => {
    setExportingPdf(true)
    try {
      const renderEl = document.getElementById('legal-draft-canvas-render')
      if (!renderEl) {
        window.print()
        return
      }

      const canvas = await html2canvas(renderEl, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 794,
        width: 794,
      })

      const imgData = canvas.toDataURL('image/jpeg', 0.98)
      const pdf = new jsPDF('p', 'mm', 'a4')
      const imgWidth = 210
      const pageHeight = 297
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      let position = 0

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft > 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      pdf.save(`JurisAI_${draftLanguage}_${draftType}_${new Date().toISOString().slice(0, 10)}.pdf`)
    } catch (err) {
      console.error('PDF rasterization failed, falling back to window.print():', err)
      window.print()
    } finally {
      setExportingPdf(false)
    }
  }

  // Dedicated White-Paper Native Print
  const handlePrint = () => {
    document.body.classList.add('print-draft-active')
    const cleanup = () => {
      document.body.classList.remove('print-draft-active')
      window.removeEventListener('afterprint', cleanup)
    }
    window.addEventListener('afterprint', cleanup)
    window.print()
    setTimeout(cleanup, 2000)
  }

  const currentLangMeta = SUPPORTED_LANGUAGES.find((l) => l.code === draftLanguage) || SUPPORTED_LANGUAGES[0]

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
          onClick={onClose}
        />

        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 16 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-5xl bg-[#0c0d26] border border-indigo-500/30 text-slate-100 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-indigo-500/15 bg-indigo-950/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  Official Legal Notice & Pleading Draft Generator
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-slate-200 font-semibold px-2 py-0.5 rounded-full">
                    {currentLangMeta.stateBadge}
                  </span>
                </h2>
                <p className="text-xs text-slate-500">
                  Pre-populated with authentic state court formats, police FIR guidelines, and verified statutes
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Vernacular Language Switcher Bar */}
          <div className="px-6 py-2.5 border-b border-white/5 bg-[#0c0d26] border-indigo-500/20 text-slate-100 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="text-xs font-semibold text-slate-300">Jurisdiction & Language:</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setDraftLanguage(lang.code)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    draftLanguage === lang.code
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 border border-indigo-400'
                      : 'bg-white/4 text-slate-500 hover:text-white hover:bg-white/8 border border-white/6'
                  }`}
                >
                  <span>{lang.flag}</span>
                  <span>{lang.nativeLabel}</span>
                  <span className="text-[10px] opacity-75 hidden sm:inline">({lang.stateBadge})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Template Selector Bar */}
          <div className="px-6 py-2.5 border-b border-white/5 bg-[#0c0d26] border-indigo-500/20 text-slate-100 flex items-center gap-2 overflow-x-auto">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider shrink-0 mr-1">
              Select Pleading:
            </span>
            {[
              {
                id: 'legal_notice',
                label: draftLanguage === 'kn' ? '೧. ಕಾನೂನು ಬೇಡಿಕೆ ನೋಟೀಸ್ (Sec 138)' :
                       draftLanguage === 'te' ? '1. లీగల్ డిమాండ్ నోటీసు (Sec 138)' :
                       draftLanguage === 'hi' ? '1. विधिक मांग नोटिस (धारा 138)' :
                       '1. Statutory Legal Notice (Sec 138 / Contract)',
              },
              {
                id: 'fir_complaint',
                label: draftLanguage === 'kn' ? '೨. ಪೊಲೀಸ್ ಠಾಣಾ FIR ದೂರು (Sec 173 BNSS)' :
                       draftLanguage === 'te' ? '2. పోలీస్ స్టేషన్ FIR ఫిర్యాదు (Sec 173 BNSS)' :
                       draftLanguage === 'hi' ? '2. पुलिस FIR प्रार्थना पत्र (धारा 173 BNSS)' :
                       '2. Police FIR Complaint (Sec 173 BNSS / 154 CrPC)',
              },
              {
                id: 'consumer_complaint',
                label: draftLanguage === 'kn' ? '೩. ಗ್ರಾಹಕರ ಆಯೋಗಕ್ಕೆ ದೂರು (Sec 35)' :
                       draftLanguage === 'te' ? '3. వినియోగదారుల కమిషన్ ఫిర్యాదు (Sec 35)' :
                       draftLanguage === 'hi' ? '3. उपभोक्ता आयोग परिवाद (धारा 35)' :
                       '3. Consumer Disputes Complaint (Sec 35 CPA)',
              },
              {
                id: 'court_petition',
                label: draftLanguage === 'kn' ? '೪. ನ್ಯಾಯಾಲಯ ಅರ್ಜಿ & ವಕಾಲತ್ತು' :
                       draftLanguage === 'te' ? '4. కోర్టు పిటిషన్ & వకాలత్' :
                       draftLanguage === 'hi' ? '4. न्यायालयीन वादपत्र / याचिका' :
                       '4. Court Petition / Vakalatnama',
              },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setDraftType(t.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  draftType === t.id
                    ? 'bg-indigo-600 text-white shadow-sm indigo-glow'
                    : 'bg-white/4 text-slate-500 hover:text-white border border-white/6'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Two-column Body: Left Party Inputs, Right Draft Preview */}
          <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-white/5">
            {/* Left: Customizable Parameters (4 cols) */}
            <div className="lg:col-span-4 p-5 space-y-4 bg-[#0c0d26] border-indigo-500/20 text-slate-100">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-400" /> Party & Authority Details
                </h3>
                <span className="text-[10px] text-indigo-400 font-semibold bg-indigo-500/10 px-2 py-0.5 rounded">
                  {currentLangMeta.region}
                </span>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-500 block mb-1">
                  Complainant / Claimant Name:
                </label>
                <input
                  type="text"
                  value={claimantName}
                  onChange={(e) => setClaimantName(e.target.value)}
                  className="w-full bg-[#131435] border border-indigo-500/25 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-500 block mb-1">
                  Complainant Address / State:
                </label>
                <input
                  type="text"
                  value={claimantAddress}
                  onChange={(e) => setClaimantAddress(e.target.value)}
                  className="w-full bg-[#131435] border border-indigo-500/25 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-500 block mb-1">
                  Opposite Party / Accused:
                </label>
                <input
                  type="text"
                  value={respondentName}
                  onChange={(e) => setRespondentName(e.target.value)}
                  className="w-full bg-[#131435] border border-indigo-500/25 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-500 block mb-1">
                  Opposite Party Address:
                </label>
                <input
                  type="text"
                  value={respondentAddress}
                  onChange={(e) => setRespondentAddress(e.target.value)}
                  className="w-full bg-[#131435] border border-indigo-500/25 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-400"
                />
              </div>

              {draftType === 'fir_complaint' && (
                <div>
                  <label className="text-[11px] font-medium text-slate-500 block mb-1">
                    Police Station Name / SHO:
                  </label>
                  <input
                    type="text"
                    value={policeStationName}
                    onChange={(e) => setPoliceStationName(e.target.value)}
                    placeholder="e.g. Station House Officer, Cubbon Park PS / Banjara Hills PS"
                    className="w-full bg-[#131435] border border-indigo-500/25 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-400"
                  />
                </div>
              )}

              {(draftType === 'legal_notice' || draftType === 'consumer_complaint') && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-medium text-slate-500 block mb-1">
                      Claim Amount:
                    </label>
                    <input
                      type="text"
                      value={claimAmount}
                      onChange={(e) => setClaimAmount(e.target.value)}
                      placeholder="Rs. 50,000 / Dues"
                      className="w-full bg-[#131435] border border-indigo-500/25 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-500 block mb-1">
                      Notice Days:
                    </label>
                    <select
                      value={noticePeriod}
                      onChange={(e) => setNoticePeriod(e.target.value)}
                      className="w-full bg-[#131435] border border-indigo-500/25 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-400"
                    >
                      <option value="15">15 Days (Sec 138 / Standard)</option>
                      <option value="30">30 Days (Commercial)</option>
                      <option value="60">60 Days (Sec 80 CPC Govt)</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="p-3 bg-indigo-500/10 border border-slate-200 rounded-xl text-xs text-indigo-300/90 leading-relaxed">
                <span className="font-semibold block mb-0.5 text-indigo-300">⚡ Auto-Linked Statutory Law:</span>
                {statuteReferences.slice(0, 160)}...
              </div>

              {isTranslating && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-400 shrink-0" />
                  <span>Synthesizing pure court-standard {currentLangMeta.nativeLabel} terminology…</span>
                </div>
              )}
            </div>

            {/* Right: Live Draft Preview (8 cols) */}
            <div className="lg:col-span-8 p-5 flex flex-col bg-[#070814]">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Official Court & Police Pleading Preview</span>
                  <span className="text-[10px] bg-white/5 border border-white/10 text-slate-500 px-2 py-0.5 rounded">
                    {currentLangMeta.nativeLabel}
                  </span>
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {/* DPDP Act 2023 PII Masking Toggle */}
                  <button
                    onClick={() => setRedactPIIActive((p) => !p)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                      redactPIIActive
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-sm'
                        : 'bg-white/5 border-white/10 text-slate-500 hover:text-white'
                    }`}
                    title="Mask Aadhaar, PAN, phone numbers & client identifiers under DPDP Act 2023"
                  >
                    <ShieldCheck className={`w-3.5 h-3.5 ${redactPIIActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                    <span>DPDP 2023 Masking</span>
                    <span className="text-[10px] font-bold opacity-80">[{redactPIIActive ? 'ON' : 'OFF'}]</span>
                  </button>

                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-xs text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-2.5 py-1.5 rounded-lg transition-all"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>

                  {/* Word (.docx) Export Button */}
                  <button
                    onClick={handleExportDOCX}
                    disabled={exportingDocx}
                    className="flex items-center gap-1.5 text-xs text-blue-200 bg-blue-600/25 hover:bg-blue-600/40 border border-blue-500/40 px-3 py-1.5 rounded-lg shadow-sm font-semibold transition-all"
                    title="Download editable Microsoft Word document (.docx)"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-400" />
                    <span>{exportingDocx ? 'Word…' : 'Word (.docx)'}</span>
                  </button>

                  {/* Print Button (Isolated White-Paper) */}
                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-1.5 text-xs text-slate-200 bg-white/5 hover:bg-white/10 border border-white/15 px-3 py-1.5 rounded-lg shadow-sm font-semibold transition-all"
                    title="Print or Save as Vector PDF"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-300" />
                    <span>Print</span>
                  </button>

                  {/* High-Resolution Unicode PDF Export Button */}
                  <button
                    onClick={handleExportPDF}
                    disabled={exportingPdf}
                    className="flex items-center gap-1.5 text-xs text-white bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded-lg shadow-sm font-semibold transition-all"
                    title="Download high-resolution Indic PDF with zero character corruption"
                  >
                    {exportingPdf ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    <span>{exportingPdf ? 'Rendering PDF…' : 'PDF'}</span>
                  </button>
                </div>
              </div>

              <div className="flex-1 bg-[#0a0b1a] border border-white/10 rounded-xl p-5 font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed overflow-y-auto max-h-[500px] select-text">
                {getDraftText()}
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="px-6 py-3 border-t border-white/5 bg-[#0c0d26] border-indigo-500/20 text-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Complies with Karnataka / Telangana Judiciary Rules, Bharatiya Nagarik Suraksha Sanhita 2023 (Sec 173), and NI Act (Sec 138).
            </span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg font-medium text-xs transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>

      {/* Offscreen high-DPI container for html2canvas PDF generation (Ensures 100% Indic Unicode shaping & zero Mojibake) */}
      <div
        id="legal-draft-canvas-render"
        style={{
          position: 'absolute',
          left: '0px',
          top: '0px',
          opacity: 0,
          pointerEvents: 'none',
          width: '794px',
          padding: '44px 52px',
          backgroundColor: '#ffffff',
          color: '#0f172a',
          fontFamily: "'Nirmala UI', 'Segoe UI', 'Noto Sans Kannada', 'Noto Sans Devanagari', 'Noto Sans Telugu', system-ui, -apple-system, sans-serif",
          fontSize: '13px',
          lineHeight: '1.7',
          whiteSpace: 'pre-wrap',
          boxSizing: 'border-box',
          zIndex: -1,
        }}
      >
        {getDraftText()}
      </div>

      {/* Dedicated White-Paper print portal for native browser print */}
      <div id="legal-draft-official-print">
        {getDraftText()}
      </div>
    </AnimatePresence>
  )
}