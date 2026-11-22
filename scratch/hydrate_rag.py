import os

def hydrate():
    target_path = os.path.abspath('jurisai/backend/rag_service.py')
    with open(target_path, 'r', encoding='utf-8') as f:
        code = f.read()

    old_target = """            print(f"[OK] ChromaDB connected — {len(self._corpus_docs)} legal entries loaded in-memory.")
        except Exception as e:
            print(f"[INFO] ChromaDB collection note: {e}. Active in sovereign in-memory mode.")"""

    new_target = """            print(f"[OK] ChromaDB connected — {len(self._corpus_docs)} legal entries loaded in-memory.")
        except Exception as e:
            print(f"[INFO] ChromaDB collection note: {e}. Active in sovereign in-memory mode.")

        # Ensure all registered domain statutes and precedents are hydrated in-memory
        existing_titles = {d.get("metadata", {}).get("title", "").lower() for d in self._corpus_docs}
        for dkey, dval in LEGAL_DOMAIN_REGISTRY.items():
            for st in dval.get("statutes", []):
                if st.get("title", "").lower() not in existing_titles:
                    self._corpus_docs.append({
                        "id": f"reg_{dkey}_{len(self._corpus_docs)}",
                        "text": f"{st.get('title', '')} {st.get('citation', '')} {st.get('excerpt', '')}",
                        "metadata": {
                            "doc_type": st.get("doc_type", "statute"),
                            "title": st.get("title", "Statutory Provision"),
                            "citation": st.get("citation", ""),
                            "court": "Enacted Indian Statute",
                            "year": 2024,
                        },
                    })
                    existing_titles.add(st.get("title", "").lower())
            for pr in dval.get("precedents", []):
                if pr.get("title", "").lower() not in existing_titles:
                    self._corpus_docs.append({
                        "id": f"reg_{dkey}_{len(self._corpus_docs)}",
                        "text": f"{pr.get('title', '')} {pr.get('citation', '')} {pr.get('holding', '')}",
                        "metadata": {
                            "doc_type": "judgment",
                            "title": pr.get("title", "Supreme Court Precedent"),
                            "citation": pr.get("citation", ""),
                            "court": pr.get("court", "Supreme Court of India"),
                            "year": pr.get("year", 2024),
                        },
                    })
                    existing_titles.add(pr.get("title", "").lower())"""

    assert old_target in code, "old_target not found"
    code = code.replace(old_target, new_target, 1)

    with open(target_path, 'w', encoding='utf-8') as f:
        f.write(code)
    print("SUCCESS: rag_service.py hydrated with all domain knowledge!")

if __name__ == '__main__':
    hydrate()
