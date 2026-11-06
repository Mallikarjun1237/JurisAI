import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import client from '../api/client'

const AuthContext = createContext(null)

// Returns today's date string in IST (UTC+5:30) as "YYYY-MM-DD"
function getISTDateString() {
  const now = new Date()
  const istOffset = 5 * 60 + 30 // minutes
  const utc = now.getTime() + now.getTimezoneOffset() * 60000
  const ist = new Date(utc + istOffset * 60000)
  return ist.toISOString().slice(0, 10)
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('jurisai_token'))
  const [user, setUser] = useState(() => {
    try {
      const u = localStorage.getItem('jurisai_user')
      if (!u) return null
      const parsed = JSON.parse(u)
      // If stored last_query_date is not today (IST), reset the daily count locally immediately
      const todayIST = getISTDateString()
      if (parsed && parsed.last_query_date && parsed.last_query_date !== todayIST) {
        parsed.daily_query_count = 0
        parsed.last_query_date = todayIST
        try { localStorage.setItem('jurisai_user', JSON.stringify(parsed)) } catch {}
      }
      return parsed
    } catch {
      return null
    }
  })

  const _persist = (access_token, userData) => {
    localStorage.setItem('jurisai_token', access_token)
    localStorage.setItem('jurisai_user', JSON.stringify(userData))
    setToken(access_token)
    setUser(userData)
  }

  const logout = useCallback(() => {
    localStorage.removeItem('jurisai_token')
    localStorage.removeItem('jurisai_user')
    setToken(null)
    setUser(null)
  }, [])

  // Listen for soft logout events fired by the axios 401 interceptor
  // This avoids a hard page reload while still clearing auth state
  useEffect(() => {
    const handleSoftLogout = () => logout()
    window.addEventListener('jurisai:logout', handleSoftLogout)
    return () => window.removeEventListener('jurisai:logout', handleSoftLogout)
  }, [logout])

  // On app load, re-fetch user from server to get the authoritative daily_query_count.
  // This ensures even if the user left the app open overnight, the count resets correctly.
  useEffect(() => {
    if (!token) return
    client.get('/auth/me')
      .then((res) => {
        const fresh = res.data
        // If server's last_query_date differs from IST today, reset count
        const todayIST = getISTDateString()
        if (fresh.last_query_date && fresh.last_query_date !== todayIST) {
          fresh.daily_query_count = 0
          fresh.last_query_date = todayIST
        }
        setUser((prev) => {
          const updated = { ...prev, ...fresh }
          try { localStorage.setItem('jurisai_user', JSON.stringify(updated)) } catch {}
          return updated
        })
      })
      .catch(() => {
        // Silent fail — keep cached user if server is unreachable
      })
  }, [token])

  const login = useCallback(async (email, password) => {
    const res = await client.post('/auth/login', { email, password })
    const { access_token, user: userData } = res.data
    _persist(access_token, userData)
    return userData
  }, [])

  const signup = useCallback(async (email, password, full_name) => {
    const res = await client.post('/auth/signup', { email, password, full_name })
    const { access_token, user: userData } = res.data
    _persist(access_token, userData)
    return userData
  }, [])

  const updateUser = useCallback((updates) => {
    setUser((prev) => {
      const updated = { ...prev, ...updates }
      try {
        localStorage.setItem('jurisai_user', JSON.stringify(updated))
      } catch (err) {
        console.warn('Could not persist updated user to localStorage:', err)
      }
      return updated
    })
  }, [])

  return (
    <AuthContext.Provider value={{ token, user, login, signup, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
