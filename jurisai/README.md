# ⚖️ JurisAI — Legal Intelligence SaaS

> AI-powered Indian legal assistant. Describe your scenario, get verified statutes, landmark SC precedents, and actionable guidance — instantly.

**Tech Stack**: FastAPI · ChromaDB · Gemini 1.5 Flash · React 18 · Tailwind CSS · Framer Motion  
**Theme**: Indigo (#6366F1) · Dark Mode First

---

## 🗂 Project Structure

```
jurisai/
├── backend/
│   ├── app.py              # FastAPI app (auth + query endpoints)
│   ├── rag_service.py      # RAG engine (ChromaDB + Gemini)
│   ├── ingest.py           # One-time DB seeding (22 legal entries)
│   ├── auth.py             # JWT helpers + bcrypt
│   ├── models.py           # SQLAlchemy ORM (User, QueryLog)
│   ├── database.py         # DB engine + session
│   ├── schemas.py          # Pydantic schemas
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── context/AuthContext.jsx
    │   ├── api/client.js
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Signup.jsx
    │   │   └── Dashboard.jsx
    │   └── components/
    │       ├── Sidebar.jsx
    │       ├── CitizenView.jsx
    │       ├── AdvocateView.jsx
    │       ├── CitationCard.jsx
    │       └── PlanBadge.jsx
    ├── package.json
    ├── tailwind.config.js
    └── vite.config.js
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- A **Gemini API key** (free at [aistudio.google.com](https://aistudio.google.com))

---

### 1. Backend Setup

```bash
cd jurisai/backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env
# Edit .env and set GEMINI_API_KEY=your_actual_key

# Seed the legal knowledge base (run ONCE)
python ingest.py

# Start the API server
uvicorn app:app --reload --port 8000
```

> The backend will be available at http://localhost:8000  
> Swagger docs: http://localhost:8000/docs

---

### 2. Frontend Setup

```bash
cd jurisai/frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

> The app will be available at http://localhost:5173

---

## 🔑 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | ✅ | Google Gemini API key |
| `SECRET_KEY` | ✅ | JWT signing secret (change in production!) |
| `DATABASE_URL` | Optional | Defaults to `sqlite:///./jurisai.db` |
| `CHROMA_PATH` | Optional | Defaults to `./.chroma_db` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Optional | JWT expiry (default: 1440 = 24h) |

---

## 🏗 API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/auth/signup` | None | Register user |
| `POST` | `/api/auth/login` | None | Login, returns JWT |
| `POST` | `/api/auth/forgot-password` | None | Password reset stub |
| `GET` | `/api/auth/me` | JWT | Current user profile |
| `PATCH` | `/api/auth/upgrade` | JWT | Upgrade to Pro |
| `POST` | `/api/query` | JWT | Main RAG query |
| `GET` | `/api/history` | JWT | Query history (last 20) |
| `GET` | `/health` | None | Health check |

---

## 🧠 Knowledge Base (22 Legal Entries)

### Constitutional Provisions
- Article 14 — Right to Equality
- Article 19 — Freedom of Speech & Expression
- Article 21 — Right to Life and Personal Liberty
- Article 32 — Right to Constitutional Remedies
- Article 226 — High Court Writ Jurisdiction
- Article 39A — Free Legal Aid

### Landmark SC Judgments
- Maneka Gandhi v. UOI (1978) — Expanded Art. 21
- K.S. Puttaswamy v. UOI (2017) — Right to Privacy
- Kesavananda Bharati (1973) — Basic Structure Doctrine
- Vishaka v. State of Rajasthan (1997) — POSH origin
- Shreya Singhal (2015) — Section 66A struck down
- Navtej Singh Johar (2018) — Section 377 decriminalized
- M.C. Mehta / Oleum Gas (1987) — Absolute Liability
- Indra Sawhney (1992) — OBC Reservations / 50% cap

### Statutory Provisions
- BNS §318 — Cheating
- BNS §356 — Defamation / Cyber Defamation
- Indian Contract Act §73 — Breach of Contract
- Industrial Disputes Act §25F/G/H — Wrongful Termination
- Consumer Protection Act 2019 — Consumer Redressal
- IT Act §43A — Data Breach Compensation
- Transfer of Property Act — Tenancy Rights
- POSH Act 2013 — Sexual Harassment at Workplace

---

## 🎨 Design System

| Token | Value |
|-------|-------|
| Primary | `#6366F1` (Indigo-500) |
| Background | `#05050F` |
| Surface | `#0D0D24` |
| Card | `#12122E` |
| Border | `rgba(99,102,241,0.18)` |
| Font | Inter (sans) · JetBrains Mono (code) |

---

## 🔒 Tier System

| Feature | Free | Pro |
|---------|------|-----|
| Queries per day | 3 | Unlimited |
| Statutory provisions | ✅ | ✅ |
| SC/HC Precedents | ❌ | ✅ |
| Confidence score | ✅ | ✅ |
| PDF Export | ❌ | ✅ (mock) |
| History | ✅ | ✅ |

---

## ⚠️ Disclaimer

JurisAI is for **informational purposes only** and does not constitute legal advice. Always consult a licensed advocate for personalized legal guidance.
