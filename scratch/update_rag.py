import os

def update():
    target_path = os.path.abspath('jurisai/backend/rag_service.py')
    with open(target_path, 'r', encoding='utf-8') as f:
        code = f.read()

    # 1. Update _generate_follow_up_domain_analysis
    old_block = """        ql = query.lower()

        # ── 1. CONSUMER DISPUTE & E-COMMERCE ──"""

    fir_block = """        ql = query.lower()

        # ── 0. FIR & POLICE CRIMINAL COMPLAINT ──
        if domain_key == "fir_criminal_complaint":
            if language == "kn":
                return {
                    "summary": (
                        "ಎಫ್.ಐ.ಆರ್ (FIR) ಮತ್ತು ಪೊಲೀಸ್ ದೂರು ಪ್ರಕ್ರಿಯೆಯ ಕುರಿತು ಸಮಗ್ರ ಕಾನೂನು ಮಾರ್ಗದರ್ಶಿ ಮತ್ತು ಹಂತಗಳು:\\n\\n"
                        "೧. ಕಾಗ್ನಿಜೇಬಲ್ ಅಪರಾಧಕ್ಕೆ ಕಡ್ಡಾಯ ಎಫ್.ಐ.ಆರ್ (ಲಲಿತಾ ಕುಮಾರಿ ತೀರ್ಪು ಮತ್ತು ಕಲಂ ೧೭೩ BNSS):\\n"
                        "ಯಾವುದೇ ಕಾಗ್ನಿಜೇಬಲ್ (ಗಂಭೀರ ಅಪರಾಧ - ವಂಚನೆ, ಹಲ್ಲೆ, ಜೀವ ಬೆದರಿಕೆ, ಕಳ್ಳತನ ಇತ್ಯಾದಿ) ನಡೆದಾಗ ತಕ್ಷಣವೇ ಎಫ್.ಐ.ಆರ್ ದಾಖಲಿಸುವುದು ಪೊಲೀಸರ ಕಡ್ಡಾಯ ಶಾಸನಬದ್ಧ ಕರ್ತವ್ಯವಾಗಿದೆ. ಪೊಲೀಸರಿಗೆ ಎಫ್.ಐ.ಆರ್ ದಾಖಲಿಸುವುದನ್ನು ನಿರಾಕರಿಸುವ ಯಾವುದೇ ವಿವೇಚನಾಧಿಕಾರವಿಲ್ಲ.\\n\\n"
                        "೨. ಠಾಣಾಧಿಕಾರಿ (SHO) ನಿರಾಕರಿಸಿದರೆ ಏನು ಮಾಡಬೇಕು? (ಕಲಂ ೧೭೫(೪) BNSS):\\n"
                        "ಸ್ಥಳೀಯ ಠಾಣೆಯು ಎಫ್.ಐ.ಆರ್ ದಾಖಲಿಸಲು ನಿರಾಕರಿಸಿದರೆ, ಸಂಪೂರ್ಣ ವಿವರಗಳುಳ್ಳ ಲಿಖಿತ ದೂರನ್ನು ಜಿಲ್ಲಾ ಪೊಲೀಸ್ ವರಿಷ್ಠಾಧಿಕಾರಿಗಳಿಗೆ (SP) ಅಥವಾ ನಗರ ಪೊಲೀಸ್ ಆಯುಕ್ತರಿಗೆ ನೋಂದಾಯಿತ ಅಂಚೆ (RPAD) ಮೂಲಕ ರವಾನಿಸಿ. ಅಂಚೆ ರಸೀದಿಯನ್ನು ನ್ಯಾಯಾಲಯದ ದಾಖಲೆಗಾಗಿ ಕಡ್ಡಾಯವಾಗಿ ಕಾಯ್ದಿರಿಸಿ.\\n\\n"
                        "೩. ಮ್ಯಾಜಿಸ್ಟ್ರೇಟ್ ನ್ಯಾಯಾಲಯದಲ್ಲಿ ಅರ್ಜಿ (ಕಲಂ ೧೭೫(೩) BNSS / ೧೫೬(೩) CrPC):\\n"
                        "ಎಸ್ಪಿ ಅವರಿಗೆ ದೂರು ನೀಡಿದ ನಂತರವೂ ಪೊಲೀಸರು ಕ್ರಮ ಕೈಗೊಳ್ಳದಿದ್ದರೆ, ವಕೀಲರ ಮೂಲಕ ಸಕ್ಷಮ ಪ್ರಥಮ ದರ್ಜೆ ನ್ಯಾಯಾಂಗ ಮ್ಯಾಜಿಸ್ಟ್ರೇಟ್ (JMFC) ನ್ಯಾಯಾಲಯಕ್ಕೆ ಕಲಂ ೧೭೫(೩) ರಂತೆ ಅಫಿಡವಿಟ್ ಸಹಿತ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ. ನ್ಯಾಯಾಧೀಶರು ಪೊಲೀಸರಿಗೆ ತಕ್ಷಣ ಎಫ್.ಐ.ಆರ್ ದಾಖಲಿಸಿ ತನಿಖಾ ವರದಿ ಸಲ್ಲಿಸಲು ನಿರ್ದೇಶನ ನೀಡುತ್ತಾರೆ.\\n\\n"
                        "೪. ಝೀರೋ ಎಫ್.ಐ.ಆರ್ (Zero FIR) ನಿಯಮ:\\n"
                        "ಘಟನೆ ಎಲ್ಲಿಯೇ ನಡೆದಿರಲಿ, ಹತ್ತಿರದ ಯಾವುದೇ ಪೊಲೀಸ್ ಠಾಣೆಯಲ್ಲಿ 'ಝೀರೋ ಎಫ್.ಐ.ಆರ್' ದಾಖಲಿಸಬಹುದು. 'ನಮ್ಮ ವ್ಯಾಪ್ತಿಗೆ ಬರುವುದಿಲ್ಲ' ಎಂದು ಪೊಲೀಸರು ನಿರಾಕರಿಸುವಂತಿಲ್ಲ. ನಂತರ ಅವರು ಸಂಬಂಧಪಟ್ಟ ಠಾಣೆಗೆ ಪ್ರಕರಣವನ್ನು ವರ್ಗಾಯಿಸುತ್ತಾರೆ.\\n\\n"
                        "೫. ಇ-ಎಫ್.ಐ.ಆರ್ (e-FIR):\\n"
                        "ಬಿಎನ್‌ಎಸ್‌ಎಸ್ ಕಲಂ ೧೭೩(೧) ರಂತೆ ಆನ್‌ಲೈನ್ ಮೂಲಕವೂ ಇ-ಎಫ್.ಐ.ಆರ್ ಸಲ್ಲಿಸಬಹುದು. ಇದನ್ನು ಸಲ್ಲಿಸಿದ ೩ ದಿನಗಳ ಒಳಗೆ ದೂರುದಾರರು ಠಾಣೆಗೆ ಹೋಗಿ ಸಹಿ ಮಾಡಬೇಕು."
                    ),
                    "steps": [
                        "ದಿನಾಂಕ, ಸಮಯ, ಸ್ಥಳ ಮತ್ತು ಆರೋಪಿಗಳ ವಿವರಗಳೊಂದಿಗೆ ಸ್ಪಷ್ಟ ಲಿಖಿತ ದೂರನ್ನು ಠಾಣಾಧಿಕಾರಿಗೆ ಸಲ್ಲಿಸಿ ಸ್ವೀಕೃತಿ ರಶೀದಿ (CSR/GD) ಪಡೆಯಿರಿ.",
                        "ಠಾಣೆಯಲ್ಲಿ ನಿರಾಕರಿಸಿದರೆ, ಬಿಎನ್‌ಎಸ್‌ಎಸ್ ಕಲಂ ೧೭೫(೪) ರಂತೆ ಜಿಲ್ಲಾ ಪೊಲೀಸ್ ವರಿಷ್ಠಾಧಿಕಾರಿಗಳಿಗೆ (SP) RPAD ಮೂಲಕ ದೂರು ಕಳುಹಿಸಿ.",
                        "ಪೊಲೀಸ್ ಕ್ರಮವಾಗದಿದ್ದಲ್ಲಿ, ವಕೀಲರ ಮೂಲಕ ಮ್ಯಾಜಿಸ್ಟ್ರೇಟ್ ನ್ಯಾಯಾಲಯದಲ್ಲಿ ಕಲಂ ೧೭೫(೩) ರಂತೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ ತನಿಖೆಗೆ ಆದೇಶ ಪಡೆಯಿರಿ.",
                        "ತುರ್ತು ಸಂದರ್ಭದಲ್ಲಿ ಯಾವುದೇ ಪೊಲೀಸ್ ಠಾಣೆಯಲ್ಲಿ 'ಝೀರೋ ಎಫ್.ಐ.ಆರ್' (Zero FIR) ದಾಖಲಿಸಿ.",
                    ],
                }
            if language == "hi":
                return {
                    "summary": (
                        "प्राथमिकी (FIR) एवं पुलिस शिकायत प्रक्रिया पर संपूर्ण वैधानिक मार्गदर्शन एवं चरण:\\n\\n"
                        "1. संज्ञेय अपराध में अनिवार्य एफआईआर (ललिता कुमारी बनाम यूपी एवं धारा 173 BNSS):\\n"
                        "किसी भी संज्ञेय अपराध (धोखाधड़ी, हमला, आपराधिक धमकी आदि) की सूचना मिलने पर तुरंत प्राथमिकी (FIR) दर्ज करना पुलिस का अनिवार्य कानूनी दायित्व है। सर्वोच्च न्यायालय के अनुसार पुलिस को प्राथमिकी दर्ज करने से इनकार करने का कोई अधिकार नहीं है।\\n\\n"
                        "2. थाना प्रभारी द्वारा इनकार करने पर विधिक उपचार (धारा 175(4) BNSS):\\n"
                        "यदि स्थानीय थाना एफआईआर दर्ज करने से मना करे, तो शिकायत की हस्ताक्षरित प्रति पंजीकृत डाक (RPAD) द्वारा जिले के पुलिस अधीक्षक (SP) या पुलिस आयुक्त को भेजें। डाक रसीद एवं ट्रैकिंग साक्ष्य सुरक्षित रखें।\\n\\n"
                        "3. न्यायिक मजिस्ट्रेट के समक्ष आवेदन (धारा 175(3) BNSS):\\n"
                        "एसपी को शिकायत भेजने के उपरांत भी यदि पुलिस कार्रवाई न करे, तो सक्षम न्यायिक मजिस्ट्रेट (JMFC) के समक्ष शपथपत्र सहित धारा 175(3) BNSS के तहत आवेदन करें। मजिस्ट्रेट पुलिस को एफआईआर दर्ज कर अन्वेषण करने का न्यायिक आदेश जारी करेंगे।\\n\\n"
                        "4. जीरो एफआईआर (Zero FIR) का अधिकार:\\n"
                        "घटनास्थल चाहे जो भी हो, पीड़ित किसी भी नजदीकी थाने में 'जीरो एफआईआर' दर्ज करा सकता है। क्षेत्राधिकार का बहाना बनाकर पुलिस इनकार नहीं कर सकती।\\n\\n"
                        "5. ई-एफआईआर (e-FIR):\\n"
                        "धारा 173(1) BNSS के तहत इलेक्ट्रॉनिक माध्यम से भी सूचना दी जा सकती है, जिस पर 3 दिन के भीतर हस्ताक्षर करना होता है।"
                    ),
                    "steps": [
                        "घटना के संपूर्ण विवरण, समय, स्थान और साक्ष्यों के साथ लिखित शिकायत सौंपकर जीडी/सीएसआर पावती प्राप्त करें।",
                        "थाने के इनकार पर धारा 175(4) BNSS के तहत पुलिस अधीक्षक (SP) को पंजीकृत डाक से शिकायत भेजें।",
                        "सक्षम न्यायिक मजिस्ट्रेट के समक्ष धारा 175(3) BNSS के तहत आवेदन कर पुलिस जांच का आदेश प्राप्त करें।",
                        "आपात स्थिति में किसी भी थाने में 'जीरो एफआईआर' (Zero FIR) दर्ज करवाएं।",
                    ],
                }
            return {
                "summary": (
                    "Complete Statutory Procedure & Legal Remedy for Filing an FIR & Addressing Police Refusal:\\n\\n"
                    "1. Mandatory FIR Registration for Cognizable Offences (Lalita Kumari & Section 173 BNSS):\\n"
                    "Under Section 173 Bharatiya Nagarik Suraksha Sanhita, 2023 (formerly Sec 154 CrPC) and the 5-Judge Constitution Bench ruling in Lalita Kumari v. Govt. of UP (2014) 2 SCC 1, the police are statutorily mandated to register a First Information Report (FIR) upon receiving information disclosing any cognizable offence (e.g. fraud, cheating, criminal breach of trust, assault, intimidation). The police possess zero discretionary power to refuse registration.\\n\\n"
                    "2. Immediate Station Acknowledgment (GD / CSR Receipt):\\n"
                    "When submitting your written complaint to the Station House Officer (SHO), demand an immediate Station General Diary (GD) entry number or Community Service Register (CSR) acknowledgment receipt. This establishes contemporaneous documentary evidence.\\n\\n"
                    "3. Step 2 Escalation — Representation to Superintendent of Police (Section 175(4) BNSS):\\n"
                    "If the SHO refuses to lodge an FIR, send the substance of your complaint along with an affidavit and proof of refusal by Registered Post AD or Speed Post to the District Superintendent of Police (SP) or Commissioner of Police under Section 175(4) BNSS (formerly Sec 154(3) CrPC).\\n\\n"
                    "4. Step 3 Escalation — Judicial Magistrate Application (Section 175(3) BNSS):\\n"
                    "If the police hierarchy fails to investigate within a reasonable timeframe, engage an advocate to file an Application supported by an affidavit before the jurisdictional Judicial Magistrate of First Class (JMFC) under Section 175(3) BNSS (formerly Sec 156(3) CrPC). Under this section, the Magistrate has statutory power to direct the police station to register an FIR and submit a status report.\\n\\n"
                    "5. Zero FIR Mandate Across India:\\n"
                    "In an ongoing emergency, a victim can lodge a 'Zero FIR' at ANY police station in India regardless of territorial jurisdiction. The station must record the FIR, assign a zero number, and formally transmit the docket to the jurisdictional station."
                ),
                "steps": [
                    "Draft a concise, chronologically structured written complaint addressed to the local Station House Officer (SHO) and obtain a GD/CSR receipt.",
                    "If refused by the SHO, dispatch a certified copy by Registered Post AD to the Superintendent of Police (SP) under Section 175(4) BNSS.",
                    "File an Application under Section 175(3) BNSS before the jurisdictional Judicial Magistrate (JMFC) to order police investigation.",
                    "Invoke the 'Zero FIR' statutory mandate if facing territorial jurisdiction objections from local police.",
                ],
            }

        # ── 1. CONSUMER DISPUTE & E-COMMERCE ──"""

    assert old_block in code, "old_block not found"
    code = code.replace(old_block, fir_block, 1)

    # 2. Add POSH/Defamation filter in fallback loop
    old_loop = """        for d in retrieved_docs:
            m = d.get("metadata", {})
            title = m.get("title", "Statutory Provision")"""

    new_loop = """        for d in retrieved_docs:
            m = d.get("metadata", {})
            title = m.get("title", "Statutory Provision")
            # Exclude inappropriate special statutes from general statutory fallback
            lower_q = query.lower()
            if "posh" in title.lower() or "sexual harassment" in title.lower():
                if not any(k in lower_q for k in ["posh", "harass", "sexual", "woman", "women", "workplace"]):
                    continue
            if "defamation" in title.lower():
                if not any(k in lower_q for k in ["defamat", "slander", "libel", "reputation", "social media"]):
                    continue"""

    assert old_loop in code, "old_loop not found"
    code = code.replace(old_loop, new_loop, 1)

    # 3. Fix document chat intent categorization
    old_doc_intent = """        # ── 2. Intent Categorization ─────────────────────────────────────────
        ql = query.lower()
        is_summary = any(k in ql for k in ["summar", "what is this", "what this is", "about", "explain", "overview", "say me", "meaning", "tell me"])
        is_unfair = any(k in ql for k in ["unfair", "one-sided", "onesided", "clause", "loophole", "risk", "danger", "pitfall", "illegal", "defect", "flaw"])
        is_steps = any(k in ql for k in ["step", "procedure", "remedy", "file", "action", "how to", "what to do", "what should"])
        is_parties = any(k in ql for k in ["who is", "parties", "accused", "complainant", "respondent", "against whom"])
        is_limitation = any(k in ql for k in ["limitation", "time limit", "deadline", "how many days", "period"])"""

    new_doc_intent = """        # ── 2. Intent Categorization ─────────────────────────────────────────
        ql = query.lower()
        is_fir = any(k in ql for k in [
            "fir", "f.i.r", "police", "police station", "sho", "cognizable",
            "154", "173 bnss", "zero fir", "file fir", "fire fir", "lodging fir",
            "police complaint", "sp office", "superintendent of police", "refused to file fir",
            "crime report", "156(3)", "175(3)", "magistrate complaint", "lalita kumari"
        ])
        is_summary = not is_fir and any(k in ql for k in ["summar", "what is this", "what this is", "overview", "meaning"])
        is_unfair = any(k in ql for k in ["unfair", "one-sided", "onesided", "clause", "loophole", "risk", "danger", "pitfall", "illegal", "defect", "flaw"])
        is_steps = any(k in ql for k in ["step", "procedure", "remedy", "action", "how to", "what to do", "what should"])
        is_parties = any(k in ql for k in ["who is", "parties", "accused", "complainant", "respondent", "against whom"])
        is_limitation = any(k in ql for k in ["limitation", "time limit", "deadline", "how many days", "period"])"""

    assert old_doc_intent in code, "old_doc_intent not found"
    code = code.replace(old_doc_intent, new_doc_intent, 1)

    # 4. Insert is_fir response in document chat before language sections
    old_lang_start = """        # ── 3. Multilingual Vernacular Generation ────────────────────────────
        # 3.A KANNADA (ಕನ್ನಡ)"""

    new_lang_start = """        # ── 3. Multilingual Vernacular Generation ────────────────────────────
        if is_fir:
            if language == "kn":
                return (
                    f"### ಎಫ್.ಐ.ಆರ್ (FIR) ದಾಖಲಿಸುವ ವಿಧಾನ ಮತ್ತು ಪೊಲೀಸರ ನಿರಾಕರಣೆಗೆ ಕಾನೂನು ಪರಿಹಾರ\\n\\n"
                    f"೧. **ಕಡ್ಡಾಯ ಎಫ್.ಐ.ಆರ್ ನೋಂದಣಿ (ಕಲಂ ೧೭೩ BNSS & ಲಲಿತಾ ಕುಮಾರಿ ತೀರ್ಪು)**:\\n"
                    f"   ಕಾಗ್ನಿಜೇಬಲ್ ಅಪರಾಧ (ವಂಚನೆ, ಹಲ್ಲೆ, ಜೀವ ಬೆದರಿಕೆ, ಅಪರಾಧ) ನಡೆದಾಗ ತಕ್ಷಣವೇ ಎಫ್.ಐ.ಆರ್ ದಾಖಲಿಸುವುದು ಪೊಲೀಸರ ಕಡ್ಡಾಯ ಕರ್ತವ್ಯವಾಗಿದೆ. ಪೊಲೀಸರು ನಿರಾಕರಿಸುವಂತಿಲ್ಲ.\\n\\n"
                    f"೨. **ಠಾಣಾಧಿಕಾರಿ (SHO) ನಿರಾಕರಿಸಿದರೆ ಹಂತ ೧ (ಕಲಂ ೧೭೫(೪) BNSS)**:\\n"
                    f"   ಲಿಖಿತ ದೂರನ್ನು ತಯಾರಿಸಿ, ಜಿಲ್ಲಾ ಪೊಲೀಸ್ ವರಿಷ್ಠಾಧಿಕಾರಿಗಳಿಗೆ (SP) ನೋಂದಾಯಿತ ಅಂಚೆ (RPAD) ಮೂಲಕ ಕಳುಹಿಸಿ ಮತ್ತು ಅಂಚೆ ರಸೀದಿಯನ್ನು ಕಾಯ್ದಿರಿಸಿ.\\n\\n"
                    f"೩. **ಮ್ಯಾಜಿಸ್ಟ್ರೇಟ್ ನ್ಯಾಯಾಲಯದಲ್ಲಿ ಅರ್ಜಿ - ಹಂತ ೨ (ಕಲಂ ೧೭೫(೩) BNSS / ೧೫೬(೩) CrPC)**:\\n"
                    f"   ಎಸ್ಪಿ ಹಂತದಲ್ಲೂ ಕ್ರಮವಾಗದಿದ್ದರೆ, ವಕೀಲರ ಮೂಲಕ ಸಕ್ಷಮ ಪ್ರಥಮ ದರ್ಜೆ ಮ್ಯಾಜಿಸ್ಟ್ರೇಟ್ (JMFC) ನ್ಯಾಯಾಲಯಕ್ಕೆ ಪ್ರಮಾಣಪತ್ರದೊಂದಿಗೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ ತನಿಖೆಗೆ ಆದೇಶ ಪಡೆಯಿರಿ.\\n\\n"
                    f"೪. **ಝೀರೋ ಎಫ್.ಐ.ಆರ್ (Zero FIR)**:\\n"
                    f"   ತುರ್ತು ಸಂದರ್ಭದಲ್ಲಿ ನ್ಯಾಯವ್ಯಾಪ್ತಿಯ ಮಿತಿ ಇಲ್ಲದೆ ಯಾವುದೇ ಪೊಲೀಸ್ ಠಾಣೆಯಲ್ಲಿ 'ಝೀರೋ ಎಫ್.ಐ.ಆರ್' ದಾಖಲಿಸಬಹುದು.\\n\\n"
                    f"[RISK: HIGH] Mandatory FIR registration rights under Section 173 BNSS."
                )
            elif language == "hi":
                return (
                    f"### प्राथमिकी (FIR) दर्ज कराने की विधिक प्रक्रिया एवं पुलिस इनकार पर उपचार\\n\\n"
                    f"1. **अनिवार्य प्राथमिकी पंजीकरण (धारा 173 BNSS एवं ललिता कुमारी निर्णय)**:\\n"
                    f"   संज्ञेय अपराध (धोखाधड़ी, हमला, धमकी आदि) की सूचना मिलने पर तुरंत एफआईआर दर्ज करना पुलिस का अनिवार्य वैधानिक दायित्व है। पुलिस इनकार नहीं कर सकती।\\n\\n"
                    f"2. **थाना प्रभारी द्वारा मना करने पर प्रथम चरण (धारा 175(4) BNSS)**:\\n"
                    f"   लिखित शिकायत की हस्ताक्षरित प्रति पंजीकृत डाक (RPAD) द्वारा जिले के पुलिस अधीक्षक (SP) या पुलिस आयुक्त को भेजें।\\n\\n"
                    f"3. **न्यायिक मजिस्ट्रेट के समक्ष आवेदन (धारा 175(3) BNSS)**:\\n"
                    f"   यदि एसपी द्वारा भी कार्रवाई न की जाए, तो सक्षम न्यायिक मजिस्ट्रेट (JMFC) के समक्ष शपथपत्र सहित धारा 175(3) BNSS के तहत आवेदन कर पुलिस जांच का न्यायिक आदेश प्राप्त करें।\\n\\n"
                    f"4. **जीरो एफआईआर (Zero FIR)**:\\n"
                    f"   आपात स्थिति में बिना किसी क्षेत्राधिकार सीमा के देश के किसी भी थाने में 'जीरो एफआईआर' दर्ज कराई जा सकती है।\\n\\n"
                    f"[RISK: HIGH] Mandatory FIR registration rights under Section 173 BNSS."
                )
            else:
                return (
                    f"### Legal Procedure for Filing an FIR & Addressing Police Refusal\\n\\n"
                    f"1. **Mandatory FIR Registration (Section 173 BNSS & Lalita Kumari Mandate)**:\\n"
                    f"   Under Section 173 of the Bharatiya Nagarik Suraksha Sanhita, 2023 (formerly Sec 154 CrPC) and the Constitution Bench judgment in *Lalita Kumari v. Govt of UP* (2014) 2 SCC 1, police are statutorily bound to register a First Information Report (FIR) upon receiving information disclosing any cognizable offence. Police have no discretion to refuse.\\n\\n"
                    f"2. **Station General Diary (GD / CSR) Receipt**:\\n"
                    f"   Submit your signed written complaint detailing date, time, location, persons involved, and sequence of facts to the Station House Officer (SHO). Demand an immediate GD entry or CSR receipt.\\n\\n"
                    f"3. **Remedy Upon Police Refusal (Section 175(4) BNSS / 154(3) CrPC)**:\\n"
                    f"   If the SHO refuses or delays registering the FIR, dispatch a certified copy of the complaint with an affidavit by Registered Post AD to the Superintendent of Police (SP) or Commissioner of Police under Section 175(4) BNSS.\\n\\n"
                    f"4. **Judicial Magistrate Directive (Section 175(3) BNSS / 156(3) CrPC)**:\\n"
                    f"   If inaction continues, engage an advocate to file an Application supported by an affidavit before the jurisdictional Judicial Magistrate of First Class (JMFC) under Section 175(3) BNSS. The Magistrate possesses the statutory power to order the police to register the FIR and investigate immediately.\\n\\n"
                    f"5. **Zero FIR Mandate**:\\n"
                    f"   In case of emergencies or disputes occurring across city/state borders, a 'Zero FIR' can be registered at ANY police station in India regardless of jurisdiction, which will subsequently be transferred to the local station.\\n\\n"
                    f"[RISK: HIGH] Mandatory statutory right to FIR registration under Section 173 BNSS."
                )

        # 3.A KANNADA (ಕನ್ನಡ)"""

    assert old_lang_start in code, "old_lang_start not found"
    code = code.replace(old_lang_start, new_lang_start, 1)

    with open(target_path, 'w', encoding='utf-8') as f:
        f.write(code)

    print("SUCCESS: rag_service.py has been updated!")

if __name__ == "__main__":
    update()
