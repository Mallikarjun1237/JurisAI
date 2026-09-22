"""
JurisAI — ChromaDB Legal Corpus Ingestion Script
Run once: python ingest.py
Seeds 22 curated legal entries into the 'legal_corpus' collection.
"""

import chromadb
import os
from dotenv import load_dotenv

# chromadb 0.6.x moved embedding_functions; support both paths
try:
    from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction
except ImportError:
    from chromadb.utils import embedding_functions as _ef
    SentenceTransformerEmbeddingFunction = _ef.SentenceTransformerEmbeddingFunction

load_dotenv()

CHROMA_PATH = os.getenv("CHROMA_PATH", "./.chroma_db")

LEGAL_CORPUS = [
    # ── CONSTITUTIONAL PROVISIONS ──────────────────────────────────────────
    {
        "id": "const_art14",
        "text": (
            "Article 14 of the Constitution of India guarantees equality before law and equal protection of laws. "
            "The State shall not deny to any person equality before the law or the equal protection of the laws "
            "within the territory of India. This article prohibits class legislation but permits reasonable "
            "classification based on intelligible differentia having a rational nexus with the object sought to "
            "be achieved. The twin tests are: (1) the classification must be founded on an intelligible differentia "
            "which distinguishes persons or things grouped together from others left out of the group, and "
            "(2) the differentia must have a rational relation to the object sought to be achieved by the statute."
        ),
        "metadata": {
            "doc_type": "statute",
            "title": "Article 14 — Right to Equality",
            "citation": "Constitution of India, Art. 14",
            "court": "Constitutional Provision",
            "year": "1950",
        },
    },
    {
        "id": "const_art19",
        "text": (
            "Article 19 of the Constitution of India guarantees six freedoms: (a) freedom of speech and expression, "
            "(b) right to assemble peaceably and without arms, (c) right to form associations or unions or "
            "co-operative societies, (d) right to move freely throughout the territory of India, "
            "(e) right to reside and settle in any part of the territory of India, "
            "(g) right to practise any profession, or to carry on any occupation, trade or business. "
            "These freedoms are subject to reasonable restrictions which may be imposed by the State. "
            "The freedom of speech and expression under 19(1)(a) includes the right to receive information, "
            "freedom of the press, right to broadcast, and right to know. "
            "Reasonable restrictions under 19(2) include public order, decency, morality, sovereignty and integrity of India."
        ),
        "metadata": {
            "doc_type": "statute",
            "title": "Article 19 — Freedom of Speech & Expression",
            "citation": "Constitution of India, Art. 19",
            "court": "Constitutional Provision",
            "year": "1950",
        },
    },
    {
        "id": "const_art21",
        "text": (
            "Article 21 of the Constitution of India states: No person shall be deprived of his life or personal "
            "liberty except according to procedure established by law. The Supreme Court has interpreted this "
            "broadly to include: right to livelihood, right to health, right to education, right to a clean "
            "environment, right to privacy, right to speedy trial, right to legal aid, right to dignified life, "
            "right against solitary confinement, right against handcuffing, and right to travel abroad. "
            "The procedure established by law must be fair, just, and reasonable (Maneka Gandhi). "
            "This is considered the most expansive and dynamic fundamental right in the Constitution. "
            "It applies to both citizens and non-citizens (foreigners) within India."
        ),
        "metadata": {
            "doc_type": "statute",
            "title": "Article 21 — Right to Life and Personal Liberty",
            "citation": "Constitution of India, Art. 21",
            "court": "Constitutional Provision",
            "year": "1950",
        },
    },
    {
        "id": "const_art32",
        "text": (
            "Article 32 guarantees the right to move the Supreme Court for enforcement of Fundamental Rights. "
            "It empowers the Supreme Court to issue writs including Habeas Corpus (produce the body), "
            "Mandamus (command to perform duty), Prohibition (stop inferior court), "
            "Quo Warranto (by what authority), and Certiorari (quash illegal orders). "
            "Dr. B.R. Ambedkar called Article 32 the heart and soul of the Constitution. "
            "This right itself is a fundamental right and cannot be taken away or abridged even by Parliament. "
            "It can be suspended only during a declared Emergency under Article 352. "
            "Article 32 guarantees the right to approach the Supreme Court directly without going to any lower court."
        ),
        "metadata": {
            "doc_type": "statute",
            "title": "Article 32 — Right to Constitutional Remedies",
            "citation": "Constitution of India, Art. 32",
            "court": "Constitutional Provision",
            "year": "1950",
        },
    },
    {
        "id": "const_art226",
        "text": (
            "Article 226 empowers every High Court to issue writs including Habeas Corpus, Mandamus, "
            "Prohibition, Quo Warranto, and Certiorari for enforcement of Fundamental Rights and for any "
            "other purpose. Unlike Article 32 which is limited to Fundamental Rights enforcement, "
            "Article 226 writ jurisdiction is wider and covers enforcement of legal rights as well. "
            "A citizen can approach the High Court of their state directly for redressal of grievances "
            "against State or public authorities. The High Court can refuse to exercise this discretionary "
            "jurisdiction if alternate adequate remedy exists, though it may still act in cases of violation "
            "of fundamental rights, natural justice, or jurisdictional error."
        ),
        "metadata": {
            "doc_type": "statute",
            "title": "Article 226 — High Court Writ Jurisdiction",
            "citation": "Constitution of India, Art. 226",
            "court": "Constitutional Provision",
            "year": "1950",
        },
    },
    {
        "id": "const_art39a",
        "text": (
            "Article 39A (Directive Principle of State Policy) mandates the State to ensure equal justice "
            "and free legal aid. The State shall secure that the operation of the legal system promotes "
            "justice on a basis of equal opportunity and shall provide free legal aid by suitable legislation "
            "or schemes to ensure that opportunities for securing justice are not denied to any citizen by "
            "reason of economic or other disabilities. The Legal Services Authorities Act 1987 and the "
            "National Legal Services Authority (NALSA) implement this directive. "
            "Free legal aid is available to women, SC/ST persons, persons with disabilities, victims of "
            "trafficking, industrial workmen, and persons in custody. You can contact the District Legal "
            "Services Authority (DLSA) in your district for free legal assistance."
        ),
        "metadata": {
            "doc_type": "statute",
            "title": "Article 39A — Free Legal Aid",
            "citation": "Constitution of India, Art. 39A",
            "court": "Constitutional Provision",
            "year": "1976",
        },
    },
    # ── SUPREME COURT LANDMARK JUDGMENTS ──────────────────────────────────
    {
        "id": "sc_maneka_gandhi",
        "text": (
            "In Maneka Gandhi v. Union of India (1978), a seven-judge Constitution Bench of the Supreme Court "
            "dramatically expanded the scope of Article 21. The Court overruled A.K. Gopalan (1950) and held "
            "that Articles 14, 19, and 21 are not mutually exclusive but form a 'golden triangle' — each must "
            "be read in the light of the others. The 'procedure established by law' under Article 21 must be "
            "fair, just, and reasonable — not arbitrary, fanciful, or oppressive. "
            "The case arose when Maneka Gandhi's passport was impounded without reasons under the Passport Act. "
            "The Court held: (1) right to travel abroad is part of personal liberty under Art. 21, "
            "(2) audi alteram partem (right to be heard) is part of due process, "
            "(3) law depriving life/liberty must satisfy Arts. 14, 19 AND 21 simultaneously. "
            "This judgment introduced substantive due process into Indian constitutional law."
        ),
        "metadata": {
            "doc_type": "judgment",
            "title": "Maneka Gandhi v. Union of India",
            "citation": "AIR 1978 SC 597",
            "court": "Supreme Court of India",
            "year": "1978",
        },
    },
    {
        "id": "sc_puttaswamy",
        "text": (
            "In Justice K.S. Puttaswamy (Retd.) v. Union of India (2017), a nine-judge Constitution Bench "
            "unanimously held that the right to privacy is a fundamental right protected under Article 21. "
            "The judgment overruled M.P. Sharma (1954) and Kharak Singh (1962) which had denied privacy as "
            "a fundamental right. All nine judges agreed on the core holding though wrote separate opinions. "
            "Privacy was held to be an intrinsic part of life and liberty encompassing: bodily integrity, "
            "personal autonomy, informational privacy, privacy of communication, decisional autonomy, and "
            "dignity. The three-fold test for State interference: (1) existence of a law, "
            "(2) legitimate state aim, (3) proportionality (least restrictive means). "
            "This judgment is foundational for data protection, surveillance, Aadhaar, and digital rights in India. "
            "The case was filed challenging the Aadhaar biometric data collection programme."
        ),
        "metadata": {
            "doc_type": "judgment",
            "title": "K.S. Puttaswamy v. Union of India (Privacy Judgment)",
            "citation": "(2017) 10 SCC 1",
            "court": "Supreme Court of India",
            "year": "2017",
        },
    },
    {
        "id": "sc_kesavananda",
        "text": (
            "In Kesavananda Bharati v. State of Kerala (1973), a 13-judge Constitution Bench — the largest ever "
            "assembled — by a 7-6 majority propounded the Basic Structure Doctrine of the Indian Constitution. "
            "The Court held that while Parliament has wide constituent powers to amend the Constitution under "
            "Article 368, it cannot abrogate, destroy, or damage the basic structure or essential features. "
            "Elements of basic structure include: supremacy of the Constitution, republican and democratic form "
            "of government, secular character, separation of powers, federal character, fundamental rights, "
            "judicial review, free and fair elections, unity and integrity of India, and rule of law. "
            "This doctrine prevents Parliament from using its amending power to convert India into a dictatorship. "
            "This remains the most important constitutional judgment in Indian legal history."
        ),
        "metadata": {
            "doc_type": "judgment",
            "title": "Kesavananda Bharati v. State of Kerala",
            "citation": "AIR 1973 SC 1461",
            "court": "Supreme Court of India",
            "year": "1973",
        },
    },
    {
        "id": "sc_vishaka",
        "text": (
            "In Vishaka v. State of Rajasthan (1997), the Supreme Court laid down binding guidelines for "
            "prevention of sexual harassment of women at the workplace, filling a legislative vacuum. "
            "The Court held that sexual harassment at workplace violates Articles 14, 15, 19(1)(g), and 21 "
            "of the Constitution. The Vishaka Guidelines made it mandatory for every employer to: "
            "(1) prohibit sexual harassment, (2) constitute a Complaints Committee, (3) spread awareness. "
            "The case arose from the gang rape of Bhanwari Devi, a social worker in Rajasthan, who was attacked "
            "for preventing a child marriage. The Vishaka Guidelines remained binding law until the POSH Act 2013 "
            "was enacted. The judgment applied CEDAW (international convention) to fill domestic legal gaps."
        ),
        "metadata": {
            "doc_type": "judgment",
            "title": "Vishaka v. State of Rajasthan",
            "citation": "AIR 1997 SC 3011",
            "court": "Supreme Court of India",
            "year": "1997",
        },
    },
    {
        "id": "sc_shreya_singhal",
        "text": (
            "In Shreya Singhal v. Union of India (2015), the Supreme Court struck down Section 66A of the "
            "Information Technology Act 2000 as unconstitutional, being violative of Article 19(1)(a). "
            "Section 66A had criminalized online speech that was 'grossly offensive', 'menacing', or caused "
            "'annoyance' — terms held to be vague, overbroad, and not falling within the eight permissible "
            "restrictions under Article 19(2). The Court distinguished between 'discussion', 'advocacy', and "
            "'incitement' — only the last can be restricted. The Court also read down Section 79 of the IT Act "
            "(intermediary liability) and upheld Section 69A (website blocking) with procedural safeguards. "
            "Online speech now enjoys the same constitutional protection as offline speech in India."
        ),
        "metadata": {
            "doc_type": "judgment",
            "title": "Shreya Singhal v. Union of India",
            "citation": "(2015) 5 SCC 1",
            "court": "Supreme Court of India",
            "year": "2015",
        },
    },
    {
        "id": "sc_navtej_johar",
        "text": (
            "In Navtej Singh Johar v. Union of India (2018), a five-judge Constitution Bench unanimously "
            "read down Section 377 IPC to decriminalize consensual sexual acts between adults in private. "
            "The Court held that Section 377 violated Articles 14 (equality), 15 (non-discrimination), "
            "19 (freedom of expression and identity), and 21 (dignity and privacy) of the Constitution. "
            "Key holdings: (1) Sexual orientation is an essential component of identity; "
            "(2) Criminalizing consensual adult same-sex relations is manifestly arbitrary; "
            "(3) Constitutional morality must prevail over social morality; "
            "(4) The LGBT+ community has the same fundamental rights as any other citizen. "
            "This overruled Suresh Kumar Koushal (2013) and restored the Delhi HC Naz Foundation judgment."
        ),
        "metadata": {
            "doc_type": "judgment",
            "title": "Navtej Singh Johar v. Union of India",
            "citation": "(2018) 10 SCC 1",
            "court": "Supreme Court of India",
            "year": "2018",
        },
    },
    {
        "id": "sc_mc_mehta_oleum",
        "text": (
            "In M.C. Mehta v. Union of India (Oleum Gas Leak Case, 1987), a five-judge Constitution Bench "
            "established the doctrine of Absolute Liability — distinct from and stricter than the English rule "
            "of Strict Liability (Rylands v. Fletcher, 1868). Under Absolute Liability: "
            "(1) Any enterprise engaged in hazardous or inherently dangerous activity is absolutely liable "
            "to compensate all those affected by any accident arising from that activity; "
            "(2) No exceptions or escape clauses apply (unlike Strict Liability); "
            "(3) Compensation must be correlated to the magnitude and capacity of the enterprise — "
            "larger enterprises must pay higher compensation. "
            "This applies to large industrial units, chemical plants, gas companies, and corporations "
            "handling hazardous substances. The case arose from a gas leak at a Delhi chemical plant."
        ),
        "metadata": {
            "doc_type": "judgment",
            "title": "M.C. Mehta v. Union of India (Oleum Gas Leak)",
            "citation": "AIR 1987 SC 1086",
            "court": "Supreme Court of India",
            "year": "1987",
        },
    },
    {
        "id": "sc_indra_sawhney",
        "text": (
            "In Indra Sawhney v. Union of India (Mandal Commission Case, 1992), a nine-judge Constitution Bench "
            "by a 6:3 majority upheld the 27% reservation for Other Backward Classes (OBCs) in central "
            "government services under Article 16(4). Key holdings: "
            "(1) Total reservations cannot exceed 50% — the '50% rule' is a constitutional requirement; "
            "(2) Creamy layer (economically advanced) among OBCs must be excluded from reservation benefits; "
            "(3) No reservation in promotions (later reversed by constitutional amendment); "
            "(4) Backward class determination must be based primarily on social backwardness, not just economic. "
            "This judgment struck down the 10% reservation for economically backward upper castes as "
            "unconstitutional — later overturned by the 103rd Constitutional Amendment (EWS quota, 2019). "
            "This remains the foundational judgment on reservation law in India."
        ),
        "metadata": {
            "doc_type": "judgment",
            "title": "Indra Sawhney v. Union of India (Mandal Case)",
            "citation": "AIR 1993 SC 477",
            "court": "Supreme Court of India",
            "year": "1992",
        },
    },
    # ── CRIMINAL LAW (BNS / IPC) ──────────────────────────────────────────
    {
        "id": "bns_cheating_318",
        "text": (
            "Section 318 of the Bharatiya Nyaya Sanhita (BNS) 2023, replacing Section 420 IPC, deals with "
            "cheating and dishonestly inducing delivery of property. Whoever cheats and thereby dishonestly "
            "induces the person deceived to deliver any property, or to make, alter, or destroy any valuable "
            "security, or anything signed or sealed which may be converted into a valuable security, shall be "
            "punished with imprisonment of either description for a term which may extend to seven years, "
            "and shall also be liable to fine. Essential ingredients: (1) deception of the complainant, "
            "(2) fraudulent or dishonest inducement, (3) delivery of property or creation of a security. "
            "Online fraud, investment scams, and identity theft cheating cases are covered. "
            "Cheating is cognizable, non-bailable, and triable by a Magistrate of First Class. "
            "Cyber cheating under IT Act Section 66D can be added as an additional charge."
        ),
        "metadata": {
            "doc_type": "statute",
            "title": "BNS Section 318 — Cheating",
            "citation": "Bharatiya Nyaya Sanhita, 2023, §318 (formerly IPC §420)",
            "court": "Statutory Provision",
            "year": "2023",
        },
    },
    {
        "id": "bns_defamation_356",
        "text": (
            "Section 356 of the Bharatiya Nyaya Sanhita (BNS) 2023 codifies the law of defamation, "
            "replacing Sections 499-500 IPC. Defamation occurs when a person makes or publishes any "
            "imputation concerning another person intending to harm, or knowing or having reason to believe "
            "that such imputation will harm the reputation of that person. "
            "Defamation includes libel (written/permanent form) and slander (spoken/transient form). "
            "Punishment: simple imprisonment up to two years, or fine, or both. "
            "Cyber defamation via social media posts, WhatsApp messages, YouTube videos, or websites "
            "is also covered. IT Act Section 66A (struck down) — cyber defamation now proceeds under BNS §356. "
            "Valid defences: truth (if for public good), fair comment on public matters, privileged communication. "
            "Defamation is non-cognizable, bailable, and compoundable — requires private complaint to Magistrate."
        ),
        "metadata": {
            "doc_type": "statute",
            "title": "BNS Section 356 — Defamation & Cyber Defamation",
            "citation": "Bharatiya Nyaya Sanhita, 2023, §356 (formerly IPC §499-500)",
            "court": "Statutory Provision",
            "year": "2023",
        },
    },
    # ── CIVIL / CONTRACT / LABOUR LAW ─────────────────────────────────────
    {
        "id": "ica_breach_s73",
        "text": (
            "Section 73 of the Indian Contract Act 1872 provides the remedy for breach of contract. "
            "When a contract has been broken, the party who suffers by such breach is entitled to receive "
            "compensation for any loss or damage caused to him which naturally arose in the usual course of "
            "things from the breach, or which the parties knew when they made the contract to be likely to "
            "result from the breach (Hadley v. Baxendale principle). "
            "Compensation is NOT given for any remote or indirect loss or damage. "
            "The aggrieved party has a duty to mitigate losses — cannot claim compensation for avoidable loss. "
            "For employment contracts: wrongful termination without notice entitles the employee to wages in "
            "lieu of notice period plus any contractual severance. Liquidated damages clauses are enforceable "
            "if they represent a genuine pre-estimate of loss, not a penalty."
        ),
        "metadata": {
            "doc_type": "statute",
            "title": "Indian Contract Act §73 — Breach of Contract & Compensation",
            "citation": "Indian Contract Act, 1872, §73",
            "court": "Statutory Provision",
            "year": "1872",
        },
    },
    {
        "id": "ida_wrongful_termination",
        "text": (
            "The Industrial Disputes Act 1947 protects workmen from wrongful termination (retrenchment). "
            "Section 25F: No workman employed for more than one year can be retrenched without: "
            "(a) one month's written notice or wages in lieu thereof, "
            "(b) retrenchment compensation at 15 days' average pay for each completed year of continuous service, "
            "(c) notice in prescribed form to the appropriate government authority. "
            "Section 25G: Principle of 'last come, first go' — the last person employed in a category must be "
            "the first retrenched, with right of preference given to longer-serving employees. "
            "Section 25H: Right of retrenched workmen to be re-employed if vacancies arise. "
            "Illegal retrenchment entitles the workman to reinstatement with full back wages. "
            "This applies to establishments with 10 or more workmen. Non-workmen (managerial staff) are "
            "governed by their contracts and the Contract Act."
        ),
        "metadata": {
            "doc_type": "statute",
            "title": "Industrial Disputes Act — Wrongful Termination & Retrenchment",
            "citation": "Industrial Disputes Act, 1947, §§25F, 25G, 25H",
            "court": "Statutory Provision",
            "year": "1947",
        },
    },
    {
        "id": "cpa_consumer_rights",
        "text": (
            "The Consumer Protection Act 2019 provides for consumer rights and speedy redressal of disputes. "
            "A consumer is any person who buys goods or hires services for personal use (not commercial resale). "
            "Filing a complaint: District Commission (claims up to Rs. 1 crore), "
            "State Commission (Rs. 1 crore to Rs. 10 crore), National Commission (above Rs. 10 crore). "
            "Complaints can be filed online on the e-Daakhil portal (edaakhil.nic.in). "
            "Grounds: deficiency in service, unfair trade practices, defective goods, charging above MRP, "
            "misleading advertisements, e-commerce frauds. "
            "The 2019 Act introduced: product liability (manufacturer/seller/service provider liable for "
            "harm caused by product), Central Consumer Protection Authority (CCPA) with suo motu powers, "
            "mediation as alternate dispute resolution, and provisions specifically for e-commerce. "
            "Limitation: complaint must be filed within 2 years of cause of action."
        ),
        "metadata": {
            "doc_type": "statute",
            "title": "Consumer Protection Act 2019",
            "citation": "Consumer Protection Act, 2019",
            "court": "Statutory Provision",
            "year": "2019",
        },
    },
    {
        "id": "it_act_43a",
        "text": (
            "Section 43A of the Information Technology Act 2000 deals with compensation for failure to "
            "protect personal data. Where a body corporate possessing, dealing, or handling any sensitive "
            "personal data in a computer resource is negligent in implementing and maintaining reasonable "
            "security practices, and thereby causes wrongful loss or gain to any person, such body corporate "
            "is liable to pay damages by way of compensation to the affected person. "
            "The IT (Reasonable Security Practices) Rules 2011 specify sensitive personal data: passwords, "
            "financial information, health data, sexual orientation, biometrics, and physical/mental health. "
            "This is India's primary data breach compensation provision (pre-DPDP Act 2023). "
            "The Digital Personal Data Protection Act 2023 now provides a more comprehensive framework. "
            "Complaints can be filed with the Adjudicating Officer appointed by the Central Government."
        ),
        "metadata": {
            "doc_type": "statute",
            "title": "IT Act Section 43A — Data Protection & Compensation",
            "citation": "Information Technology Act, 2000, §43A",
            "court": "Statutory Provision",
            "year": "2000",
        },
    },
    {
        "id": "topa_tenancy",
        "text": (
            "The Transfer of Property Act 1882 and state-specific Rent Control Acts govern tenancy law in India. "
            "Key tenant rights: (1) Right to written rent agreement registered with local authority, "
            "(2) Protection against arbitrary eviction — grounds limited to: non-payment of rent, "
            "unauthorized subletting, damage to property, landlord's bonafide personal requirement, "
            "(3) Right to receipt for every rent payment, (4) Right to essential services (water, electricity) "
            "not being cut off, (5) Right to recover security deposit within 30 days after vacating. "
            "Landlord obligations: (1) Must give adequate notice before eviction (typically 30-90 days "
            "depending on state Rent Control Act), (2) Cannot forcibly evict without court order, "
            "(3) Cannot enter premises without prior notice. "
            "The Model Tenancy Act 2021 establishes a Rent Authority and Rent Court for disputes. "
            "Illegal eviction by landlord amounts to criminal trespass under BNS."
        ),
        "metadata": {
            "doc_type": "statute",
            "title": "Tenancy Rights — Transfer of Property Act & Rent Control Laws",
            "citation": "Transfer of Property Act, 1882; Model Tenancy Act, 2021",
            "court": "Statutory Provision",
            "year": "1882",
        },
    },
    {
        "id": "posh_act_2013",
        "text": (
            "The Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act 2013 "
            "(POSH Act) mandates every organization with 10 or more employees to constitute an Internal "
            "Complaints Committee (ICC) headed by a senior woman employee and including an external member. "
            "Sexual harassment includes: unwelcome physical contact and advances, demand or request for "
            "sexual favours, making sexually coloured remarks, showing pornography, any other unwelcome "
            "physical, verbal or non-verbal conduct of a sexual nature. "
            "Any aggrieved woman (including contractual, temporary, domestic workers, interns) can file a "
            "complaint within 3 months of the incident (extendable by further 3 months for good cause). "
            "ICC must complete inquiry within 60 days and submit report within 10 days. "
            "Penalties on employer: fine up to Rs. 50,000 for first offence, cancellation of license for "
            "repeated violations. ICC inquiry is confidential. Both conciliation and inquiry are available."
        ),
        "metadata": {
            "doc_type": "statute",
            "title": "POSH Act 2013 — Sexual Harassment at Workplace",
            "citation": "Sexual Harassment of Women at Workplace Act, 2013",
            "court": "Statutory Provision",
            "year": "2013",
        },
    },
]



