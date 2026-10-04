import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, Mail, Lock, Camera, X, Check,
  AlertCircle, Eye, EyeOff, Shield, Loader2, Trash2,
} from 'lucide-react'
import { apiUpdateProfile } from '../api/client'

export default function ProfileModal({ isOpen, onClose, user, onUserUpdated }) {
  const fileInputRef = useRef(null)

  const [fullName, setFullName] = useState('')
  const [profileImage, setProfileImage] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Sync state whenever modal opens or user object updates
  useEffect(() => {
    if (isOpen && user) {
      setFullName(user.full_name || '')
      setProfileImage(user.profile_image || '')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setError('')
      setSuccess('')
    }
  }, [isOpen, user])

  if (!isOpen) return null

  // Handle local image file upload & resize via canvas to ~256x256 JPEG (~20KB)
  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPG, PNG, WebP).')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const maxDim = 256
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width)
            width = maxDim
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height)
            height = maxDim
          }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        // High quality small JPEG data URL (usually 15KB - 30KB)
        const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.88)
        setProfileImage(resizedDataUrl)
        setError('')
      }
      img.src = event.target.result
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = () => {
    setProfileImage('')
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const payload = {}

    // Send updated image (or null if removed)
    if (profileImage !== (user?.profile_image || '')) {
      payload.profile_image = profileImage || null
    }

    // Send updated name if provided
    if (fullName && fullName.trim() !== (user?.full_name || '')) {
      payload.full_name = fullName.trim()
    }

    // Send password update if requested
    if (newPassword) {
      if (!currentPassword) {
        setError('Please enter your current password to authorize a password change.')
        return
      }
      if (newPassword.length < 8) {
        setError('New password must be at least 8 characters long.')
        return
      }
      if (newPassword !== confirmPassword) {
        setError('New password and confirmation password do not match.')
        return
      }
      payload.current_password = currentPassword
      payload.new_password = newPassword
    }

    // If nothing changed but user hit save, send the current photo or name so save always succeeds
    if (Object.keys(payload).length === 0) {
      if (profileImage) {
        payload.profile_image = profileImage
      } else if (fullName.trim()) {
        payload.full_name = fullName.trim()
      } else {
        setError('No changes to save. Please choose a photo or enter a new name/password.')
        return
      }
    }

    setSaving(true)
    try {
      const res = await apiUpdateProfile(payload)
      if (onUserUpdated) onUserUpdated(res.data)

      setSuccess('Profile updated successfully!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')

      setTimeout(() => {
        onClose()
      }, 1000)
    } catch (err) {
      console.error('Failed to update profile:', err)
      const detail = err.response?.data?.detail
      const status = err.response?.status
      if (status === 404 || status === 502 || status === 504 || !err.response) {
        setError('Backend server not responding. Please restart uvicorn: `uvicorn app:app --port 8000`')
      } else {
        setError(detail || 'Failed to update profile. Please check your credentials and try again.')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Modal Card */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 16 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-lg bg-[#0d0e20] border border-indigo-500/25 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-8"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-indigo-500/15 bg-indigo-950/20">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Edit Profile & Account</h2>
                <p className="text-[11px] text-slate-400">Update photo, name or password individually</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSave} className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
            {/* Alerts */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/25 rounded-xl flex items-start gap-2 text-xs text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl flex items-center gap-2 text-xs text-emerald-400">
                <Check className="w-4 h-4 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {/* Avatar Section */}
            <div className="flex flex-col items-center gap-3 py-1">
              <div className="relative group">
                <div className="w-20 h-20 rounded-full border-2 border-indigo-500/40 p-0.5 bg-[#14152e] overflow-hidden flex items-center justify-center">
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="Avatar"
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-2xl">
                      {(fullName || user?.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Upload Trigger Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-7 h-7 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-[#0d0e20] transition-transform group-hover:scale-110"
                  title="Upload photo"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>

              <div className="flex items-center gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-indigo-400 hover:text-indigo-300 font-medium"
                >
                  Upload New Photo
                </button>
                {profileImage && (
                  <>
                    <span className="text-slate-600">·</span>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="text-red-400 hover:text-red-300 font-medium flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Remove
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-400" /> Full Name / Advocate Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Adv. Rajesh Sharma"
                className="w-full bg-[#13142d] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Email (Read-only) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-500" /> Email Address (Immutable)
                </label>
                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                  <Shield className="w-3 h-3 text-slate-500" /> Permanent login ID
                </span>
              </div>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full bg-[#0a0b17] border border-white/5 rounded-xl px-3.5 py-2.5 text-sm text-slate-400 cursor-not-allowed select-none"
              />
            </div>

            {/* Password Change Section (Optional) */}
            <div className="pt-3 border-t border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-indigo-400" /> Change Password
                </h3>
                <span className="text-[10px] text-slate-500">Optional</span>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPw ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password to authorize change"
                    className="w-full bg-[#13142d] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-600 pr-10 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                  >
                    {showCurrentPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPw ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      className="w-full bg-[#13142d] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 pr-9 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPw(!showNewPw)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                    >
                      {showNewPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full bg-[#13142d] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-4 border-t border-white/5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving Changes...
                  </>
                ) : (
                  'Save Profile'
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
