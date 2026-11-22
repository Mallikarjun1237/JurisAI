"""
JurisAI — Indian Judicial Precedents & Citation Analysis Engine
Provides authoritative citations, bench compositions, ratio decidendi, and obiter dicta
for Supreme Court of India and High Court landmark jurisprudence.
"""

from typing import List, Dict, Any, Optional
import re

INDEXED_LANDMARK_PRECEDENTS: List[Dict[str, Any]] = [
    {
        "id": "kesavananda_bharati",
        "title": "Kesavananda Bharati Sripadagalvaru v. State of Kerala",
        "citation": "(1973) 4 SCC 225",
        "equivalent_citations": "AIR 1973 SC 1461, 1973 Supp SCR 1",
        "court": "Supreme Court of India",
        "year": 1973,
        "bench_strength": "13 Judges (Full Constitutional Bench)",
        "presiding_judges": "S.M. Sikri, C.J., J.M. Shelat, K.S. Hegde, A.N. Grover, A.N. Ray, P.J. Reddy, D.G. Palekar, H.R. Khanna, K.K. Mathew, M.H. Beg, S.N. Dwivedi, A.K. Mukherjea, Y.V. Chandrachud, JJ.",
        "subject_area": "Constitutional Law & Judicial Review",
        "statutes_interpreted": "Article 368, Article 13, Article 31C, Constitution of India",
        "ratio_decidendi": "Parliament's constituent power to amend the Constitution under Article 368 is broad but not unlimited. Parliament cannot alter, damage, emasculate, or destroy the 'Basic Structure' or essential framework of the Constitution.",
        "obiter_dicta": "Democracy, republican form of government, rule of law, separation of powers, secularism, and judicial review are quintessential pillars forming the foundational core of the Indian Republic.",
        "status": "Good Law (Bedrock of Indian Constitutional Jurisprudence)",
        "litigation_utility": "Cited in challenges to constitutional amendments or statutes that encroach upon fundamental rights or judicial independence.",
    },
    {
        "id": "maneka_gandhi",
        "title": "Maneka Gandhi v. Union of India",
        "citation": "(1978) 1 SCC 248",
        "equivalent_citations": "AIR 1978 SC 597, (1978) 2 SCR 621",
        "court": "Supreme Court of India",
        "year": 1978,
        "bench_strength": "7 Judges (Constitution Bench)",
        "presiding_judges": "M.H. Beg, C.J., Y.V. Chandrachud, P.N. Bhagwati, V.R. Krishna Iyer, N.L. Untwalia, S. Murtaza Fazal Ali, P.S. Kailasam, JJ.",
        "subject_area": "Personal Liberty & Due Process",
        "statutes_interpreted": "Article 21, Article 19, Article 14, Passports Act 1967",
        "ratio_decidendi": "Procedure established by law under Article 21 cannot be arbitrary, whimsical, or oppressive; it must satisfy the test of being 'just, fair, and reasonable'. Articles 14, 19, and 21 form a holy trinity and are not mutually exclusive.",
        "obiter_dicta": "The right to travel abroad is an integral aspect of personal liberty. Natural justice principles must be read into statutory enactments unless explicitly excluded.",
        "status": "Good Law (Established substantive due process in India)",
        "litigation_utility": "Invoked in writ petitions challenging administrative impounding, passport restrictions, detention, or violation of principles of natural justice.",
    },
    {
        "id": "arnesh_kumar",
        "title": "Arnesh Kumar v. State of Bihar",
        "citation": "(2014) 8 SCC 273",
        "equivalent_citations": "AIR 2014 SC 2756, 2014 Cri LJ 3707",
        "court": "Supreme Court of India",
        "year": 2014,
        "bench_strength": "2 Judges (Division Bench)",
        "presiding_judges": "Chandramauli Kumar Prasad, Pinaki Chandra Ghose, JJ.",
        "subject_area": "Arrest, Criminal Procedure & Matrimonial Law",
        "statutes_interpreted": "Section 41, 41A CrPC [Now Sections 35, 35(3) BNSS, 2023], Section 498A IPC [Now Section 85 BNS, 2023]",
        "ratio_decidendi": "Arrest should not be made routinely on mere lodging of an FIR for offences punishable with imprisonment up to 7 years. Police officers must serve Notice of Appearance under Section 41A CrPC (Sec 35(3) BNSS) and record reasons for arrest. Magistrates authorizing detention without recording satisfaction commit departmental misconduct.",
        "obiter_dicta": "Arrest brings humiliation, curtails freedom, and casts scars forever. The culture of arrest on registration of matrimonial disputes must be arrested by strict compliance with statutory preconditions.",
        "status": "Good Law (Reiterated in Satender Kumar Antil v. CBI (2022) 10 SCC 51)",
        "litigation_utility": "Crucial in anticipatory bail petitions, Section 482 / 528 BNSS quashing, and challenging illegal arrest without Section 41A/35 BNSS notice.",
    },
    {
        "id": "lalita_kumari",
        "title": "Lalita Kumari v. Government of Uttar Pradesh",
        "citation": "(2014) 2 SCC 1",
        "equivalent_citations": "AIR 2014 SC 187, 2014 Cri LJ 470",
        "court": "Supreme Court of India",
        "year": 2014,
        "bench_strength": "5 Judges (Constitution Bench)",
        "presiding_judges": "P. Sathasivam, C.J., B.S. Chauhan, Ranjana P. Desai, Ranjan Gogoi, S.A. Bobde, JJ.",
        "subject_area": "Registration of FIR & Police Powers",
        "statutes_interpreted": "Section 154 CrPC [Now Section 173 BNSS, 2023]",
        "ratio_decidendi": "Registration of FIR is mandatory under Section 154 CrPC (Sec 173 BNSS) if the information discloses the commission of a cognizable offence. No preliminary inquiry is permissible in such cases. Preliminary inquiry is permissible only in matrimonial, commercial, medical negligence, corruption, or abnormal delay cases and must be concluded within 14 days (now 14 days statutory rule under BNSS).",
        "obiter_dicta": "Burking of crimes creates an illusion of low crime rates while denying victims statutory access to the criminal justice mechanism.",
        "status": "Good Law (Codified into Section 173(3) BNSS 2023)",
        "litigation_utility": "Mandatory citation when filing writ petitions for police inaction or seeking registration of FIR under Section 156(3) CrPC / 175(3) BNSS.",
    },
    {
        "id": "puttaswamy_privacy",
        "title": "Justice K.S. Puttaswamy (Retd.) v. Union of India",
        "citation": "(2017) 10 SCC 1",
        "equivalent_citations": "AIR 2017 SC 4161, (2017) 10 SCJ 1",
        "court": "Supreme Court of India",
        "year": 2017,
        "bench_strength": "9 Judges (Constitution Bench - Unanimous)",
        "presiding_judges": "J.S. Khehar, C.J., J. Chelameswar, S.A. Bobde, R.K. Agrawal, R.F. Nariman, A.M. Sapre, D.Y. Chandrachud, S.K. Kaul, S. Abdul Nazeer, JJ.",
        "subject_area": "Right to Privacy & Data Protection",
        "statutes_interpreted": "Article 21, Article 19, Article 14, Constitution of India",
        "ratio_decidendi": "Right to Privacy is a fundamental and inalienable right protected under Article 21 and Part III of the Constitution. State encroachments on privacy must satisfy a threefold test: (1) Legality (statutory backing), (2) Legitimate state aim, and (3) Proportionality (least intrusive means).",
        "obiter_dicta": "Informational privacy, bodily autonomy, and privacy of choice are core components of human dignity. Overruled M.P. Sharma (1954) and Kharak Singh (1962) to the extent they held privacy was not a fundamental right.",
        "status": "Good Law (Foundational authority for Digital Personal Data Protection Act 2023)",
        "litigation_utility": "Invoked against unauthorized state surveillance, illegal phone interception, Aadhaar overreach, and data breaches.",
    },
    {
        "id": "dashrath_rupsingh",
        "title": "Dashrath Rupsingh Rathod v. State of Maharashtra",
        "citation": "(2014) 9 SCC 129",
        "equivalent_citations": "AIR 2014 SC 3519, 2014 Cri LJ 4181",
        "court": "Supreme Court of India",
        "year": 2014,
        "bench_strength": "3 Judges (Full Bench)",
        "presiding_judges": "T.S. Thakur, Vikramajit Sen, C. Nagappan, JJ.",
        "subject_area": "Territorial Jurisdiction in Cheque Bounce",
        "statutes_interpreted": "Section 138, Negotiable Instruments Act, 1881",
        "ratio_decidendi": "Led to Parliament enacting the Negotiable Instruments (Amendment) Act 2015 introducing Section 142(2): Venue of Section 138 trial lies strictly where the payee maintains the bank account if delivered for collection through an account.",
        "obiter_dicta": "Forum shopping in cheque dishonour complaints must be curtailed by strict statutory tethering to the payee bank branch.",
        "status": "Governed by statutory amendment in Section 142(2) NI Act",
        "litigation_utility": "Pivotal in deciding territorial jurisdiction for filing Section 138 complaints.",
    },
    {
        "id": "damodar_prabhu",
        "title": "Damodar S. Prabhu v. Sayed Babalal H.",
        "citation": "(2010) 5 SCC 663",
        "equivalent_citations": "AIR 2010 SC 1907, 2010 Cri LJ 2871",
        "court": "Supreme Court of India",
        "year": 2010,
        "bench_strength": "3 Judges (Full Bench)",
        "presiding_judges": "K.G. Balakrishnan, C.J., P. Sathasivam, J.M. Panchal, JJ.",
        "subject_area": "Compounding of Cheque Bounce Offences",
        "statutes_interpreted": "Section 138, Section 147, Negotiable Instruments Act, 1881",
        "ratio_decidendi": "Offences under Section 138 NI Act are predominantly of a civil nature in the guise of criminal prosecution. Compounding is permissible at trial, appellate, or Supreme Court stage subject to graded costs (10% at Sessions, 15% at High Court, 20% at Supreme Court) payable to the Legal Services Authority.",
        "obiter_dicta": "The primary objective of Section 138 is recovery of money, not incarceration of debtors. Courts should encourage early dispute settlement.",
        "status": "Good Law (Followed in all NI Act compounding applications)",
        "litigation_utility": "Used when parties reach an out-of-court settlement in a cheque bounce case to seek quashing/compounding without serving jail time.",
    },
    {
        "id": "satender_kumar_antil",
        "title": "Satender Kumar Antil v. Central Bureau of Investigation",
        "citation": "(2022) 10 SCC 51",
        "equivalent_citations": "2022 LiveLaw (SC) 577, AIR 2022 SC 3386",
        "court": "Supreme Court of India",
        "year": 2022,
        "bench_strength": "2 Judges (Division Bench)",
        "presiding_judges": "Sanjay Kishan Kaul, M.M. Sundresh, JJ.",
        "subject_area": "Bail Jurisprudence & Categorization of Offences",
        "statutes_interpreted": "Section 41, 41A, 88, 170, 204, 209, 437, 439 CrPC [Now BNSS Chapters V & XXXV]",
        "ratio_decidendi": "Categorized offences into Category A (up to 7 yrs), Category B (death/life/7+ yrs), Category C (special acts like NDPS, PMLA), and Category D (economic offences). For Category A offences, if accused was not arrested during probe and complied with 41A notices, court cannot remand to custody upon filing of charge-sheet; regular bail or undertaking should be granted without arrest.",
        "obiter_dicta": "Bail is the rule and jail is the exception. Overcrowding in Indian prisons is a human rights crisis driven by mechanical arrests.",
        "status": "Good Law (Binding nationwide bail guidelines)",
        "litigation_utility": "The single most frequently cited judgment in trial and High courts to secure bail on summons without being remanded to judicial custody.",
    },
    {
        "id": "shreya_singhal",
        "title": "Shreya Singhal v. Union of India",
        "citation": "(2015) 5 SCC 1",
        "equivalent_citations": "AIR 2015 SC 1523, (2015) 2 SCC (Cri) 449",
        "court": "Supreme Court of India",
        "year": 2015,
        "bench_strength": "2 Judges (Division Bench)",
        "presiding_judges": "J. Chelameswar, Rohinton Fali Nariman, JJ.",
        "subject_area": "Freedom of Speech, Internet & Cyber Law",
        "statutes_interpreted": "Section 66A, Information Technology Act, 2000; Article 19(1)(a) & 19(2) Constitution",
        "ratio_decidendi": "Section 66A of the IT Act was struck down as unconstitutional in its entirety for being vague, overbroad, and having a chilling effect on freedom of speech. Intermediaries are protected under Section 79 unless ordered by a court or government agency.",
        "obiter_dicta": "Discussion or advocacy on controversial topics cannot be equated with incitement. The chilling effect invalidates overly sweeping cyber censorship.",
        "status": "Good Law (Section 66A rendered void ab initio)",
        "litigation_utility": "Primary precedent in quashing criminal proceedings initiated over social media posts, political commentary, and online speech.",
    },
    {
        "id": "kailash_nath_associates",
        "title": "Kailash Nath Associates v. Delhi Development Authority",
        "citation": "(2015) 4 SCC 136",
        "equivalent_citations": "AIR 2015 SC (Supp) 1243, 2015 (1) SCALE 625",
        "court": "Supreme Court of India",
        "year": 2015,
        "bench_strength": "2 Judges (Division Bench)",
        "presiding_judges": "Ranjan Gogoi, Rohinton Fali Nariman, JJ.",
        "subject_area": "Contract Law & Liquidated Damages",
        "statutes_interpreted": "Section 73, Section 74, Indian Contract Act, 1872",
        "ratio_decidendi": "Compensation can only be awarded for actual damage or loss suffered. If no loss results from the breach of contract, even a stipulated liquidated damages or forfeiture clause cannot be enforced mechanically. Section 74 does not dispense with the proof of loss where such loss is capable of proof.",
        "obiter_dicta": "Forfeiture of earnest money or lock-in rent without establishing actual commercial loss is penal and impermissible under Indian jurisprudence.",
        "status": "Good Law (Landmark authority on liquidated damages)",
        "litigation_utility": "Decisive in commercial arbitration, lease agreement lock-in disputes, tender earnest money forfeitures, and contract terminations.",
    },
]


