import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  BookOpen,
  Scale,
  ArrowLeft,
  Copy,
  Check,
  Sparkles,
  Award,
  Users,
  ShieldCheck,
  FileText,
  Bookmark,
  ExternalLink,
} from 'lucide-react'
import { apiSearchPrecedents, apiAnalyzePrecedent } from '../api/client'

const CATEGORIES = [
  'All Domains',
  'Criminal & Bail',
  'Constitutional Law',
  'Commercial & Contracts',
  'Negotiable Instruments',
  'Privacy & Cyber',
]

export default function PrecedentsExplorer() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All Domains')
  const [precedents, setPrecedents] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedCase, setSelectedCase] = useState(null)
  const [copiedId, setCopiedId] = useState(null)

  // AI Deep Search state
  const [deepLoading, setDeepLoading] = useState(false)
  const [deepResult, setDeepResult] = useState(null)

  // Load / Search precedents
  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      try {
        const res = await apiSearchPrecedents(searchQuery)
        if (active) {
          setPrecedents(res.data?.results || [])
          if (res.data?.results?.length > 0 && !selectedCase) {
            setSelectedCase(res.data.results[0])
          }
        }
      } catch (err) {
        console.error('Error fetching precedents:', err)
      } finally {
        if (active) setLoading(false)
      }
    }

    const timer = setTimeout(load, 250)
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [searchQuery])

  // Filtered by category pill
  const filteredPrecedents = precedents.filter((item) => {
    if (activeCategory === 'All Domains') return true
    if (activeCategory === 'Criminal & Bail') {
      return (
        item.subject_area?.toLowerCase().includes('criminal') ||
        item.subject_area?.toLowerCase().includes('bail') ||
        item.subject_area?.toLowerCase().includes('police')
      )
    }
    if (activeCategory === 'Constitutional Law') {
      return item.subject_area?.toLowerCase().includes('constitution')
    }
    if (activeCategory === 'Commercial & Contracts') {
      return item.subject_area?.toLowerCase().includes('contract') || item.subject_area?.toLowerCase().includes('commercial')
    }
    if (activeCategory === 'Negotiable Instruments') {
      return item.subject_area?.toLowerCase().includes('cheque') || item.subject_area?.toLowerCase().includes('negotiable')
    }
    if (activeCategory === 'Privacy & Cyber') {
      return item.subject_area?.toLowerCase().includes('privacy') || item.subject_area?.toLowerCase().includes('cyber')
    }
    return true
  })

  // Deep AI Precedent Synthesis
  const handleDeepAnalyze = async () => {
    if (!searchQuery.trim()) return
    setDeepLoading(true)
    try {
      const res = await apiAnalyzePrecedent(searchQuery)
      if (res.data?.data) {
        setSelectedCase(res.data.data)
        setDeepResult(res.data.data)
      }
    } catch (err) {
      alert(err?.response?.data?.detail || 'Failed to synthesize precedent brief.')
    } finally {
      setDeepLoading(false)
    }
  }

  // Copy Citation
  const handleCopyCitation = (citation, id) => {
    navigator.clipboard.writeText(citation)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="min-h-screen bg-[#060813] text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="border-b border-indigo-500/10 bg-[#060813]/80 backdrop-blur-md sticky top-0 z-30 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white flex items-center gap-2">
                <span>Landmark Precedents & Citation Explorer</span>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-semibold">
                  Supreme Court of India
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Authoritative Ratio Decidendi, Obiter Dicta & Law Report Citations
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/case-chat')}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors"
          >
            <span>Case Co-Pilot</span>
          </button>
        </div>
      </header>

      {/* Search & Category Header */}
      <div className="border-b border-white/5 bg-[#090c1e] px-6 py-4">
        <div className="max-w-6xl mx-auto space-y-3">
          {/* Search Box */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by case name (e.g. Arnesh Kumar, Kesavananda), citation (e.g. (2014) 8 SCC 273), or act..."
                className="w-full bg-[#12162d] border border-indigo-500/30 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 shadow-inner"
              />
            </div>
            <button
              onClick={handleDeepAnalyze}
              disabled={deepLoading || !searchQuery.trim()}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 transition-colors shadow-md shrink-0"
              title="Synthesize authoritative brief for any citation or legal query via Judicial AI"
            >
              {deepLoading ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="hidden sm:inline">Analyzing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Deep AI Ratio Brief</span>
                </>
              )}
            </button>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  activeCategory === cat
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white/4 text-slate-400 hover:text-slate-200 hover:bg-white/8'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Landmark List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>Landmarks Found ({filteredPrecedents.length})</span>
            {loading && <span>Searching...</span>}
          </div>

          <div className="space-y-2.5 max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
            {filteredPrecedents.map((item) => {
              const isSelected = selectedCase?.citation === item.citation
              return (
                <div
                  key={item.citation}
                  onClick={() => setSelectedCase(item)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-950/40 border-indigo-500 shadow-md ring-1 ring-indigo-500/50'
                      : 'bg-[#0b0e20] border-white/5 hover:border-indigo-500/30 hover:bg-[#0f132b]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h3 className="text-xs font-bold text-white line-clamp-1">{item.title}</h3>
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-mono px-1.5 py-0.5 rounded font-semibold shrink-0">
                      {item.year}
                    </span>
                  </div>

                  <p className="text-[11px] text-amber-300/90 font-mono font-medium mb-1.5">{item.citation}</p>

                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {item.ratio_decidendi}
                  </p>

                  <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500">
                    <span className="truncate max-w-[180px]">{item.subject_area}</span>
                    <span className="text-emerald-400 font-semibold">{item.status?.split(' ')[0] || 'Good Law'}</span>
                  </div>
                </div>
              )
            })}

            {filteredPrecedents.length === 0 && !loading && (
              <div className="p-8 text-center text-xs text-slate-500 bg-[#0b0e20] rounded-xl border border-white/5">
                No indexed landmarks matched your search.
                <div className="mt-2">
                  <button
                    onClick={handleDeepAnalyze}
                    className="text-indigo-400 hover:underline font-semibold"
                  >
                    Click to run Deep Judicial AI Analysis on "{searchQuery}"
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: In-depth Ratio Brief Viewer */}
        <div className="lg:col-span-7">
          {selectedCase ? (
            <div className="bg-[#0b0e20] border border-indigo-500/20 rounded-2xl p-6 shadow-2xl space-y-5 sticky top-24">
              {/* Case Header */}
              <div className="border-b border-white/10 pb-4">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-500/30">
                    {selectedCase.court || 'Supreme Court of India'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyCitation(`${selectedCase.title}, ${selectedCase.citation}`, 'main')}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
                      title="Copy Court Citation"
                    >
                      {copiedId === 'main' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Citation</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <h2 className="text-base font-bold text-white leading-snug">{selectedCase.title}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-2 text-xs font-mono">
                  <span className="text-amber-300 font-bold">{selectedCase.citation}</span>
                  {selectedCase.equivalent_citations && (
                    <span className="text-slate-400">| Equiv: {selectedCase.equivalent_citations}</span>
                  )}
                </div>
              </div>

              {/* Bench Composition & Statutes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-[#12162d] border border-white/5 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                    <Users className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Bench Composition</span>
                  </div>
                  <p className="text-white font-semibold">{selectedCase.bench_strength || 'Bench details'}</p>
                  {selectedCase.presiding_judges && (
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{selectedCase.presiding_judges}</p>
                  )}
                </div>

                <div className="bg-[#12162d] border border-white/5 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                    <Scale className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Statutes Interpreted</span>
                  </div>
                  <p className="text-indigo-300 font-medium line-clamp-2">
                    {selectedCase.statutes_interpreted || 'Indian Penal / Procedural Code'}
                  </p>
                </div>
              </div>

              {/* Ratio Decidendi (Binding Law) */}
              <div className="bg-gradient-to-br from-indigo-950/40 to-slate-900/60 border border-indigo-500/30 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider">
                  <Award className="w-4 h-4" />
                  <span>Ratio Decidendi (Binding Rule of Law)</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed font-normal">
                  {selectedCase.ratio_decidendi}
                </p>
              </div>

              {/* Obiter Dicta */}
              {selectedCase.obiter_dicta && (
                <div className="bg-white/3 border border-white/10 rounded-xl p-3.5 space-y-1">
                  <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Obiter Dicta & Judicial Observations
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed italic">{selectedCase.obiter_dicta}</p>
                </div>
              )}

              {/* Practical Litigation Utility */}
              {selectedCase.litigation_utility && (
                <div className="bg-[#12162d] border border-emerald-500/20 rounded-xl p-3.5 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Litigation Practice & Arguments</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">{selectedCase.litigation_utility}</p>
                </div>
              )}

              {/* Current Validity Status */}
              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                <span className="text-slate-400">Precedent Validity Status:</span>
                <span className="text-emerald-400 font-semibold bg-emerald-950/50 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  {selectedCase.status || 'Good Law'}
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-[#0b0e20] border border-white/5 rounded-2xl p-12 text-center text-xs text-slate-500">
              Select any landmark judgment from the left list or search a citation to view its judicial brief.
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
