import React from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Command, X, CornerDownLeft, Search, Sidebar, Minimize2, Sparkles } from 'lucide-react'

const SHORTCUTS = [
  {
    keys: ['Ctrl', 'Enter'],
    macKeys: ['⌘', 'Enter'],
    label: 'Submit Legal Query / Follow-up',
    description: 'Triggers multi-statute AI analysis and precedent retrieval',
    icon: <CornerDownLeft className="w-3.5 h-3.5 text-indigo-400" />,
  },
  {
    keys: ['Ctrl', 'K'],
    macKeys: ['⌘', 'K'],
    label: 'Focus Scenario Search / Input',
    description: 'Instantly focuses the query textarea anywhere on the screen',
    icon: <Search className="w-3.5 h-3.5 text-indigo-400" />,
  },
  {
    keys: ['Esc'],
    macKeys: ['Esc'],
    label: 'Close Active Modal / Overlay',
    description: 'Dismisses open dialogs, menus, or tooltips immediately',
    icon: <Minimize2 className="w-3.5 h-3.5 text-indigo-400" />,
  },
  {
    keys: ['Ctrl', 'B'],
    macKeys: ['⌘', 'B'],
    label: 'Toggle Navigation Sidebar',
    description: 'Expands or collapses the cases and tools drawer',
    icon: <Sidebar className="w-3.5 h-3.5 text-indigo-400" />,
  },
  {
    keys: ['Ctrl', '/'],
    macKeys: ['⌘', '/'],
    label: 'Keyboard Accelerators Guide',
    description: 'Opens this quick reference modal for speed power-users',
    icon: <Command className="w-3.5 h-3.5 text-indigo-400" />,
  },
]

export default function KeyboardShortcutsModal({ isOpen, onClose }) {
  if (!isOpen) return null

  const isMac = typeof window !== 'undefined' && navigator.platform?.toUpperCase().indexOf('MAC') >= 0

  const content = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="bg-[#0b0e24] border border-indigo-500/40 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden text-slate-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
                <Command className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Keyboard Accelerators</span>
                  <span className="text-[10px] px-1.5 py-0.2 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded font-mono">
                    JurisAI Pro
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">Streamline your legal research workflow</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* List of Shortcuts */}
          <div className="p-4 space-y-2.5 max-h-[60vh] overflow-y-auto">
            {SHORTCUTS.map((item, idx) => {
              const displayKeys = isMac ? item.macKeys : item.keys

              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white/4 border border-white/6 hover:border-indigo-500/30 transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-3">
                    <div className="w-6 h-6 rounded-lg bg-indigo-950/60 border border-indigo-500/20 flex items-center justify-center shrink-0">
                      {item.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{item.label}</p>
                      <p className="text-[10.5px] text-slate-400 truncate">{item.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {displayKeys.map((k, ki) => (
                      <kbd
                        key={ki}
                        className="px-2 py-1 text-[11px] font-mono font-semibold text-indigo-200 bg-indigo-950/80 border border-indigo-500/40 rounded-md shadow-sm shadow-black/40 min-w-[24px] text-center"
                      >
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-white/10 bg-white/2 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Press <kbd className="px-1 py-0.5 rounded bg-white/10 text-slate-300">Esc</kbd> anytime to dismiss</span>
            <span className="text-indigo-400 font-sans font-medium">Sovereign UX</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )

  return createPortal(content, document.body)
}
