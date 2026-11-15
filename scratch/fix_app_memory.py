with open(r'jurisai/backend/app.py', 'r', encoding='utf-8') as f:
    c = f.read()

target = """    # Prepare parent session history if continued from earlier chat
    parent_history = []
    if session.parent_session_id:
        p_msgs = (
            db.query(models.DocChatMessage)
            .filter(models.DocChatMessage.chat_id == session.parent_session_id)
            .order_by(models.DocChatMessage.id.asc())
            .all()
        )
        for pm in p_msgs:
            parent_history.append({"role": pm.role, "content": pm.content})"""

replacement = """    # Prepare parent session history if continued from earlier chat (or fallback to latest prior chat)
    parent_history = []
    parent_sid = session.parent_session_id
    if not parent_sid:
        last_prior = (
            db.query(models.DocChat)
            .filter(models.DocChat.user_id == current_user.id, models.DocChat.id != session.id)
            .order_by(models.DocChat.id.desc())
            .first()
        )
        if last_prior:
            parent_sid = last_prior.id

    if parent_sid:
        p_msgs = (
            db.query(models.DocChatMessage)
            .filter(models.DocChatMessage.chat_id == parent_sid)
            .order_by(models.DocChatMessage.id.asc())
            .all()
        )
        for pm in p_msgs:
            parent_history.append({"role": pm.role, "content": pm.content})"""

if target in c:
    c = c.replace(target, replacement)
    with open(r'jurisai/backend/app.py', 'w', encoding='utf-8') as f:
        f.write(c)
    print("Updated app.py cross-session memory successfully!")
else:
    print("Target not found in app.py!")
