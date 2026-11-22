/**
 * useSpeechRecognition — Vernacular Voice Dictation Hook
 * Supports: en-IN (English), hi-IN (Hindi), kn-IN (Kannada), te-IN (Telugu)
 * Uses the Web Speech API — no API key, no backend, no billing.
 */
import { useState, useRef, useCallback, useEffect } from 'react'

const LANG_LOCALE_MAP = {
  en: 'en-IN',
  hi: 'hi-IN',
  kn: 'kn-IN',
  te: 'te-IN',
}

const LANG_LABEL_MAP = {
  en: 'English (India)',
  hi: 'हिन्दी (Hindi)',
  kn: 'ಕನ್ನಡ (Kannada)',
  te: 'తెలుగు (Telugu)',
}

export function useSpeechRecognition({ language = 'en', onResult, onError } = {}) {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(true)
  const [transcript, setTranscript] = useState('')
  const [interimText, setInterimText] = useState('')
  const [audioLevels, setAudioLevels] = useState([0.2, 0.4, 0.7, 0.5, 0.9, 0.6, 0.8, 0.4, 0.7, 0.3, 0.5])
  const recognitionRef = useRef(null)
  const audioAnimRef = useRef(null)

  // Check browser support once on mount
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setIsSupported(false)
    }
  }, [])

  // Simulate animated audio waveform levels while listening
  const startAudioAnimation = useCallback(() => {
    const animate = () => {
      setAudioLevels(() =>
        Array.from({ length: 11 }, () => 0.15 + Math.random() * 0.85)
      )
      audioAnimRef.current = requestAnimationFrame(animate)
    }
    audioAnimRef.current = requestAnimationFrame(animate)
  }, [])

  const stopAudioAnimation = useCallback(() => {
    if (audioAnimRef.current) {
      cancelAnimationFrame(audioAnimRef.current)
      audioAnimRef.current = null
    }
    setAudioLevels([0.2, 0.4, 0.7, 0.5, 0.9, 0.6, 0.8, 0.4, 0.7, 0.3, 0.5])
  }, [])

  const startListening = useCallback(() => {
    if (!isSupported) {
      onError?.('Voice input requires Chrome or Edge browser. Firefox does not support the Web Speech API.')
      return
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition

    const recognition = new SpeechRecognition()
    recognitionRef.current = recognition

    recognition.lang = LANG_LOCALE_MAP[language] || 'en-IN'
    recognition.continuous = true         // keep recording until user stops
    recognition.interimResults = true     // show live partial text
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setIsListening(true)
      setTranscript('')
      setInterimText('')
      startAudioAnimation()
    }

    recognition.onresult = (event) => {
      let finalTranscript = ''
      let currentInterim = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += text + ' '
        } else {
          currentInterim += text
        }
      }

      setInterimText(currentInterim)
      if (finalTranscript) {
        setTranscript((prev) => {
          const next = (prev ? prev + ' ' : '') + finalTranscript.trim()
          onResult?.(finalTranscript.trim())
          return next
        })
      }
    }

    recognition.onerror = (event) => {
      stopAudioAnimation()
      setIsListening(false)

      const errorMessages = {
        'not-allowed': 'Microphone access denied. Please allow microphone permission in your browser settings.',
        'network': 'Network error. Please check your internet connection and try again.',
        'no-speech': 'No speech detected. Please speak clearly and try again.',
        'audio-capture': 'Microphone not found. Please connect a microphone and try again.',
        'aborted': null,
      }

      const msg = errorMessages[event.error]
      if (msg) onError?.(msg)
    }

    recognition.onend = () => {
      stopAudioAnimation()
      setIsListening(false)
      setInterimText('')
    }

    try {
      recognition.start()
    } catch (e) {
      stopAudioAnimation()
      setIsListening(false)
      onError?.('Could not start voice recognition. Please refresh and try again.')
    }
  }, [isSupported, language, onResult, onError, startAudioAnimation, stopAudioAnimation])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (e) {}
      recognitionRef.current = null
    }
    stopAudioAnimation()
    setIsListening(false)
    setInterimText('')
  }, [stopAudioAnimation])

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort()
        } catch (e) {}
      }
      stopAudioAnimation()
    }
  }, [stopAudioAnimation])

  return {
    isListening,
    isSupported,
    transcript,
    interimText,
    audioLevels,
    startListening,
    stopListening,
    langLabel: LANG_LABEL_MAP[language] || 'English (India)',
    locale: LANG_LOCALE_MAP[language] || 'en-IN',
  }
}
