"""
JurisAI — Legal Document Clause Risk & Loophole Auditor Service
Strictly grounded in enacted Indian statutes and Supreme Court landmark precedents:
- Indian Contract Act, 1872 (Sections 23, 27, 28, 73, 74)
- Arbitration and Conciliation Act, 1996 (Section 12(5), Seventh Schedule)
- Specific Relief Act, 1963 (Section 14, 41)
- Consumer Protection Act, 2019 (Section 2(46) Unfair Contract Terms)
- Digital Personal Data Protection Act, 2023 (Section 6, 7)
- Authoritative Supreme Court Precedents:
    * Perkins Eastman (2020) 20 SCC 760 (Unilateral Arbitrator Appointment)
    * Percept D'Mark v. Zaheer Khan (2006) 4 SCC 227 (Post-Term Non-Compete Void)
    * Central Inland Water Transport v. Brojo Nath Ganguly (1986) 3 SCC 156 (Unconscionable Clauses)
    * Kailash Nath Associates v. DDA (2015) 4 SCC 136 (Earnest Money & Penalty)
    * Pioneer Urban v. Govindan Raghavan (2019) 5 SCC 725 (One-sided Builder-Buyer Terms)
"""

import json
import re
from typing import Dict, Any, List
from rag_service import get_rag_service

