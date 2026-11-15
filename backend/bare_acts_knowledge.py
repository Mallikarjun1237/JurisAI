# coding: utf-8
"""
JurisAI — Sovereign Bare Acts Knowledge & Case Law Applicability Repository
Provides detailed statutory overviews, legislative objectives, and practical
litigation scenarios ('When to Use This Act') for all Central Acts of India.
"""

import os
import glob
import json
from typing import Dict, Any, List, Optional

# Knowledge directory mapping Act ID / Key terms to Overview & Case Applications
ACT_KNOWLEDGE_BASE: Dict[str, Dict[str, Any]] = {
    "ACT_2023_45": {
        "overview": (
            "The Bharatiya Nyaya Sanhita, 2023 (BNS) is the substantive criminal code of India, repealing and replacing the colonial Indian Penal Code, 1860. "
            "It consolidates criminal offenses, modernizes definitions, introduces community service as a penal sanction for petty offenses, "
            "and penalizes contemporary crimes including organized crime (Section 111), mob lynching (Section 103(2)), terrorism (Section 113), and cyber extortion. "
            "The code emphasizes victim-centric justice, gender-neutral protection for children, and stringent deterrence for violent offenses against women and the state."
        ),
        "key_applications": [
            "Criminal Prosecution for Violent Offenses: Murder (Sec 103), Grievous Hurt, and Mob Lynching.",
            "White-Collar & Commercial Crimes: Cheating and Dishonestly Inducing Delivery of Property (Sec 318), Forgery, and Criminal Breach of Trust (Sec 316).",
            "Crimes Against Women & Children: Rape (Sec 64), Cruelty by Husband or Relatives (Sec 85), and Dowry Death (Sec 80).",
            "Offenses Against Public Peace & Reputation: Criminal Defamation (Sec 356), Affray, and Unlawful Assembly.",
            "Cyber & Transnational Offenses: Organized crime syndicate violations, financial fraud, and identity theft."
        ]
    },
    "ACT_2023_46": {
        "overview": (
            "The Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS) is the procedural law governing the investigation, inquiry, arrest, bail, and trial of criminal offenses in India, "
            "replacing the Code of Criminal Procedure, 1973 (CrPC). BNSS establishes strict statutory timelines for police investigations, mandates the use of forensics and audio-video recording "
            "during searches and seizures, introduces electronic summons/warrants, and expands Zero FIR mechanisms across all police stations in India regardless of territorial jurisdiction."
        ),
        "key_applications": [
            "Police Complaints & First Information Reports: Registration of regular FIRs or Zero FIRs under Section 173 BNSS.",
            "Arrest Protection & Safeguards: Mandatory Notice of Appearance under Section 35 (replacing Sec 41A CrPC) and DSP approval for elderly/infirm persons.",
            "Bail Jurisprudence: Anticipatory Bail (Sec 482 BNSS / 438 CrPC), Regular Bail (Sec 480 BNSS), and Statutory Default Bail upon non-filing of chargesheet within 60/90 days (Sec 187 BNSS).",
            "Forensic & Search Safeguards: Mandatory videography of spot mahazar/panchnama and search operations (Sec 105 BNSS).",
            "Criminal Inquiries & Revisions: Section 442/528 BNSS High Court inherent powers (quashing of frivolous FIRs under former Sec 482 CrPC)."
        ]
    },
    "ACT_2023_47": {
        "overview": (
            "The Bharatiya Sakshya Adhiniyam, 2023 (BSA) consolidates the law of evidence in Indian courts, repealing the Indian Evidence Act, 1872. "
            "BSA legally equates electronic and digital records with primary documentary evidence, standardizing hash value verification, cloud server logs, "
            "and electronic signatures. It regulates the admissibility of confessions, expert opinions, dying declarations, and governs statutory presumptions in criminal and civil trials."
        ),
        "key_applications": [
            "Admissibility of Electronic Evidence: Generating and proving digital records, WhatsApp chats, emails, and CCTV footage under Section 63 BSA (replaces Section 65B IEA).",
            "Documentary Proof in Court: Proving primary vs secondary documents in civil suits and criminal trials.",
            "Examination of Witnesses: Cross-examination, refreshing memory, and confronting witnesses with prior statements (Sec 145-148 BSA).",
            "Statutory Presumptions: Presumption of innocence, legitimate child presumption, and reverse burden in statutory offenses.",
            "Expert Testimony & Forensic Reports: Medical examination reports, ballistic analysis, and forensic handwriting verification."
        ]
    },
    "ACT_1881_26": {
        "overview": (
            "The Negotiable Instruments Act, 1881 (NI Act) governs promissory notes, bills of exchange, and cheques in India. "
            "Its Chapter XVII (Sections 138 to 148) provides a specialized, quasi-criminal summary enforcement mechanism to ensure credibility in commercial banking transactions. "
            "Section 138 penalizes drawer default with up to two years imprisonment and fines up to twice the cheque amount, reinforced by statutory presumptions of debt under Section 139."
        ),
        "key_applications": [
            "Commercial Debt Recovery via Cheque Dishonour: Serving mandatory 30-day statutory legal notice upon receipt of bank memo.",
            "Criminal Complaint Filing: Instituting Section 138 complaints before the competent Judicial Magistrate within 30 days of notice expiry.",
            "Interim Relief for Creditors: Filing applications under Section 143A for mandatory/discretionary 20% interim compensation.",
            "Appellate Safeguards: Section 148 mandatory 20% deposit when convicted drawer appeals before Sessions Court.",
            "Corporate Director Liability: Impleading active directors under Section 141 for corporate cheque dishonour."
        ]
    },
    "ACT_2013_18": {
        "overview": (
            "The Companies Act, 2013 regulates the incorporation, governance, fiduciary duties, financial disclosures, and dissolution of companies in India. "
            "It establishes the National Company Law Tribunal (NCLT), mandates Corporate Social Responsibility (Section 135), codifies directors' duties (Section 166), "
            "and enforces stringent penalties and investigations through the Serious Fraud Investigation Office (SFIO) for corporate fraud under Section 447."
        ),
        "key_applications": [
            "Corporate Fraud & White-Collar Crime: SFIO investigations and stringent bail bars under Section 447.",
            "Oppression & Mismanagement: Petitions before NCLT under Sections 241 & 242 by minority shareholders.",
            "Director Disqualification & Duties: Enforcing fiduciary liability under Section 166 or removal under Section 164/167.",
            "Mergers, Amalgamations & Schemes of Arrangement: Compromises with creditors and restructuring under Section 230-232.",
            "CSR Compliance: Defending or ensuring mandatory 2% average net profit allocation under Section 135."
        ]
    },
    "ACT_2016_31": {
        "overview": (
            "The Insolvency and Bankruptcy Code, 2016 (IBC) is India's unified statutory framework for the time-bound reorganization and insolvency resolution "
            "of corporate debtors, partnership firms, and individuals. It empowers financial and operational creditors to initiate Corporate Insolvency Resolution Processes (CIRP) "
            "before the NCLT upon minimum default (₹1 Crore), imposing an immediate statutory moratorium under Section 14 to maximize asset preservation."
        ),
        "key_applications": [
            "Operational Debt Recovery: Serving Section 8 statutory demand notice and filing Section 9 CIRP petitions before NCLT.",
            "Financial Creditor Remedies: Banks and financial institutions triggering Section 7 insolvency proceedings against defaulting borrowers.",
            "Moratorium Protection: Invoking Section 14 moratorium to stay all parallel recovery suits, arbitrations, and debt enforcement actions.",
            "Resolution Plan Adjudication: Submitting or challenging Committee of Creditors (CoC) approved resolution plans before NCLT.",
            "Liquidation & Asset Sale: Distribution of liquidation proceeds according to Section 53 waterfall mechanism."
        ]
    },
    "ACT_1996_26": {
        "overview": (
            "The Arbitration and Conciliation Act, 1996 governs domestic arbitration, international commercial arbitration, and the enforcement of foreign arbitral awards in India. "
            "Grounded in the UNCITRAL Model Law, it minimizes judicial intervention, provides urgent interim court protection under Section 9, "
            "empowers High Courts to appoint independent arbitrators under Section 11, and restricts award annulment under Section 34 strictly to public policy or patent illegality."
        ),
        "key_applications": [
            "Emergency Interim Protection: Injunctions, asset freezing, or bank guarantee security applications under Section 9 (Court) or Section 17 (Tribunal).",
            "Arbitrator Appointment Petitions: Approaching High Court or Supreme Court under Section 11 when a party fails to agree on arbitrator nomination.",
            "Challenging Arbitral Awards: Filing Section 34 setting aside petitions in Commercial Court / High Court within strict 3-month limitation.",
            "Execution & Enforcement: Enforcing domestic awards as civil court decrees under Section 36 or foreign awards under New York/Geneva Conventions (Part II).",
            "Reference to Arbitration: Filing Section 8 applications in civil suits to refer disputes to contractually agreed arbitration."
        ]
    },
    "ACT_1955_25": {
        "overview": (
            "The Hindu Marriage Act, 1955 codifies the law relating to marriage, separation, restitution, and divorce among Hindus, Buddhists, Jains, and Sikhs in India. "
            "It establishes monogamy, sets minimum marriageable age, provides grounds for nullity and judicial separation, and prescribes statutory mechanisms for "
            "contested divorce (cruelty, desertion, adultery under Section 13), mutual consent divorce (Section 13B), pendente lite maintenance (Section 24), and permanent alimony (Section 25)."
        ),
        "key_applications": [
            "Divorce by Mutual Consent: Filing joint petition under Section 13B and seeking waiver of 6-month cooling off period under Supreme Court precedent.",
            "Contested Divorce Petitions: Initiating or defending divorce on grounds of mental/physical cruelty, desertion for 2+ years, or adultery.",
            "Restitution of Conjugal Rights (RCR): Section 9 petitions compelling cohabitation when a spouse withdraws without reasonable cause.",
            "Interim Maintenance & Litigation Expenses: Section 24 applications securing monthly subsistence for dependent spouse and minor children.",
            "Permanent Alimony & Property Settlement: Section 25 petitions determining lump-sum or monthly alimony based on financial status."
        ]
    },
    "ACT_2005_43": {
        "overview": (
            "The Protection of Women from Domestic Violence Act, 2005 (PWDVA) provides civil and quasi-criminal remedies to protect women from physical, "
            "sexual, verbal, emotional, and economic abuse within domestic relationships. It creates the statutory right of residence in a shared household (Section 19), "
            "empowers Magistrates to issue emergency protection orders (Section 18), and awards monetary compensation without requiring the dissolution of marriage."
        ),
        "key_applications": [
            "Restraining Dispossession: Section 19 Residence Orders safeguarding wife's right to reside in matrimonial home/shared household (Satish Chander Ahuja).",
            "Emergency Injunctions: Section 18 Protection Orders restraining respondent from entering workplace or contacting complainant.",
            "Monetary Maintenance & Medical Relief: Section 20 orders securing immediate monthly financial support.",
            "Compensation for Tortious Harm: Section 22 damages for mental torture, physical injury, and domestic distress.",
            "Criminal Penalties for Breach: Section 31 arrest and prosecution for violating protection orders."
        ]
    },
    "ACT_1882_4": {
        "overview": (
            "The Transfer of Property Act, 1882 (TPA) regulates the transfer of immovable and movable property between living persons (inter vivos) in India. "
            "It establishes statutory rules for sales, mortgages, leases, exchanges, and gifts of real estate, defines actionable claims, "
            "and codifies equitable doctrines such as Part Performance (Section 53A), Doctrine of Lis Pendens (Section 52), and Fraudulent Transfers (Section 53)."
        ),
        "key_applications": [
            "Tenancy & Eviction Proceedings: Serving mandatory 15-day termination notices under Section 106 and recovering leased property.",
            "Protecting Possession via Part Performance: Invoking Section 53A defence where purchaser took possession under registered agreement to sell.",
            "Mortgage Foreclosure & Redemption: Filing suits for redemption by mortgagor or sale/foreclosure by mortgagee under Section 67.",
            "Challenging Transfers During Litigation: Applying Section 52 Lis Pendens to invalidate clandestine property sales during pending title suits.",
            "Revocation or Cancellation of Gift Deeds: Disputing void or conditional gifts under Section 126."
        ]
    },
    "ACT_2016_16": {
        "overview": (
            "The Real Estate (Regulation and Development) Act, 2016 (RERA) establishes state Real Estate Regulatory Authorities to protect home buyers, "
            "enforce transparency, and standardize real estate transactions. It mandates builder registration, quarterly escrow account audits (70% funds rule), "
            "and provides statutory rights to allottees to claim 100% refund with interest or compensation under Section 18 for delayed project handover."
        ),
        "key_applications": [
            "Homebuyer Refund Claims: Filing Section 18 complaints before RERA Authority for project delay and recovering invested capital with SBI lending rate interest.",
            "Execution of Possession & Conveyance: Compelling promoter to deliver occupancy certificate and execute registered title deed.",
            "Escrow Account Violation Actions: Freezing developer funds when 70% project development funds are diverted.",
            "Adjudicating Officer Compensation Claims: Seeking damages under Section 12, 14, or 19 for structural defects within 5 years.",
            "Appeals before REAT: Challenging RERA Authority orders before Real Estate Appellate Tribunal and High Court under Section 58."
        ]
    },
    "ACT_2019_35": {
        "overview": (
            "The Consumer Protection Act, 2019 replaced the 1986 enactment to modernize consumer rights in the era of digital commerce, tele-marketing, and multi-tier supply chains. "
            "It establishes the Central Consumer Protection Authority (CCPA), introduces Product Liability claims against manufacturers and sellers (Section 84), "
            "provides for mediation, and establishes a 3-tier pecuniary hierarchy (District Commission up to ₹50 Lakhs, State Commission ₹50 Lakhs to ₹2 Crore, National Commission above ₹2 Crore)."
        ),
        "key_applications": [
            "Deficiency in Service Claims: Filing complaints against insurance companies for arbitrary claim repudiation, airlines for cancellations, and banks for unauthorized debits.",
            "Real Estate Deficiencies: Homebuyer complaints against builders for unfair contract terms or non-handover.",
            "Product Liability Actions: Suing manufacturers and e-commerce platforms for physical harm, property loss, or injury caused by defective goods (Sec 84).",
            "Misleading Advertisements & Unfair Trade: Petitions before CCPA for recall of hazardous goods and penalties on endorsers.",
            "Consumer Mediation: Settling consumer disputes through statutory mediation cells attached to District/State Commissions."
        ]
    },
    "ACT_2005_22": {
        "overview": (
            "The Right to Information Act, 2005 (RTI Act) operationalizes the citizen's fundamental right to know under Article 19(1)(a) of the Constitution of India. "
            "It mandates public authorities to provide certified records, file inspects, and information within 30 days (48 hours for life/liberty), "
            "restricting exemptions strictly to Section 8, and empowering Information Commissions to penalize non-compliant Public Information Officers (PIOs) up to ₹25,000."
        ),
        "key_applications": [
            "Obtaining Public Government Records: Inquiring into government tenders, municipal sanction plans, road development budgets, and recruitment answer keys.",
            "Life or Liberty Urgent RTI: Demanding detention records, hospital ICU logs, or emergency medical clearances within mandatory 48 hours (Sec 7(1)).",
            "Appellate Recourse: Filing First Appeal within 30 days to Senior Departmental Officer and Second Appeal to Central/State Information Commission.",
            "Challenging Illegal Rejections: Contesting arbitrary invocation of Section 8(1)(j) privacy exemptions when public interest predominates.",
            "Enforcing Financial Penalties: Seeking Section 20 ₹250/day penalties and disciplinary action against obstructive PIOs."
        ]
    },
    "ACT_1963_36": {
        "overview": (
            "The Limitation Act, 1963 consolidates the law prescribing specific time limits within which suits, appeals, and applications must be instituted before courts. "
            "Under Section 3, courts are statutorily bound to dismiss time-barred proceedings even if limitation is not pleaded. "
            "The Act balances this strictness with Section 5 condonation of delay for sufficient cause, Section 14 exclusion of bona fide time in wrong forums, and Section 18 renewal upon debt acknowledgment."
        ),
        "key_applications": [
            "Filing Section 5 Condonation of Delay Petitions: Demonstrating sufficient cause for delay in criminal or civil appeals and revision petitions.",
            "Exclusion of Time Spent in Good Faith: Section 14 applications excluding period spent prosecuting before court lacking jurisdiction.",
            "Renewing Debt Limitation: Computing fresh 3-year commercial limitation from date of written balance confirmation or ledger acknowledgment (Sec 18).",
            "Specific Performance Suits: Calculating strict 3-year limitation under Article 54 from date fixed for performance.",
            "Adverse Possession Title Suits: Computing 12-year statutory threshold under Article 65 to extinguish original owner's title (Sec 27)."
        ]
    },
    "ACT_2013_14": {
        "overview": (
            "The Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013 (POSH Act) operationalizes the Vishaka Guidelines "
            "to guarantee women a safe, harassment-free workplace. It mandates every organization with 10 or more employees to constitute an Internal Committee (IC) "
            "headed by a senior woman employee, establishes a 90-day inquiry timeline with civil court powers, and penalizes employer non-compliance with fines and licence revocation."
        ),
        "key_applications": [
            "Filing Workplace Harassment Complaints: Submitting formal complaints to IC within 3 months of incident.",
            "Interim Relief During Inquiry: Demanding transfer of respondent or complainant, or granting up to 3 months paid leave (Sec 12).",
            "Employer Compliance Audits: Mandating constitution of IC and filing annual reports with District Officer (Sec 21).",
            "Challenging Malicious Complaints: Invoking Section 14 when complaints are proven to be false or fabricated with forged evidence.",
            "Appeals Against IC Reports: Filing statutory appeals before Industrial Tribunal or High Court within 90 days under Section 18."
        ]
    }
}


