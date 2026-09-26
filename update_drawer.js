const fs = require('fs');

const path = 'app/discover/page.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Remove Sparkles from the lucide-react import
code = code.replace(/Sparkles,\s*/, '');

// 2. Replace the collapsible drawer markup with an animated container without the icon
const oldDrawerRegex = /\{\/\* Collapsible Filters Drawer \*\/\}[\s\S]*?\{\/\* Prioritized Horizontal Country Chips \*\/\}/;

const newDrawer = `{/* Collapsible Filters Drawer (Smooth Height & Opacity Transition) */}
        <div 
          className={\`grid transition-all duration-300 ease-in-out \${
            filtersOpen 
              ? 'grid-rows-[1fr] opacity-100 mb-2' 
              : 'grid-rows-[0fr] opacity-0 pointer-events-none'
          }\`}
        >
          <div className="overflow-hidden">
            <div className="bg-[#1D1726] border border-[#7D7E92]/35 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#7D7E92]/20 pb-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Refine Matches</h4>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={resetFilters}
                    className="flex items-center gap-1.5 text-xs text-[#9A79BA] hover:text-white transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset all
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
                
                {/* Age Range Filter */}
                <div>
                  <label className="block text-xs font-semibold text-[#D5CEE5] mb-2">
                    Age Range: <span className="text-white font-mono">{minAge} - {maxAge}</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="18"
                      max={maxAge}
                      value={minAge}
                      onChange={(e) => setMinAge(Math.min(Number(e.target.value), maxAge))}
                      className="w-16 px-2 py-1.5 bg-[#261F33] border border-[#7D7E92]/30 rounded-xl text-xs text-white text-center focus:border-[#9A79BA] outline-none"
                    />
                    <span className="text-xs text-[#7D7E92]">to</span>
                    <input
                      type="number"
                      min={minAge}
                      max="80"
                      value={maxAge}
                      onChange={(e) => setMaxAge(Math.max(Number(e.target.value), minAge))}
                      className="w-16 px-2 py-1.5 bg-[#261F33] border border-[#7D7E92]/30 rounded-xl text-xs text-white text-center focus:border-[#9A79BA] outline-none"
                    />
                  </div>
                </div>

                {/* Relationship Intent Filter */}
                <div>
                  <label className="block text-xs font-semibold text-[#D5CEE5] mb-2">
                    Relationship Intent
                  </label>
                  <select
                    value={selectedIntent}
                    onChange={(e) => setSelectedIntent(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#261F33] border border-[#7D7E92]/30 rounded-xl text-xs text-white focus:border-[#9A79BA] outline-none"
                  >
                    {RELATIONSHIP_INTENTS.map((intent) => (
                      <option key={intent} value={intent} className="bg-[#1D1726] text-white">
                        {intent}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Verified Only Toggle */}
                <div className="flex items-center justify-between sm:justify-start sm:gap-3 pt-2 sm:pt-6">
                  <span className="text-xs font-semibold text-[#D5CEE5]">Verified Members Only</span>
                  <button
                    type="button"
                    onClick={() => setVerifiedOnly(!verifiedOnly)}
                    className={\`w-10 h-6 rounded-full p-1 transition-colors \${
                      verifiedOnly ? 'bg-[#653C87]' : 'bg-[#261F33] border border-[#7D7E92]/40'
                    }\`}
                  >
                    <div
                      className={\`w-4 h-4 rounded-full bg-white transition-transform \${
                        verifiedOnly ? 'translate-x-4' : 'translate-x-0'
                      }\`}
                    />
                  </button>
                </div>

                {/* Active Today Toggle */}
                <div className="flex items-center justify-between sm:justify-start sm:gap-3 pt-2 sm:pt-6">
                  <span className="text-xs font-semibold text-[#D5CEE5]">Active Now / Today</span>
                  <button
                    type="button"
                    onClick={() => setActiveNowOnly(!activeNowOnly)}
                    className={\`w-10 h-6 rounded-full p-1 transition-colors \${
                      activeNowOnly ? 'bg-emerald-600' : 'bg-[#261F33] border border-[#7D7E92]/40'
                    }\`}
                  >
                    <div
                      className={\`w-4 h-4 rounded-full bg-white transition-transform \${
                        activeNowOnly ? 'translate-x-4' : 'translate-x-0'
                      }\`}
                    />
                  </button>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Prioritized Horizontal Country Chips */}`;

code = code.replace(oldDrawerRegex, newDrawer);
fs.writeFileSync(path, code, 'utf8');
console.log('SMOOTH_DRAWER_UPDATED');
