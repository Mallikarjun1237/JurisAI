"""
JurisAI — Indian Court Limitation & Statutory Deadline Engine
Governed by:
- The Limitation Act, 1963
- The Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023 / CrPC, 1973
- The Code of Civil Procedure (CPC), 1908
- The Negotiable Instruments Act, 1881
- The Consumer Protection Act, 2019
- The Arbitration and Conciliation Act, 1996
- The Right to Information Act, 2005
- The Insolvency and Bankruptcy Code (IBC), 2016
"""

from datetime import datetime, date, timedelta
from typing import List, Dict, Any, Optional


LIMITATION_PRESETS: List[Dict[str, Any]] = [
    {
        "id": "ni_sec138_notice",
        "title": "Cheque Dishonour — Statutory Demand Notice",
        "act": "Negotiable Instruments Act, 1881",
        "section": "Section 138(b)",
        "forum": "Dispatched to Drawer via Registered Post / Speed Post",
        "period_type": "days",
        "period_value": 30,
        "cure_period_days": 0,
        "cause_label": "Date of receipt of Cheque Return Memo from Bank",
        "delay_condonable": False,
        "condonation_statute": "Strict statutory precondition. Delay is NOT condonable by any court.",
        "landmark_ratios": "MSR Leathers v. S. Palaniappan (2013) 1 SCC 177: Limitation begins on first receipt of return memo.",
        "description": "Mandatory demand notice requiring payment within 15 days of notice receipt.",
    },
    {
        "id": "ni_sec138_complaint",
        "title": "Cheque Dishonour — Criminal Complaint Filing",
        "act": "Negotiable Instruments Act, 1881",
        "section": "Section 142(1)(b)",
        "forum": "Judicial Magistrate First Class / Metropolitan Magistrate (NI Court)",
        "period_type": "days",
        "period_value": 30,
        "cure_period_days": 15,
        "cause_label": "Date of Service / Delivery of Statutory Notice to Drawer",
        "delay_condonable": True,
        "condonation_statute": "Section 142(1)(b) Proviso: Magistrate may condone delay if complainant satisfies sufficient cause.",
        "landmark_ratios": "Pawan Kumar Ralli v. Maninder Singh Narula (2014) 15 SCC 245: Proviso permits condonation on bona fide grounds.",
        "description": "Complaint must be filed within 30 days after the expiry of the 15-day notice cure period.",
    },
    {
        "id": "bnss_default_bail_60",
        "title": "Default Statutory Bail (Investigation up to 10 Yrs)",
        "act": "Bharatiya Nagarik Suraksha Sanhita, 2023",
        "section": "Section 187(3)(a)(ii) [Old Sec 167(2) CrPC]",
        "forum": "Magistrate / Special Court",
        "period_type": "days",
        "period_value": 60,
        "cure_period_days": 0,
        "cause_label": "Date of First Remand to Custody",
        "delay_condonable": False,
        "condonation_statute": "Indefeasible constitutional right under Article 21. Court CANNOT extend time if charge-sheet is not filed.",
        "landmark_ratios": "Bikramjit Singh v. State of Punjab (2020) 10 SCC 616: Right to default bail matures on the 61st day.",
        "description": "Accused is entitled to indefeasible statutory bail if police fail to file charge-sheet within 60 days.",
    },
    {
        "id": "bnss_default_bail_90",
        "title": "Default Statutory Bail (Life / Death / Min 10 Yrs)",
        "act": "Bharatiya Nagarik Suraksha Sanhita, 2023",
        "section": "Section 187(3)(a)(i) [Old Sec 167(2) CrPC]",
        "forum": "Sessions Court / Special Court",
        "period_type": "days",
        "period_value": 90,
        "cure_period_days": 0,
        "cause_label": "Date of First Remand to Custody",
        "delay_condonable": False,
        "condonation_statute": "Indefeasible right. Accused must be released on bail upon furnishing surety on 91st day.",
        "landmark_ratios": "Sanjay Dutt v. State (1994) 5 SCC 410 & M. Ravindran v. DoR (2021) 2 SCC 485.",
        "description": "Investigation deadline for serious offences. Inability to submit police report within 90 days creates statutory bail.",
    },
    {
        "id": "crim_appeal_hc_conviction",
        "title": "Criminal Appeal to High Court against Conviction",
        "act": "Limitation Act, 1963 & BNSS, 2023",
        "section": "Article 115(b)(i), Limitation Act 1963 read with Sec 415 BNSS",
        "forum": "High Court (Appellate Jurisdiction)",
        "period_type": "days",
        "period_value": 60,
        "cure_period_days": 0,
        "cause_label": "Date of Conviction & Sentence Pronouncement by Sessions Court",
        "delay_condonable": True,
        "condonation_statute": "Section 5, Limitation Act, 1963: Delay condonable on demonstration of 'sufficient cause'.",
        "landmark_ratios": "Collector, Land Acquisition v. Katiji (1987) 2 SCC 107: Liberal approach in criminal appeals involving liberty.",
        "description": "Appeal against sentence of imprisonment passed by Sessions Judge or Special Judge.",
    },
    {
        "id": "crim_appeal_hc_acquittal",
        "title": "Criminal Appeal to High Court against Acquittal",
        "act": "Limitation Act, 1963 & BNSS, 2023",
        "section": "Article 114, Limitation Act 1963 read with Sec 419 BNSS",
        "forum": "High Court",
        "period_type": "days",
        "period_value": 90,
        "cure_period_days": 0,
        "cause_label": "Date of Acquittal Order by Trial Court",
        "delay_condonable": True,
        "condonation_statute": "Section 5, Limitation Act, 1963: Delay condonable if supported by an affidavit explaining sufficient cause.",
        "landmark_ratios": "State of Rajasthan v. Sohan Lal (2004) 5 SCC 573: Strict scrutiny required for delayed acquittal appeals.",
        "description": "Appeal filed by State or Victim against trial court acquittal judgment.",
    },
    {
        "id": "civil_first_appeal_hc",
        "title": "Civil First Appeal (RFA) to High Court",
        "act": "Limitation Act, 1963 & CPC, 1908",
        "section": "Article 116(a), Limitation Act 1963 read with Sec 96 CPC",
        "forum": "High Court",
        "period_type": "days",
        "period_value": 90,
        "cure_period_days": 0,
        "cause_label": "Date of Signing of Decree by Subordinate Court",
        "delay_condonable": True,
        "condonation_statute": "Section 5, Limitation Act, 1963: File application with Section 12 exclusion for certified copy preparation.",
        "landmark_ratios": "Section 12(2) Limitation Act: Time requisite for obtaining certified copy of decree/judgment excluded.",
        "description": "Regular First Appeal challenging monetary, partition, or declaration civil decree.",
    },
    {
        "id": "civil_revision_hc",
        "title": "Civil Revision Petition (CRP) to High Court",
        "act": "Limitation Act, 1963 & CPC, 1908",
        "section": "Article 131, Limitation Act 1963 read with Sec 115 CPC",
        "forum": "High Court",
        "period_type": "days",
        "period_value": 90,
        "cure_period_days": 0,
        "cause_label": "Date of Impugned Interlocutory / Jurisdictional Order",
        "delay_condonable": True,
        "condonation_statute": "Section 5, Limitation Act, 1963: Condonable on sufficient grounds.",
        "landmark_ratios": "Major S.S. Khanna v. Brig. F.J. Dillon AIR 1964 SC 497: Jurisdictional error evaluation.",
        "description": "Challenging orders where no direct appeal lies and trial court exercised jurisdiction illegally.",
    },
    {
        "id": "money_recovery_contract",
        "title": "Money Recovery Suit / Breach of Contract",
        "act": "Limitation Act, 1963",
        "section": "Articles 19, 22, and 55, Schedule to Limitation Act",
        "forum": "Civil Court / Commercial Court",
        "period_type": "years",
        "period_value": 3,
        "cure_period_days": 0,
        "cause_label": "Date of Breach, Due Date of Invoice, or Part-Payment Acknowledgment",
        "delay_condonable": False,
        "condonation_statute": "Section 3, Limitation Act, 1963: Bar of Limitation is absolute. Section 5 does NOT apply to original suits.",
        "landmark_ratios": "Section 18 & 19 Limitation Act: Written acknowledgment or payment of interest resets 3-year clock.",
        "description": "Recovery of money lent, unpaid invoices, or damages for breach of commercial contract.",
    },
    {
        "id": "consumer_complaint_district",
        "title": "Consumer Complaint before District Commission",
        "act": "Consumer Protection Act, 2019",
        "section": "Section 69, Consumer Protection Act, 2019",
        "forum": "District Consumer Disputes Redressal Commission (DCDRC)",
        "period_type": "years",
        "period_value": 2,
        "cure_period_days": 0,
        "cause_label": "Date on which Cause of Action Arose (Deficiency of Service / Defect)",
        "delay_condonable": True,
        "condonation_statute": "Section 69(2) CPA 2019: Commission may entertain complaint after 2 years if complainant shows sufficient cause.",
        "landmark_ratios": "State Bank of India v. B.S. Agricultural Industries (2009) 5 SCC 121: 2-year limitation is mandatory.",
        "description": "Filing consumer grievance for compensation up to INR 50 Lakhs (or 1 Crore under updated rules).",
    },
    {
        "id": "arbitration_sec34_challenge",
        "title": "Challenge to Arbitral Award under Section 34",
        "act": "Arbitration and Conciliation Act, 1996",
        "section": "Section 34(3), Arbitration and Conciliation Act, 1996",
        "forum": "Commercial Court / High Court (Original Jurisdiction)",
        "period_type": "days",
        "period_value": 90,  # 3 months
        "cure_period_days": 0,
        "cause_label": "Date of Receipt of Signed Arbitral Award by Party",
        "delay_condonable": True,
        "condonation_statute": "Section 34(3) Proviso: Strictly maximum 30 days condonation only. Absolute bar after 120 days.",
        "landmark_ratios": "Union of India v. Popular Construction Co. (2001) 8 SCC 470 & Simplex Infrastructure (2019) 2 SCC 455: Sec 5 excluded.",
        "description": "Setting aside arbitral award. Strict 90 days + 30 days maximum grace window.",
    },
    {
        "id": "rti_first_appeal",
        "title": "RTI First Appeal to First Appellate Authority",
        "act": "Right to Information Act, 2005",
        "section": "Section 19(1), Right to Information Act, 2005",
        "forum": "First Appellate Authority (FAA) of Public Authority",
        "period_type": "days",
        "period_value": 30,
        "cure_period_days": 0,
        "cause_label": "Date of Expiry of 30-day PIO Response Period or Receipt of PIO Rejection",
        "delay_condonable": True,
        "condonation_statute": "Section 19(1) Proviso: FAA may admit appeal after 30 days if appellant was prevented by sufficient cause.",
        "landmark_ratios": "Central Board of Secondary Education v. Aditya Bandopadhyay (2011) 8 SCC 497.",
        "description": "Challenging failure of Public Information Officer (PIO) to provide requested information.",
    },
    {
        "id": "rti_second_appeal",
        "title": "RTI Second Appeal to Central / State Info Commission",
        "act": "Right to Information Act, 2005",
        "section": "Section 19(3), Right to Information Act, 2005",
        "forum": "Central Information Commission (CIC) / State Information Commission (SIC)",
        "period_type": "days",
        "period_value": 90,
        "cure_period_days": 0,
        "cause_label": "Date on which FAA Decision was Received or Ought to have Been Made",
        "delay_condonable": True,
        "condonation_statute": "Section 19(3) Proviso: Commission may admit appeal after 90 days upon demonstrating sufficient cause.",
        "landmark_ratios": "Chief Information Commissioner v. State of Manipur AIR 2012 SC 864.",
        "description": "Appealing against dismissal or inadequate order of First Appellate Authority.",
    },
    {
        "id": "ibc_cirp_section7_9",
        "title": "Insolvency CIRP Application under Section 7 or 9",
        "act": "Insolvency and Bankruptcy Code, 2016 & Limitation Act",
        "section": "Article 137, Limitation Act read with Sec 7/9 IBC",
        "forum": "National Company Law Tribunal (NCLT)",
        "period_type": "years",
        "period_value": 3,
        "cure_period_days": 0,
        "cause_label": "Date of Default in Payment of Debt (Min threshold INR 1 Crore)",
        "delay_condonable": True,
        "condonation_statute": "Section 238A IBC makes Limitation Act 1963 applicable. Section 5 condonation applicable for NCLT applications.",
        "landmark_ratios": "B.K. Educational Services v. Parag Gupta (2019) 11 SCC 633 & Asset Reconstruction Co v. Bishal Homes (2021).",
        "description": "Corporate Insolvency Resolution Process initiated by Financial Creditor or Operational Creditor.",
    },
]