def search_indexed_precedents(query: str) -> List[Dict[str, Any]]:
    """Fast local search over curated Supreme Court landmark database."""
    q = query.lower().strip()
    if not q:
        return INDEXED_LANDMARK_PRECEDENTS

    results = []
    for item in INDEXED_LANDMARK_PRECEDENTS:
        # Search match across all rich fields
        searchable_corpus = " ".join([
            item["title"],
            item["citation"],
            item["equivalent_citations"],
            item["subject_area"],
            item["statutes_interpreted"],
            item["ratio_decidendi"],
            item["obiter_dicta"],
            item.get("presiding_judges", ""),
        ]).lower()

        # Score matching
        score = 0
        if q in item["title"].lower():
            score += 10
        if q in item["citation"].lower() or q in item["equivalent_citations"].lower():
            score += 15
        if q in item["subject_area"].lower():
            score += 6
        if q in item["statutes_interpreted"].lower():
            score += 8
        if q in item["ratio_decidendi"].lower():
            score += 5

        # Check token overlaps
        tokens = [t for t in re.split(r"[\s,]+", q) if len(t) > 2]
        token_matches = sum(1 for t in tokens if t in searchable_corpus)
        score += token_matches * 2

        if score > 0:
            item_copy = dict(item)
            item_copy["relevance_score"] = score
            results.append(item_copy)

    results.sort(key=lambda x: x.get("relevance_score", 0), reverse=True)
    return results


def get_precedent_by_id(precedent_id: str) -> Optional[Dict[str, Any]]:
    return next((p for p in INDEXED_LANDMARK_PRECEDENTS if p["id"] == precedent_id), None)
