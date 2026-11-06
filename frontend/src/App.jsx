import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { LanguageProvider } from './context/LanguageContext'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import CaseChat from './pages/CaseChat'
import LimitationChronology from './pages/LimitationChronology'
import PrecedentsExplorer from './pages/PrecedentsExplorer'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import SpacetimeGrid from './components/SpacetimeGrid'

// Clean Error Boundary to catch any unexpected component errors and prevent blank dark screens
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught UI render exception:', error, errorInfo)
  }

  handleReset = () => {
    try {
      localStorage.removeItem('jurisai_token')
      localStorage.removeItem('jurisai_user')
    } catch {}
    this.setState({ hasError: false, error: null })
    window.location.href = '/login'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050a0e] flex items-center justify-center p-6 text-white">
          <div className="max-w-md w-full bg-[#0c141d] border border-red-500/30 rounded-2xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400 text-xl font-bold">
              ⚠
            </div>
            <h2 className="text-lg font-bold text-slate-100">Display Recovery</h2>
            <p className="text-xs text-slate-400">
              An unexpected display issue occurred. Your session state has been preserved safely.
            </p>
            {this.state.error && (
              <pre className="text-[11px] text-red-300 bg-red-950/40 p-3 rounded-lg border border-red-500/20 text-left overflow-x-auto max-h-32">
                {this.state.error.message || String(this.state.error)}
              </pre>
            )}
            <div className="flex items-center gap-3 justify-center pt-2">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-indigo-600/20"
              >
                Reset Session & Return to Login
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-semibold border border-white/10 transition-all"
              >
                Reload
              </button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

function ProtectedRoute({ children }) {
  const { token } = useAuth()
  return token ? children : <Navigate to="/login" replace />
}

function RootRoute() {
  const { token } = useAuth()
  return token ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <LanguageProvider>
          <BrowserRouter>
            <div className="relative min-h-screen bg-[#070714] text-slate-100 overflow-x-hidden selection:bg-indigo-500/30 selection:text-indigo-200">
              <SpacetimeGrid />
              <Routes>
                {/* Root URL goes to /dashboard if logged in, otherwise /login */}
                <Route path="/" element={<RootRoute />} />

                {/* Authentication routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                <Route
                  path="/dashboard"
                  element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
                />
                <Route
                  path="/case-chat"
                  element={<ProtectedRoute><CaseChat /></ProtectedRoute>}
                />
                <Route
                  path="/limitation-chronology"
                  element={<ProtectedRoute><LimitationChronology /></ProtectedRoute>}
                />
                <Route
                  path="/precedents"
                  element={<ProtectedRoute><PrecedentsExplorer /></ProtectedRoute>}
                />

                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </div>
          </BrowserRouter>
        </LanguageProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}
