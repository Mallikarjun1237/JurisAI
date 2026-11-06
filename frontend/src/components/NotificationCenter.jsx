/**
 * NotificationCenter — In-App Notification Center Dropdown & Bell Badge
 * 
 * Commercial-grade notification hub:
 * - Real-time unread badge counter
 * - Category filter tabs: All, Hearings, Payments, Pro & Ads
 * - Quick-action routing (Open Advocate Diary, View Court Fee Receipt, Upgrade Pro)
 * - Built-in native browser push tester
 * - System permission status banner with one-click enable
 */
import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, Check, Trash2, Calendar, CreditCard, Sparkles,
  Megaphone, ExternalLink, ShieldAlert, CheckCheck,
  AlertCircle, ChevronRight, Volume2, Info, X
} from 'lucide-react'
import { notificationService } from '../services/notificationService'

export default function NotificationCenter({
  onOpenDiary,
  onOpenCourtFee,
  onOpenPro,
  onOpenBNS,
  onRequestPermissionModal,
  align = 'right',
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [filter, setFilter] = useState('all') // 'all' | 'hearing' | 'payment' | 'pro_ad'
  const [permission, setPermission] = useState(notificationService.getPermission())
  const dropdownRef = useRef(null)

  useEffect(() => {
    // Initial load
    setNotifications(notificationService.getNotifications())
    setPermission(notificationService.getPermission())

    // Subscribe to updates
    const unsubscribe = notificationService.subscribe((updated) => {
      setNotifications(updated)
      setPermission(notificationService.getPermission())
    })

    return () => unsubscribe()
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick)
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [isOpen])

  const unreadCount = notifications.filter((n) => !n.is_read).length

  // Filtered notifications
  const filteredList = notifications.filter((n) => {
    if (filter === 'all') return true
    if (filter === 'hearing') return n.type === 'hearing' || n.type === 'deadline'
    if (filter === 'payment') return n.type === 'payment'
    if (filter === 'pro_ad') return n.type === 'pro_plan' || n.type === 'ad_sponsored'
    return true
  })

  const handleActionClick = (notif) => {
    notificationService.markAsRead(notif.id)
    setIsOpen(false)

    if (notif.action === 'open_diary' && onOpenDiary) {
      onOpenDiary()
    } else if (notif.action === 'open_court_fee' && onOpenCourtFee) {
      onOpenCourtFee()
    } else if (notif.action === 'view_pro' && onOpenPro) {
      onOpenPro()
    } else if (notif.action === 'open_bns' && onOpenBNS) {
      onOpenBNS()
    }
  }

  const handleTestNativePush = () => {
    if (!notificationService.isPermissionGranted()) {
      if (onRequestPermissionModal) onRequestPermissionModal()
      return
    }

    notificationService.triggerNativeNotification('⚖️ Court Hearing Alert (Test)', {
      body: 'Item 14 in Court Hall 3: O.S. 412/2026 starts in 30 minutes. All files ready.',
      icon: '/favicon.ico',
      tag: 'test-push',
    })
  }

  const formatTimeAgo = (isoString) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime()
      const diffMins = Math.floor(diffMs / (1000 * 60))
      if (diffMins < 1) return 'Just now'
      if (diffMins < 60) return `${diffMins}m ago`
      const diffHours = Math.floor(diffMins / 60)
      if (diffHours < 24) return `${diffHours}h ago`
      const diffDays = Math.floor(diffHours / 24)
      return `${diffDays}d ago`
    } catch {
      return 'Recently'
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* ── Bell Icon Button with Live Badge ── */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 bg-white hover:bg-indigo-500/10 transition-all border border-slate-200 hover:border-sky-300 shadow-sm flex items-center justify-center"
        title="Notifications & Hearing Reminders"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4 text-indigo-400" />

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white shadow-md shadow-red-500/40 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* ── Floating Notification Dropdown Tray ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="max-lg:fixed max-lg:top-14 max-lg:right-3 max-lg:left-3 max-lg:w-auto sm:max-lg:left-auto sm:max-lg:right-4 sm:max-lg:w-96 lg:absolute lg:right-0 lg:w-96 mt-2 max-w-[calc(100vw-1.5rem)] bg-white border border-slate-200 rounded-2xl shadow-[0_20px_50px_rgba(10,37,64,0.15)] z-[99999] overflow-hidden flex flex-col max-h-[82vh] origin-top-right text-slate-800"
          >
            {/* Header */}
            <div className="p-3.5 border-b border-slate-200 bg-slate-50/90 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                  <Bell className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 truncate">
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] bg-red-500/20 text-red-300 border border-red-500/30 px-1.5 py-0.2 rounded font-mono font-bold shrink-0">
                        {unreadCount} new
                      </span>
                    )}
                  </h4>
                  <p className="text-[10px] text-slate-500 truncate">Court hearings, fee slips & pro updates</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {unreadCount > 0 && (
                  <button
                    onClick={() => notificationService.markAllAsRead()}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 transition-colors px-1.5 py-0.5 rounded hover:bg-white/5"
                    title="Mark all as read"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span className="hidden xs:inline">Mark read</span>
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  title="Close notifications"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Browser Permission Banner (If Not Granted) */}
            {permission !== 'granted' && (
              <div className="px-3.5 py-2.5 bg-gradient-to-r from-amber-500/15 via-emerald-500/10 to-transparent border-b border-amber-500/20 flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
                  <span className="text-[11px] text-amber-200 font-medium">
                    Enable system push to receive morning cause list calls
                  </span>
                </div>
                <button
                  onClick={() => {
                    setIsOpen(false)
                    if (onRequestPermissionModal) onRequestPermissionModal()
                  }}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[10px] shrink-0 transition-all shadow-sm"
                >
                  Turn On
                </button>
              </div>
            )}

            {/* Filter Category Tabs */}
            <div className="p-2 border-b border-slate-200 bg-slate-100/70 flex items-center gap-1 shrink-0">
              <button
                onClick={() => setFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  filter === 'all'
                    ? 'bg-indigo-600 text-white indigo-glow font-bold shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('hearing')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1 ${
                  filter === 'hearing'
                    ? 'bg-indigo-600 text-white indigo-glow font-bold shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Calendar className="w-3 h-3 text-indigo-400" />
                <span>Hearings</span>
              </button>
              <button
                onClick={() => setFilter('payment')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1 ${
                  filter === 'payment'
                    ? 'bg-indigo-600 text-white indigo-glow font-bold shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CreditCard className="w-3 h-3 text-indigo-400" />
                <span>Payments</span>
              </button>
              <button
                onClick={() => setFilter('pro_ad')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1 ${
                  filter === 'pro_ad'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Pro & Offers</span>
              </button>
            </div>

            {/* Notification List Body */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2 divide-y divide-white/5">
              {filteredList.length === 0 ? (
                <div className="text-center py-10 text-slate-400 space-y-2">
                  <Bell className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs font-semibold text-slate-300">No notifications here</p>
                  <p className="text-[10px] text-slate-500">
                    You're completely caught up on your hearing schedules and court deadlines.
                  </p>
                </div>
              ) : (
                filteredList.map((notif) => {
                  const isHearing = notif.type === 'hearing' || notif.type === 'deadline'
                  const isPayment = notif.type === 'payment'
                  const isPro = notif.type === 'pro_plan'
                  const isAd = notif.type === 'ad_sponsored'

                  return (
                    <div
                      key={notif.id}
                      className={`pt-2 p-2.5 rounded-xl transition-all ${
                        !notif.is_read
                          ? 'bg-emerald-500/5 border border-emerald-500/20'
                          : 'hover:bg-white/3'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        {/* Icon Badge */}
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border ${
                            isHearing
                              ? 'bg-red-500/15 border-red-500/30 text-red-400'
                              : isPayment
                              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                              : isPro
                              ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400'
                              : 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                          }`}
                        >
                          {isHearing ? (
                            <Calendar className="w-3.5 h-3.5" />
                          ) : isPayment ? (
                            <CreditCard className="w-3.5 h-3.5" />
                          ) : isPro ? (
                            <Sparkles className="w-3.5 h-3.5" />
                          ) : (
                            <Megaphone className="w-3.5 h-3.5" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <h5 className="text-xs font-bold text-white truncate">
                              {notif.title}
                            </h5>
                            <span className="text-[10px] text-slate-500 shrink-0 font-mono">
                              {formatTimeAgo(notif.timestamp)}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-300 leading-snug mb-2">
                            {notif.body}
                          </p>

                          {/* Quick Action Button */}
                          <div className="flex items-center justify-between gap-2">
                            {notif.action && notif.actionLabel && (
                              <button
                                onClick={() => handleActionClick(notif)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold transition-all"
                              >
                                <span>{notif.actionLabel}</span>
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            )}

                            <div className="flex items-center gap-1.5 ml-auto">
                              {!notif.is_read && (
                                <button
                                  onClick={() => notificationService.markAsRead(notif.id)}
                                  className="text-[10px] text-slate-400 hover:text-emerald-300 font-medium"
                                  title="Mark as read"
                                >
                                  Read
                                </button>
                              )}
                              <button
                                onClick={() => notificationService.deleteNotification(notif.id)}
                                className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                                title="Remove"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Footer Bar */}
            {notifications.length > 0 && (
              <div className="p-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-400 shrink-0">
                <span className="text-[11px] text-slate-500">
                  {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
                </span>
                <button
                  onClick={() => notificationService.clearAll()}
                  className="flex items-center gap-1.5 px-3 py-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/25 rounded-lg transition-all font-semibold shadow-sm"
                  title="Remove all notifications"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear all</span>
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
