import React from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'

/**
 * ComponentErrorBoundary — Localized, soft error boundary
 * Catches errors in secondary panels (CitationCards, Modals, Audio/Voice Widgets)
 * so that a minor rendering glitch never crashes the main chat or dashboard.
 */
export default class ComponentErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.warn(`[ComponentErrorBoundary] Captured localized render exception in <${this.props.name || 'Anonymous'}>:`, error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="p-3.5 rounded-xl border border-indigo-500/20 bg-indigo-950/20 text-slate-300 text-xs my-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>
              {this.props.message || 'Information temporarily unavailable. Legal research co-pilot remains fully active.'}
            </span>
          </div>
          <button
            onClick={this.handleReset}
            className="flex items-center gap-1 text-[11px] font-semibold text-indigo-300 hover:text-white bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 px-2.5 py-1 rounded-lg transition-all shrink-0"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
