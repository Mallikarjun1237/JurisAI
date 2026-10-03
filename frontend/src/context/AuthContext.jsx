import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import client from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('jurisai_token'))
  const [user, setUser] = useState(() => {
    try {
      const u = localStorage.getItem('jurisai_user')
      return u ? JSON.parse(u) : null
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
      localStorage.setItem('jurisai_user', JSON.stringify(updated))
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
