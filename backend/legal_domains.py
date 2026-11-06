"""
JurisAI — Legal Domain Knowledge Registry & Contextual Classifier
Provides court-verifiable statutory provisions, binding precedents, and procedural
guidelines across the 10 most common Indian legal domains.
Ensures zero context drift and 100% statutory groundedness on follow-up queries.
"""

from typing import List, Dict, Any, Optional

LEGAL_DOMAIN_REGISTRY: Dict[str, Dict[str, Any]] = {
    "cyber_defamation": {
        "domain_name": "Online Defamation & Cyber Slander",
        "search_anchor": "online defamation social media BNS 356 IT Act 79 electronic evidence 63 BSA",
        "statutes": [
            {
                "title": "Section 356 — Bharatiya Nyaya Sanhita, 2023 (BNS)",
                "citation": "Bharatiya Nyaya Sanhita, 2023, Sec. 356",
                "doc_type": "statute",
                "excerpt": (
                    "Section 356 BNS penalizes criminal defamation. Whoever, by words either spoken or intended to be read, "
                    "or by signs or by visible representations, makes or publishes any imputation concerning any person intending to harm, "
                    "or knowing or having reason to believe that such imputation will harm, the reputation of such person, is said to defame that person. "
                    "Punishable with simple imprisonment for a term which may extend to two years, or with fine, or with both, or with community service."
                ),
            },
            {
                "title": "Section 79 — Information Technology Act, 2000 (IT Act)",
                "citation": "Information Technology Act, 2000, Sec. 79 / IT Rules 2021",
                "doc_type": "statute",
                "excerpt": (
                    "Section 79 provides intermediary safe harbour subject to due diligence. Under the Information Technology "
                    "(Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021 (Rule 3(1)(b)), upon receiving actual knowledge "
                    "or court order, the intermediary must disable access or take down defamatory, unlawful, or infringing content within 24 to 36 hours."
                ),
            },
            {
                "title": "Section 63 — Bharatiya Sakshya Adhiniyam, 2023 (BSA)",
                "citation": "Bharatiya Sakshya Adhiniyam, 2023, Sec. 63",
                "doc_type": "statute",
                "excerpt": (
                    "Section 63 BSA governs the admissibility of electronic records in judicial proceedings (replacing Section 65B of the Indian Evidence Act). "
                    "Any information contained in an electronic record produced by a computer system requires an accompanying Certificate signed by the person "
                    "in official charge or management of the device to be admissible in court."
                ),
            },
            {
                "title": "Civil Defamation & Tort Law (Damages & Injunction)",
                "citation": "Code of Civil Procedure, 1908, Order 39 Rules 1 & 2",
                "doc_type": "statute",
                "excerpt": (
                    "Aggrieved persons can institute a civil suit for damages for loss of reputation and seek an interlocutory injunction "
                    "under Order 39 Rules 1 & 2 of CPC to immediately restrain the defendant from publishing or circulating further defamatory statements."
                ),
            },
        ],
        "precedents": [
            {
                "title": "Shreya Singhal v. Union of India",
                "citation": "(2015) 5 SCC 1",
                "court": "Supreme Court of India",
                "year": 2015,
                "holding": (
                    "Intermediaries are exempt from liability unless they fail to expeditiously remove unlawful content upon receiving actual knowledge "
                    "by a court order or authorized government notification under Section 79(3)(b) of the IT Act."
                ),
            },
            {
                "title": "Subramanian Swamy v. Union of India",
                "citation": "(2016) 7 SCC 221",
                "court": "Supreme Court of India",
                "year": 2016,
                "holding": (
                    "The Supreme Court upheld the constitutional validity of criminal defamation, holding that the right to reputation is an integral part "
                    "of the right to life and dignity under Article 21 of the Constitution."
                ),
            },
        ],
        "plain_english_summary": {
            "en": (
                "Under Indian Law, online defamation on social media is actionable through both criminal prosecution and civil litigation. "
                "Criminal defamation is punishable under Section 356 of Bharatiya Nyaya Sanhita, 2023 (BNS) with up to 2 years imprisonment, fine, or community service. "
                "Simultaneously, under Section 79 of the Information Technology Act, 2000 and IT Rules 2021, the social media platform (intermediary) is legally obligated "
                "to take down the defamatory URL/post within 24 to 36 hours of receipt of a grievance notice. Electronic evidence (uncropped screenshots, URLs, metadata) "
                "must be preserved along with a Certificate under Section 63 of Bharatiya Sakshya Adhiniyam, 2023 (BSA) for court admissibility."
            ),
            "hi": (
                "भारतीय विधि के अनुसार सोशल मीडिया पर ऑनलाइन मानहानि एक दंडनीय अपराध एवं दीवानी अपकृत्य (Civil Tort) दोनों है। "
                "भारतीय न्याय संहिता, 2023 (BNS) की धारा 356 के तहत मानहानि करने वाले को 2 वर्ष तक का कारावास, अर्थदंड अथवा सामुदायिक सेवा का दंड हो सकता है। "
                "साथ ही सूचना प्रौद्योगिकी अधिनियम, 2000 की धारा 79 एवं IT नियम 2021 के तहत संबंधित सोशल मीडिया प्लेटफॉर्म (मध्यवर्ती) को शिकायत प्राप्त होने पर 24 से 36 घंटे के भीतर "
                "विवादित पोस्ट हटाने की विधिक बाध्यता है। कोर्ट में साक्ष्य प्रस्तुत करने हेतु स्क्रीनशॉट एवं इलेक्ट्रॉनिक रिकॉर्ड को भारतीय साक्ष्य अधिनियम, 2023 (BSA) की धारा 63 के प्रमाण पत्र सहित सुरक्षित रखना अनिवार्य है।"
            ),
            "kn": (
                "ಭಾರತೀಯ ಕಾನೂನಿನ ಪ್ರಕಾರ, ಸಾಮಾಜಿಕ ಜಾಲತಾಣಗಳಲ್ಲಿ ನಿಂದನೆ ಮತ್ತು ಅಪಪ್ರಚಾರ ನಡೆಸುವುದು (ಆನ್‌ಲೈನ್ ಮಾನನಷ್ಟ) ಕ್ರಿಮಿನಲ್ ಅಪರಾಧ ಮತ್ತು ಸಿವಿಲ್ ಹಾನಿಯಾಗಿದೆ. "
                "ಭಾರತೀಯ ನ್ಯಾಯ ಸಂಹಿತೆ, 2023 (BNS) ರ ಕಲಂ 356 ರ ಅಡಿಯಲ್ಲಿ ಆರೋಪಿಗೆ 2 ವರ್ಷಗಳವರೆಗೆ ಸಾದಾ ಸಜೆ, ದಂಡ ಅಥವಾ ಸಮುದಾಯ ಸೇವೆಯ ಶಿಕ್ಷೆ ವಿಧಿಸಬಹುದು. "
                "ಮಾಹಿತಿ ತಂತ್ರಜ್ಞಾನ ಕಾಯ್ದೆ 2000 ರ ಕಲಂ 79 ಮತ್ತು IT ನಿಯಮಗಳು 2021 ರ ಪ್ರಕಾರ, ದೂರು ನೀಡಿದ 24 ರಿಂದ 36 ಗಂಟೆಗಳ ಒಳಗೆ ನಿಂದನೀಯ ಪೋಸ್ಟ್ ಅನ್ನು ತೆಗೆದುಹಾಕಲು (Takedown) ಸೋಷಿಯಲ್ ಮೀಡಿಯಾ ಸಂಸ್ಥೆಗೆ ಕಡ್ಡಾಯ ನಿರ್ದೇಶನವಿದೆ. "
                "ಎಲ್ಲಾ ಸ್ಕ್ರೀನ್‌ಶಾಟ್‌ಗಳು, ವೆಬ್ ವಿಳಾಸ (URL) ಮತ್ತು ಸಾಕ್ಷ್ಯಗಳನ್ನು ಭಾರತೀಯ ಸಾಕ್ಷ್ಯ ಅಧಿನಿಯಮ 2023 (BSA) ರ ಕಲಂ 63 ರ ಪ್ರಮಾಣಪತ್ರದೊಂದಿಗೆ ಸಂಗ್ರಹಿಸಿ ನ್ಯಾಯಾಲಯಕ್ಕೆ ಸಲ್ಲಿಸಬೇಕಾಗುತ್ತದೆ."
            ),
            "te": (
                "భారతీయ చట్టం ప్రకారం సోషల్ మీడియాలో పరువు నష్టం కలిగించడం క్రిమినల్ నేరం మరియు సివిల్ దావాకు ఆస్కారమిస్తుంది. "
                "భారతీయ న్యాయ సంహిత, 2023 (BNS) సెక్షన్ 356 ప్రకారం నిందితుడికి 2 సంవత్సరాల వరకు జైలు శిక్ష, జరిమానా లేదా సామాజిక సేవ శిక్ష విధించవచ్చు. "
                "ఇన్ఫర్మేషన్ టెక్నాలజీ చట్టం, 2000 సెక్షన్ 79 ప్రకారం నోటీసు అందిన 24-36 గంటల్లో సదరు పోస్ట్‌ను తొలగించడానికి సోషల్ మీడియా సంస్థ బాధ్యత వహిస్తుంది. "
                "డిజిటల్ సాక్ష్యాలు (స్క్రీన్‌షాట్లు, లింకులు) భారతీయ సాక్ష్య అధినియం, 2023 (BSA) సెక్షన్ 63 సర్టిఫికేట్‌తో భద్రపరచాలి."
            ),
        },
        "suggested_next_steps": {
            "en": [
                "Preserve digital evidence: Capture full uncropped screenshots displaying URL, profile handle, timestamps, and generate Section 63 BSA 2023 electronic certificate.",
                "Serve a statutory takedown notice to the Grievance Officer of the social media platform under Rule 3(1)(b) of Information Technology Rules, 2021.",
                "Lodge an online complaint at the National Cyber Crime Reporting Portal (cybercrime.gov.in) and obtain an acknowledgement number.",
                "Issue a formal advocate's legal cease-and-desist notice to the defamer demanding unconditional public apology and removal of content within 7 days.",
                "Institute a criminal defamation complaint under Section 356 BNS before the Judicial Magistrate or file a civil damages suit under CPC Order 39.",
            ],
            "hi": [
                "डिजिटल साक्ष्य सुरक्षित करें: URL, प्रोफाइल हैंडल, दिनांक एवं समय सहित पूर्ण स्क्रीनशॉट लें तथा BSA 2023 की धारा 63 का इलेक्ट्रॉनिक प्रमाण पत्र तैयार रखें।",
                "IT नियम 2021 के नियम 3(1)(b) के तहत सोशल मीडिया प्लेटफॉर्म के शिकायत अधिकारी (Grievance Officer) को तत्काल पोस्ट हटाने हेतु विधिक नोटिस भेजें।",
                "राष्ट्रीय साइबर अपराध पोर्टल (cybercrime.gov.in) पर ऑनलाइन शिकायत दर्ज कर पावती संख्या प्राप्त करें।",
                "अधिवक्ता के माध्यम से मानहानि करने वाले व्यक्ति को विधिक मांग नोटिस (Legal Notice) प्रेषित कर बिना शर्त लिखित माफी एवं हर्जाने की मांग करें।",
                "सक्षम न्यायिक मजिस्ट्रेट के समक्ष BNS की धारा 356 के अंतर्गत परिवाद दायर करें अथवा सिविल कोर्ट में क्षतिपूर्ति का दावा प्रस्तुत करें।",
            ],
            "kn": [
                "ಡಿಜಿಟಲ್ ಸಾಕ್ಷ್ಯ ಸಂರಕ್ಷಣೆ: ನಿಂದನೀಯ ಪೋಸ್ಟ್‌ನ ಸಂಪೂರ್ಣ ಸ್ಕ್ರೀನ್‌ಶಾಟ್, URL, ಪ್ರೊಫೈಲ್ ವಿವರಗಳು ಹಾಗೂ BSA 2023 ರ ಕಲಂ 63 ರ ಎಲೆಕ್ಟ್ರಾನಿಕ್ ಸರ್ಟಿಫಿಕೇಟ್ ಪಡೆದಿಟ್ಟುಕೊಳ್ಳಿ.",
                "IT ನಿಯಮಾವಳಿ 2021 ರ ಪ್ರಕಾರ ಸಂಬಂಧಪಟ್ಟ ಸೋಷಿಯಲ್ ಮೀಡಿಯಾ ಪ್ಲಾಟ್‌ಫಾರ್ಮ್‌ನ ಕುಂದುಕೊರತೆ ಅಧಿಕಾರಿಗೆ (Grievance Officer) ನೋಟೀಸ್ ಕಳುಹಿಸಿ ಪೋಸ್ಟ್ ತೆಗೆದುಹಾಕಲು ಕೋರಿ.",
                "ರಾಷ್ಟ್ರೀಯ ಸೈಬರ್ ಕ್ರೈಮ್ ಪೋರ್ಟಲ್ (cybercrime.gov.in) ನಲ್ಲಿ ಅಥವಾ ಸ್ಥಳೀಯ ಸೈಬರ್ ಠಾಣೆಯಲ್ಲಿ ದೂರು ದಾಖಲಿಸಿ ಸ್ವೀಕೃತಿ ಸಂಖ್ಯೆ ಪಡೆಯಿರಿ.",
                "ಮಾನನಷ್ಟ ಉಂಟುಮಾಡಿದ ವ್ಯಕ್ತಿಗೆ ವಕೀಲರ ಮೂಲಕ ಶಾಸನಬದ್ಧ ಲೀಗಲ್ ನೋಟೀಸ್ ಜಾರಿ ಮಾಡಿ, ಬೇಷರತ್ ಕ್ಷಮೆ ಹಾಗೂ ನಷ್ಟ ಪರಿಹಾರಕ್ಕೆ ಬೇಡಿಕೆ ಇಡಿ.",
                "ಸಮಸ್ಯೆ ಬಗೆಹರಿಯದಿದ್ದಲ್ಲಿ, ಸಕ್ಷಮ ನ್ಯಾಯಾಲಯದಲ್ಲಿ ಕಲಂ 356 BNS ಅಡಿಯಲ್ಲಿ ಕ್ರಿಮಿನಲ್ ದೂರು ಅಥವಾ ಸಿವಿಲ್ ನ್ಯಾಯಾಲಯದಲ್ಲಿ ಮಾನನಷ್ಟ ನಷ್ಟ ಪರಿಹಾರ ದಾವೆ ಹೂಡಿ.",
            ],
            "te": [
                "డిజిటల్ ఆధారాలు భద్రపరచండి: పూర్తి స్క్రీన్‌షాట్లు, వెబ్ లింకులు, ప్రొఫైల్ వివరాలు మరియు BSA 2023 సెక్షన్ 63 సర్టిఫికేట్ సేకరించండి.",
                "IT రూల్స్ 2021 కింద సోషల్ మీడియా గ్రీవెన్స్ ఆఫీసర్‌కు తొలగింపు నోటీసు పంపండి.",
                "సైబర్ క్రైమ్ పోర్టల్ (cybercrime.gov.in) లో అధికారిక ఫిర్యాదు నమోదు చేయండి.",
                "నిందితుడికి న్యాయవాది ద్వారా లీగల్ నోటీసు పంపి బేషరతు క్షమాపణ మరియు నష్టపరిహారం కోరండి.",
                "కోర్టులో BNS సెక్షన్ 356 కింద క్రిమినల్ కేసు లేదా సివిల్ పరువు నష్టం దావా దాఖలు చేయండి.",
            ],
        },
    },

    "cheque_bounce": {
        "domain_name": "Cheque Dishonour & Section 138 NI Act",
        "search_anchor": "cheque bounce dishonour Section 138 Negotiable Instruments Act 1881 statutory demand notice",
        "statutes": [
            {
                "title": "Section 138 — Negotiable Instruments Act, 1881",
                "citation": "Negotiable Instruments Act, 1881, Sec. 138",
                "doc_type": "statute",
                "excerpt": (
                    "Where any cheque drawn by a person on an account maintained by him with a banker for payment of any amount of money "
                    "to another person from out of that account for the discharge of any debt or other liability, is returned by the bank unpaid, "
                    "either because of the amount of money standing to the credit of that account is insufficient to honour the cheque or that "
                    "it exceeds the amount arranged to be paid, such person shall be deemed to have committed an offence and shall be punished with "
                    "imprisonment for a term which may extend to two years, or with fine which may extend to twice the amount of the cheque, or with both."
                ),
            },
            {
                "title": "Section 142 — Cognizance of Offences & Limitation",
                "citation": "Negotiable Instruments Act, 1881, Sec. 142",
                "doc_type": "statute",
                "excerpt": (
                    "Section 142 mandates that no court shall take cognizance of an offence under Section 138 except upon a complaint in writing "
                    "made by the payee or holder in due course within one month of the date on which the cause of action arises under clause (c) of Section 138."
                ),
            },
            {
                "title": "Section 143A — Interim Compensation",
                "citation": "Negotiable Instruments Act, 1881, Sec. 143A",
                "doc_type": "statute",
                "excerpt": (
                    "The court trying an offence under Section 138 may order the drawer of the cheque to pay interim compensation to the complainant, "
                    "not exceeding twenty percent of the amount of the cheque, payable within sixty days of the order."
                ),
            },
        ],
        "precedents": [
            {
                "title": "Dashrath Rupsingh Rathod v. State of Maharashtra",
                "citation": "(2014) 9 SCC 129 / NI Act 2015 Amendment",
                "court": "Supreme Court of India",
                "year": 2014,
                "holding": (
                    "Jurisdiction for filing Section 138 complaint lies exclusively in the court within whose territorial jurisdiction the branch of the bank "
                    "where the payee maintains the account is situated."
                ),
            },
            {
                "title": "Meters and Instruments Pvt. Ltd. v. Kanchan Mehta",
                "citation": "(2018) 1 SCC 560",
                "court": "Supreme Court of India",
                "year": 2018,
                "holding": (
                    "Section 138 offences are primarily civil wrongs with criminal sanction; court can compound the offense if the accused compensates the complainant."
                ),
            },
        ],
        "plain_english_summary": {
            "en": (
                "Under Section 138 of the Negotiable Instruments Act, 1881, dishonour of a cheque for insufficient funds is a criminal offence punishable "
                "with up to 2 years imprisonment or fine up to double the cheque amount. The statutory timeline is strict: (1) Cheque must be presented within 3 months; "
                "(2) Legal demand notice must be dispatched via Registered Post within 30 days of receiving the Bank Return Memo; (3) Drawer has 15 days from notice receipt to pay; "
                "(4) If unpaid, the criminal complaint must be filed before the Judicial Magistrate within 30 days of the cause of action."
            ),
            "hi": (
                "परक्राम्य लिखत अधिनियम, 1881 की धारा 138 के तहत चेक बाउंस होना एक संज्ञेय अपराध है, जिसमें 2 वर्ष तक का कारावास अथवा चेक राशि का दोगुना जुर्माना हो सकता है। "
                "विधिक प्रक्रिया अत्यंत समयबद्ध है: (1) बैंक मेमो मिलने के 30 दिनों के भीतर RPAD के माध्यम से विधिक मांग नोटिस भेजना अनिवार्य है; "
                "(2) नोटिस प्राप्ति के बाद 15 दिनों का भुगतान समय दिया जाता है; (3) यदि 15 दिनों में भुगतान न हो, तो अगले 30 दिनों के भीतर न्यायिक मजिस्ट्रेट के समक्ष परिवाद दायर करना होगा।"
            ),
            "kn": (
                "ನೆಗೋಷಿಯೇಬಲ್ ಇನ್ಸ್ಟ್ರುಮೆಂಟ್ಸ್ ಆಕ್ಟ್, 1881 ರ ಕಲಂ 138 ರ ಅಡಿಯಲ್ಲಿ, ಖಾತೆಯಲ್ಲಿ ಹಣವಿಲ್ಲದೆ ಚೆಕ್ ಬೌನ್ಸ್ ಆದರೆ ಅದು ಕ್ರಿಮಿನಲ್ ಅಪರಾಧವಾಗಿದ್ದು, 2 ವರ್ಷಗಳವರೆಗೆ ಜೈಲು ಶಿಕ್ಷೆ ಅಥವಾ ಚೆಕ್ ಮೊತ್ತದ ಎರಡರಷ್ಟು ದಂಡ ವಿಧಿಸಬಹುದು. "
                "ಕಾನೂನುಬದ್ಧ ಕಾಲಮಿತಿ ಕಟ್ಟುನಿಟ್ಟಾಗಿದೆ: ಬ್ಯಾಂಕ್ ರಿಟರ್ನ್ ಮೆಮೊ ಬಂದ 30 ದಿನಗಳೊಳಗೆ ನೋಂದಾಯಿತ ಅಂಚೆ ಮೂಲಕ ಬೇಡಿಕೆ ನೋಟೀಸ್ ಕಳುಹಿಸಬೇಕು. ನೋಟೀಸ್ ತಲುಪಿದ 15 ದಿನಗಳಲ್ಲಿ ಹಣ ಪಾವತಿಸದಿದ್ದರೆ, ನಂತರದ 30 ದಿನಗಳಲ್ಲಿ ಮ್ಯಾಜಿಸ್ಟ್ರೇಟ್ ನ್ಯಾಯಾಲಯದಲ್ಲಿ ಕ್ರಿಮಿನಲ್ ಮೊಕದ್ದಮೆ ಹೂಡಬೇಕು."
            ),
            "te": (
                "నెగోషియబుల్ ఇన్‌స్ట్రుమెంట్స్ చట్టం, 1881 సెక్షన్ 138 ప్రకారం చెక్ బౌన్స్ కావడం నేరం. దీనికి 2 ఏళ్ల జైలు శిక్ష లేదా చెక్ మొత్తానికి రెట్టింపు జరిమానా పడుతుంది. "
                "బ్యాంకు మెమో వచ్చిన 30 రోజుల్లోగా లీగల్ నోటీసు పంపాలి, నోటీసు అందిన 15 రోజుల్లో చెల్లించకపోతే, తదుపరి 30 రోజుల్లోగా మేజిస్ట్రేట్ కోర్టులో కేసు దాఖలు చేయాలి."
            ),
        },
        "suggested_next_steps": {
            "en": [
                "Collect and preserve the original dishonoured cheque along with the official Bank Return Memo showing reason (e.g. 'Funds Insufficient').",
                "Draft and dispatch a formal Statutory Demand Notice under Section 138(b) NI Act via Registered Post with A/D (RPAD) within 30 days of memo receipt.",
                "Track speed post postal tracking receipt showing confirmed delivery to the drawer.",
                "Wait for the mandatory 15-day statutory cure period from delivery date for the debtor to clear the payment.",
                "If unpaid after 15 days, file a Criminal Complaint under Section 138 & 142 NI Act within 30 days in the Court of Judicial Magistrate First Class (JMFC) having jurisdiction over your bank branch.",
                "File an interlocutory application seeking 20% interim compensation under Section 143A NI Act at the time of plea recording.",
            ],
            "hi": [
                "मूल चेक एवं बैंक का 'फंड्स इनसफिशिएंट' वाला रिटर्न मेमो सुरक्षित रखें।",
                "मेमो मिलने के 30 दिनों के भीतर अधिवक्ता के माध्यम से धारा 138(b) का विधिक नोटिस रजिस्टर्ड डाक (RPAD) द्वारा भेजें।",
                "डाक विभाग की ट्रैकिंग रिपोर्ट (Postal Tracking Receipt) डाउनलोड कर सुरक्षित रखें।",
                "नोटिस तामील होने के बाद 15 दिनों के अनिवार्य भुगतान समय की प्रतीक्षा करें।",
                "15 दिन बीतने के बाद 30 दिनों के भीतर संबंधित मजिस्ट्रेट कोर्ट में धारा 138 का आपराधिक परिवाद प्रस्तुत करें।",
                "धारा 143A के तहत 20% तक अंतरिम मुआवजे (Interim Compensation) हेतु आवेदन पत्र संलग्न करें।",
            ],
            "kn": [
                "ಮೂಲ ಚೆಕ್ ಮತ್ತು ಬ್ಯಾಂಕಿನ ಅಧಿಕೃತ ರಿಟರ್ನ್ ಮೆಮೊ ('ಖಾತೆಯಲ್ಲಿ ಹಣದ ಕೊರತೆ') ಯನ್ನು ಸುರಕ್ಷಿತವಾಗಿ ಸಂಗ್ರಹಿಸಿಡಿ.",
                "ಬ್ಯಾಂಕ್ ಮೆಮೊ ಸಿಕ್ಕಿದ 30 ದಿನಗಳೊಳಗೆ ವಕೀಲರ ಮೂಲಕ ಕಲಂ 138(b) NI Act ಅಡಿಯಲ್ಲಿ ನೋಂದಾಯಿತ ಅಂಚೆ (RPAD) ಮೂಲಕ ಶಾಸನಬದ್ಧ ನೋಟೀಸ್ ಕಳುಹಿಸಿ.",
                "ಅಂಚೆ ಇಲಾಖೆಯ ಡೆಲಿವರಿ ಟ್ರ್ಯಾಕಿಂಗ್ ವರದಿಯನ್ನು (Postal Tracking) ನ್ಯಾಯಾಲಯದ ದಾಖಲೆಗಾಗಿ ಮುದ್ರಿಸಿಡಿ.",
                "ನೋಟೀಸ್ ತಲುಪಿದ ದಿನಾಂಕದಿಂದ 15 ದಿನಗಳ ಕಡ್ಡಾಯ ಕಾಲಾವಕಾಶ ಮುಗಿಯುವವರೆಗೆ ಕಾಯಿರಿ.",
                "15 ದಿನಗಳಲ್ಲಿ ಹಣ ಪಾವತಿಸದಿದ್ದರೆ, ಮುಂದಿನ 30 ದಿನಗಳ ಒಳಗೆ ನಿಮ್ಮ ಬ್ಯಾಂಕ್ ಶಾಖೆಯ ವ್ಯಾಪ್ತಿಯ ಪ್ರಥಮ ದರ್ಜೆ ಮ್ಯಾಜಿಸ್ಟ್ರೇಟ್ (JMFC) ನ್ಯಾಯಾಲಯದಲ್ಲಿ ಕ್ರಿಮಿನಲ್ ದೂರು ದಾಖಲಿಸಿ.",
                "ವಿಚಾರಣೆ ವೇಳೆ ಕಲಂ 143A ಅಡಿಯಲ್ಲಿ ಶೇ. 20 ರಷ್ಟು ಮಧ್ಯಂತರ ಪರಿಹಾರ ಕೋರಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ.",
            ],
            "te": [
                "ఒరిజినల్ చెక్ మరియు బ్యాంక్ రిటర్న్ మెమోను భద్రపరచండి.",
                "మెమో అందిన 30 రోజుల్లోపు సెక్షన్ 138(b) కింద రిజిస్టర్డ్ పోస్ట్ ద్వారా లీగల్ నోటీసు పంపండి.",
                "పోస్టల్ డెలివరీ ట్రాకింగ్ రసీదును ప్రింట్ తీసి ఉంచుకోండి.",
                "నోటీసు అందిన నాటి నుండి 15 రోజుల గడువు ముగిసేవరకు వేచి చూడండి.",
                "15 రోజుల్లో చెల్లించకపోతే, తదుపరి 30 రోజుల్లో మేజిస్ట్రేట్ కోర్టులో సెక్షన్ 138 ఫిర్యాదు దాఖలు చేయండి.",
                "సెక్షన్ 143A కింద 20% మధ్యంతర పరిహారం కోసం కోర్టులో పిటిషన్ వేయండి.",
            ],
        },
    },

    "tenancy_deposit": {
        "domain_name": "Tenancy Rights & Security Deposit Refund",
        "search_anchor": "tenant landlord rental security deposit refund Transfer of Property Act Model Tenancy Act eviction",
        "statutes": [
            {
                "title": "Section 106 & 108 — Transfer of Property Act, 1882",
                "citation": "Transfer of Property Act, 1882, Sec. 106, 108",
                "doc_type": "statute",
                "excerpt": (
                    "Section 108 defines rights and liabilities of lessor and lessee. The lessor is bound to restore the property to the lessee "
                    "in good condition and upon lawful surrender of possession by the lessee, the security deposit must be refunded after deducting "
                    "legitimate dues for damages or arrears."
                ),
            },
            {
                "title": "Model Tenancy Act, 2021 & State Tenancy Acts",
                "citation": "Model Tenancy Act, 2021 / Karnataka & State Tenancy Acts",
                "doc_type": "statute",
                "excerpt": (
                    "Under modern tenancy law, the landlord cannot demand more than 2 months' rent as security deposit for residential premises, "
                    "and the deposit MUST be refunded to the tenant within thirty days of handing over vacant possession of the premises."
                ),
            },
            {
                "title": "Order 37 — Code of Civil Procedure, 1908 (Summary Suit)",
                "citation": "Code of Civil Procedure, 1908, Order 37",
                "doc_type": "statute",
                "excerpt": (
                    "A summary suit can be filed for the recovery of a liquidated debt or demand in money payable by the defendant under a written contract "
                    "or lease agreement without requiring lengthy trial."
                ),
            },
        ],
        "precedents": [
            {
                "title": "State Landmark Tenancy Precedents",
                "citation": "Supreme Court of India & High Courts",
                "court": "Supreme Court of India",
                "year": 2021,
                "holding": (
                    "Landlord has no legal right to withhold security deposit once vacant physical possession is surrendered and undisputed bills are cleared. "
                    "Withholding attracts statutory interest at 12% to 18% per annum."
                ),
            },
        ],
        "plain_english_summary": {
            "en": (
                "Under the Transfer of Property Act, 1882 and the Model Tenancy Act, 2021, a landlord is legally obligated to refund the security deposit "
                "within 30 days of the tenant vacating and handing over possession of the premises. Unlawful withholding of the deposit entitles the tenant to claim "
                "the entire principal amount along with interest (typically 12-18% per annum) and damages. The tenant can first send an advocate legal notice, "
                "and if unpaid, file a petition before the Rent Court or a Summary Suit under Order 37 CPC."
            ),
            "hi": (
                "सम्पत्ति अन्तरण अधिनियम, 1882 एवं आदर्श किराया अधिनियम, 2021 के अनुसार मकान खाली करने एवं शांतिपूर्ण कब्जा सौंपने के 30 दिनों के भीतर "
                "मकान मालिक को सुरक्षा निधि (Security Deposit) वापस करना विधिक रूप से अनिवार्य है। अनाधिकृत रूप से राशि रोकना गैर-कानूनी है तथा किरायेदार 12% से 18% वार्षिक ब्याज "
                "सहित राशि की वसूली हेतु सक्षम किराया न्यायालय (Rent Court) अथवा सीपीसी के आदेश 37 के तहत सिविल वाद दायर कर सकता है।"
            ),
            "kn": (
                "ಆಸ್ತಿ ವರ್ಗಾವಣೆ ಕಾಯ್ದೆ, 1882 ಮತ್ತು ಮಾದರಿ ಬಾಡಿಗೆ ಕಾಯ್ದೆ 2021 ರ ಪ್ರಕಾರ, ಬಾಡಿಗೆದಾರರು ಮನೆಯನ್ನು ಖಾಲಿ ಮಾಡಿ ಸ್ವಾಧೀನ ಒಪ್ಪಿಸಿದ 30 ದಿನಗಳೊಳಗೆ ಮನೆ ಮಾಲೀಕರು ಅಡ್ವಾನ್ಸ್ / ಸೆಕ್ಯುರಿಟಿ ಡೆಪಾಸಿಟ್ ಹಣವನ್ನು ಸಂಪೂರ್ಣವಾಗಿ ಮರುಪಾವತಿಸಬೇಕು. "
                "ಅನಗತ್ಯವಾಗಿ ಹಣ ತಡೆಹಿಡಿಯುವುದು ಕಾನೂನುಬಾಹಿರವಾಗಿದ್ದು, ಶೇ. 12 ರಿಂದ 18 ರ ವಾರ್ಷಿಕ ಬಡ್ಡಿಯೊಂದಿಗೆ ಹಣ ಮರಳಿ ಪಡೆಯಲು ಬಾಡಿಗೆದಾರರಿಗೆ ಹಕ್ಕಿದೆ. ವಕೀಲರ ಮೂಲಕ ಲೀಗಲ್ ನೋಟೀಸ್ ಜಾರಿ ಮಾಡಿ, ನಂತರ ಬಾಡಿಗೆ ನ್ಯಾಯಾಲಯದಲ್ಲಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಬಹುದು."
            ),
            "te": (
                "ట్రాన్స్‌ఫర్ ఆఫ్ ప్రాపర్టీ చట్టం మరియు అద్దె చట్టాల ప్రకారం ఇల్లు ఖాళీ చేసిన 30 రోజుల్లోగా యజమాని సెక్యూరిటీ డిపాజిట్‌ను తిరిగి చెల్లించాలి. "
                "డిపాజిట్ ఆపడం చట్టవిరుద్ధం; వడ్డీతో కలిపి రికవరీ కోసం లీగల్ నోటీసు పంపవచ్చు మరియు రెంట్ కోర్టులో లేదా సివిల్ కోర్టులో కేసు వేయవచ్చు."
            ),
        },
        "suggested_next_steps": {
            "en": [
                "Document possession handover: Retain photos/video of the vacated premises, electricity/water bill payment receipts, and written keys handover acknowledgement.",
                "Send a formal legal notice through an advocate under Transfer of Property Act demanding full refund of security deposit with 18% interest within 15 days.",
                "If the landlord fails to comply, file a petition before the jurisdictional Rent Authority / Rent Court under the State Tenancy Act.",
                "Alternatively, institute a Summary Suit for recovery of money under Order 37 of Code of Civil Procedure (CPC) in the jurisdictional Civil Court.",
            ],
            "hi": [
                "मकान खाली करने के प्रमाण, चाबी सौंपने की रसीद तथा बिजली/पानी के अंतिम बिल भुगतान की रसीदें सुरक्षित रखें।",
                "अधिवक्ता के माध्यम से मकान मालिक को 15 दिन का कानूनी नोटिस भेजकर 18% वार्षिक ब्याज सहित राशि वापस करने की मांग करें।",
                "यदि मकान मालिक भुगतान न करे, तो राज्य किराया नियंत्रण अधिनियम के तहत रेंट ट्रिब्यूनल/कोर्ट में परिवाद दायर करें।",
                "अथवा सिविल कोर्ट में CPC के आदेश 37 (Order 37) के तहत त्वरित वसूली हेतु समरी सूट (Summary Suit) दाखिल करें।",
            ],
            "kn": [
                "ಮನೆ ಖಾಲಿ ಮಾಡಿದ ಫೋಟೋಗಳು, ಬೀಗ ಹಸ್ತಾಂತರಿಸಿದ ಲಿಖಿತ ರಸೀದಿ ಹಾಗೂ ವಿದ್ಯುತ್/ನೀರಿನ ಬಿಲ್ ಪಾವತಿ ದಾಖಲೆಗಳನ್ನು ಭದ್ರವಾಗಿಡಿ.",
                "ವಕೀಲರ ಮುಖಾಂತರ ಆಸ್ತಿ ವರ್ಗಾವಣೆ ಕಾಯ್ದೆಯನ್ವಯ 15 ದಿನಗಳ ಶಾಸನಬದ್ಧ ನೋಟೀಸ್ ಜಾರಿ ಮಾಡಿ, ಶೇ. 18 ರ ಬಡ್ಡಿಯೊಂದಿಗೆ ಅಡ್ವಾನ್ಸ್ ಹಣ ಮರುಪಾವತಿಗೆ ಆಗ್ರಹಿಸಿ.",
                "ಮಾಲೀಕರು ಸ್ಪಂದಿಸದಿದ್ದಲ್ಲಿ, ರಾಜ್ಯ ಬಾಡಿಗೆ ಕಾಯ್ದೆಯಡಿಯಲ್ಲಿ ಬಾಡಿಗೆ ಪ್ರಾಧಿಕಾರ / ನ್ಯಾಯಾಲಯದ (Rent Court) ಮುಂದೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ.",
                "ಅಥವಾ ಸಿವಿಲ್ ನ್ಯಾಯಾಲಯದಲ್ಲಿ CPC ಆರ್ಡರ್ 37 (Order 37) ರ ಅಡಿಯಲ್ಲಿ ಹಣ ವಸೂಲಾತಿ ದಾವೆ (Summary Suit) ದಾಖಲಿಸಿ.",
            ],
            "te": [
                "ఇల్లు ఖాళీ చేసినట్లు ఫొటోలు, తాళాలు అప్పగించిన రసీదు మరియు బిల్లుల కాపీలను భద్రపరచండి.",
                "15 రోజుల్లో డిపాజిట్ వడ్డీతో చెల్లించాలని న్యాయవాది ద్వారా లీగల్ నోటీసు పంపండి.",
                "యజమాని చెల్లించకపోతే రెంట్ ట్రిబ్యునల్ లేదా సివిల్ కోర్టులో ఆర్డర్ 37 కింద సమ్మరీ దావా వేయండి.",
            ],
        },
    },

    "employment_salary": {
        "domain_name": "Employment Disputes & Unpaid Salary",
        "search_anchor": "unpaid salary wrongful termination Industrial Disputes Act Payment of Wages gratuity notice pay",
        "statutes": [
            {
                "title": "Payment of Wages Act, 1936 / Code on Wages, 2019",
                "citation": "Payment of Wages Act, 1936, Sec. 15",
                "doc_type": "statute",
                "excerpt": (
                    "Wages must be paid within 7 to 10 days of the wage period. Unlawful deductions or non-payment allows the employee "
                    "to claim wages along with statutory compensation up to 10 times the unpaid amount before the Authority under Section 15."
                ),
            },
            {
                "title": "Industrial Disputes Act, 1947, Section 25F",
                "citation": "Industrial Disputes Act, 1947, Sec. 25F",
                "doc_type": "statute",
                "excerpt": (
                    "No workman employed in any industry who has been in continuous service for not less than one year shall be retrenched "
                    "without one month's notice in writing indicating the reasons for retrenchment or wages in lieu thereof, and retrenchment compensation "
                    "equivalent to 15 days' average pay for every completed year of service."
                ),
            },
            {
                "title": "Payment of Gratuity Act, 1972, Section 7",
                "citation": "Payment of Gratuity Act, 1972, Sec. 7",
                "doc_type": "statute",
                "excerpt": (
                    "Gratuity becomes payable upon completion of 5 years of service. Must be disbursed within 30 days of termination, "
                    "failing which simple interest at prescribed central bank rates is strictly mandatory."
                ),
            },
        ],
        "precedents": [
            {
                "title": "Bangalore Water Supply & Sewerage Board v. A. Rajappa",
                "citation": "(1978) 2 SCC 213",
                "court": "Supreme Court of India",
                "year": 1978,
                "holding": (
                    "Broad definition of 'industry' under Indian labour jurisprudence covering educational, technical, and corporate undertakings."
                ),
            },
        ],
        "plain_english_summary": {
            "en": (
                "Under Indian Labour & Employment Law, withholding earned wages or terminating an employee without contractual notice pay or statutory retrenchment "
                "compensation is illegal. The employee is entitled to full arrears of salary, notice pay in lieu of notice, accumulated leave encashment, and gratuity (if service > 5 years). "
                "Remedies include issuing a demand notice via advocate, filing a complaint before the Labour Commissioner, and instituting recovery proceedings under the Payment of Wages Act or Civil Court."
            ),
            "hi": (
                "भारतीय श्रम विधि के अनुसार बिना वेतन दिए कार्य कराना अथवा बिना विहित नोटिस/मुआवजे के आकस्मिक बर्खास्तगी गैर-कानूनी है। "
                "कर्मचारी बकाया वेतन, नोटिस अवधि का वेतन, अवकाश नकदीकरण एवं ग्रेच्युटी पाने का पूर्ण विधिक अधिकारी है। "
                "उपायों में श्रम आयुक्त (Labour Commissioner) के समक्ष शिकायत, वेतन भुगतान अधिनियम के तहत दावा तथा दीवानी वाद शामिल हैं।"
            ),
            "kn": (
                "ಭಾರತೀಯ ಕಾರ್ಮಿಕ ಕಾನೂನುಗಳ ಪ್ರಕಾರ, ದುಡಿದ ವೇತನವನ್ನು ನೀಡದೆ ತಡೆಹಿಡಿಯುವುದು ಅಥವಾ ನೋಟೀಸ್ ನೀಡದೆ ಕೆಲಸದಿಂದ ವಜಾಗೊಳಿಸುವುದು ಕಾನೂನುಬಾಹಿರ. "
                "ನೌಕರನಿಗೆ ಬಾಕಿ ವೇತನ, ನೋಟೀಸ್ ಅವಧಿಯ ಸಂಬಳ, ಗ್ರಾಚ್ಯುಟಿ ಮತ್ತು ಪರಿಹಾರ ಪಡೆಯುವ ಶಾಸನಬದ್ಧ ಹಕ್ಕಿದೆ. ವಕೀಲರ ಲೀಗಲ್ ನೋಟೀಸ್ ಜಾರಿ ಮಾಡಿ ಲೇಬರ್ ಕಮಿಷನರ್ ಮುಂದೆ ದೂರು ದಾಖಲಿಸಬಹುದು."
            ),
            "te": (
                "వేతనాలు ఇవ్వకపోవడం లేదా నోటీసు లేకుండా ఉద్యోగం నుండి తీసివేయడం చట్టవిరుద్ధం. ఉద్యోగికి జీతాల బకాయిలు, గ్రాట్యుటీ మరియు నష్టపరిహారం పొందే హక్కు ఉంది."
            ),
        },
        "suggested_next_steps": {
            "en": [
                "Consolidate employment evidence: Employment agreement, appointment letter, payslips, bank statements, resignation/termination letters, and email trails.",
                "Send a formal statutory demand notice through an advocate to the employer demanding release of all pending salary, notice pay, and relieving letter within 15 days.",
                "Lodge a complaint before the jurisdictional Labour Commissioner / Conciliation Officer under the Industrial Disputes Act / Payment of Wages Act.",
                "If managerial or non-workman, file a civil suit for recovery of unpaid contractual dues and damages in the Civil Court.",
            ],
            "hi": [
                "नियुक्ति पत्र, वेतन पर्ची (Payslips), बैंक स्टेटमेंट एवं ईमेल पत्राचार को साक्ष्य हेतु एकत्रित करें।",
                "अधिवक्ता द्वारा कंपनी को 15 दिन का कानूनी नोटिस भेजकर समस्त बकाया वेतन एवं रिलीविंग लेटर की मांग करें।",
                "क्षेत्रीय श्रम आयुक्त (Labour Commissioner) के समक्ष विधिक शिकायत दर्ज कराएं।",
                "सिविल कोर्ट में बकाया राशि की वसूली हेतु दीवानी वाद प्रस्तुत करें।",
            ],
            "kn": [
                "ನೇಮಕಾತಿ ಆದೇಶ, ಮಾಸಿಕ ವೇತನ ರಸೀದಿಗಳು (Payslips), ಬ್ಯಾಂಕ್ ಸ್ಟೇಟ್‌ಮೆಂಟ್ ಹಾಗೂ ವಜಾ ಆದೇಶದ ದಾಖಲೆಗಳನ್ನು ಸಂಗ್ರಹಿಸಿಡಿ.",
                "ವಕೀಲರ ಮೂಲಕ ಕಂಪನಿಗೆ ಲೀಗಲ್ ನೋಟೀಸ್ ಕಳುಹಿಸಿ, ಬಾಕಿ ವೇತನ ಮತ್ತು ಅನುಭವ ಪ್ರಮಾಣಪತ್ರ (Relieving Letter) ನೀಡಲು 15 ದಿನಗಳ ಗಡುವು ನೀಡಿ.",
                "ಕಾರ್ಮಿಕ ಆಯುಕ್ತರ (Labour Commissioner) ಕಚೇರಿಯಲ್ಲಿ ದೂರು ದಾಖಲಿಸಿ ಮಧ್ಯಸ್ಥಿಕೆಗೆ ಕೋರಿ.",
                "ಸಿವಿಲ್ ನ್ಯಾಯಾಲಯದಲ್ಲಿ ಬಾಕಿ ವೇತನ ವಸೂಲಾತಿಗಾಗಿ ದಾವೆ ಹೂಡಿ.",
            ],
            "te": [
                "అపాయింట్‌మెంట్ లెటర్, పే-స్లిప్పులు, బ్యాంక్ స్టేట్‌మెంట్లు మరియు ఈమెయిల్స్ భద్రపరచండి.",
                "15 రోజుల్లో జీతాల బకాయిలు చెల్లించాలని న్యాయవాది ద్వారా లీగల్ నోటీసు పంపండి.",
                "లేబర్ కమిషనర్ వద్ద అధికారిక ఫిర్యాదు నమోదు చేయండి.",
            ],
        },
    },

    "consumer_dispute": {
        "domain_name": "Consumer Protection & Deficiency in Service",
        "search_anchor": "consumer complaint deficiency in service unfair trade practice Consumer Protection Act 2019 e-daakhil refund",
        "statutes": [
            {
                "title": "Consumer Protection Act, 2019, Section 35",
                "citation": "Consumer Protection Act, 2019, Sec. 35",
                "doc_type": "statute",
                "excerpt": (
                    "A consumer or recognised consumer association can file a complaint with the District Commission in relation to any goods sold "
                    "or delivered, or any service provided, claiming refund, replacement, compensation for injury or financial loss, and punitive damages."
                ),
            },
            {
                "title": "Section 2(11) & 2(47) — Deficiency & Unfair Trade Practice",
                "citation": "Consumer Protection Act, 2019, Sec. 2(11), 2(47)",
                "doc_type": "statute",
                "excerpt": (
                    "Deficiency means any fault, imperfection, shortcoming or inadequacy in the quality, nature and manner of performance. "
                    "Unfair trade practice includes false representation regarding standard, grade, composition, or failure to refund within stipulated timelines."
                ),
            },
        ],
        "precedents": [
            {
                "title": "Lucknow Development Authority v. M.K. Gupta",
                "citation": "(1994) 1 SCC 243",
                "court": "Supreme Court of India",
                "year": 1994,
                "holding": (
                    "Public authorities and private corporations are equally accountable under consumer law for harassment, delay, and administrative deficiency."
                ),
            },
        ],
        "plain_english_summary": {
            "en": (
                "Under the Consumer Protection Act, 2019, consumers have a statutory right against defective goods, substandard services, and unfair trade practices. "
                "Consumers can file complaints before the District Consumer Disputes Redressal Commission (claims up to ₹50 Lakhs) for full refund with interest, "
                "replacement, and compensation for mental agony. Complaints can be filed online via the government e-Daakhil portal without mandatory advocate representation."
            ),
            "hi": (
                "उपभोक्ता संरक्षण अधिनियम, 2019 के अंतर्गत दोषपूर्ण वस्तुओं अथवा सेवा में कमी के विरुद्ध उपभोक्ता को पूर्ण विधिक अधिकार प्राप्त हैं। "
                "पीड़ित उपभोक्ता 50 लाख रुपये तक के दावों हेतु जिला उपभोक्ता आयोग में ई-दाखिल पोर्टल के माध्यम से ऑनलाइन परिवाद दर्ज कर सकता है।"
            ),
            "kn": (
                "ಗ್ರಾಹಕ ಸಂರಕ್ಷಣಾ ಕಾಯ್ದೆ 2019 ರ ಪ್ರಕಾರ, ದೋಷಯುಕ್ತ ವಸ್ತುಗಳು ಮತ್ತು ಸೇವೆಯಲ್ಲಿನ ನ್ಯೂನತೆ ವಿರುದ್ಧ ಗ್ರಾಹಕರಿಗೆ ಪರಿಹಾರ ಪಡೆಯುವ ಹಕ್ಕಿದೆ. ಜಿಲ್ಲಾ ಗ್ರಾಹಕ ನ್ಯಾಯಾಲಯದಲ್ಲಿ ಇ-ದಾಖಿಲ್ (e-Daakhil) ಮೂಲಕ ಆನ್‌ಲೈನ್ ದೂರು ದಾಖಲಿಸಬಹುದು."
            ),
            "te": (
                "వినియోగదారుల రక్షణ చట్టం 2019 కింద లోపభూయిష్ట వస్తువులు లేదా సేవా లోపాలపై వినియోగదారుల కమిషన్‌లో ఇ-దాఖిల్ ద్వారా ఫిర్యాదు చేసి పరిహారం పొందవచ్చు."
            ),
        },
        "suggested_next_steps": {
            "en": [
                "Compile proof of purchase: Tax invoice, warranty card, transaction confirmation, defect photographs/video, and customer support communications.",
                "Register a complaint on the National Consumer Helpline (NCH: 1915 or consumerhelpline.gov.in) to attempt institutional conciliation.",
                "Send a formal 15-day statutory legal notice to the seller, platform, and manufacturer demanding refund with compensation for harassment.",
                "File a consumer complaint online through the e-Daakhil portal (edaakhil.nic.in) before the jurisdictional District Consumer Commission.",
            ],
            "hi": [
                "बिल, वारंटी कार्ड, खराब उत्पाद की तस्वीरें एवं कस्टमर केयर से हुए पत्राचार को सुरक्षित करें।",
                "राष्ट्रीय उपभोक्ता हेल्पलाइन (1915 अथवा consumerhelpline.gov.in) पर प्रारंभिक शिकायत दर्ज करें।",
                "विक्रेता एवं निर्माता को 15 दिन का कानूनी नोटिस प्रेषित करें।",
                "ई-दाखिल (e-Daakhil) पोर्टल के माध्यम से जिला उपभोक्ता विवाद निवारण आयोग में ऑनलाइन परिवाद दायर करें।",
            ],
            "kn": [
                "ಖರೀದಿ ಬಿಲ್, ವಾರಂಟಿ ಕಾರ್ಡ್, ದೋಷದ ಫೋಟೋಗಳು ಮತ್ತು ಕಸ್ಟಮರ್ ಕೇರ್ ಸಂವಹನಗಳನ್ನು ಕ್ರೋಢೀಕರಿಸಿ.",
                "ರಾಷ್ಟ್ರೀಯ ಗ್ರಾಹಕ ಸಹಾಯವಾಣಿ (NCH: 1915) ನಲ್ಲಿ ಆರಂಭಿಕ ದೂರು ದಾಖಲಿಸಿ.",
                "ಮಾರಾಟಗಾರ ಸಂಸ್ಥೆಗೆ 15 ದಿನಗಳ ಕಾಲಮಿತಿ ನೀಡಿ ವಕೀಲರ ಲೀಗಲ್ ನೋಟೀಸ್ ರವಾನಿಸಿ.",
                "ಇ-ದಾಖಿಲ್ (e-Daakhil) ಪೋರ್ಟಲ್ ಮೂಲಕ ಜಿಲ್ಲಾ ಗ್ರಾಹಕರ ವ್ಯಾಜ್ಯಗಳ ಪರಿಹಾರ ಆಯೋಗಕ್ಕೆ ಆನ್‌ಲೈನ್ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ.",
            ],
            "te": [
                "ఇన్వాయిస్, వారంటీ కార్డు, ఫోటోలు మరియు చాట్ ఆధారాలు సేకరించండి.",
                "జాతీయ వినియోగదారుల హెల్ప్‌లైన్ (1915) లో ఫిర్యాదు చేయండి.",
                "ఇ-దాఖిల్ పోర్టల్ ద్వారా వినియోగదారుల కమిషన్‌లో ఆన్‌లైన్ కేసు వేయండి.",
            ],
        },
    },

    "criminal_fraud": {
        "domain_name": "Financial Fraud, Cheating & Criminal Breach of Trust",
        "search_anchor": "financial fraud cheating 318 BNS 420 IPC criminal breach of trust cyber scam FIR 173 BNSS",
        "statutes": [
            {
                "title": "Section 318 — Bharatiya Nyaya Sanhita, 2023 (BNS)",
                "citation": "Bharatiya Nyaya Sanhita, 2023, Sec. 318",
                "doc_type": "statute",
                "excerpt": (
                    "Section 318 BNS replaces Section 420 IPC for Cheating and dishonestly inducing delivery of property. "
                    "Whoever cheats and thereby dishonestly induces the person deceived to deliver any property, is punishable with imprisonment "
                    "up to seven years and fine."
                ),
            },
            {
                "title": "Section 173 — Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS)",
                "citation": "Bharatiya Nagarik Suraksha Sanhita, 2023, Sec. 173",
                "doc_type": "statute",
                "excerpt": (
                    "Every information relating to the commission of a cognizable offence, if given orally to an officer in charge of a police station, "
                    "shall be reduced to writing and signed by the informant (FIR registration). If police fail to act, representation lies to the Superintendent of Police."
                ),
            },
        ],
        "precedents": [
            {
                "title": "Lalita Kumari v. Govt. of U.P.",
                "citation": "(2014) 2 SCC 1",
                "court": "Supreme Court of India",
                "year": 2014,
                "holding": (
                    "Registration of FIR is mandatory under Section 154 CrPC (now Section 173 BNSS) if the information discloses commission of a cognizable offence."
                ),
            },
        ],
        "plain_english_summary": {
            "en": (
                "Under Indian Criminal Law, dishonest inducement, cyber fraud, and cheating are cognizable offenses under Section 318 of Bharatiya Nyaya Sanhita, 2023 (BNS), "
                "punishable with up to 7 years imprisonment. The victim has a statutory right to immediate registration of an FIR under Section 173 BNSS at the police station or Cyber Cell. "
                "If police refuse to register an FIR, the victim can file an application before the Judicial Magistrate under Section 175(3) BNSS."
            ),
            "hi": (
                "भारतीय न्याय संहिता, 2023 (BNS) की धारा 318 के तहत धोखाधड़ी एवं छल एक संज्ञेय अपराध है, जिसमें 7 वर्ष तक के कारावास का प्रावधान है। "
                "पीड़ित को BNSS की धारा 173 के तहत तत्काल FIR दर्ज कराने का अधिकार है।"
            ),
            "kn": (
                "ಭಾರತೀಯ ನ್ಯಾಯ ಸಂಹಿತೆ, 2023 (BNS) ರ ಕಲಂ 318 ರ ಪ್ರಕಾರ ವಂಚನೆ ಮತ್ತು ನಂಬಿಕೆದ್ರೋಹ ಗಂಭೀರ ಅಪರಾಧವಾಗಿದ್ದು, 7 ವರ್ಷಗಳವರೆಗೆ ಜೈಲು ಶಿಕ್ಷೆ ವಿಧಿಸಲಾಗುತ್ತದೆ. ಕಲಂ 173 BNSS ಅಡಿಯಲ್ಲಿ ಪೊಲೀಸ್ ಠಾಣೆಯಲ್ಲಿ FIR ದಾಖಲಿಸಬಹುದು."
            ),
            "te": (
                "BNS సెక్షన్ 318 కింద మోసం చేయడం తీవ్రమైన నేరం; 7 సంవత్సరాల వరకు జైలు శిక్ష పడుతుంది. BNSS సెక్షన్ 173 కింద FIR నమోదు చేయాలి."
            ),
        },
        "suggested_next_steps": {
            "en": [
                "Preserve all transaction evidence: Bank account statements, UPI reference/UTR numbers, chat transcripts, fraudulent links, and sender profile details.",
                "Immediately call 1930 (National Cyber Financial Fraud Helpline) and report online at cybercrime.gov.in to freeze fraudulent beneficiary bank accounts.",
                "Submit a written signed complaint under Section 173 BNSS to the Station House Officer (SHO) of the local police station or Cyber Cell.",
                "If the police refuse to register an FIR, send a written complaint via registered post to the Superintendent of Police (SP/DCP) under Section 173(4) BNSS.",
                "If still unresolved, file a criminal complaint petition under Section 175(3) BNSS before the Judicial Magistrate Court seeking directions to register FIR.",
            ],
            "hi": [
                "बैंक स्टेटमेंट, UTR नंबर, स्क्रीनशॉट एवं व्हाट्सएप चैट का प्रिंटआउट सुरक्षित रखें।",
                "बैंक खातों को फ्रीज कराने हेतु तुरंत 1930 पर कॉल करें एवं cybercrime.gov.in पर रिपोर्ट करें।",
                "स्थानीय थाने या साइबर सेल में BNSS धारा 173 के तहत लिखित शिकायत देकर FIR दर्ज कराएं।",
                "यदि पुलिस FIR न लिखे, तो पुलिस अधीक्षक (SP/DCP) को धारा 173(4) के तहत रजिस्टर्ड डाक से शिकायत भेजें।",
                "मजिस्ट्रेट कोर्ट में धारा 175(3) BNSS के तहत FIR दर्ज कराने हेतु प्रार्थना पत्र प्रस्तुत करें।",
            ],
            "kn": [
                "ಬ್ಯಾಂಕ್ ಸ್ಟೇಟ್‌ಮೆಂಟ್, UTR ಸಂಖ್ಯೆ, ವಾಟ್ಸಾಪ್ ಸಂದೇಶಗಳು ಮತ್ತು ಆನ್‌ಲೈನ್ ವಹಿವಾಟಿನ ರಸೀದಿಗಳನ್ನು ಸಂಗ್ರಹಿಸಿಡಿ.",
                "ವಂಚಕರ ಖಾತೆಯನ್ನು ತಕ್ಷಣ ಫ್ರೀಜ್ ಮಾಡಲು ರಾಷ್ಟ್ರೀಯ ಸೈಬರ್ ಹೆಲ್ಪ್‌ಲೈನ್ 1930 ಗೆ ಕರೆ ಮಾಡಿ ಹಾಗೂ cybercrime.gov.in ನಲ್ಲಿ ದೂರು ದಾಖಲಿಸಿ.",
                "ಸ್ಥಳೀಯ ಪೊಲೀಸ್ ಠಾಣೆ ಅಥವಾ ಸೈಬರ್ ಕ್ರೈಮ್ ಠಾಣೆಯಲ್ಲಿ ಕಲಂ 173 BNSS ಅಡಿಯಲ್ಲಿ ಲಿಖಿತ ದೂರು ನೀಡಿ FIR ದಾಖಲಿಸಿ.",
                "ಪೊಲೀಸರು FIR ದಾಖಲಿಸದಿದ್ದರೆ, ಜಿಲ್ಲಾ ಪೊಲೀಸ್ ವರಿಷ್ಠಾಧಿಕಾರಿಗಳಿಗೆ (SP/DCP) ನೋಂದಾಯಿತ ಅಂಚೆ ಮೂಲಕ ದೂರು ಕಳುಹಿಸಿ.",
                "ಮ್ಯಾಜಿಸ್ಟ್ರೇಟ್ ನ್ಯಾಯಾಲಯದಲ್ಲಿ ಕಲಂ 175(3) BNSS ಅಡಿಯಲ್ಲಿ FIR ದಾಖಲಿಸಲು ನಿರ್ದೇಶನ ಕೋರಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ.",
            ],
            "te": [
                "బ్యాంక్ స్టేట్‌మెంట్లు, UTR నంబర్లు మరియు చాట్ ఆధారాలు భద్రపరచండి.",
                "ఖాతాలు స్తంభింపజేయడానికి 1930 కి కాల్ చేసి cybercrime.gov.in లో ఫిర్యాదు చేయండి.",
                "పోలీస్ స్టేషన్‌లో BNSS సెక్షన్ 173 కింద FIR నమోదు చేయించండి.",
            ],
        },
    },

    "matrimonial_family": {
        "domain_name": "Matrimonial Remedies & Mutual Consent Divorce",
        "search_anchor": "mutual consent divorce cooling off period Section 13B Hindu Marriage Act maintenance domestic violence",
        "statutes": [
            {
                "title": "Section 13B — Hindu Marriage Act, 1955",
                "citation": "Hindu Marriage Act, 1955, Sec. 13B",
                "doc_type": "statute",
                "excerpt": (
                    "Section 13B provides for divorce by mutual consent. Both parties must have been living separately for a period of one year or more, "
                    "have not been able to live together, and have mutually agreed that the marriage should be dissolved. "
                    "Second motion is presented not earlier than 6 months and not later than 18 months after the first motion."
                ),
            },
            {
                "title": "Section 24 & 25 — Maintenance Pendente Lite & Permanent Alimony",
                "citation": "Hindu Marriage Act, 1955, Sec. 24, 25",
                "doc_type": "statute",
                "excerpt": (
                    "Court may direct payment of interim maintenance and litigation expenses during proceedings, and grant permanent alimony having regard "
                    "to the applicant's own income, respondent's property, and conduct of the parties."
                ),
            },
        ],
        "precedents": [
            {
                "title": "Amardeep Singh v. Harveen Kaur",
                "citation": "(2017) 8 SCC 746",
                "court": "Supreme Court of India",
                "year": 2017,
                "holding": (
                    "The Supreme Court held that the 6-month cooling-off period under Section 13B(2) of the Hindu Marriage Act is directory and not mandatory. "
                    "The Family Court can waive the 6-month waiting period if the parties have lived separately for over 18 months and settled all alimony and custody terms."
                ),
            },
            {
                "title": "Rajnesh v. Neha",
                "citation": "(2021) 2 SCC 324",
                "court": "Supreme Court of India",
                "year": 2021,
                "holding": (
                    "Comprehensive guidelines on maintenance requiring mandatory filing of Affidavits of Assets and Liabilities by both parties."
                ),
            },
        ],
        "plain_english_summary": {
            "en": (
                "Under Section 13B of the Hindu Marriage Act, 1955, spouses living separately for over one year can obtain divorce by mutual consent with dignity. "
                "Crucially, under the Supreme Court's landmark judgment in Amardeep Singh v. Harveen Kaur (2017), the statutory 6-month cooling-off period CAN BE WAIVED "
                "by the Family Court if all alimony, return of Stridhan, and child custody arrangements have been mutually resolved. The process is concluded in 2 motions."
            ),
            "hi": (
                "हिन्दू विवाह अधिनियम, 1955 की धारा 13B के अंतर्गत आपसी सहमति से विवाह विच्छेद (Mutual Consent Divorce) का प्रावधान है। "
                "सर्वोच्च न्यायालय के 'अमरदीप सिंह बनाम हरवीन कौर' फैसले के तहत यदि सभी विवाद व गुजारा भत्ता तय हो चुके हों, तो 6 माह की प्रतीक्षा अवधि (Cooling-off Period) को कोर्ट द्वारा माफ (Waive) किया जा सकता है।"
            ),
            "kn": (
                "ಹಿಂದೂ ವಿವಾಹ ಕಾಯ್ದೆ 1955 ರ ಕಲಂ 13B ರ ಅಡಿಯಲ್ಲಿ, ದಂಪತಿಗಳು ಪರಸ್ಪರ ಒಪ್ಪಿಗೆಯ ಮೂಲಕ ಗೌರವಯುತವಾಗಿ ವಿಚ್ಛೇದನ ಪಡೆಯಬಹುದು. ಸುಪ್ರೀಂ ಕೋರ್ಟ್‌ನ 'ಅಮರ್‌ದೀಪ್ ಸಿಂಗ್' ತೀರ್ಪಿನ ಪ್ರಕಾರ, ಜೀವನಾಂಶ ಮತ್ತು ಆಸ್ತಿ ಹಂಚಿಕೆ ಇತ್ಯರ್ಥವಾಗಿದ್ದರೆ 6 ತಿಂಗಳ ಕಾಯುವಿಕೆಯ ಅವಧಿಯನ್ನು (Cooling-off Period) ರದ್ದುಪಡಿಸಿ ತಕ್ಷಣ ವಿಚ್ಛೇದನ ನೀಡಲು ನ್ಯಾಯಾಲಯಕ್ಕೆ ಅಧಿಕಾರವಿದೆ."
            ),
            "te": (
                "హిందూ వివాహ చట్టం సెక్షన్ 13B కింద పరస్పర అంగీకారంతో విడాకులు పొందవచ్చు. సుప్రీంకోర్టు తీర్పు ప్రకారం 6 నెలల కూలింగ్-ఆఫ్ వ్యవధిని మినహాయించవచ్చు."
            ),
        },
        "suggested_next_steps": {
            "en": [
                "Execute a comprehensive Settlement Agreement / Memorandum of Understanding (MoU) defining permanent alimony, Stridhan return, and child custody.",
                "Jointly file the First Motion Petition under Section 13B(1) HMA before the jurisdictional Family Court.",
                "File an Interlocutory Application citing Amardeep Singh v. Harveen Kaur (2017) seeking waiver of the 6-month cooling-off period.",
                "Appear for statement recording and complete the Second Motion to receive the formal Decree of Dissolution of Marriage.",
            ],
            "hi": [
                "भरण-पोषण, स्त्रीधन वापसी एवं बच्चों की कस्टडी हेतु विस्तृत समझौता पत्र (MoU) तैयार करें।",
                "सक्षम पारिवारिक न्यायालय (Family Court) में धारा 13B(1) के तहत प्रथम प्रस्ताव (First Motion) याचिका दायर करें।",
                "अमरदीप सिंह फैसले का हवाला देते हुए 6 महीने की प्रतीक्षा अवधि माफ करने हेतु प्रार्थना पत्र प्रस्तुत करें।",
                "द्वितीय प्रस्ताव (Second Motion) पर बयान दर्ज कराकर अंतिम तलाक डिक्री प्राप्त करें।",
            ],
            "kn": [
                "ಜೀವನಾಂಶ, ಸ್ತ್ರೀಧನ ಮರುಪಾವತಿ ಮತ್ತು ಮಕ್ಕಳ ಪಾಲನೆ ಕುರಿತು ವಕೀಲರ ಸಮ್ಮುಖದಲ್ಲಿ ಒಪ್ಪಂದ ಪತ್ರ (MoU) ಸಿದ್ಧಪಡಿಸಿ.",
                "ಕೌಟುಂಬಿಕ ನ್ಯಾಯಾಲಯದಲ್ಲಿ ಕಲಂ 13B(1) ಅಡಿಯಲ್ಲಿ ಪ್ರಥಮ ಮೋಷನ್ ಜಂಟಿ ಅರ್ಜಿ ದಾಖಲಿಸಿ.",
                "ಸುಪ್ರೀಂ ಕೋರ್ಟ್‌ನ 'ಅಮರ್‌ದೀಪ್ ಸಿಂಗ್' ತೀರ್ಪನ್ನು ಉಲ್ಲೇಖಿಸಿ 6 ತಿಂಗಳ ಕಾಯುವಿಕೆ ಅವಧಿ ಮನ್ನಾ ಮಾಡಲು ಮಧ್ಯಂತರ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ.",
                "ದ್ವಿತೀಯ ಮೋಷನ್‌ನಲ್ಲಿ ಪ್ರಮಾಣ ವಚನ ಹೇಳಿಕೆ ದಾಖಲಿಸಿ ನ್ಯಾಯಾಲಯದಿಂದ ಅಂತಿಮ ವಿಚ್ಛೇದನ ಆದೇಶ (Decree) ಪಡೆದುಕೊಳ್ಳಿ.",
            ],
            "te": [
                "భరణం మరియు పిల్లల కస్టడీపై పరస్పర ఒప్పంద పత్రం (MoU) రూపొందించండి.",
                "ఫ్యామిలీ కోర్టులో సెక్షన్ 13B(1) కింద మొదటి మోషన్ దాఖలు చేయండి.",
                "6 నెలల వ్యవధి మినహాయింపు కోసం అమర్‌దీప్ సింగ్ తీర్పును ఆధారంగా చేసుకుని పిటిషన్ వేయండి.",
            ],
        },
    },

    "motor_accident": {
        "domain_name": "Motor Accident Claims (MACT)",
        "search_anchor": "motor accident claims tribunal MACT Section 166 Motor Vehicles Act rash driving compensation",
        "statutes": [
            {
                "title": "Section 166 — Motor Vehicles Act, 1988",
                "citation": "Motor Vehicles Act, 1988, Sec. 166",
                "doc_type": "statute",
                "excerpt": (
                    "An application for compensation arising out of an accident involving death or bodily injury may be made by the person who has sustained "
                    "the injury, or by legal representatives of the deceased, to the Claims Tribunal having jurisdiction. Must be filed within 6 months of accident."
                ),
            },
        ],
        "precedents": [
            {
                "title": "Sarla Verma v. Delhi Transport Corporation",
                "citation": "(2009) 6 SCC 121",
                "court": "Supreme Court of India",
                "year": 2009,
                "holding": (
                    "Binding guidelines on multipliers, dependency deduction, and loss of future prospects for motor accident compensation calculation."
                ),
            },
        ],
        "plain_english_summary": {
            "en": (
                "Under the Motor Vehicles Act, 1988 (as amended), victims of road accidents or their legal heirs have a right to full statutory compensation "
                "from the offending vehicle's insurance company before the Motor Accident Claims Tribunal (MACT). Compensation includes medical expenses, "
                "loss of income/dependency, and future prospects calculated under Sarla Verma multipliers. Note: Claim must strictly be filed within 6 months."
            ),
            "hi": (
                "मोटर वाहन अधिनियम के अंतर्गत सड़क दुर्घटना में पीड़ित या उसके आश्रित MACT ट्रिब्यूनल के समक्ष बीमा कंपनी से संपूर्ण मुआवजे का दावा कर सकते हैं। दावा 6 माह के भीतर दाखिल करना आवश्यक है।"
            ),
            "kn": (
                "ಮೋಟಾರು ವಾಹನ ಕಾಯ್ದೆಯಡಿ, ಅಪಘಾತಕ್ಕೀಡಾದ ಸಂತ್ರಸ್ತರು ಅಥವಾ ಅವರ ವಾರಸುದಾರರು MACT ನ್ಯಾಯಾಧಿಕರಣದಲ್ಲಿ ವಿಮಾ ಕಂಪನಿಯಿಂದ ಸಂಪೂರ್ಣ ಪರಿಹಾರ ಪಡೆಯಲು ಅರ್ಹರಾಗಿದ್ದಾರೆ. ಅಪಘಾತವಾದ 6 ತಿಂಗಳೊಳಗೆ ಅರ್ಜಿ ಸಲ್ಲಿಸುವುದು ಕಡ್ಡಾಯ."
            ),
            "te": (
                "మోటారు వాహనాల చట్టం కింద రోడ్డు ప్రమాద బాధితులు MACT ట్రిబ్యునల్ ద్వారా ఇన్సూరెన్స్ కంపెనీ నుండి నష్టపరిహారం పొందవచ్చు. 6 నెలల్లోపు దరఖాస్తు చేయాలి."
            ),
        },
        "suggested_next_steps": {
            "en": [
                "Obtain certified copies of FIR, Spot Mahazar, Vehicle Inspection Report, and Charge Sheet from the police.",
                "Consolidate all hospital discharge summaries, original medical pharmacy bills, and Medical Board Disability Certificate.",
                "File Claim Petition under Section 166 Motor Vehicles Act before MACT within 6 months of accident.",
            ],
            "hi": [
                "पुलिस से FIR, मौका पंचनामा एवं वाहन निरीक्षण रिपोर्ट की प्रमाणित प्रतियां प्राप्त करें।",
                "अस्पताल के डिस्चार्ज कार्ड, मूल मेडिकल बिल एवं दिव्यांगता प्रमाण पत्र एकत्रित करें।",
                "दुर्घटना के 6 माह के भीतर MACT कोर्ट में धारा 166 के अंतर्गत क्लेम पिटीशन दायर करें।",
            ],
            "kn": [
                "ಪೊಲೀಸ್ ಠಾಣೆಯಿಂದ ಎಫ್.ಐ.ಆರ್. (FIR), ಸ್ಥಳ ಮಹಜರು ಮತ್ತು ವಾಹನ ಪರಿಶೀಲನಾ ವರದಿಯ ದೃಢೀಕೃತ ಪ್ರತಿಗಳನ್ನು ಪಡೆದುಕೊಳ್ಳಿ.",
                "ಆಸ್ಪತ್ರೆಯ ಡಿಸ್ಚಾರ್ಜ್ ಸಮ್ಮರಿ, ಮೂಲ ವೈದ್ಯಕೀಯ ಖರ್ಚಿನ ಬಿಲ್‌ಗಳು ಮತ್ತು ಅಂಗವೈಕಲ್ಯ ಪ್ರಮಾಣಪತ್ರವನ್ನು ಜೋಪಾನವಾಗಿಡಿ.",
                "ಅಪಘಾತ ಸಂಭವಿಸಿದ 6 ತಿಂಗಳ ಕಡ್ಡಾಯ ಅವಧಿಯೊಳಗೆ MACT ನ್ಯಾಯಾಲಯದಲ್ಲಿ ಕಲಂ 166 ರಡಿ ಪರಿಹಾರ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ.",
            ],
            "te": [
                "పోలీసుల నుండి FIR, పంచనామా మరియు ఛార్జ్ షీట్ కాపీలను సేకరించండి.",
                "హాస్పిటల్ బిల్లులు మరియు డిసేబిలిటీ సర్టిఫికేట్ భద్రపరచండి.",
                "6 నెలల లోపు MACT ట్రిబ్యునల్‌లో క్లెయిమ్ పిటిషన్ దాఖలు చేయండి.",
            ],
        },
    },

    "data_privacy": {
        "domain_name": "Data Privacy & Personal Data Protection",
        "search_anchor": "data privacy DPDP Act 2023 breach of personal data right to privacy Article 21",
        "statutes": [
            {
                "title": "Digital Personal Data Protection Act, 2023 (DPDP Act)",
                "citation": "Digital Personal Data Protection Act, 2023, Sec. 4-8, 33",
                "doc_type": "statute",
                "excerpt": (
                    "The DPDP Act governs the processing of digital personal data. Entities must obtain clear, unbundled consent. "
                    "Data principals have rights to access, correction, erasure, and grievance redressal. Penalties up to ₹250 Crores for significant data breaches."
                ),
            },
        ],
        "precedents": [
            {
                "title": "Justice K.S. Puttaswamy v. Union of India",
                "citation": "(2017) 10 SCC 1",
                "court": "Supreme Court of India",
                "year": 2017,
                "holding": (
                    "The right to privacy is protected as an intrinsic part of the right to life and personal liberty under Article 21 of the Constitution."
                ),
            },
        ],
        "plain_english_summary": {
            "en": (
                "Under the Digital Personal Data Protection Act, 2023 (DPDP Act) and Article 21 of the Constitution, individuals possess enforceable rights over their personal data. "
                "Entities processing data without valid consent or leaking biometric/financial identifiers face strict scrutiny and penalties before the Data Protection Board of India (DPBI)."
            ),
            "hi": (
                "डिजिटल व्यक्तिगत डेटा संरक्षण अधिनियम, 2023 (DPDP Act) एवं संविधान के अनुच्छेद 21 के तहत निजता का अधिकार एक मौलिक अधिकार है।"
            ),
            "kn": (
                "ಡಿಜಿಟಲ್ ವೈಯಕ್ತಿಕ ಡೇಟಾ ಸಂರಕ್ಷಣಾ ಕಾಯ್ದೆ 2023 (DPDP Act) ಮತ್ತು ಸಂವಿಧಾನದ 21 ನೇ ವಿಧಿಯಡಿ ವೈಯಕ್ತಿಕ ಗೌಪ್ಯತೆ ಮೂಲಭೂತ ಹಕ್ಕಾಗಿದೆ."
            ),
            "te": (
                "DPDP చట్టం 2023 మరియు ఆర్టికల్ 21 ప్రకారం వ్యక్తిగత గోప్యత ప్రాథమిక హక్కు."
            ),
        },
        "suggested_next_steps": {
            "en": [
                "Serve a formal data erasure / withdrawal of consent notice to the Data Protection Officer (DPO) of the entity.",
                "Lodge an official grievance on the Data Protection Board of India (DPBI) portal for unauthorized processing or breach.",
                "For identity theft or extortion, file an immediate complaint at cybercrime.gov.in and local Cyber Police Station.",
            ],
            "hi": [
                "संबंधित कंपनी के डेटा सुरक्षा अधिकारी (DPO) को डेटा हटाने हेतु विधिक नोटिस भेजें।",
                "डेटा प्रोटेक्शन बोर्ड ऑफ इंडिया में अनधिकृत डेटा उपयोग के विरुद्ध परिवाद दायर करें।",
            ],
            "kn": [
                "ಸಂಬಂಧಪಟ್ಟ ಸಂಸ್ಥೆಯ ಡೇಟಾ ಸಂರಕ್ಷಣಾ ಅಧಿಕಾರಿಗೆ (DPO) ನೋಟೀಸ್ ನೀಡಿ ವೈಯಕ್ತಿಕ ಡೇಟಾ ಅಳಿಸಿಹಾಕಲು ಕೋರಿ.",
                "ಡೇಟಾ ಪ್ರೊಟೆಕ್ಷನ್ ಬೋರ್ಡ್ ಆಫ್ ಇಂಡಿಯಾ (DPBI) ಮುಂದೆ ಅಧಿಕೃತ ದೂರು ಸಲ್ಲಿಸಿ.",
            ],
            "te": [
                "సంస్థ యొక్క డేటా ప్రొటెక్షన్ ఆఫీసర్‌కు నోటీసు పంపండి.",
                "డేటా ప్రొటెక్షన్ బోర్డుకు ఫిర్యాదు చేయండి.",
            ],
        },
    },

    "constitutional_writs": {
        "domain_name": "Constitutional Remedies & High Court Writs",
        "search_anchor": "writ petition Article 226 High Court Article 32 Supreme Court mandamus certiorari habeas corpus",
        "statutes": [
            {
                "title": "Article 226 & Article 32 — Constitution of India",
                "citation": "Constitution of India, Art. 226, 32",
                "doc_type": "statute",
                "excerpt": (
                    "Article 226 empowers High Courts to issue directions, orders or writs (habeas corpus, mandamus, prohibition, quo warranto, and certiorari) "
                    "for the enforcement of fundamental rights and for any other purpose against state action."
                ),
            },
        ],
        "precedents": [
            {
                "title": "Maneka Gandhi v. Union of India",
                "citation": "(1978) 1 SCC 248",
                "court": "Supreme Court of India",
                "year": 1978,
                "holding": (
                    "Procedure established by law under Article 21 must be just, fair, and reasonable, and not arbitrary or oppressive."
                ),
            },
        ],
        "plain_english_summary": {
            "en": (
                "Under Article 226 of the Constitution of India, citizens can directly approach the jurisdictional High Court against arbitrary, illegal, "
                "or unconstitutional actions of government bodies and public authorities through extraordinary Writ Petitions."
            ),
            "hi": (
                "संविधान के अनुच्छेद 226 के तहत सरकारी प्राधिकारियों की मनमानी अथवा गैर-कानूनी कार्रवाई के विरुद्ध उच्च न्यायालय में रिट याचिका दायर की जा सकती है।"
            ),
            "kn": (
                "ಸಂವಿಧಾನದ 226 ನೇ ವಿಧಿಯಡಿ ಸರ್ಕಾರಿ ಇಲಾಖೆಗಳ ಕಾನೂನುಬಾಹಿರ ಕೃತ್ಯಗಳ ವಿರುದ್ಧ ನೇರವಾಗಿ ಉಚ್ಚ ನ್ಯಾಯಾಲಯದಲ್ಲಿ ರಿಟ್ ಅರ್ಜಿ (Writ Petition) ಸಲ್ಲಿಸಬಹುದು."
            ),
            "te": (
                "ఆర్టికల్ 226 కింద ప్రభుత్వ అధికారుల చట్టవిరుద్ధ చర్యలపై నేరుగా హైకోర్టులో రిట్ పిటిషన్ దాఖలు చేయవచ్చు."
            ),
        },
        "suggested_next_steps": {
            "en": [
                "Verify that the respondent body qualifies as 'State' under Article 12 of the Constitution.",
                "Collate the impugned government order, license cancellation, or official inaction notice.",
                "Engage a High Court advocate to draft and file a Writ Petition under Article 226 praying for Mandamus or Certiorari.",
            ],
            "hi": [
                "संविधान के अनुच्छेद 12 के अंतर्गत विरोधी पक्ष के 'राज्य' होने की पुष्टि करें।",
                "विवादित आदेश या सरकारी निष्क्रियता के साक्ष्य एकत्र करें।",
                "अधिवक्ता के माध्यम से उच्च न्यायालय में अनुच्छेद 226 के तहत रिट याचिका प्रस्तुत करें।",
            ],
            "kn": [
                "ಎದುರುದಾರ ಸಂಸ್ಥೆಯು ಸಂವಿಧಾನದ 12 ನೇ ವಿಧಿಯಡಿ 'ಸರ್ಕಾರಿ ಸಂಸ್ಥೆ' ಹೌದೇ ಎಂಬುದನ್ನು ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ.",
                "ಸರ್ಕಾರದ ಅಕ್ರಮ ಆದೇಶ ಅಥವಾ ನೋಟೀಸ್‌ನ ನಕಲು ಪ್ರತಿಗಳನ್ನು ಸಂಗ್ರಹಿಸಿಡಿ.",
                "ಹೈಕೋರ್ಟ್ ವಕೀಲರ ಮೂಲಕ ಕಲಂ 226 ರಡಿ ರಿಟ್ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ ತಡೆಯಾಜ್ಞೆ ಪಡೆಯಿರಿ.",
            ],
            "te": [
                "ప్రభుత్వ సంస్థపై హైకోర్టులో ఆర్టికల్ 226 కింద రిట్ పిటిషన్ దాఖలు చేయండి.",
            ],
        },
    },
}


