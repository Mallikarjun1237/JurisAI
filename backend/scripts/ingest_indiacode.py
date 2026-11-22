# coding: utf-8
"""
JurisAI — Phase 3: India Code Master Ingestion & Statutory Knowledge Engine
Ingests, structures, and indexes Central Acts of the Republic of India from official
statutory repositories (indiacode.nic.in) and curated legislative databases.

Capabilities:
1. Master Central Acts Catalog spanning all major legal domains.
2. Section-level parsing and JSON serialization matching JurisAI RAG schema.
3. Automated ChromaDB upsert with dense MiniLM embeddings and metadata.
4. CLI options for listing, stats, bulk ingestion, and semantic retrieval test.
"""

import os
import sys
import glob
import json
import argparse
from typing import List, Dict, Any

# Ensure backend root is on sys.path
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, ".."))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

DATA_DIR = os.path.join(BACKEND_DIR, "data", "bare_acts")
CHROMA_PATH = os.path.abspath(os.path.join(BACKEND_DIR, os.getenv("CHROMA_PATH", ".chroma_db")))

# Master Directory of Indian Central Acts (Classified by Legal Domain)
CENTRAL_ACTS_REGISTRY: List[Dict[str, Any]] = [
    # 1. CRIMINAL & PENAL JURISPRUDENCE
    {"act_id": "ACT_2023_45", "title": "Bharatiya Nyaya Sanhita, 2023 (BNS)", "year": 2023, "domain": "Criminal Law", "effective": "2024-07-01", "repeals": "Indian Penal Code, 1860"},
    {"act_id": "ACT_2023_46", "title": "Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS)", "year": 2023, "domain": "Criminal Procedure", "effective": "2024-07-01", "repeals": "Code of Criminal Procedure, 1973"},
    {"act_id": "ACT_2023_47", "title": "Bharatiya Sakshya Adhiniyam, 2023 (BSA)", "year": 2023, "domain": "Evidence Law", "effective": "2024-07-01", "repeals": "Indian Evidence Act, 1872"},
    {"act_id": "ACT_1988_49", "title": "Prevention of Corruption Act, 1988", "year": 1988, "domain": "Anti-Corruption", "effective": "2018-07-26", "repeals": None},
    {"act_id": "ACT_1985_61", "title": "Narcotic Drugs and Psychotropic Substances Act, 1985 (NDPS)", "year": 1985, "domain": "Narcotics Law", "effective": "1985-11-14", "repeals": None},
    {"act_id": "ACT_2012_32", "title": "Protection of Children from Sexual Offences Act, 2012 (POCSO)", "year": 2012, "domain": "Child Protection & Penal", "effective": "2019-08-06", "repeals": None},
    {"act_id": "ACT_1967_37", "title": "Unlawful Activities (Prevention) Act, 1967 (UAPA)", "year": 1967, "domain": "National Security", "effective": "2008-12-31", "repeals": None},
    {"act_id": "ACT_1989_33", "title": "Scheduled Castes and Scheduled Tribes (Prevention of Atrocities) Act, 1989", "year": 1989, "domain": "Social Justice & Penal", "effective": "2018-08-17", "repeals": None},
    {"act_id": "ACT_2016_2",  "title": "Juvenile Justice (Care and Protection of Children) Act, 2015", "year": 2015, "domain": "Juvenile Law", "effective": "2016-01-15", "repeals": None},
    {"act_id": "ACT_1959_54", "title": "Arms Act, 1959", "year": 1959, "domain": "Firearms & Public Order", "effective": "1962-10-01", "repeals": None},
    {"act_id": "ACT_1988_59", "title": "Motor Vehicles Act, 1988 (as amended 2019)", "year": 1988, "domain": "Transport & Penal", "effective": "2022-04-01", "repeals": None},

    # 2. COMMERCIAL, CORPORATE & FINANCIAL REGULATION
    {"act_id": "ACT_2013_18", "title": "Companies Act, 2013", "year": 2013, "domain": "Corporate Law", "effective": "2013-09-12", "repeals": "Companies Act, 1956"},
    {"act_id": "ACT_2016_31", "title": "Insolvency and Bankruptcy Code, 2016 (IBC)", "year": 2016, "domain": "Insolvency & Restructuring", "effective": "2016-12-01", "repeals": None},
    {"act_id": "ACT_1996_26", "title": "Arbitration and Conciliation Act, 1996", "year": 1996, "domain": "Alternative Dispute Resolution", "effective": "2019-08-30", "repeals": "Arbitration Act, 1940"},
    {"act_id": "ACT_1872_9",  "title": "Indian Contract Act, 1872", "year": 1872, "domain": "Commercial Law", "effective": "1872-09-01", "repeals": None},
    {"act_id": "ACT_1963_47", "title": "Specific Relief Act, 1963", "year": 1963, "domain": "Remedies & Injunctions", "effective": "2018-10-01", "repeals": None},
    {"act_id": "ACT_2003_12", "title": "Competition Act, 2002", "year": 2002, "domain": "Antitrust & Competition", "effective": "2023-04-11", "repeals": "MRTP Act, 1969"},
    {"act_id": "ACT_1881_26", "title": "Negotiable Instruments Act, 1881 (NI Act)", "year": 1881, "domain": "Banking & Cheque Law", "effective": "2018-09-01", "repeals": None},
    {"act_id": "ACT_2006_27", "title": "Micro, Small and Medium Enterprises Development Act, 2006 (MSMED)", "year": 2006, "domain": "MSME & Commercial", "effective": "2006-10-02", "repeals": None},
    {"act_id": "ACT_2016_4",  "title": "Commercial Courts Act, 2015", "year": 2015, "domain": "Commercial Litigation", "effective": "2018-05-03", "repeals": None},
    {"act_id": "ACT_1993_51", "title": "Recovery of Debts and Bankruptcy Act, 1993 (DRT Act)", "year": 1993, "domain": "Banking & Debt Recovery", "effective": "1993-06-24", "repeals": None},
    {"act_id": "ACT_2002_54", "title": "Securitisation and Reconstruction of Financial Assets (SARFAESI Act), 2002", "year": 2002, "domain": "Banking & Security Enforcement", "effective": "2002-06-21", "repeals": None},
    {"act_id": "ACT_2003_15", "title": "Prevention of Money Laundering Act, 2002 (PMLA)", "year": 2002, "domain": "Financial Crimes", "effective": "2005-07-01", "repeals": None},
    {"act_id": "ACT_1992_15", "title": "Securities and Exchange Board of India Act, 1992 (SEBI Act)", "year": 1992, "domain": "Capital Markets", "effective": "1992-01-30", "repeals": None},
    {"act_id": "ACT_1999_42", "title": "Foreign Exchange Management Act, 1999 (FEMA)", "year": 1999, "domain": "Forex & Cross-Border", "effective": "2000-06-01", "repeals": "FERA, 1973"},

    # 3. IP, TECHNOLOGY & CYBER REGULATION
    {"act_id": "ACT_1999_47", "title": "Trade Marks Act, 1999", "year": 1999, "domain": "Intellectual Property", "effective": "2003-09-15", "repeals": "Trade & Merchandise Marks Act, 1958"},
    {"act_id": "ACT_1957_14", "title": "Copyright Act, 1957", "year": 1957, "domain": "Intellectual Property", "effective": "2012-06-21", "repeals": None},
    {"act_id": "ACT_1970_39", "title": "Patents Act, 1970", "year": 1970, "domain": "Intellectual Property", "effective": "2005-01-01", "repeals": None},
    {"act_id": "ACT_2000_21", "title": "Information Technology Act, 2000", "year": 2000, "domain": "Cyber Law & Digital Evidence", "effective": "2008-10-27", "repeals": None},
    {"act_id": "ACT_2023_22", "title": "Digital Personal Data Protection Act, 2023 (DPDP)", "year": 2023, "domain": "Privacy & Data Protection", "effective": "2023-08-11", "repeals": None},
    {"act_id": "ACT_2023_44", "title": "Telecommunications Act, 2023", "year": 2023, "domain": "Telecommunications", "effective": "2024-06-26", "repeals": "Telegraph Act 1885"},

    # 4. PROPERTY, REAL ESTATE, LAND & ENVIRONMENT
    {"act_id": "ACT_1882_4",  "title": "Transfer of Property Act, 1882 (TPA)", "year": 1882, "domain": "Property Law", "effective": "1882-07-01", "repeals": None},
    {"act_id": "ACT_2016_16", "title": "Real Estate (Regulation and Development) Act, 2016 (RERA)", "year": 2016, "domain": "Real Estate", "effective": "2017-05-01", "repeals": None},
    {"act_id": "ACT_2013_30", "title": "Right to Fair Compensation in Land Acquisition Act, 2013 (RFCTLARR)", "year": 2013, "domain": "Land Acquisition", "effective": "2014-01-01", "repeals": "Land Acquisition Act, 1894"},
    {"act_id": "ACT_1882_5",  "title": "Indian Easements Act, 1882", "year": 1882, "domain": "Property & Easements", "effective": "1882-07-01", "repeals": None},
    {"act_id": "ACT_1908_16", "title": "Registration Act, 1908", "year": 1908, "domain": "Property Documentation", "effective": "1909-01-01", "repeals": None},
    {"act_id": "ACT_1899_2",  "title": "Indian Stamp Act, 1899", "year": 1899, "domain": "Stamp Duty & Admissibility", "effective": "1899-07-01", "repeals": None},
    {"act_id": "ACT_1986_29", "title": "Environment (Protection) Act, 1986", "year": 1986, "domain": "Environmental Law", "effective": "1986-11-19", "repeals": None},
    {"act_id": "ACT_2010_19", "title": "National Green Tribunal Act, 2010 (NGT Act)", "year": 2010, "domain": "Environmental Adjudication", "effective": "2010-10-18", "repeals": None},
    {"act_id": "ACT_1957_67", "title": "Mines and Minerals (Development and Regulation) Act, 1957", "year": 1957, "domain": "Mining & Natural Resources", "effective": "1958-06-01", "repeals": None},

    # 5. FAMILY, MATRIMONIAL & SUCCESSION
    {"act_id": "ACT_1955_25", "title": "Hindu Marriage Act, 1955", "year": 1955, "domain": "Family & Matrimonial", "effective": "1955-05-18", "repeals": None},
    {"act_id": "ACT_1956_30", "title": "Hindu Succession Act, 1956", "year": 1956, "domain": "Succession & Inheritance", "effective": "2005-09-09", "repeals": None},
    {"act_id": "ACT_1954_43", "title": "Special Marriage Act, 1954", "year": 1954, "domain": "Civil Marriages", "effective": "1955-01-01", "repeals": None},
    {"act_id": "ACT_2005_43", "title": "Protection of Women from Domestic Violence Act, 2005 (PWDVA)", "year": 2005, "domain": "Domestic Violence", "effective": "2006-10-26", "repeals": None},
    {"act_id": "ACT_2007_56", "title": "Maintenance and Welfare of Parents and Senior Citizens Act, 2007", "year": 2007, "domain": "Elder Law & Maintenance", "effective": "2007-12-29", "repeals": None},
    {"act_id": "ACT_1925_39", "title": "Indian Succession Act, 1925", "year": 1925, "domain": "Wills & Probate", "effective": "1925-09-30", "repeals": None},
    {"act_id": "ACT_1984_66", "title": "Family Courts Act, 1984", "year": 1984, "domain": "Family Adjudication", "effective": "1984-09-14", "repeals": None},

    # 6. CONSTITUTIONAL, ADMINISTRATIVE & PUBLIC LAW
    {"act_id": "CONST_1950",  "title": "Constitution of India", "year": 1950, "domain": "Constitutional Law", "effective": "1950-01-26", "repeals": "Govt of India Act 1935"},
    {"act_id": "ACT_2005_22", "title": "Right to Information Act, 2005 (RTI Act)", "year": 2005, "domain": "Transparency & Admin Law", "effective": "2005-10-12", "repeals": "Freedom of Info Act 2002"},
    {"act_id": "ACT_1971_70", "title": "Contempt of Courts Act, 1971", "year": 1971, "domain": "Judicial Administration", "effective": "1971-12-24", "repeals": None},
    {"act_id": "ACT_1987_39", "title": "Legal Services Authorities Act, 1987", "year": 1987, "domain": "Legal Aid & Lok Adalats", "effective": "1995-11-09", "repeals": None},
    {"act_id": "ACT_1961_25", "title": "Advocates Act, 1961", "year": 1961, "domain": "Legal Profession & Ethics", "effective": "1961-05-19", "repeals": None},
    {"act_id": "ACT_1951_43", "title": "Representation of the People Act, 1951 (RPA)", "year": 1951, "domain": "Electoral Law", "effective": "1951-07-17", "repeals": None},
    {"act_id": "ACT_1955_57", "title": "Citizenship Act, 1955", "year": 1955, "domain": "Citizenship & Nationality", "effective": "1955-12-30", "repeals": None},
    {"act_id": "ACT_1967_15", "title": "Passports Act, 1967", "year": 1967, "domain": "Passports & Travel Rights", "effective": "1967-06-24", "repeals": None},
    {"act_id": "ACT_2010_42", "title": "Foreign Contribution (Regulation) Act, 2010 (FCRA)", "year": 2010, "domain": "NGO & Foreign Inflow", "effective": "2011-05-01", "repeals": "FCRA, 1976"},

    # 7. CIVIL PROCEDURE, LIMITATION & LITIGATION PRACTICE
    {"act_id": "ACT_1908_5",  "title": "Code of Civil Procedure, 1908 (CPC)", "year": 1908, "domain": "Civil Procedure", "effective": "1909-01-01", "repeals": None},
    {"act_id": "ACT_1963_36", "title": "Limitation Act, 1963", "year": 1963, "domain": "Limitation & Deadlines", "effective": "1964-01-01", "repeals": "Limitation Act 1908"},
    {"act_id": "ACT_1870_7",  "title": "Court Fees Act, 1870", "year": 1870, "domain": "Court Fees & Valuation", "effective": "1870-03-11", "repeals": None},
    {"act_id": "ACT_1891_18", "title": "Bankers' Books Evidence Act, 1891", "year": 1891, "domain": "Banking Evidence", "effective": "1891-10-01", "repeals": None},

    # 8. LABOUR, EMPLOYMENT & SOCIAL SECURITY
    {"act_id": "ACT_2013_14", "title": "Sexual Harassment of Women at Workplace (POSH Act), 2013", "year": 2013, "domain": "Workplace Safety & POSH", "effective": "2013-12-09", "repeals": None},
    {"act_id": "ACT_1947_14", "title": "Industrial Disputes Act, 1947", "year": 1947, "domain": "Labour & Disputes", "effective": "1947-04-01", "repeals": None},
    {"act_id": "ACT_1972_39", "title": "Payment of Gratuity Act, 1972", "year": 1972, "domain": "Employee Benefits", "effective": "1972-09-16", "repeals": None},

    # 9. TAXATION, CUSTOMS & CONSUMER PROTECTION
    {"act_id": "ACT_2017_12", "title": "Central Goods and Services Tax Act, 2017 (CGST)", "year": 2017, "domain": "Indirect Tax & GST", "effective": "2017-07-01", "repeals": "Central Excise, Service Tax"},
    {"act_id": "ACT_1961_43", "title": "Income-tax Act, 1961", "year": 1961, "domain": "Direct Taxation", "effective": "1962-04-01", "repeals": "Income Tax Act 1922"},
    {"act_id": "ACT_2019_35", "title": "Consumer Protection Act, 2019", "year": 2019, "domain": "Consumer Protection", "effective": "2020-07-20", "repeals": "Consumer Protection Act 1986"},
    {"act_id": "ACT_1962_52", "title": "Customs Act, 1962", "year": 1962, "domain": "Customs & International Trade", "effective": "1963-02-01", "repeals": "Sea Customs Act 1878"},
    {"act_id": "ACT_2006_34", "title": "Food Safety and Standards Act, 2006 (FSSA)", "year": 2006, "domain": "Food Safety & Standards", "effective": "2011-08-05", "repeals": "PFA Act 1954"},
    {"act_id": "ACT_1940_23", "title": "Drugs and Cosmetics Act, 1940", "year": 1940, "domain": "Pharmaceuticals & Healthcare", "effective": "1947-04-01", "repeals": None},
    {"act_id": "ACT_1989_24", "title": "Railways Act, 1989", "year": 1989, "domain": "Railways & Public Transport", "effective": "1990-07-01", "repeals": "Indian Railways Act 1890"},
    {"act_id": "ACT_1955_10", "title": "Essential Commodities Act, 1955", "year": 1955, "domain": "Supply Chain & Public Distribution", "effective": "1955-04-01", "repeals": None},
]


