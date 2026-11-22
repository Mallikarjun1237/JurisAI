/**
 * JurisAI Commercial Notification Engine
 * 
 * Provides unified state management, local caching, and native system push dispatch for:
 * 1. Court Hearings & Cause List Deadlines (Advocate Daily Planner)
 * 2. Statutory Limitation Periods & Court Orders
 * 3. Payment Confirmations, Court Fee Valuation Receipts & Billing
 * 4. Pro Plan Perks, Unlimited Quota & Subscriptions
 * 5. Sponsored Legal Webinars, Regulatory Broadcasts & Commercial Ads
 */

const STORAGE_KEY = 'jurisai_notifications_v1'
const PERMISSION_PROMPT_KEY = 'jurisai_notif_prompt_dismissed_at'

// Default seed notifications for commercial demo
const DEFAULT_NOTIFICATIONS = [
  {
    id: 'seed-notif-1',
    type: 'hearing',
    priority: 'high',
    title: '🔴 Today Court Hearing: O.S. 412/2026',
    body: 'Item 14 at 10:30 AM in City Civil Court Hall 14. Stage: Plaintiff Evidence (PW-1 Cross).',
    timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(), // 35 mins ago
    is_read: false,
    action: 'open_diary',
    actionLabel: 'Open Advocate Diary',
  },
  {
    id: 'seed-notif-2',
    type: 'payment',
    priority: 'normal',
    title: '💳 Court Fee Valuation Slip Generated',
    body: 'Section 10 Valuation Certificate & Court Fee breakdown (₹1,850) generated for WP 14022/2026.',
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(), // 3 hours ago
    is_read: false,
    action: 'open_court_fee',
    actionLabel: 'View Receipt',
  },
  {
    id: 'seed-notif-3',
    type: 'pro_plan',
    priority: 'normal',
    title: '💎 Pro Plan Benefits Active',
    body: 'Unlimited judicial search, Supreme Court precedents, and automated clause audits enabled for your account.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    is_read: true,
    action: 'view_pro',
    actionLabel: 'Explore Pro Tools',
  },
  {
    id: 'seed-notif-4',
    type: 'ad_sponsored',
    priority: 'low',
    title: '📢 Continuing Legal Education: BNS 2024 Masterclass',
    body: 'Official Bar Council registered seminar on new procedural shifts in Bharatiya Nagarik Suraksha Sanhita. Free for JurisAI advocates.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    is_read: true,
    action: 'open_bns',
    actionLabel: 'Open BNS Concordance',
  },
]

class NotificationService {
  constructor() {
    this.listeners = new Set()
  }

  /**
   * Subscribe to notification list changes
   */
  subscribe(callback) {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  notifyListeners() {
    const list = this.getNotifications()
    this.listeners.forEach((cb) => {
      try {
        cb(list)
      } catch (err) {
        console.error('Error notifying listener:', err)
      }
    })
  }

  /**
   * Get all stored notifications
   */
  getNotifications() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw === null) {
        return []
      }
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  /**
   * Get unread count
   */
  getUnreadCount() {
    const list = this.getNotifications()
    return list.filter((n) => !n.is_read).length
  }

