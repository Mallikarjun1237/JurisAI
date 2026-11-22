import os

def update_dashboard():
    path = os.path.abspath('jurisai/frontend/src/pages/Dashboard.jsx')
    with open(path, 'r', encoding='utf-8') as f:
        code = f.read()

    # 1. Add User import
    old_import = "  Calculator, ShieldCheck, Printer,\n} from 'lucide-react'"
    new_import = "  Calculator, ShieldCheck, Printer, User,\n} from 'lucide-react'"
    if old_import not in code:
        old_import = "  Calculator, ShieldCheck, Printer,\r\n} from 'lucide-react'"
        new_import = "  Calculator, ShieldCheck, Printer, User,\r\n} from 'lucide-react'"

    assert old_import in code, "old_import not found"
    code = code.replace(old_import, new_import, 1)

    # 2. Replace the turn rendering layout
    old_turn_render = """                        {/* Scenario / Question Banner */}
                        <div className="glass-card rounded-2xl p-5 border border-indigo-500/20 relative overflow-hidden shadow-lg">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
                          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                            <span className="flex items-center gap-1.5 font-semibold text-indigo-400">
                              <Scale className="w-3.5 h-3.5" />
                              {isInitial ? 'Legal Scenario Analyzed' : `Follow-up Question #${idx + 1}`}
                            </span>
                            {turn.created_at && (
                              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(turn.created_at).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            )}
                          </div>
                          <p className="text-sm sm:text-base font-medium text-white leading-relaxed">
                            {turn.query_text}
                          </p>
                        </div>

                        {/* Statutory Verification & Authority Telemetry */}
                        <TelemetryCard
                          telemetry={turn.telemetry}
                          confidenceScore={turn.confidence_score}
                          statutesCount={turn.applicable_statutes?.length || 0}
                          precedentsCount={turn.relevant_precedents?.length || 0}
                        />

                        {/* Dual-View Switcher for this Turn */}
                        <div className="flex gap-1 glass rounded-xl p-1 w-fit border border-white/6">
                          <TabButton
                            active={turnView === 'citizen'}
                            onClick={() => setTurnView(turn.query_id, idx, 'citizen')}
                            icon={<Users className="w-3.5 h-3.5" />}
                            label={t('citizenView') || 'Citizen Guide'}
                          />
                          <TabButton
                            active={turnView === 'advocate'}
                            onClick={() => setTurnView(turn.query_id, idx, 'advocate')}
                            icon={<Briefcase className="w-3.5 h-3.5" />}
                            label={t('advocateView') || 'Advocate Brief'}
                          />
                        </div>

                        {/* Turn Content (Citizen vs Advocate) */}
                        <div>
                          {turnView === 'citizen' ? (
                            <CitizenView data={turn} />
                          ) : (
                            <AdvocateView data={turn} isPro={user?.is_pro} />
                          )}
                        </div>"""

    new_turn_render = """                        {/* User Message Bubble (Right-aligned, ChatGPT / Gemini style) */}
                        <div className="flex justify-end mb-4">
                          <div className="max-w-[85%] sm:max-w-2xl bg-indigo-600 text-white rounded-2xl rounded-tr-sm px-5 py-3.5 shadow-lg shadow-indigo-950/40 border border-indigo-400/25">
                            <div className="flex items-center justify-between text-[11px] text-indigo-200/90 mb-1.5 gap-4">
                              <span className="font-semibold tracking-wide flex items-center gap-1.5 uppercase">
                                <User className="w-3.5 h-3.5" />
                                {isInitial ? 'Your Legal Query' : `Follow-up #${idx + 1}`}
                              </span>
                              {turn.created_at && (
                                <span className="flex items-center gap-1 text-[11px] text-indigo-200/80">
                                  <Clock className="w-3 h-3" />
                                  {new Date(turn.created_at).toLocaleTimeString('en-IN', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              )}
                            </div>
                            <p className="text-sm sm:text-base font-normal leading-relaxed whitespace-pre-wrap">
                              {turn.query_text}
                            </p>
                          </div>
                        </div>

                        {/* Assistant Response (Left-aligned, ChatGPT / Gemini style) */}
                        <div className="flex items-start gap-3 w-full">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-md mt-1">
                            <Scale className="w-4 h-4" />
                          </div>
                          <div className="flex-1 space-y-4 min-w-0">
                            {/* Statutory Verification Telemetry Card: ONLY on Initial Assessment (Turn 0) */}
                            {isInitial ? (
                              <TelemetryCard
                                telemetry={turn.telemetry}
                                confidenceScore={turn.confidence_score}
                                statutesCount={turn.applicable_statutes?.length || 0}
                                precedentsCount={turn.relevant_precedents?.length || 0}
                              />
                            ) : (
                              /* Clean, minimal verification badge for follow-ups (NO 3 repeating boxes!) */
                              <div className="flex items-center gap-2 text-xs text-indigo-300/80 bg-indigo-500/5 px-3 py-1.5 rounded-lg border border-indigo-500/15 w-fit">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                <span>Court-Verifiable Statutory Analysis</span>
                                {turn.telemetry?.groundedness_score && (
                                  <span className="text-slate-500">• {turn.telemetry.groundedness_score}% groundedness</span>
                                )}
                              </div>
                            )}

                            {/* Dual-View Switcher for this Turn */}
                            <div className="flex gap-1 glass rounded-xl p-1 w-fit border border-white/6">
                              <TabButton
                                active={turnView === 'citizen'}
                                onClick={() => setTurnView(turn.query_id, idx, 'citizen')}
                                icon={<Users className="w-3.5 h-3.5" />}
                                label={t('citizenView') || 'Citizen Guide'}
                              />
                              <TabButton
                                active={turnView === 'advocate'}
                                onClick={() => setTurnView(turn.query_id, idx, 'advocate')}
                                icon={<Briefcase className="w-3.5 h-3.5" />}
                                label={t('advocateView') || 'Advocate Brief'}
                              />
                            </div>

                            {/* Turn Content (Citizen vs Advocate) */}
                            <div>
                              {turnView === 'citizen' ? (
                                <CitizenView data={turn} />
                              ) : (
                                <AdvocateView data={turn} isPro={user?.is_pro} />
                              )}
                            </div>
                          </div>
                        </div>"""

    if old_turn_render not in code:
        old_turn_render = old_turn_render.replace("\n", "\r\n")
        new_turn_render = new_turn_render.replace("\n", "\r\n")

    assert old_turn_render in code, "old_turn_render not found"
    code = code.replace(old_turn_render, new_turn_render, 1)

    with open(path, 'w', encoding='utf-8') as f:
        f.write(code)
    print("SUCCESS: Dashboard.jsx updated with ChatGPT/Gemini bubble layout & single TelemetryCard!")

if __name__ == '__main__':
    update_dashboard()