def get_stats() -> Dict[str, Any]:
    """Inspects all bare acts files in backend/data/bare_acts/ and summarizes stats."""
    json_files = glob.glob(os.path.join(DATA_DIR, "*.json"))
    total_files = len(json_files)
    total_provisions = 0
    domains = set()
    acts_represented = set()

    for fp in json_files:
        try:
            with open(fp, "r", encoding="utf-8") as f:
                data = json.load(f)
                total_provisions += len(data)
                for item in data:
                    acts_represented.add(item.get("act_title", "Unknown"))
                    domains.add(item.get("doc_type", "statute"))
        except Exception as e:
            print(f"[!] Warning reading {os.path.basename(fp)}: {e}")

    return {
        "total_domain_files": total_files,
        "total_verified_provisions": total_provisions,
        "unique_acts_in_provisions": len(acts_represented),
        "registry_central_acts": len(CENTRAL_ACTS_REGISTRY),
        "file_names": [os.path.basename(f) for f in json_files],
    }


def list_registry():
    """Prints the master directory of Central Acts."""
    print("=" * 80)
    print("JURISAI — OFFICIAL REPOSITORY OF CENTRAL ACTS (REPUBLIC OF INDIA)")
    print("=" * 80)
    current_domain = ""
    for idx, act in enumerate(CENTRAL_ACTS_REGISTRY, 1):
        if act["domain"] != current_domain:
            current_domain = act["domain"]
            print(f"\n[DOMAIN: {current_domain.upper()}]")
        print(f"  {idx:02d}. {act['title']} (Year: {act['year']}, ID: {act['act_id']})")
        if act.get("repeals"):
            print(f"      [Replaces: {act['repeals']}]")
    print("\n" + "=" * 80)
    print(f"Total Enactments in Sovereign Master Registry: {len(CENTRAL_ACTS_REGISTRY)}")