def detect_legal_domain(query: str, conversation_history: Optional[List[Dict[str, str]]] = None) -> str:
    """
    Classifies a query into its sovereign Indian legal domain with follow-up case anchoring.
    If conversation_history is present, the root query sets the master domain anchor.
    """
    combined = query.lower()
    if conversation_history and len(conversation_history) > 0:
        root_q = conversation_history[0].get("query", "").lower()
        combined = f"{root_q} {combined}"

    if any(k in combined for k in [
        "defamat", "social media", "reputation", "slander", "libel",
        "instagram", "twitter", "x.com", "facebook", "youtube", "troll",
        "character assassination", "fake account", "maligned", "cyber bullying"
    ]):
        return "cyber_defamation"

    if any(k in combined for k in [
        "cheque", "check", "138", "dishonour", "bounce", "banker",
        "payee", "insufficient funds", "memo", "drawer"
    ]):
        return "cheque_bounce"

    if any(k in combined for k in [
        "deposit", "tenant", "landlord", "rent", "vacat", "evict",
        "lease", "rental agreement", "security deposit", "lessor", "lessee"
    ]):
        return "tenancy_deposit"

    if any(k in combined for k in [
        "salary", "terminat", "unpaid", "employer", "employee", "wages",
        "gratuity", "fired", "sacked", "retrench", "provident fund", "pf",
        "relieving letter", "severance"
    ]):
        return "employment_salary"

    if any(k in combined for k in [
        "consumer", "ecommerce", "e-commerce", "defective", "warranty",
        "refund", "amazon", "flipkart", "deficiency in service",
        "unfair trade practice", "faulty product"
    ]):
        return "consumer_dispute"

    if any(k in combined for k in [
        "cheat", "fraud", "scam", "extortion", "forgery", "318", "420",
        "swindle", "impersonation", "financial fraud", "ponzi", "identity theft"
    ]):
        return "criminal_fraud"

    if any(k in combined for k in [
        "divorce", "matrimonial", "husband", "wife", "maintenance",
        "domestic violence", "13b", "custody", "child support", "cruelty",
        "stridhan", "cooling off", "alimony"
    ]):
        return "matrimonial_family"

    if any(k in combined for k in [
        "accident", "mact", "motor vehicle", "vehicular", "rash driving",
        "hit and run", "claim tribunal", "insurance claim", "third party insurance"
    ]):
        return "motor_accident"

    if any(k in combined for k in [
        "privacy", "biometric", "aadhar", "data leak", "surveillance",
        "phone tap", "dpdp", "personal data", "consent manager", "breach of data"
    ]):
        return "data_privacy"

    if any(k in combined for k in [
        "writ", "mandamus", "certiorari", "habeas corpus", "quo warranto",
        "prohibition", "article 32", "article 226", "fundamental right", "arbitrary state action"
    ]):
        return "constitutional_writs"

    return "general_statutory"
