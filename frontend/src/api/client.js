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

// Auto-logout on 401
client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('jurisai_token')
      localStorage.removeItem('jurisai_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ── Auth ──────────────────────────────────────────────────────────────────────
export const apiSignup = (data) => client.post('/auth/signup', data)
export const apiLogin = (data) => client.post('/auth/login', data)
export const apiGetMe = () => client.get('/auth/me')
export const apiTogglePro = () => client.patch('/auth/upgrade')
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