def get_all_presets() -> List[Dict[str, Any]]:
    return LIMITATION_PRESETS


def calculate_limitation(
    preset_id: str,
    cause_of_action_date_str: str,
    reference_date_str: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Computes statutory limitation deadline, days remaining, and legal status.
    Reference date defaults to today.
    """
    preset = next((p for p in LIMITATION_PRESETS if p["id"] == preset_id), None)
    if not preset:
        raise ValueError(f"Unknown preset ID '{preset_id}'")

    try:
        cause_date = datetime.strptime(cause_of_action_date_str, "%Y-%m-%d").date()
    except Exception:
        raise ValueError("Invalid cause_of_action_date. Expected format YYYY-MM-DD.")

    if reference_date_str:
        try:
            today = datetime.strptime(reference_date_str, "%Y-%m-%d").date()
        except Exception:
            today = date.today()
    else:
        today = date.today()

    # Calculate effective start date (including any statutory notice cure period)
    cure_days = preset.get("cure_period_days", 0)
    effective_start = cause_date + timedelta(days=cure_days)

    # Calculate expiry
    period_type = preset["period_type"]
    period_val = preset["period_value"]

    if period_type == "days":
        expiry_date = effective_start + timedelta(days=period_val)
    elif period_type == "years":
        # Add years safely (handling leap year Feb 29)
        try:
            expiry_date = effective_start.replace(year=effective_start.year + period_val)
        except ValueError:
            expiry_date = effective_start + timedelta(days=365 * period_val)
    elif period_type == "months":
        expiry_date = effective_start + timedelta(days=period_val * 30)
    else:
        expiry_date = effective_start + timedelta(days=period_val)

    # Days remaining relative to reference date (today)
    delta_days = (expiry_date - today).days

    # Determine status & urgency
    if delta_days < 0:
        urgency = "TIME_BARRED"
        status_label = "Limitation Expired (Time-Barred)"
        status_color = "red"
    elif delta_days <= 7:
        urgency = "CRITICAL"
        status_label = "Critical Deadline (< 7 Days Remaining)"
        status_color = "red"
    elif delta_days <= 15:
        urgency = "APPROACHING"
        status_label = "Approaching Expiry (Under 15 Days)"
        status_color = "amber"
    else:
        urgency = "SAFE"
        status_label = "Within Limitation"
        status_color = "emerald"

    # Section 4 Limitation Act (Court Holiday Rule):
    # If deadline falls on Sunday / Saturday (court closed), filing on next working day is protected.
    weekday = expiry_date.strftime("%A")
    court_closed_warning = None
    if weekday in ("Sunday", "Saturday"):
        court_closed_warning = (
            f"Note: Final limitation date ({expiry_date.strftime('%d-%b-%Y')}) falls on a {weekday}. "
            f"Under Section 4 of the Limitation Act, 1963, if the court is closed on the expiry day, "
            f"filing on the immediate next court reopening day is valid."
        )

    # Section 5 Strategy
    if delta_days < 0:
        if preset["delay_condonable"]:
            action_advice = (
                f"Deadline elapsed by {abs(delta_days)} days. File formal Interim Application (IA) for Condonation of Delay "
                f"under {preset['condonation_statute']}. Cite 'sufficient cause' supported by an affidavit and relevant medical / postal exhibits."
            )
        else:
            action_advice = (
                f"Deadline elapsed by {abs(delta_days)} days. WARNING: Under Indian law, {preset['condonation_statute']}. "
                f"Remedy under this specific provision is barred by statutory limitation."
            )
    elif delta_days <= 7:
        action_advice = (
            f"Extremely urgent: Only {delta_days} days remaining before limitation expiry. "
            f"Draft and file immediately before {preset['forum']} to prevent statutory bar."
        )
    else:
        action_advice = (
            f"{delta_days} days remaining within statutory limitation window. "
            f"Prepare pleadings, verify court fees, and execute vakalatnama."
        )

    return {
        "preset_id": preset["id"],
        "title": preset["title"],
        "act": preset["act"],
        "section": preset["section"],
        "forum": preset["forum"],
        "cause_of_action_date": cause_date.strftime("%Y-%m-%d"),
        "cause_of_action_display": cause_date.strftime("%d %B %Y"),
        "cure_period_days": cure_days,
        "effective_start_date": effective_start.strftime("%Y-%m-%d"),
        "expiry_date": expiry_date.strftime("%Y-%m-%d"),
        "expiry_date_display": expiry_date.strftime("%d %B %Y"),
        "days_remaining": delta_days,
        "urgency": urgency,
        "status_label": status_label,
        "status_color": status_color,
        "delay_condonable": preset["delay_condonable"],
        "condonation_statute": preset["condonation_statute"],
        "landmark_ratios": preset["landmark_ratios"],
        "court_closed_warning": court_closed_warning,
        "action_advice": action_advice,
        "description": preset["description"],
    }
