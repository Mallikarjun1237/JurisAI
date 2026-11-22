import os

def refine():
    # 1. Update titles in legal_domains.py
    ld_path = os.path.abspath('jurisai/backend/legal_domains.py')
    with open(ld_path, 'r', encoding='utf-8') as f:
        ld_code = f.read()

    ld_code = ld_code.replace(
        '"title": "Section 173 — Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS)",',
        '"title": "Section 173 BNSS — First Information Report (FIR) in Cognizable Cases",',
        1
    )
    ld_code = ld_code.replace(
        '"title": "Section 175(3) & 175(4) — Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS)",',
        '"title": "Section 175 BNSS — Police Inaction, Representation to SP & Magistrate Directive",',
        1
    )
    ld_code = ld_code.replace(
        '"title": "Lalita Kumari v. Govt. of Uttar Pradesh",',
        '"title": "Lalita Kumari v. Govt. of Uttar Pradesh — Mandatory FIR Registration",',
        1
    )

    with open(ld_path, 'w', encoding='utf-8') as f:
        f.write(ld_code)
    print("legal_domains.py titles refined!")

    # 2. Update retrieve() in rag_service.py
    rag_path = os.path.abspath('jurisai/backend/rag_service.py')
    with open(rag_path, 'r', encoding='utf-8') as f:
        rag_code = f.read()

    old_retrieve_scoring = """        # Sub-millisecond token-overlap & statutory keyword scoring
        q_words = set(re.findall(r"\\w+", query.lower()))
        scored = []
        for doc in self._corpus_docs:"""

    new_retrieve_scoring = """        # Sub-millisecond token-overlap & statutory keyword scoring with stopword removal
        _STOPWORDS = {
            "to", "a", "an", "the", "in", "on", "of", "for", "with", "at", "by", "from",
            "and", "or", "is", "are", "was", "were", "be", "been", "how", "what", "why",
            "when", "where", "my", "me", "i", "can", "do", "does", "did", "this", "that",
            "it", "its", "you", "your", "we", "our", "so", "if", "not", "no", "as", "about",
            "say", "tell", "give", "giving", "same", "answer", "every", "question", "ask", "asked"
        }
        all_q_words = set(re.findall(r"\\w+", query.lower()))
        q_words = {w for w in all_q_words if w not in _STOPWORDS} or all_q_words
        scored = []
        for doc in self._corpus_docs:"""

    assert old_retrieve_scoring in rag_code, "old_retrieve_scoring not found"
    rag_code = rag_code.replace(old_retrieve_scoring, new_retrieve_scoring, 1)

    with open(rag_path, 'w', encoding='utf-8') as f:
        f.write(rag_code)
    print("rag_service.py retrieve() refined!")

if __name__ == '__main__':
    refine()