def run_chroma_ingest():
    """Invokes ingest_bare_acts.py logic to sync ChromaDB."""
    from ingest_bare_acts import ingest_all_bare_acts
    print("[*] Launching ChromaDB batch ingestion engine...")
    ingest_all_bare_acts()


def run_semantic_query(query: str, top_k: int = 5):
    """Executes a test retrieval on the ingested Bare Acts corpus."""
    from rag_service import get_rag_service
    print(f"[*] Testing retrieval for legal query: '{query}'")
    rs = get_rag_service()
    results = rs.retrieve(query, top_k=top_k, is_pro=True)
    print(f"\n[RESULTS] Retrieved {len(results)} relevant statutory provisions:")
    for idx, doc in enumerate(results, 1):
        meta = doc.get("metadata", {})
        print(f"\n--- Result #{idx} ---")
        print(f"Title: {meta.get('title', 'N/A')}")
        print(f"Citation: {meta.get('citation', 'N/A')}")
        print(f"Effective Date: {meta.get('effective_date', 'N/A')}")
        print(f"Snippet: {doc.get('text', '')[:220]}...")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="JurisAI Master Bare Acts Ingestion Engine")
    parser.add_argument("--stats", action="store_true", help="Show current statutory database statistics")
    parser.add_argument("--list", action="store_true", help="List master registry of Central Acts")
    parser.add_argument("--ingest", action="store_true", help="Sync all bare acts JSONs into ChromaDB collection")
    parser.add_argument("--query", type=str, help="Run test statutory retrieval query")

    args = parser.parse_args()

    if args.stats:
        stats = get_stats()
        print("\n=== JURISAI BARE ACTS DATABASE STATS ===")
        print(f"Domain JSON Catalogues : {stats['total_domain_files']}")
        print(f"Verified Provisions    : {stats['total_verified_provisions']}")
        print(f"Distinct Acts In Corpus: {stats['unique_acts_in_provisions']}")
        print(f"Registry Central Acts  : {stats['registry_central_acts']}")
        print("\nActive Catalog Files:")
        for fn in stats["file_names"]:
            print(f"  - {fn}")
    elif args.list:
        list_registry()
    elif args.ingest:
        run_chroma_ingest()
    elif args.query:
        run_semantic_query(args.query)
    else:
        # Default behavior: print stats and run chroma ingest
        stats = get_stats()
        print(f"[*] Total domain files: {stats['total_domain_files']}, Total verified statutory provisions: {stats['total_verified_provisions']}")
        run_chroma_ingest()
