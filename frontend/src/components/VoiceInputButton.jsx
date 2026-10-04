/**
 * VoiceInputButton — Vernacular Voice Dictation with Compact-Height Big Wave & Expanding Circles
 * Perfectly balanced: retains full width (max-w-lg) while shrinking vertical height (~230px)
 * to avoid overflowing or covering lower components.
 * Supports: English (India), हिन्दी (Hindi), ಕನ್ನಡ (Kannada), తెలుగు (Telugu).
 */
import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, Check, X } from 'lucide-react'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'

export default function VoiceInputButton({
  language = 'en',
  onTranscript,
  onError,
  size = 'md',        // 'sm' | 'md' | 'lg'
  className = '',
}) {
  const [accumulatedSessionText, setAccumulatedSessionText] = useState('')

  const handleLiveResult = (chunk) => {
    setAccumulatedSessionText((prev) => (prev ? prev + ' ' : '') + chunk)
  }

  const {
    isListening,
    isSupported,
    interimText,
    audioLevels,
    startListening,
    stopListening,
    langLabel,
  } = useSpeechRecognition({
    language,
    onResult: handleLiveResult,
    onError,
  })

  const handleStart = () => {
    if (!isSupported) {
      onError?.('Voice dictation requires Chrome or Edge. Firefox does not support Web Speech API.')
      return
    }
    setAccumulatedSessionText('')
    startListening()
  }

  const handleDone = () => {
    stopListening()
    const fullText = (accumulatedSessionText + (interimText ? ' ' + interimText : '')).trim()
    if (fullText) {
      onTranscript?.(fullText)
    }
    setAccumulatedSessionText('')
  }

  const handleCancel = () => {
    stopListening()
    setAccumulatedSessionText('')
  }

  // Button sizes
  const buttonSize = {
    sm: 'w-8 h-8',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
  }[size]

  const iconSize = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }[size]

  return (
    <>
      {/* ── Toolbar Trigger Button ────────────────────────────────────────── */}
      <div className={`relative flex items-center ${className}`}>
        <motion.button
          onClick={isListening ? handleDone : handleStart}
          title={isListening ? 'Click to finish speaking' : `Voice input in ${langLabel}`}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          className={`
            relative ${buttonSize} flex items-center justify-center rounded-xl transition-all
            ${isListening
              ? 'bg-red-500/25 border border-red-500/60 text-red-400 shadow-lg shadow-red-500/30'
              : isSupported
                ? 'text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/10 border border-white/0 hover:border-indigo-500/25'
                : 'text-slate-600 cursor-not-allowed opacity-50'
            }
          `}
        >
          {isListening && (
            <motion.div
              className="absolute inset-0 rounded-xl bg-red-500/30"
              animate={{ scale: [1, 1.4, 1], opacity: [0.7, 0, 0.7] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}

          {isListening ? (
            <MicOff className={`${iconSize} relative z-10`} />
          ) : (
            <Mic className={`${iconSize}`} />
          )}
        </motion.button>
      </div>

      {/* ── COMPACT-HEIGHT IMMERSIVE VOICE DICTATION OVERLAY ────────────────── */}
      {/* ── COMPACT-HEIGHT IMMERSIVE VOICE DICTATION OVERLAY ────────────────── */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {isListening && (
              <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
                <motion.div
                  initial={{ opacity: 0, scale: 0.92, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 12 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  className="relative w-full max-w-lg bg-gradient-to-b from-[#14173b] via-[#0c0e27] to-[#070818] border-2 border-indigo-400/80 rounded-2xl p-4 sm:p-5 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95),0_0_45px_rgba(99,102,241,0.45)] ring-2 ring-indigo-500/30 flex flex-col overflow-hidden"
                >
                  {/* Background ambient light */}
                  <div className="absolute -top-16 left-1/3 w-64 h-32 bg-indigo-600/20 rounded-full blur-2xl pointer-events-none" />

                  {/* ── Top Header Row: Language badge + Close button ── */}
                  <div className="flex items-center justify-between mb-3 shrink-0">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold shadow-sm">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                      <span>Listening in {langLabel}</span>
                    </div>

                    <button
                      onClick={handleCancel}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                      title="Cancel voice input"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* ── Middle Row: Expanding Circles on Left + Wave & Transcript on Right ── */}
                  <div className="flex flex-col sm:flex-row items-center gap-4 my-1">
                    {/* ── LEFT: Big Expanding & Contracting Wave Circles ── */}
                    <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center shrink-0">
                      {/* Outer Ring 3 */}
                      <motion.div
                        className="absolute rounded-full border border-indigo-500/25 bg-indigo-500/5"
                        animate={{
                          width: ['75px', '125px', '75px'],
                          height: ['75px', '125px', '75px'],
                          opacity: [0.2, 0.6, 0.2],
                        }}
                        transition={{
                          duration: 2.4,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                      />

                      {/* Mid Ring 2 */}
                      <motion.div
                        className="absolute rounded-full border border-purple-500/35 bg-purple-500/10"
                        animate={{
                          width: ['60px', '98px', '60px'],
                          height: ['60px', '98px', '60px'],
                          opacity: [0.3, 0.8, 0.3],
                        }}
                        transition={{
                          duration: 2.0,
                          repeat: Infinity,
                          ease: 'easeInOut',
                          delay: 0.3,
                        }}
                      />

                      {/* Inner Ring 1 */}
                      <motion.div
                        className="absolute rounded-full border border-cyan-400/40 bg-cyan-500/15"
                        animate={{
                          width: ['48px', '76px', '48px'],
                          height: ['48px', '76px', '48px'],
                          opacity: [0.4, 0.95, 0.4],
                        }}
                        transition={{
                          duration: 1.6,
                          repeat: Infinity,
                          ease: 'easeInOut',
                          delay: 0.6,
                        }}
                      />

                      {/* Center Breathing Orb with Glowing Mic */}
                      <motion.div
                        className="relative z-10 w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-xl shadow-indigo-500/70 border border-white/30 cursor-pointer"
                        onClick={handleDone}
                        animate={{
                          scale: [1, 1.14, 0.96, 1.1, 1],
                        }}
                        transition={{
                          duration: 2.0,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                        whileHover={{ scale: 1.18 }}
                        whileTap={{ scale: 0.94 }}
                        title="Click orb to finish"
                      >
                        <Mic className="w-6 h-6 text-white drop-shadow-md" />
                      </motion.div>
                    </div>

                    {/* ── RIGHT: Bouncing Waveform Bars & Live Speech Preview ── */}
                    <div className="flex-1 w-full flex flex-col justify-center min-w-0">
                      {/* Bouncing Fluid Soundwave Bars */}
                      <div className="flex items-end justify-center sm:justify-start gap-1 h-8 mb-2 px-1">
                        {audioLevels.map((lvl, idx) => {
                          const colors = [
                            'from-indigo-500 to-blue-400',
                            'from-blue-500 to-cyan-400',
                            'from-cyan-500 to-teal-400',
                            'from-emerald-500 to-green-400',
                            'from-green-500 to-amber-400',
                            'from-amber-500 to-rose-400',
                            'from-rose-500 to-pink-400',
                            'from-pink-500 to-purple-400',
                            'from-purple-500 to-indigo-400',
                            'from-indigo-500 to-cyan-400',
                            'from-cyan-500 to-emerald-400',
                          ]
                          const grad = colors[idx % colors.length]

                          return (
                            <motion.div
                              key={idx}
                              className={`w-1.5 rounded-full bg-gradient-to-t ${grad} shadow-sm`}
                              animate={{
                                height: `${Math.max(6, lvl * 32)}px`,
                              }}
                              transition={{
                                duration: 0.12,
                                ease: 'easeInOut',
                              }}
                            />
                          )
                        })}
                      </div>

                      {/* Real-time Transcription Box */}
                      <div className="bg-black/40 border border-white/10 rounded-xl p-2.5 min-h-[58px] max-h-24 overflow-y-auto scrollbar-thin text-left">
                        {accumulatedSessionText || interimText ? (
                          <p className="text-xs sm:text-sm font-medium text-white leading-relaxed">
                            <span>{accumulatedSessionText}</span>
                            {interimText && (
                              <span className="text-indigo-300 italic"> {interimText}</span>
                            )}
                            <span className="inline-block w-1.5 h-3.5 ml-1 bg-indigo-400 animate-pulse align-middle" />
                          </p>
                        ) : (
                          <p className="text-xs text-slate-400 italic">
                            Speak clearly in {langLabel}… your words appear here.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ── Bottom Action Row: Cancel + Done Button ── */}
                  <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-white/10 shrink-0">
                    <button
                      onClick={handleCancel}
                      className="py-2 px-3 rounded-lg border border-white/10 hover:border-red-500/30 bg-white/5 hover:bg-red-500/10 text-slate-400 hover:text-red-300 text-xs font-semibold transition-all flex items-center justify-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Cancel</span>
                    </button>

                    <motion.button
                      onClick={handleDone}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 py-2 px-4 rounded-lg bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all flex items-center justify-center gap-1.5 border border-white/15"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Done & Insert Text</span>
                    </motion.button>
                  </div>

                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  )
}