class ContractAuditorService:
    def __init__(self):
        self._rag = None

    def _get_rag(self):
        if self._rag is None:
            try:
                self._rag = get_rag_service()
            except Exception as e:
                print(f"[ContractAuditorService] Note: RAG service init deferred: {e}")
                return None
        return self._rag

    def audit_document_clauses(self, document_text: str, filename: str = "Uploaded Document") -> Dict[str, Any]:
        """
        Deep statutory audit of document clauses against Indian law.
        Identifies void, unconscionable, or high-liability clauses with exact citations,
        Supreme Court ratios, and attorney's recommended redlines.
        """
        if not document_text or len(document_text.strip()) < 50:
            return {
                "document_name": filename,
                "overall_health_score": 100,
                "risk_summary": "Document contains insufficient text for deep statutory clause analysis.",
                "total_clauses_audited": 0,
                "critical_risks_count": 0,
                "high_risks_count": 0,
                "moderate_risks_count": 0,
                "audited_clauses": [],
                "statutory_compliance_badge": "INSUFFICIENT_DATA",
            }

        # Truncate to reasonable context window (~25,000 chars)
        doc_slice = document_text[:28000]

        prompt = f"""You are the Chief Contract Risk Auditor for the Indian Supreme Court and Bar Council.
You must conduct a strict, rigorous, and legally accountable audit of the following contract/document under ENACTED INDIAN LAWS and BINDING SUPREME COURT PRECEDENTS.

=== MANDATORY STATUTORY & PRECEDENT BENCHMARKS ===
1. RESTRAINT OF TRADE (POST-TERMINATION NON-COMPETE):
   - Statute: Section 27, Indian Contract Act, 1872.
   - Supreme Court Ratios: 'Percept D'Mark (India) (P) Ltd. v. Zaheer Khan (2006) 4 SCC 227' & 'Niranjan Shankar Golikari (1967) 2 SCR 378'.
   - Rule: ANY post-employment or post-contract non-compete restricting lawful trade or profession is STRICTLY VOID AB INITIO.

2. UNILATERAL ARBITRATOR APPOINTMENT:
   - Statute: Section 12(5) read with Seventh Schedule, Arbitration and Conciliation Act, 1996.
   - Supreme Court Ratios: 'Perkins Eastman Architects DPC v. HSCC (India) Ltd. (2020) 20 SCC 760' & 'TRF Ltd. v. Energo Engineering (2017) 8 SCC 377'.
   - Rule: A clause entitling only one party (e.g. Managing Director/Company) to unilaterally nominate a sole arbitrator is INVALID AND UNENFORCEABLE BY LAW.

3. RESTRAINT OF LEGAL PROCEEDINGS & SHORTENED LIMITATION:
   - Statute: Section 28, Indian Contract Act, 1872 & Limitation Act, 1963.
   - Supreme Court Ratio: 'National Insurance Co. Ltd. v. Sujir Ganesh Nayak & Co. (1997) 4 SCC 366'.
   - Rule: Any clause shortening the statutory period to file a suit or claim (e.g., "claims must be brought within 30 days") is VOID under Section 28(b).

4. UNREASONABLE PENALTY & FORFEITURE OF ENTIRE SUM:
   - Statute: Section 74, Indian Contract Act, 1872.
   - Supreme Court Ratio: 'Kailash Nath Associates v. Delhi Development Authority (2015) 4 SCC 136'.
   - Rule: Forfeiture of substantial security/earnest money without proof of actual legal injury is an illegal penalty under Section 74.

5. UNCONSCIONABLE & ONE-SIDED TERMINATION CLAUSES:
   - Statute: Section 23, Indian Contract Act, 1872 & Section 2(46), Consumer Protection Act, 2019.
   - Supreme Court Ratios: 'Central Inland Water Transport Corp. v. Brojo Nath Ganguly (1986) 3 SCC 156' & 'Pioneer Urban Land v. Govindan Raghavan (2019) 5 SCC 725'.
   - Rule: Grossly unequal bargaining power where one party can terminate immediately without cause but binds the other to 90 days notice is opposed to public policy.

6. DIGITAL DATA HARVESTING & NON-CONSENSUAL TRANSFERS:
   - Statute: Sections 6 & 7, Digital Personal Data Protection Act, 2023 (DPDP Act).
   - Rule: Blanket, irrevocable consent to sell, share, or transfer biometric or private client data to unspecified third parties violates DPDP 2023.

=== DOCUMENT TO AUDIT ===
{doc_slice}
=== END DOCUMENT ===

INSTRUCTIONS FOR AUDIT:
Carefully read the document. Identify every problematic, one-sided, void, or high-liability clause.
Output your analysis STRICTLY as a valid JSON object matching this exact schema:
{{
  "overall_health_score": <number between 0 and 100 representing safety/fairness of the agreement>,
  "risk_summary": "<A 2-3 sentence executive summary of the document's legal risk profile for the user>",
  "total_clauses_audited": <integer count of identified clauses>,
  "critical_risks_count": <integer count of VOID AB INITIO clauses>,
  "high_risks_count": <integer count of HIGH risk clauses>,
  "moderate_risks_count": <integer count of MODERATE risk clauses>,
  "statutory_compliance_badge": "<COMPLIANT | FAIR_RISK | HIGH_LIABILITY_ALERT | VOID_CLAUSES_DETECTED>",
  "audited_clauses": [
    {{
      "clause_title": "<Concise name of clause e.g. Post-Employment Non-Compete Restriction>",
      "quoted_excerpt": "<Exact excerpt quoted from the document>",
      "risk_level": "<CRITICAL_VOID | HIGH_RISK | MODERATE_RISK>",
      "governing_statute": "<e.g. Section 27, Indian Contract Act, 1872>",
      "precedent_authority": "<e.g. Percept D'Mark v. Zaheer Khan (2006) 4 SCC 227>",
      "why_it_is_dangerous": "<Clear plain-language explanation of how this harms the signing party>",
      "recommended_amendment": "<The lawyer's suggested redline clause replacement that protects the party>"
    }}
  ]
}}

DO NOT wrap with markdown code blocks. Return ONLY the raw valid JSON string."""

        rag = self._get_rag()
        if rag is not None:
            try:
                response_text = rag._generate_with_fallback(prompt)
            except Exception as e:
                print(f"[ContractAuditorService] Fallback to statutory heuristic audit: {e}")
                parsed = self._build_emergency_audit(doc_slice, filename)
                parsed["document_name"] = filename
                return parsed
        else:
            parsed = self._build_emergency_audit(doc_slice, filename)
            parsed["document_name"] = filename
            return parsed
        
        # Clean response
        clean_text = response_text.strip()
        if clean_text.startswith("```json"):
            clean_text = clean_text[7:]
        if clean_text.startswith("```"):
            clean_text = clean_text[3:]
        if clean_text.endswith("```"):
            clean_text = clean_text[:-3]
        clean_text = clean_text.strip()

        try:
            parsed = json.loads(clean_text)
        except Exception as e:
            # Fallback parser if JSON was slightly malformed
            match = re.search(r'(\{[\s\S]*\})', clean_text)
            if match:
                try:
                    parsed = json.loads(match.group(1))
                except Exception:
                    parsed = self._build_emergency_audit(doc_slice, filename)
            else:
                parsed = self._build_emergency_audit(doc_slice, filename)

        parsed["document_name"] = filename
        return parsed

    def _build_emergency_audit(self, doc_slice: str, filename: str) -> Dict[str, Any]:
        """Heuristic audit fallback if LLM response format fails."""
        clauses = []
        low_doc = doc_slice.lower()

        # Heuristic 1: Non-compete
        if "non-compete" in low_doc or "not engage in" in low_doc or "restraint" in low_doc:
            clauses.append({
                "clause_title": "Post-Termination Non-Compete Restriction",
                "quoted_excerpt": "Restrictive covenant prohibiting engagement in competitive trade/employment.",
                "risk_level": "CRITICAL_VOID",
                "governing_statute": "Section 27, Indian Contract Act, 1872",
                "precedent_authority": "Percept D'Mark (India) (P) Ltd. v. Zaheer Khan (2006) 4 SCC 227",
                "why_it_is_dangerous": "Supreme Court has repeatedly affirmed that any restraint on lawful profession after termination is strictly void ab initio.",
                "recommended_amendment": "Restrict non-disclosure of proprietary trade secrets only, completely striking down post-employment non-compete.",
            })

        # Heuristic 2: Unilateral Arbitration
        if "sole arbitrator" in low_doc and ("shall appoint" in low_doc or "managing director" in low_doc or "company will" in low_doc):
            clauses.append({
                "clause_title": "Unilateral Sole Arbitrator Nomination",
                "quoted_excerpt": "Clause granting one party sole discretion to appoint the arbitrator.",
                "risk_level": "CRITICAL_VOID",
                "governing_statute": "Section 12(5) read with Seventh Schedule, Arbitration & Conciliation Act, 1996",
                "precedent_authority": "Perkins Eastman Architects DPC v. HSCC (India) Ltd. (2020) 20 SCC 760",
                "why_it_is_dangerous": "An arbitrator unilaterally appointed by an interested party is legally ineligible and any award passed is liable to be set aside.",
                "recommended_amendment": "Arbitrator must be mutually agreed upon by both parties, or appointed via High Court under Section 11(6).",
            })

        # Heuristic 3: Forfeiture / Liquidated damages
        if "forfeit" in low_doc or "liquidated damages" in low_doc:
            clauses.append({
                "clause_title": "Disproportionate Penalty / Deposit Forfeiture",
                "quoted_excerpt": "Clause permitting unilateral forfeiture of full deposit or punitive damages.",
                "risk_level": "HIGH_RISK",
                "governing_statute": "Section 74, Indian Contract Act, 1872",
                "precedent_authority": "Kailash Nath Associates v. Delhi Development Authority (2015) 4 SCC 136",
                "why_it_is_dangerous": "Law permits only reasonable compensation for proven loss, not arbitrary punitive forfeiture.",
                "recommended_amendment": "Damages must be limited to genuine pre-estimated actual loss incurred, with right of cure notice.",
            })

        critical_count = sum(1 for c in clauses if c["risk_level"] == "CRITICAL_VOID")
        high_count = sum(1 for c in clauses if c["risk_level"] == "HIGH_RISK")
        mod_count = sum(1 for c in clauses if c["risk_level"] == "MODERATE_RISK")

        score = max(35, 100 - (critical_count * 25 + high_count * 15 + mod_count * 8))

        return {
            "document_name": filename,
            "overall_health_score": score,
            "risk_summary": f"Audit identified {len(clauses)} potentially risky or unenforceable clauses under Indian statutory frameworks.",
            "total_clauses_audited": len(clauses),
            "critical_risks_count": critical_count,
            "high_risks_count": high_count,
            "moderate_risks_count": mod_count,
            "statutory_compliance_badge": "VOID_CLAUSES_DETECTED" if critical_count > 0 else "HIGH_LIABILITY_ALERT",
            "audited_clauses": clauses,
        }


def get_contract_auditor_service() -> ContractAuditorService:
    return ContractAuditorService()
