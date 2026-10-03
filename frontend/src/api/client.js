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
export const apiTogglePro = (action = null) =>
  client.patch(`/auth/upgrade${action ? `?action=${action}` : ''}`)
export const apiForgotPassword = (email) => client.post('/auth/forgot-password', { email })
export const apiResetPassword = (token, new_password) =>
  client.post('/auth/reset-password', { token, new_password })

// ── Query ─────────────────────────────────────────────────────────────────────
export const apiQuery = (query, case_id = null) =>
  client.post('/query', { query, ...(case_id ? { case_id } : {}) })

// ── Cases ─────────────────────────────────────────────────────────────────────
export const apiListCases = () => client.get('/cases')
export const apiGetCase = (caseId) => client.get(`/cases/${caseId}`)
export const apiRenameCase = (caseId, name) => client.patch(`/cases/${caseId}`, { name })
export const apiDeleteCase = (caseId) => client.delete(`/cases/${caseId}`)

// ── History ───────────────────────────────────────────────────────────────────
export const apiGetHistory = () => client.get('/history')

export default client