def main():
    import sys
    # Ensure UTF-8 output on Windows terminals
    if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    print("[*] JurisAI -- ChromaDB Ingestion Script")
    print(f"[+] ChromaDB path: {CHROMA_PATH}")
    print(f"[+] Total entries to ingest: {len(LEGAL_CORPUS)}")
    print("-" * 50)

    client = chromadb.PersistentClient(path=CHROMA_PATH)

    embedding_fn = SentenceTransformerEmbeddingFunction(
        model_name="all-MiniLM-L6-v2"
    )

    # Delete existing collection if re-running
    try:
        client.delete_collection("legal_corpus")
        print("[!] Deleted existing 'legal_corpus' collection for fresh ingestion.")
    except Exception:
        pass

    collection = client.create_collection(
        name="legal_corpus",
        embedding_function=embedding_fn,
        metadata={"hnsw:space": "cosine"},
    )

    ids = [entry["id"] for entry in LEGAL_CORPUS]
    texts = [entry["text"] for entry in LEGAL_CORPUS]
    metadatas = [entry["metadata"] for entry in LEGAL_CORPUS]

    collection.add(documents=texts, metadatas=metadatas, ids=ids)

    print(f"\n[OK] Successfully ingested {len(LEGAL_CORPUS)} legal entries into 'legal_corpus'.")
    print("\nIngested entries:")
    for entry in LEGAL_CORPUS:
        tag = "[JUDGMENT]" if entry["metadata"]["doc_type"] == "judgment" else "[STATUTE] "
        print(f"  {tag} {entry['metadata']['title']}")
    print("\n[>>] ChromaDB is ready. Start the FastAPI server with: uvicorn app:app --reload")


if __name__ == "__main__":
    main()
