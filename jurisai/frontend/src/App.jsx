import React, { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { LanguageProvider } from './context/LanguageContext'
import Login from './pages/Login'
import Signup from './pages/Signup'
import SpacetimeGrid from './components/SpacetimeGrid'

// Route-level code splitting: heavy application modules are loaded on demand to prevent main-thread lag
const Dashboard = lazy(() => import('./pages/Dashboard'))
const CaseChat = lazy(() => import('./pages/CaseChat'))
const LimitationChronology = lazy(() => import('./pages/LimitationChronology'))
const PrecedentsExplorer = lazy(() => import('./pages/PrecedentsExplorer'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const NotFound = lazy(() => import('./pages/NotFound'))

// High-performance, lightweight loading fallback for on-demand route transitions
function PageLoadingFallback() {
  return (
    <div className="min-h-screen bg-[#070714] flex flex-col items-center justify-center p-6 text-slate-300">
      <div className="relative flex items-center justify-center mb-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shadow-lg shadow-indigo-500/10">
          <span className="text-xl">⚖</span>
        </div>
        <div className="absolute -inset-1 rounded-2xl border-2 border-indigo-500/40 border-t-transparent animate-spin" />
      </div>
      <p className="text-xs font-semibold text-slate-300 tracking-wide">
        JurisAI Sovereign Legal Intelligence
      </p>
      <p className="text-[11px] text-slate-500 mt-1">
        Loading requested module…
      </p>
    </div>
  )
}

// Resilient Error Boundary: Protects the user's workspace, authentication token, and case notes safely
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.warn('[JurisAI ErrorBoundary] Captured interface exception:', error, errorInfo)
  }

  handleRestoreWorkspace = () => {
    // Reset component error state and return to dashboard without clearing session tokens
    this.setState({ hasError: false, error: null })
    if (window.location.pathname !== '/dashboard') {
      window.location.href = '/dashboard'
    } else {
      window.location.reload()
    }
  }

  handleSoftReload = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  handleExplicitSignOut = () => {
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
        <div className="min-h-screen bg-[#070714] flex items-center justify-center p-6 text-white relative overflow-hidden">
          <div className="max-w-lg w-full glass-card border border-indigo-500/30 rounded-3xl p-8 shadow-2xl text-center space-y-5 relative z-10">
            {/* Crest & Icon */}
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center mx-auto text-indigo-400 text-2xl font-bold shadow-xl shadow-indigo-600/10">
              ⚖
            </div>

            {/* Title & Reassurance */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-[11px] text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Session & Legal Dockets Preserved Safely</span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Self-Recovery Interface Activated
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
                An interface glitch occurred while displaying this view, but your authenticated session, legal research notes, and case records remain completely secure.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 justify-center pt-2">
              <button
                onClick={this.handleRestoreWorkspace}
                className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2"
              >
                <span>Restore Workspace</span>
              </button>
              <button
                onClick={this.handleSoftReload}
                className="w-full sm:w-auto px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-white/10 transition-all"
              >
                Refresh View
              </button>
            </div>

            {/* Collapsible Technical Diagnostics (Non-intrusive) */}
            {this.state.error && (
              <details className="text-left text-xs bg-black/40 rounded-xl p-3 border border-white/5 group">
                <summary className="cursor-pointer text-slate-400 font-semibold select-none flex items-center justify-between text-[11px] hover:text-slate-200">
                  <span>Diagnostic Technical Docket</span>
                  <span className="text-[10px] text-indigo-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <pre className="mt-2 text-[10px] text-indigo-300/80 font-mono overflow-x-auto p-2 bg-indigo-950/30 rounded border border-indigo-500/15 whitespace-pre-wrap max-h-36">
                  {this.state.error.message || String(this.state.error)}
                </pre>
              </details>
            )}

            {/* Subtle Sign Out Option (Only if user genuinely desires it) */}
            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500">
              <span>JurisAI Sovereign Legal Intelligence</span>
              <button
                onClick={this.handleExplicitSignOut}
                className="text-slate-400 hover:text-slate-300 underline transition"
              >
                Switch account
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
              <Suspense fallback={<PageLoadingFallback />}>
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
                    path="/cases"
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

                  {/* Reassuring 404 Route — Prevents unexpected redirects to /login */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </div>
          </BrowserRouter>
        </LanguageProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}
