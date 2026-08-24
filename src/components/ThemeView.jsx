import { useMemo } from 'react';
import { getThemeKeywords, getThemeOrder, APWHM_THEME_ORDER, APUSH_THEME_ORDER } from '../data/theme-keywords';
import { classifyChart } from '../lib/theme-classifier';
import { getCategoryConfig } from '../data/prompts';
import { Tag } from 'lucide-react';

export default function ThemeView({ charts }) {
  const { byTheme, hasApwhm, hasApush } = useMemo(() => {
    const result = {};
    // Seed both course theme sets
    for (const abbr of APWHM_THEME_ORDER) result[abbr] = [];
    for (const abbr of APUSH_THEME_ORDER) result[abbr] = [];

    let apwhmFound = false;
    let apushFound = false;

    for (const chart of charts) {
      const course = chart.course || 'apwhm';
      if (course === 'apwhm') apwhmFound = true;
      if (course === 'apush') apushFound = true;

      const classification = classifyChart(chart);
      for (const [cat, catData] of Object.entries(chart.categories || {})) {
        const entries = catData.entries || [];
        entries.forEach((entry, idx) => {
          if (!entry.claim?.trim()) return;
          const themes = classification[cat]?.[idx] || [];
          for (const abbr of themes) {
            if (result[abbr]) {
              result[abbr].push({
                chartId: chart.id,
                chartName: chart.empireName || 'Untitled',
                chartCourse: course,
                category: cat,
                entryIndex: idx,
                claim: entry.claim,
                evidence: entry.evidence || '',
                citation: entry.citation || '',
              });
            }
          }
        });
      }
    }
    return { byTheme: result, hasApwhm: apwhmFound, hasApush: apushFound };
  }, [charts]);

  if (charts.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <Tag size={40} className="mx-auto mb-3 opacity-30" />
        <p>No charts yet. Create charts to see theme analysis.</p>
      </div>
    );
  }

  function ThemeSection({ course, themeOrder }) {
    const themeKeywords = getThemeKeywords(course);
    const catConfig = getCategoryConfig(course);
    const courseLabel = course === 'apush' ? 'AP US History' : 'AP World History: Modern';

    return (
      <div>
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{courseLabel} Themes</h4>
        <div className="space-y-4">
          {themeOrder.map(abbr => {
            const theme = themeKeywords[abbr];
            const entries = byTheme[abbr] || [];
            return (
              <div key={abbr} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className={`px-4 py-3 border-b ${theme.color} flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full border font-mono">
                      {abbr}
                    </span>
                    <h4 className="font-semibold text-sm">{theme.label}</h4>
                  </div>
                  <span className="text-xs opacity-70">
                    {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
                  </span>
                </div>

                {entries.length === 0 ? (
                  <div className="px-4 py-5 text-sm text-gray-400 italic text-center">
                    No entries matched this theme across your charts.
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {entries.map((entry, i) => {
                      const cfg = catConfig[entry.category];
                      const catColor = getThemeKeywords(entry.chartCourse)[entry.category]?.color
                        || 'text-gray-600 bg-gray-50 border-gray-200';
                      const catLabel = cfg?.label || entry.category;
                      const catAbbr = cfg?.abbr;
                      return (
                        <div key={i} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full font-medium">
                              {entry.chartName}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${catColor}`}>
                              {catAbbr && <span className="font-bold uppercase mr-1">{catAbbr}</span>}
                              {catLabel}
                            </span>
                          </div>
                          <p className="text-sm text-gray-900 font-medium leading-snug">{entry.claim}</p>
                          {entry.evidence && (
                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                              <span className="font-semibold">Evidence:</span> {entry.evidence}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2">
        <Tag size={20} className="text-primary" />
        <h3 className="text-lg font-bold text-gray-800">By AP Theme</h3>
        <span className="text-xs text-gray-400 ml-1">Auto-tagged by keyword matching</span>
      </div>

      {hasApwhm && <ThemeSection course="apwhm" themeOrder={APWHM_THEME_ORDER} />}
      {hasApush && <ThemeSection course="apush" themeOrder={APUSH_THEME_ORDER} />}
    </div>
  );
}
