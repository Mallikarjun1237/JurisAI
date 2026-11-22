/**
 * NotificationPermissionModal — Instagram-style Contextual Opt-In Prompt
 * 
 * Features:
 * - Animated Electric Mint bell with pulsing radar wave optics
 * - Clear commercial legal value proposition (hearings, deadlines, fee receipts, pro updates)
 * - Two-tier permission: soft custom UI first to prevent browser-level permanent blocking
 * - "Not Now" persistent fallback with smooth dismissal handling
 */
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, Check, X, Shield, Calendar, Clock,
  CreditCard, Sparkles, AlertCircle, ArrowRight
} from 'lucide-react'
import { notificationService } from '../services/notificationService'

export default function NotificationPermissionModal({
  isOpen,
  onClose,
  onPermissionGranted,
}) {
  const [loading, setLoading] = useState(false)
  const [granted, setGranted] = useState(false)

  if (!isOpen) return null

  const handleAllow = async () => {
    setLoading(true)
    try {
      const status = await notificationService.requestPermission()
      if (status === 'granted') {
        setGranted(true)
        if (onPermissionGranted) onPermissionGranted()
        setTimeout(() => {
          onClose()
        }, 1200)
      } else {
        // User denied or closed the native prompt
        notificationService.setPromptDismissed()
        onClose()
      }
    } catch (err) {
      console.error('Permission request failed:', err)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const handleDismiss = () => {
    notificationService.setPromptDismissed()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full max-w-md bg-[#081219] border border-emerald-500/30 border-t-emerald-400 rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95),0_0_50px_rgba(16,185,129,0.15)] ring-1 ring-emerald-400/20 overflow-hidden p-6 sm:p-7 text-center"
      >
        {/* Subtle Ambient Radial Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Cross Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Not now"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Instagram-style Animated Emblem with Concentric Radar Waves */}
        <div className="relative w-20 h-20 mx-auto mb-5 flex items-center justify-center">
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-emerald-400/30"
            animate={{ scale: [1, 1.35, 1], opacity: [0.7, 0, 0.7] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute inset-1.5 rounded-full border border-emerald-400/50"
            animate={{ scale: [1, 1.2, 1], opacity: [0.9, 0.1, 0.9] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
          />
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-600/30 border border-emerald-400/50 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/20 z-10">
            {granted ? (
              <Check className="w-8 h-8 text-emerald-300" />
            ) : (
              <Bell className="w-8 h-8 text-emerald-400 animate-bounce" />
            )}
          </div>
        </div>

        {/* Title & Description */}
        <h3 className="text-lg font-bold text-white mb-2 tracking-wide">
          {granted ? 'Hearing Alerts Activated!' : 'Turn on Court Notifications'}
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto mb-5">
          {granted
            ? 'You will now receive timely reminders on this device for all court hearings, cause list calls, and limitation dates.'
            : 'Stay ahead in court. Get automated morning reminders for your cause list items, statutory limitation deadlines, and payment receipts.'}
        </p>

        {/* Value Proposition List */}
        {!granted && (
          <div className="space-y-2.5 text-left mb-6 bg-[#050a0e] border border-white/8 rounded-2xl p-3.5">
            <div className="flex items-start gap-2.5 text-xs text-slate-300">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                <Calendar className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="font-semibold text-white">Daily Cause List Callouts</p>
                <p className="text-[11px] text-slate-400">Morning alerts at 08:30 AM with Court Hall & Item No.</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 text-xs text-slate-300">
              <div className="w-6 h-6 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0 mt-0.5">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="font-semibold text-white">Statutory Limitation Deadlines</p>
                <p className="text-[11px] text-slate-400">Advance 24-hr countdown before filing expiry dates</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 text-xs text-slate-300">
              <div className="w-6 h-6 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                <CreditCard className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="font-semibold text-white">Court Fee Valuation & Receipts</p>
                <p className="text-[11px] text-slate-400">Instant notification when official slips and invoices are ready</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 text-xs text-slate-300">
              <div className="w-6 h-6 rounded-lg bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0 mt-0.5">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="font-semibold text-white">Pro Plan Updates & Legal Reforms</p>
                <p className="text-[11px] text-slate-400">Instant notices for BNS concordance & Supreme Court ratios</p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          {granted ? (
            <div className="py-2.5 px-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2">
              <Check className="w-4 h-4" />
              <span>Permission Granted</span>
            </div>
          ) : (
            <>
              <button
                onClick={handleAllow}
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span>Requesting System Permission…</span>
                ) : (
                  <>
                    <Bell className="w-4 h-4" />
                    <span>Turn On Notifications</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDismiss}
                className="w-full py-2.5 px-4 rounded-xl text-xs text-slate-400 hover:text-slate-200 transition-colors font-medium"
              >
                Not Now
              </button>
            </>
          )}
        </div>

        {/* Privacy Assurance Footer */}
        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-center gap-1.5 text-[10px] text-slate-500">
          <Shield className="w-3 h-3 text-emerald-400/80" />
          <span>Zero spam · Strictly relevant to your legal calendar & cases</span>
        </div>
      </motion.div>
    </div>
  )
}