  /**
   * Add a notification
   */
  addNotification(notif) {
    const list = this.getNotifications()
    const newEntry = {
      id: notif.id || `notif-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      type: notif.type || 'hearing', // 'hearing' | 'deadline' | 'payment' | 'pro_plan' | 'ad_sponsored' | 'system'
      priority: notif.priority || 'normal', // 'high' | 'normal' | 'low'
      title: notif.title,
      body: notif.body,
      timestamp: notif.timestamp || new Date().toISOString(),
      is_read: false,
      action: notif.action || null,
      actionLabel: notif.actionLabel || null,
      metadata: notif.metadata || {},
    }

    const updated = [newEntry, ...list.filter((n) => n.id !== newEntry.id)]
    // Keep max 50 notifications in local history
    if (updated.length > 50) {
      updated.length = 50
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    this.notifyListeners()

    // Also trigger native browser notification if granted
    if (this.isPermissionGranted()) {
      this.triggerNativeNotification(newEntry.title, {
        body: newEntry.body,
        icon: '/favicon.ico',
        tag: newEntry.id,
      })
    }

    return newEntry
  }

  /**
   * Mark a specific notification as read
   */
  markAsRead(id) {
    const list = this.getNotifications()
    const updated = list.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    this.notifyListeners()
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead() {
    const list = this.getNotifications()
    const updated = list.map((n) => ({ ...n, is_read: true }))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    this.notifyListeners()
  }

  /**
   * Delete a notification
   */
  deleteNotification(id) {
    const list = this.getNotifications()
    const updated = list.filter((n) => n.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    this.notifyListeners()
  }

  /**
   * Clear all notifications
   */
  clearAll() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]))
    this.notifyListeners()
  }

  /* ────────────────── Browser Native Notification API ────────────────── */

  /**
   * Check if native browser notifications are supported
   */
  isSupported() {
    return typeof window !== 'undefined' && 'Notification' in window
  }

  /**
   * Current native permission: 'granted' | 'denied' | 'default'
   */
  getPermission() {
    if (!this.isSupported() || typeof window === 'undefined' || !window.Notification) return 'denied'
    return window.Notification.permission
  }

  isPermissionGranted() {
    return this.getPermission() === 'granted'
  }

  /**
   * Check if the user previously dismissed the prompt recently (within 24 hours)
   */
  isPromptDismissedRecently() {
    try {
      const dismissedAt = localStorage.getItem(PERMISSION_PROMPT_KEY)
      if (!dismissedAt) return false
      const diffHours = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60)
      return diffHours < 24 // Don't annoy user if dismissed in the last 24h
    } catch {
      return false
    }
  }

  /**
   * Mark that the user dismissed the prompt ("Not Now")
   */
  setPromptDismissed() {
    try {
      localStorage.setItem(PERMISSION_PROMPT_KEY, Date.now().toString())
    } catch (e) {
      console.warn('Failed to save prompt dismissal:', e)
    }
  }

  /**
   * Clear the dismissal so the prompt can be triggered explicitly
   */
  clearPromptDismissal() {
    try {
      localStorage.removeItem(PERMISSION_PROMPT_KEY)
    } catch (e) {
      console.warn('Failed to clear prompt dismissal:', e)
    }
  }

  /**
   * Request native browser permission
   */
  async requestPermission() {
    if (!this.isSupported()) {
      return 'denied'
    }

    try {
      const result = await window.Notification.requestPermission()
      if (result === 'granted') {
        // Clear any previous dismissal
        this.clearPromptDismissal()

        // Trigger welcome confirmation system notification
        this.triggerNativeNotification('🔔 JurisAI Hearing Alerts Active', {
          body: 'You will now receive morning cause list callouts and limitation deadline alerts directly on this device.',
          icon: '/favicon.ico',
          tag: 'jurisai-welcome-notif',
        })

        // Also add an in-app confirmation
        this.addNotification({
          type: 'system',
          priority: 'normal',
          title: '✅ Push Notifications Successfully Activated',
          body: 'This device is now registered for real-time hearing reminders and statutory limitation alerts.',
          timestamp: new Date().toISOString(),
          is_read: false,
        })
      }
      return result
    } catch (err) {
      console.error('Error requesting notification permission:', err)
      return 'denied'
    }
  }

  /**
   * Fire a native system notification
   */
  triggerNativeNotification(title, options = {}) {
    if (!this.isPermissionGranted()) return null

    try {
      const notif = new window.Notification(title, {
        badge: '/favicon.ico',
        icon: '/favicon.ico',
        vibrate: [200, 100, 200],
        ...options,
      })

      notif.onclick = () => {
        window.focus()
        notif.close()
      }

      return notif
    } catch (err) {
      console.warn('Native notification trigger failed:', err)
      return null
    }
  }

  /**
   * Schedule or check for today's hearings from an array of diary entries
   */
  syncDiaryHearings(entries) {
    if (!Array.isArray(entries) || entries.length === 0) return

    const todayStr = new Date().toISOString().split('T')[0]
    const todayHearings = entries.filter(
      (e) => e.hearing_date === todayStr && !e.is_completed
    )

    if (todayHearings.length === 0) return

    const existingNotifs = this.getNotifications()
    const todaySyncKey = `daily-hearing-sync-${todayStr}`

    // Check if we already synced today
    const alreadySynced = existingNotifs.some(
      (n) => n.metadata && n.metadata.syncKey === todaySyncKey
    )

    if (!alreadySynced) {
      const count = todayHearings.length
      const first = todayHearings[0]
      const title =
        count === 1
          ? `🔴 Today Hearing: ${first.case_number}`
          : `🔴 ${count} Court Hearings Scheduled Today`

      const body =
        count === 1
          ? `${first.court_name} (${first.hearing_time || '10:30 AM'}) — ${first.parties}. Stage: ${first.stage}.`
          : `You have ${count} hearings scheduled today, starting with ${first.case_number} at ${first.court_name}.`

      this.addNotification({
        type: 'hearing',
        priority: 'high',
        title: title,
        body: body,
        action: 'open_diary',
        actionLabel: 'Open Advocate Diary',
        metadata: {
          syncKey: todaySyncKey,
          case_id: first.id,
        },
      })
    }
  }
}

export const notificationService = new NotificationService()
