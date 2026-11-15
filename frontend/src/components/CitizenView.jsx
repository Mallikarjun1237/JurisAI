import React from 'react'
import { motion } from 'framer-motion'
import { MessageSquare, ListChecks, BookOpen, ChevronRight } from 'lucide-react'
import CitationCard from './CitationCard'
import { useLanguage } from '../context/LanguageContext'

export default function CitizenView({ data }) {
  const { language } = useLanguage()
  if (!data) return null

  const summaryTitle =
    language === 'kn' ? 'ಸರಳ ಕಾನೂನು ಸಾರಾಂಶ (Citizen Summary)' :
    language === 'te' ? 'సరళ న్యాయ సారాంశం (Citizen Summary)' :
    language === 'hi' ? 'सरल विधिक सारांश (Citizen Summary)' :
    'Plain Language Legal Summary'

  const lawsTitle =
    language === 'kn' ? 'ಅನ್ವಯವಾಗುವ ಶಾಸನಗಳು (Applicable Laws)' :
    language === 'te' ? 'వర్తించే చట్టాలు & సెక్షన్లు (Applicable Laws)' :
    language === 'hi' ? 'लागू होने वाले कानून (Applicable Laws)' :
    'Applicable Laws & Statutes'

  const nextStepsTitle =
    language === 'kn' ? 'ನೀವು ಮಾಡಬೇಕಾದ ಮುಂದಿನ ಕ್ರಮಗಳು (Actionable Next Steps)' :
    language === 'te' ? 'మీరు తీసుకోవలసిన తదుపరి చర్యలు (Next Steps)' :
    language === 'hi' ? 'अग्रिम विधिक कदम (Actionable Next Steps)' :
    'What You Should Do (Next Steps)'

  return (
    <motion.div
      key="citizen"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-4"
    >
      {/* Plain Language Summary */}
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/12 border border-indigo-500/20 flex items-center justify-center">
            <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">{summaryTitle}</h3>
          <span className="ml-auto text-xs text-indigo-400/60 bg-indigo-500/8 px-2 py-0.5 rounded-full border border-indigo-500/15">
            Citizen View
          </span>
        </div>
        <p className="text-sm text-slate-800 dark:text-slate-300 leading-relaxed font-normal">{data.plain_english_summary}</p>
      </div>

      {/* Applicable Statutes — Top 3 Max to Minimize Height */}
      {data.applicable_statutes?.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-300">
              {lawsTitle}
              <span className="ml-2 text-[11px] text-slate-500 font-normal">
                (Top {Math.min(3, data.applicable_statutes.length)})
              </span>
            </h3>
          </div>
          <div className="grid gap-2">
            {data.applicable_statutes.slice(0, 3).map((statute, i) => (
              <CitationCard key={`statute-${i}`} item={statute} type="statute" index={i} />
            ))}
          </div>
        </div>
      )}

      {/* Suggested Next Steps */}
      {data.suggested_next_steps?.length > 0 && (
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/12 border border-emerald-500/20 flex items-center justify-center">
              <ListChecks className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{nextStepsTitle}</h3>
          </div>
          <ul className="space-y-2.5">
            {data.suggested_next_steps.map((step, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.07 }}
                className="flex items-start gap-3 text-sm text-slate-800 dark:text-slate-300 font-normal"
              >
                <div className="w-5 h-5 rounded-full bg-emerald-500/12 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <ChevronRight className="w-3 h-3 text-emerald-400" />
                </div>
                {step}
              </motion.li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  )
}
