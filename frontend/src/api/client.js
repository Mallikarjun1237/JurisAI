import axios from 'axios'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD ? 'https://jurisai-kccw.onrender.com/api' : '/api')

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000,
})

// Attach Bearer token to every request automatically
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jurisai_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Intercept 401s — only hard-redirect if root session identity verification fails
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || ''
      const isAuthInit = url.includes('/auth/me')
      // Only do a hard session clear if root user identity check explicitly rejects the stored token
      if (isAuthInit && window.location.pathname !== '/login') {
        localStorage.removeItem('jurisai_token')
        localStorage.removeItem('jurisai_user')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default client

// ── Auth ──────────────────────────────────────────────────────────────────────
export const apiSignup = (data) => client.post('/auth/signup', data)
export const apiLogin = (data) => client.post('/auth/login', data)
export const apiGetMe = () => client.get('/auth/me')
export const apiUpdateProfile = (data) => client.patch('/auth/profile', data)
export const apiTogglePro = (action = null) =>
  client.patch(`/auth/upgrade${action ? `?action=${action}` : ''}`)
export const apiForgotPassword = (email) => client.post('/auth/forgot-password', { email })
export const apiResetPassword = (token, new_password) =>
  client.post('/auth/reset-password', { token, new_password })

// ── Query (Robust dual-signature handler with AbortController signal support) ──────────────────────
export const apiQuery = (query, case_id = null, language = 'en', signal = undefined) => {
  if (typeof query === 'object' && query !== null) {
    const qText = query.query || query.query_text || ''
    const cId = query.case_id !== undefined ? query.case_id : case_id
    const lang = query.language || language || 'en'
    const sig = query.signal || signal
    return client.post(
      '/query',
      { query: qText, ...(cId ? { case_id: cId } : {}), language: lang },
      sig ? { signal: sig } : {}
    )
  }
  return client.post(
    '/query',
    { query, ...(case_id ? { case_id } : {}), language },
    signal ? { signal } : {}
  )
}

// ── Cases ─────────────────────────────────────────────────────────────────────
export const apiListCases = () => client.get('/cases')
export const apiGetCase = (caseId) => client.get(`/cases/${caseId}`)
export const apiRenameCase = (caseId, name) => client.patch(`/cases/${caseId}`, { name })
export const apiDeleteCase = (caseId) => client.delete(`/cases/${caseId}`)

// ── History ───────────────────────────────────────────────────────────────────
export const apiGetHistory = () => client.get('/history')

// ── Document & Case Chat ──────────────────────────────────────────────────────
export const apiCreateChatSession = (title = null) =>
  client.post('/chat/sessions', null, { params: title ? { title } : {} })
export const apiListChatSessions = () => client.get('/chat/sessions')
export const apiGetChatSession = (sessionId) => client.get(`/chat/sessions/${sessionId}`)
export const apiDeleteChatSession = (sessionId) => client.delete(`/chat/sessions/${sessionId}`)
export const apiUploadChatDocument = (sessionId, file) => {
  const formData = new FormData()
  formData.append('file', file)
  return client.post(`/chat/sessions/${sessionId}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  })
}
export const apiSendChatMessage = (sessionId, message, tone = 'citizen', language = 'en', thinkMode = false) =>
  client.post(`/chat/sessions/${sessionId}/message`, {
    message,
    tone,
    language,
    target_language: language,
    mode: tone,
    think_mode: thinkMode,
  })

// ── Context Continuity & Chat Handoff ──────────────────────────────────────────
export const apiGetHandoffPrompt = (sessionId) =>
  client.post(`/chat/sessions/${sessionId}/handoff`)

export const apiContinueInNewSession = (sessionId) =>
  client.post(`/chat/sessions/${sessionId}/continue-in-new`)

// ── Dynamic Legal Jargon Definition ──────────────────────────────────────────
export const apiDefineJargon = (term) => client.post('/legal-jargon/define', { term })

export const apiTransferCaseToChat = (caseId, title = null) =>
  client.post(`/chat/sessions/from-case/${caseId}`, null, { params: title ? { title } : {} })

// ── Contract Redlining & Clause Risk Audit ─────────────────────────────────────
export const apiAuditContract = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return client.post('/contracts/audit', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 90000,
  })
}

// ── Official State Court Fees & Ad-Valorem Calculator (Section 10) ────────────
export const apiGetCourtFeeStates = () => client.get('/court-fees/states')
export const apiGetCourtFeeSuitTypes = (stateCode) => client.get(`/court-fees/suit-types/${stateCode}`)
export const apiCalculateCourtFee = (data) => client.post('/court-fees/calculate', data)

// ── Vernacular Pleading Translation ───────────────────────────────────────────
export const apiTranslateDraft = (data) => client.post('/drafts/translate', data)

// ── Advocate Digital Diary & Hearing NDOH Calendar ─────────────────────────────
export const apiGetDiaryEntries = (filter = 'all', docChatId = null) => {
  const params = {}
  if (filter && filter !== 'all') params.filter = filter
  if (docChatId) params.doc_chat_id = docChatId
  return client.get('/diary/entries', { params })
}
export const apiGetDiaryStats = () => client.get('/diary/stats')
export const apiCreateDiaryEntry = (data) => client.post('/diary/entries', data)
export const apiUpdateDiaryEntry = (entryId, data) => client.put(`/diary/entries/${entryId}`, data)
export const apiToggleDiaryComplete = (entryId) => client.patch(`/diary/entries/${entryId}/toggle-complete`)
export const apiAdjournDiaryEntry = (entryId, data) => client.post(`/diary/entries/${entryId}/adjourn`, data)
export const apiDeleteDiaryEntry = (entryId) => client.delete(`/diary/entries/${entryId}`)

// ── DPDP 2023 Security & Redaction ─────────────────────────────────────────────
export const apiRedactPreview = (text) => client.post('/redact/preview', { text })
export const apiGetSecurityCertificate = (data) => client.post('/security/certificate', data)

// ── Contract Clause Risk Audit ────────────────────────────────────────────────
export const apiAuditChatClauses = (sessionId) => client.post(`/chat/sessions/${sessionId}/audit-clauses`)

// ── Court Limitation & Chronology ──────────────────────────────────────────────
export const apiGetLimitationPresets = () => client.get('/limitation/presets')
export const apiCalculateLimitation = (data) => client.post('/limitation/calculate', data)
export const apiExtractChronology = (text, language = 'en') => client.post('/chronology/extract', { text, language })
export const apiUploadAndExtractChronology = (file, language = 'en') => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('language', language)
  return client.post('/chronology/upload-and-extract', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

// ── Precedents & Citations Search ─────────────────────────────────────────────
export const apiSearchPrecedents = (q) => client.get('/precedents/search', { params: { q } })
export const apiAnalyzePrecedent = (data) => client.post('/precedents/analyze', data)


// ── Bare Acts Catalog & India Code Repository ─────────────────────────────────
export const apiGetBareActsCatalog = () => client.get('/legal/acts/catalog')
export const apiGetBareActDetail = (actId) => client.get(`/legal/acts/${encodeURIComponent(actId)}`)
