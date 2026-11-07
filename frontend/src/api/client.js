import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

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

// Intercept 401s — only redirect if explicitly on a protected route and not during active retry
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isAuthEndpoint = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/signup')
      if (!isAuthEndpoint && window.location.pathname !== '/login') {
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

// ── Query (Robust dual-signature handler) ──────────────────────────────────────
export const apiQuery = (query, case_id = null, language = 'en') => {
  if (typeof query === 'object' && query !== null) {
    const qText = query.query || query.query_text || ''
    const cId = query.case_id !== undefined ? query.case_id : case_id
    const lang = query.language || language || 'en'
    return client.post('/query', { query: qText, ...(cId ? { case_id: cId } : {}), language: lang })
  }
  return client.post('/query', { query, ...(case_id ? { case_id } : {}), language })
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
export const apiSendChatMessage = (sessionId, message, targetLanguage = 'en', mode = 'advocate') =>
  client.post(`/chat/sessions/${sessionId}/message`, {
    message,
    target_language: targetLanguage,
    mode,
  })

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
