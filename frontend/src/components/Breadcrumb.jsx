import React from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'

/**
 * Breadcrumb Component:
 * Provides clear hierarchical navigation for advocates and citizens.
 * 
 * items: Array<{
 *   label: string,
 *   href?: string,
 *   onClick?: () => void,
 *   icon?: React.ReactNode,
 *   active?: boolean
 * }>
 */
export default function Breadcrumb({ items = [], className = '' }) {
  if (!items || items.length === 0) return null

  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center gap-1.5 text-xs text-slate-400 select-none overflow-x-auto scrollbar-none whitespace-nowrap py-1 ${className}`}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1 || item.active

        return (
          <React.Fragment key={`crumb-${index}-${item.label}`}>
            {index > 0 && (
              <ChevronRight className="w-3 h-3 text-slate-600 shrink-0 mx-0.5" />
            )}

            {isLast ? (
              <span
                className="flex items-center gap-1.5 font-semibold text-white truncate max-w-[180px] sm:max-w-xs md:max-w-sm"
                title={item.label}
              >
                {item.icon && <span className="shrink-0">{item.icon}</span>}
                <span className="truncate">{item.label}</span>
              </span>
            ) : item.href ? (
              <Link
                to={item.href}
                className="flex items-center gap-1.5 text-slate-400 hover:text-indigo-300 transition-colors truncate max-w-[140px] sm:max-w-none"
                title={item.label}
              >
                {item.icon && <span className="shrink-0">{item.icon}</span>}
                <span className="truncate">{item.label}</span>
              </Link>
            ) : item.onClick ? (
              <button
                type="button"
                onClick={item.onClick}
                className="flex items-center gap-1.5 text-slate-400 hover:text-indigo-300 transition-colors cursor-pointer truncate max-w-[140px] sm:max-w-none"
                title={item.label}
              >
                {item.icon && <span className="shrink-0">{item.icon}</span>}
                <span className="truncate">{item.label}</span>
              </button>
            ) : (
              <span className="flex items-center gap-1.5 text-slate-400 truncate max-w-[140px] sm:max-w-none">
                {item.icon && <span className="shrink-0">{item.icon}</span>}
                <span className="truncate">{item.label}</span>
              </span>
            )}
          </React.Fragment>
        )
      })}
    </nav>
  )
}
