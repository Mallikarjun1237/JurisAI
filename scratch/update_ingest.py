import os

def update_ingest():
    path = os.path.abspath('jurisai/backend/ingest.py')
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    new_entries = '''    {
        "id": "bnss_173_fir",
        "text": (
            "Section 173 of the Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS), replacing Section 154 of the "
            "Code of Criminal Procedure (CrPC), 1973, governs Information in cognizable cases and mandatory "
            "registration of First Information Reports (FIR). Key provisions: (1) Every information relating to "
            "the commission of a cognizable offence given orally to an officer in charge of a police station shall "
            "be reduced to writing and read over to the informant. (2) Zero FIR: Irrespective of the area where "
            "the crime was committed, a person may lodge an FIR at any police station across India. (3) Electronic "
            "communication (e-FIR): Information may be given by electronic communication and shall be taken on record "
            "on being signed within three days by the person giving it. (4) A copy of the information recorded shall "
            "be given forthwith, free of cost, to the informant or the person giving the information. "
            "Refusal by police to register an FIR upon disclosure of a cognizable offence violates statutory law."
        ),
        "metadata": {
            "doc_type": "statute",
            "title": "Section 173 BNSS — First Information Report (FIR) in Cognizable Cases",
            "citation": "Bharatiya Nagarik Suraksha Sanhita, 2023, §173 (formerly CrPC §154)",
            "court": "Central Criminal Procedure Code",
            "year": "2023",
        },
    },
    {
        "id": "bnss_175_magistrate_sp",
        "text": (
            "Section 175 of the Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS), replacing Sections 154(3) and 156(3) "
            "of the CrPC, establishes the legal remedy when an officer in charge of a police station refuses to register "
            "an FIR or investigate. (1) Section 175(4): Any person aggrieved by a refusal to record information may send "
            "the substance of such information in writing and by post to the Superintendent of Police (SP). If satisfied "
            "that a cognizable offence is disclosed, the SP shall investigate or direct a subordinate. "
            "(2) Section 175(3): Any person aggrieved may make an application to the Magistrate, accompanied by an affidavit "
            "verifying that an application has been made to the police officer and Superintendent. The Judicial Magistrate "
            "of First Class (JMFC) has statutory jurisdiction to order the police to register an FIR and conduct a full investigation."
        ),
        "metadata": {
            "doc_type": "statute",
            "title": "Section 175 BNSS — Police Inaction Remedies & Magistrate Directive",
            "citation": "Bharatiya Nagarik Suraksha Sanhita, 2023, §175(3), §175(4) (formerly CrPC §154(3), §156(3))",
            "court": "Central Criminal Procedure Code",
            "year": "2023",
        },
    },
    {
        "id": "sc_lalita_kumari",
        "text": (
            "In Lalita Kumari v. Govt. of Uttar Pradesh (2014) 2 SCC 1, a 5-Judge Constitution Bench of the Supreme Court "
            "of India laid down landmark authoritative principles governing the mandatory registration of FIRs under "
            "Section 154 of the CrPC (now Section 173 BNSS). The Court held: (1) Registration of FIR is mandatory under "
            "Section 154 if the information discloses commission of a cognizable offence, and no preliminary inquiry is "
            "permissible in such a situation. (2) If the information does not disclose a cognizable offence but indicates "
            "the necessity for an inquiry, a preliminary inquiry may be conducted only to ascertain whether cognizable "
            "offence is disclosed. (3) The preliminary inquiry must be completed expeditiously within a fixed timeframe. "
            "(4) The police officer cannot avoid his duty of registering an offence if cognizable offence is disclosed; "
            "action must be taken against erring officers who do not register the FIR as per law."
        ),
        "metadata": {
            "doc_type": "judgment",
            "title": "Lalita Kumari v. Govt. of Uttar Pradesh — Mandatory FIR Registration",
            "citation": "AIR 2014 SC 187; (2014) 2 SCC 1",
            "court": "Supreme Court of India (Constitution Bench)",
            "year": "2014",
        },
    },
    {
        "id": "sc_sakiri_vasu",
        "text": (
            "In Sakiri Vasu v. State of U.P. (2008) 2 SCC 409, the Supreme Court of India held that when an aggrieved "
            "citizen approaches a High Court under Article 226 of the Constitution or Section 482 CrPC complaining that "
            "the police have not registered an FIR or are not conducting a proper investigation, the High Court should "
            "normally not interfere if the complainant has not exhausted the alternative efficacious statutory remedy "
            "available before the Magistrate under Section 156(3) CrPC (now Section 175(3) BNSS). The Magistrate has wide "
            "powers to order registration of FIR, monitor police investigation, and ensure justice is served."
        ),
        "metadata": {
            "doc_type": "judgment",
            "title": "Sakiri Vasu v. State of U.P. — Exhaustion of Magistrate Remedies",
            "citation": "(2008) 2 SCC 409",
            "court": "Supreme Court of India",
            "year": "2008",
        },
    },
    {
        "id": "ni_act_138_cheque",
        "text": (
            "Section 138 of the Negotiable Instruments Act, 1881 criminalizes dishonour of cheques for insufficiency of "
            "funds or exceeding arrangement. Essential ingredients: (1) Cheque presented within validity period (3 months); "
            "(2) Cheque returned unpaid by bank due to insufficiency of funds; (3) Payee makes statutory demand for payment "
            "by giving written notice within 30 days of receiving return memo; (4) Drawer fails to make payment within 15 days "
            "of receipt of notice. Cause of action arises on Day 16. Under Section 142 NI Act, complaint must be filed "
            "before Judicial Magistrate of First Class (JMFC) or Metropolitan Magistrate within 30 days of cause of action. "
            "Punishment extends up to 2 years imprisonment, or fine up to twice the cheque amount, or both."
        ),
        "metadata": {
            "doc_type": "statute",
            "title": "Section 138 Negotiable Instruments Act — Cheque Bounce & Demand Notice",
            "citation": "Negotiable Instruments Act, 1881, §138, §142",
            "court": "Commercial Criminal Statute",
            "year": "1881",
        },
    },
]'''

    target = '    {\n        "id": "posh_act_2013",'
    assert target in content, "target not found"
    
    # Insert new entries before target
    content = content.replace(target, new_entries.replace(']', ',\n') + target, 1)

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("SUCCESS: ingest.py updated with criminal law, FIR, and NI Act entries!")

if __name__ == '__main__':
    update_ingest()
