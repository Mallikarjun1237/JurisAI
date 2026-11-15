with open("jurisai/backend/app.py", "a", encoding="utf-8") as f:
    f.write('''

@app.get("/api/legal/acts/{act_id}", response_model=schemas.BareActDetailResponse, tags=["Bare Acts"])
def get_bare_act_detail(act_id: str):
    """Retrieve detailed statutory profile, what it states, when enacted, case applications, and section texts."""
    from scripts.ingest_indiacode import CENTRAL_ACTS_REGISTRY
    import bare_acts_knowledge

    found_act = None
    for act in CENTRAL_ACTS_REGISTRY:
        if act["act_id"].lower() == act_id.lower() or act["title"].lower() == act_id.lower():
            found_act = act
            break

    if not found_act:
        for act in CENTRAL_ACTS_REGISTRY:
            if act_id.lower() in act["title"].lower() or act["act_id"].lower() in act_id.lower():
                found_act = act
                break

    if not found_act:
        found_act = {
            "act_id": act_id,
            "title": act_id.replace("_", " ").title(),
            "year": 2024,
            "domain": "Central Legislation",
            "effective": "2024-07-01",
            "repeals": None,
        }

    kb = bare_acts_knowledge.get_act_knowledge(found_act["act_id"], found_act["title"], found_act["domain"])
    provisions = bare_acts_knowledge.get_act_provisions(found_act["act_id"], found_act["title"])

    return schemas.BareActDetailResponse(
        act_id=found_act["act_id"],
        title=found_act["title"],
        year=found_act["year"],
        domain=found_act["domain"],
        effective=found_act.get("effective"),
        repeals=found_act.get("repeals"),
        overview=kb["overview"],
        key_applications=kb["key_applications"],
        provisions=[schemas.BareActProvisionDetail(**p) for p in provisions],
    )
''')

print("Appended /api/legal/acts/{act_id} successfully")
