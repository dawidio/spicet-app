import { useState, useEffect } from 'react';
import { getAllReviews, getAllStudySessions, syncReviews } from '../lib/db';
import { getCategoriesOrder, getCategoryConfig } from '../data/prompts';
import { isMastered, MASTERY_CRITERION } from '../lib/spacing';
import { TrendingUp, History } from 'lucide-react';

// Cells report the share of that chart+theme's entries that have finished the
// learning phase (3 correct retrievals) — current scheduler state, not a
// running average of ratings. Entries never retrieved read as "Not started".
function masteryColor(stats) {
  if (!stats || stats.total === 0) return 'bg-gray-100 text-gray-400';
  if (stats.retrievals === 0) return 'bg-gray-100 text-gray-400';
  const pct = stats.mastered / stats.total;
  if (pct === 0) return 'bg-red-100 text-red-600';
  if (pct < 0.5) return 'bg-orange-100 text-orange-600';
  if (pct < 1) return 'bg-yellow-100 text-yellow-600';
  return 'bg-green-100 text-green-600';
}

function masteryLabel(stats) {
  if (!stats || stats.total === 0) return 'No entries';
  if (stats.retrievals === 0) return 'Not started';
  const pct = stats.mastered / stats.total;
  if (pct === 0) return 'Needs work';
  if (pct < 0.5) return 'Learning';
  if (pct < 1) return 'Almost there';
  return 'Mastered';
}

function cellText(stats) {
  if (!stats || stats.total === 0) return '—';
  if (stats.retrievals === 0) return '—';
  return `${stats.mastered}/${stats.total}`;
}

function CourseTable({ course, charts, lookup }) {
  const catOrder = getCategoriesOrder(course);
  const catConfig = getCategoryConfig(course);
  const courseLabel = course === 'apush' ? 'AP United States History' : 'AP World History: Modern';

  return (
    <div className="mb-8">
      <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">{courseLabel}</h4>
      <div className="inline-block min-w-full">
        <table className="border-collapse">
          <thead>
            <tr>
              <th className="text-xs font-medium text-gray-500 text-left p-2 w-28 sticky left-0 bg-white z-10">
                Category
              </th>
              {charts.map(chart => (
                <th
                  key={chart.id}
                  className="text-xs font-medium text-gray-700 text-center p-2 min-w-[110px] max-w-[140px]"
                  title={chart.empireName}
                >
                  <div className="truncate max-w-[130px]">{chart.empireName || 'Untitled'}</div>
                  {chart.dateRange && (
                    <div className="text-gray-400 font-normal">{chart.dateRange}</div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {catOrder.map(catKey => {
              const config = catConfig[catKey];
              return (
                <tr key={catKey}>
                  <td className="text-xs font-medium text-gray-700 p-2 sticky left-0 bg-white z-10 border-t border-gray-100">
                    <span className="font-bold text-gray-500 mr-1">{config.abbr}</span>
                    {config.label}
                  </td>
                  {charts.map(chart => {
                    const stats = lookup[chart.id]?.[catKey];
                    const label = masteryLabel(stats);
                    const detail = stats && stats.total > 0
                      ? ` (${stats.mastered} of ${stats.total} entries past ${MASTERY_CRITERION} correct, ${stats.retrievals} retrieval${stats.retrievals === 1 ? '' : 's'} logged)`
                      : '';
                    return (
                      <td key={chart.id} className="p-1.5 border-t border-gray-100">
                        <div
                          className={`rounded-lg p-2 text-center text-xs font-medium ${masteryColor(stats)}`}
                          title={`${label}${detail}`}
                        >
                          {cellText(stats)}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ProgressMap({ charts }) {
  const [reviews, setReviews] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      // Make sure newly written entries have review rows before we count them.
      await syncReviews();
      const [r, s] = await Promise.all([getAllReviews(), getAllStudySessions()]);
      setReviews(r);
      setSessions(s);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-400">
        Loading progress...
      </div>
    );
  }

  if (charts.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <TrendingUp size={40} className="mx-auto mb-3 opacity-30" />
        <p>No charts yet. Create charts to track your mastery.</p>
      </div>
    );
  }

  // Build lookup: { chartId: { categoryKey: { total, mastered, retrievals } } }
  const lookup = {};
  for (const r of reviews) {
    if (!lookup[r.chartId]) lookup[r.chartId] = {};
    const bucket = lookup[r.chartId][r.categoryKey] || { total: 0, mastered: 0, retrievals: 0 };
    bucket.total += 1;
    if (isMastered(r)) bucket.mastered += 1;
    bucket.retrievals += (r.history || []).length;
    lookup[r.chartId][r.categoryKey] = bucket;
  }

  const totalRetrievals = reviews.reduce((n, r) => n + (r.history || []).length, 0);

  const apwhmCharts = charts.filter(c => (c.course || 'apwhm') === 'apwhm');
  const apushCharts = charts.filter(c => c.course === 'apush');

  const finishedSessions = sessions.filter(s => s.endedAt);

  return (
    <div className="overflow-x-auto">
      <div className="mb-4 flex items-center gap-2">
        <TrendingUp size={20} className="text-primary" />
        <h3 className="text-lg font-bold text-gray-800">Mastery Progress</h3>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-6 text-xs">
        {[
          { color: 'bg-gray-100', label: 'Not started' },
          { color: 'bg-red-100', label: 'Needs work' },
          { color: 'bg-orange-100', label: 'Learning' },
          { color: 'bg-yellow-100', label: 'Almost there' },
          { color: 'bg-green-100', label: 'Mastered' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={`w-4 h-4 rounded ${color} border border-gray-200`} />
            <span className="text-gray-600">{label}</span>
          </div>
        ))}
        <span className="text-gray-400">
          Cells show entries past the {MASTERY_CRITERION}-correct learning criterion, out of entries in that theme.
        </span>
      </div>

      {apwhmCharts.length > 0 && (
        <CourseTable course="apwhm" charts={apwhmCharts} lookup={lookup} />
      )}
      {apushCharts.length > 0 && (
        <CourseTable course="apush" charts={apushCharts} lookup={lookup} />
      )}

      {totalRetrievals === 0 && (
        <p className="text-sm text-gray-400 mt-4 text-center">
          Use "Start review" to begin building your retrieval record.
        </p>
      )}

      {finishedSessions.length > 0 && (
        <div className="mt-8 max-w-xl">
          <div className="flex items-center gap-2 mb-3">
            <History size={16} className="text-gray-400" />
            <h4 className="text-sm font-semibold text-gray-700">Recent review sessions</h4>
          </div>
          <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
            {finishedSessions.slice(0, 8).map(s => (
              <div key={s.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <span className="text-gray-700">
                  {new Date(s.startedAt).toLocaleDateString()}
                </span>
                <span className="text-xs text-gray-400">
                  {s.mode === 'all' ? 'All entries' : 'Due today'}
                </span>
                <span className="text-gray-500 ml-auto">
                  {s.itemsCorrect}/{s.itemsTotal} knew it
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