def get_act_knowledge(act_id: str, title: str, domain: str) -> Dict[str, Any]:
    """Retrieves rich overview and litigation applications for an act, with robust fallback."""
    # 1. Direct registry lookup
    if act_id in ACT_KNOWLEDGE_BASE:
        return ACT_KNOWLEDGE_BASE[act_id]

    # 2. Check title keywords
    t_lower = title.lower()
    for aid, data in ACT_KNOWLEDGE_BASE.items():
        if any(w in t_lower for w in ["penal", "bns", "nyaya"]) and aid == "ACT_2023_45":
            return data
        if any(w in t_lower for w in ["procedure", "bnss", "suraksha"]) and aid == "ACT_2023_46":
            return data
        if any(w in t_lower for w in ["evidence", "sakshya"]) and aid == "ACT_2023_47":
            return data
        if any(w in t_lower for w in ["cheque", "negotiable", "ni act"]) and aid == "ACT_1881_26":
            return data
        if any(w in t_lower for w in ["company", "companies"]) and aid == "ACT_2013_18":
            return data
        if any(w in t_lower for w in ["insolvency", "bankruptcy", "ibc"]) and aid == "ACT_2016_31":
            return data
        if any(w in t_lower for w in ["arbitration", "conciliation"]) and aid == "ACT_1996_26":
            return data
        if any(w in t_lower for w in ["marriage", "divorce", "hindu marriage"]) and aid == "ACT_1955_25":
            return data
        if any(w in t_lower for w in ["domestic violence", "pwdva"]) and aid == "ACT_2005_43":
            return data
        if any(w in t_lower for w in ["transfer of property", "tenancy", "tpa"]) and aid == "ACT_1882_4":
            return data
        if any(w in t_lower for w in ["rera", "real estate"]) and aid == "ACT_2016_16":
            return data
        if any(w in t_lower for w in ["consumer"]) and aid == "ACT_2019_35":
            return data
        if any(w in t_lower for w in ["information", "rti"]) and aid == "ACT_2005_22":
            return data
        if any(w in t_lower for w in ["limitation"]) and aid == "ACT_1963_36":
            return data
        if any(w in t_lower for w in ["posh", "harassment"]) and aid == "ACT_2013_14":
            return data

    # 3. Dynamic domain-grounded synthesis
    return {
        "overview": (
            f"The {title} is an enacted statute of the Republic of India governing the domain of {domain}. "
            "It establishes sovereign legislative standards, substantive rights, and regulatory duties for Indian citizens, corporate entities, and public authorities. "
            "Provisions under this enactment are adjudicated across District Courts, High Courts, the Supreme Court of India, and specialized tribunals."
        ),
        "key_applications": [
            f"Filing statutory claims and petitions under the {domain} legal framework.",
            "Instituting or defending civil suits and summary proceedings in competent territorial courts.",
            "Ensuring regulatory and corporate compliance with Central Government rules and notifications.",
            "Drafting legal notices, statutory appeals, and representation briefs for client disputes."
        ]
    }


def get_act_provisions(act_id: str, title: str) -> List[Dict[str, Any]]:
    """Gathers all section-level provisions for an act from backend/data/bare_acts/*.json."""
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    bare_acts_dir = os.path.join(backend_dir, "data", "bare_acts")
    matching = []

    if not os.path.exists(bare_acts_dir):
        return matching

    for fp in glob.glob(os.path.join(bare_acts_dir, "*.json")):
        try:
            with open(fp, "r", encoding="utf-8") as jf:
                items = json.load(jf)
                for item in items:
                    p_aid = item.get("act_id", "")
                    p_title = item.get("act_title", "")
                    if (act_id and p_aid == act_id) or (title and (title.lower() in p_title.lower() or p_title.lower() in title.lower())):
                        matching.append({
                            "id": item.get("id", ""),
                            "section_number": str(item.get("section_number", "")),
                            "marginal_heading": item.get("marginal_heading", ""),
                            "citation": item.get("citation", p_title),
                            "text": item.get("text", ""),
                            "enacted_year": item.get("enacted_year"),
                            "effective_date": str(item.get("effective_date", "")),
                        })
        except Exception:
            pass

    # Sort provisions by section number if possible
    return matching
