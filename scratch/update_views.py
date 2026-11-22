import os

def update_views():
    # 1. Update CitizenView.jsx
    cz_path = os.path.abspath('jurisai/frontend/src/components/CitizenView.jsx')
    with open(cz_path, 'r', encoding='utf-8') as f:
        cz_code = f.read()

    old_cz_statutes = '''      {/* Applicable Statutes */}
      {data.applicable_statutes?.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-slate-300">
              {lawsTitle}
              <span className="ml-2 text-xs text-slate-600 font-normal">
                ({data.applicable_statutes.length} found)
              </span>
            </h3>
          </div>
          <div className="grid gap-3">
            {data.applicable_statutes.map((statute, i) => (
              <CitationCard key={`statute-${i}`} item={statute} type="statute" index={i} />
            ))}
          </div>
        </div>
      )}'''

    new_cz_statutes = '''      {/* Applicable Statutes — Top 3 Max to Minimize Height */}
      {data.applicable_statutes?.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <h3 className="text-xs sm:text-sm font-semibold text-slate-300">
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
      )}'''

    if old_cz_statutes not in cz_code:
        old_cz_statutes = old_cz_statutes.replace('\n', '\r\n')
        new_cz_statutes = new_cz_statutes.replace('\n', '\r\n')

    assert old_cz_statutes in cz_code, "old_cz_statutes not found in CitizenView.jsx"
    cz_code = cz_code.replace(old_cz_statutes, new_cz_statutes, 1)

    with open(cz_path, 'w', encoding='utf-8') as f:
        f.write(cz_code)
    print("CitizenView.jsx updated to Top 3 statutes!")

    # 2. Update AdvocateView.jsx
    adv_path = os.path.abspath('jurisai/frontend/src/components/AdvocateView.jsx')
    with open(adv_path, 'r', encoding='utf-8') as f:
        adv_code = f.read()

    old_adv_statutes = '''      {/* Applicable Statutes */}
      {data.applicable_statutes?.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-slate-300">
              Applicable Statutes
              <span className="ml-2 text-xs text-slate-500 font-normal">
                ({data.applicable_statutes.length})
              </span>
            </h3>
          </div>
          <div className="grid gap-3">
            {data.applicable_statutes.map((s, i) => (
              <CitationCard key={`statute-adv-${i}`} item={s} type="statute" index={i} />
            ))}
          </div>
        </div>
      )}'''

    new_adv_statutes = '''      {/* Applicable Statutes — Top 3 Max */}
      {data.applicable_statutes?.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <h3 className="text-xs sm:text-sm font-semibold text-slate-300">
              Applicable Statutes
              <span className="ml-2 text-[11px] text-slate-500 font-normal">
                (Top {Math.min(3, data.applicable_statutes.length)})
              </span>
            </h3>
          </div>
          <div className="grid gap-2">
            {data.applicable_statutes.slice(0, 3).map((s, i) => (
              <CitationCard key={`statute-adv-${i}`} item={s} type="statute" index={i} />
            ))}
          </div>
        </div>
      )}'''

    if old_adv_statutes not in adv_code:
        old_adv_statutes = old_adv_statutes.replace('\n', '\r\n')
        new_adv_statutes = new_adv_statutes.replace('\n', '\r\n')

    assert old_adv_statutes in adv_code, "old_adv_statutes not found in AdvocateView.jsx"
    adv_code = adv_code.replace(old_adv_statutes, new_adv_statutes, 1)

    # In AdvocateView, also cap precedents to top 2
    old_prec_map = '{data.relevant_precedents.map((p, i) => ('
    new_prec_map = '{data.relevant_precedents.slice(0, 2).map((p, i) => ('
    if old_prec_map in adv_code:
        adv_code = adv_code.replace(old_prec_map, new_prec_map, 1)

    with open(adv_path, 'w', encoding='utf-8') as f:
        f.write(adv_code)
    print("AdvocateView.jsx updated to Top 3 statutes and Top 2 precedents!")

if __name__ == '__main__':
    update_views()
