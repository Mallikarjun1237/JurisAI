import axios from 'axios'

const client = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000,
})

// Attach JWT token to every request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('jurisai_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// On 401: clear stored credentials and fire a custom event so
// AuthContext can log out via React state (no hard page reload).
// IMPORTANT: Do NOT redirect here — Login page also gets 401 on wrong password,
// and a hard redirect would wipe the error message before it renders.
client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const isAuthEndpoint =
        err.config?.url?.includes('/auth/login') ||
        err.config?.url?.includes('/auth/signup') ||
        err.config?.url?.includes('/auth/forgot-password') ||
        err.config?.url?.includes('/auth/reset-password')

      if (!isAuthEndpoint) {
        // Only clear session + redirect for non-auth endpoints
        // (e.g. expired token on /query, /cases, etc.)
        localStorage.removeItem('jurisai_token')
        localStorage.removeItem('jurisai_user')
        // Fire a soft logout event — AuthContext listens and updates state
        window.dispatchEvent(new Event('jurisai:logout'))
      }
      // For auth endpoints (wrong password), just reject — let the form show the error
    }
    return Promise.reject(err)
  }
)

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

// ── Query ─────────────────────────────────────────────────────────────────────
export const apiQuery = (query, case_id = null, language = 'en') =>
  client.post('/query', { query, ...(case_id ? { case_id } : {}), language })

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
  })
}
export const apiSendChatMessage = (sessionId, message, tone = 'citizen', language = 'en') =>
  client.post(`/chat/sessions/${sessionId}/message`, { message, tone, language })

// ── Limitation & Chronology ──────────────────────────────────────────────────
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

// ── Precedents & Citations ───────────────────────────────────────────────────
export const apiSearchPrecedents = (q = '') => client.get('/precedents/search', { params: { q } })
export const apiGetPrecedent = (id) => client.get(`/precedents/${id}`)
export const apiAnalyzePrecedent = (query_or_citation, language = 'en') =>
  client.post('/precedents/analyze', { query_or_citation, language })

// ── Privacy & PII Redaction (DPDP Act 2023) ──────────────────────────────────
export const apiRedactPreview = (text) => client.post('/redact/preview', { text })

export default client

