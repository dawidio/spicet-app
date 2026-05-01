import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getChart,
  findComparisonByChartIds,
  createEmptyComparison,
  saveComparison,
  getStudentProfile,
} from '../lib/db';
import { CATEGORIES_ORDER, CATEGORY_CONFIG } from '../data/prompts';
import AnnotationStrip from './AnnotationStrip';
import { Save, CheckCircle, FileDown } from 'lucide-react';
import { exportComparisonPDF } from '../lib/export';

export default function CompareView({ chartIds, onBack }) {
  const [charts, setCharts] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const saveTimerRef = useRef(null);

  // Load charts and find/create comparison
  useEffect(() => {
    async function load() {
      const loadedCharts = (
        await Promise.all(chartIds.map((id) => getChart(id)))
      ).filter(Boolean);
      setCharts(loadedCharts);

      // Find existing comparison or create new one
      let comp = await findComparisonByChartIds(chartIds);
      if (!comp) {
        comp = createEmptyComparison(chartIds);
      }
      setComparison(comp);
      setLoading(false);
    }
    load();
  }, [chartIds]);

  // Auto-save
  const doSave = useCallback(async (compData) => {
    setSaving(true);
    try {
      const id = await saveComparison(compData);
      if (!compData.id) {
        setComparison((prev) => ({ ...prev, id }));
      }
      setLastSaved(new Date());
    } catch (err) {
      console.error('Save comparison failed:', err);
    }
    setSaving(false);
  }, []);

  const scheduleAutosave = useCallback(
    (updatedComp) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        doSave(updatedComp);
      }, 800);
    },
    [doSave]
  );

  const updateAnnotation = useCallback(
    (categoryKey, field, value) => {
      setComparison((prev) => {
        const updated = {
          ...prev,
          annotations: {
            ...prev.annotations,
            [categoryKey]: {
              ...prev.annotations[categoryKey],
              [field]: value,
            },
          },
        };
        scheduleAutosave(updated);
        return updated;
      });
    },
    [scheduleAutosave]
  );

  const handleExportPDF = useCallback(async () => {
    const profile = await getStudentProfile();
    exportComparisonPDF(charts, comparison, profile);
  }, [charts, comparison]);

  if (loading || !comparison) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-500">Loading comparison...</div>
      </div>
    );
  }

  // Color assignments for each chart column
  const columnColors = [
    { border: 'border-t-blue-500', bg: 'bg-blue-50', dot: 'bg-blue-500' },
    { border: 'border-t-emerald-500', bg: 'bg-emerald-50', dot: 'bg-emerald-500' },
    { border: 'border-t-amber-500', bg: 'bg-amber-50', dot: 'bg-amber-500' },
    { border: 'border-t-purple-500', bg: 'bg-purple-50', dot: 'bg-purple-500' },
  ];

  const colorClasses = {
    social: 'bg-social-bg border-social',
    political: 'bg-political-bg border-political',
    interactions: 'bg-interactions-bg border-interactions',
    cultural: 'bg-cultural-bg border-cultural',
    economic: 'bg-economic-bg border-economic',
    technological: 'bg-technological-bg border-technological',
  };

  return (
    <div className="max-w-[100vw] overflow-x-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800">
            Comparing {charts.length} Charts
          </h2>
          <p className="text-sm text-gray-500 mt-1 hidden sm:block">
            Review entries side by side, then write your analysis below each category
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportPDF}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5 text-gray-600"
          >
            <FileDown size={15} />
            Export PDF
          </button>
          <div className="flex items-center gap-2 text-sm text-gray-500">
          {saving ? (
            <>
              <Save size={16} className="animate-pulse" />
              Saving...
            </>
          ) : lastSaved ? (
            <>
              <CheckCircle size={16} className="text-green-500" />
              Saved {lastSaved.toLocaleTimeString()}
            </>
          ) : (
            <span className="text-gray-400">Auto-saves as you type</span>
          )}
          </div>
        </div>
      </div>

      {/* Chart column headers - sticky */}
      <div
        className="grid gap-3 mb-4 sticky top-[57px] z-10"
        style={{
          gridTemplateColumns: `repeat(${charts.length}, minmax(220px, 1fr))`,
        }}
      >
        {charts.map((chart, i) => (
          <div
            key={chart.id}
            className={`rounded-lg border-t-4 ${columnColors[i].border} ${columnColors[i].bg} p-3 shadow-sm`}
          >
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${columnColors[i].dot} shrink-0`} />
              <h3 className="font-bold text-gray-900 truncate">
                {chart.empireName || 'Untitled'}
              </h3>
            </div>
            <p className="text-sm text-gray-600 mt-0.5">
              {chart.region}
              {chart.dateRange ? ` \u2022 ${chart.dateRange}` : ''}
            </p>
            {chart.unitNumber && (
              <span className="inline-block mt-1 text-xs bg-white/70 text-gray-600 px-2 py-0.5 rounded-full">
                Unit {chart.unitNumber}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Categories side by side with annotation strips */}
      {CATEGORIES_ORDER.map((catKey) => {
        const config = CATEGORY_CONFIG[catKey];
        return (
          <div key={catKey} className="mb-6">
            {/* Category label */}
            <div
              className={`${colorClasses[catKey]} border-l-4 rounded-t-lg px-4 py-2.5`}
            >
              <h4 className="font-semibold text-gray-800 text-lg">
                {config.label}
              </h4>
            </div>

            {/* Side-by-side entries */}
            <div
              className="grid gap-3 bg-white border-x border-gray-200 p-4"
              style={{
                gridTemplateColumns: `repeat(${charts.length}, minmax(220px, 1fr))`,
              }}
            >
              {charts.map((chart, i) => {
                const entries = chart.categories?.[catKey]?.entries || [];
                const filledEntries = entries.filter((e) => e.claim.trim());
                return (
                  <div key={chart.id} className="space-y-2">
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className={`w-2 h-2 rounded-full ${columnColors[i].dot}`} />
                      <span className="text-xs font-medium text-gray-500">
                        {chart.empireName}
                      </span>
                    </div>
                    {filledEntries.length === 0 ? (
                      <p className="text-sm text-gray-400 italic py-2">
                        No entries yet
                      </p>
                    ) : (
                      filledEntries.map((entry, j) => (
                        <div
                          key={j}
                          className="bg-gray-50 rounded-lg p-3 text-sm border border-gray-100"
                        >
                          <p className="text-gray-800 font-medium leading-snug">
                            {entry.claim}
                          </p>
                          {entry.evidence && (
                            <p className="text-gray-600 mt-1.5 text-xs leading-relaxed">
                              <span className="font-semibold text-gray-500">Evidence:</span>{' '}
                              {entry.evidence}
                            </p>
                          )}
                          {entry.citation && (
                            <p className="text-gray-400 mt-1 text-xs italic">
                              {entry.citation}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                );
              })}
            </div>

            {/* Annotation strip - the key Phase 2 feature */}
            <div className="border-x border-b border-gray-200 rounded-b-lg bg-white px-4 pb-3">
              <AnnotationStrip
                categoryKey={catKey}
                annotation={comparison.annotations[catKey]}
                onUpdate={(field, value) =>
                  updateAnnotation(catKey, field, value)
                }
              />
            </div>
          </div>
        );
      })}

      {/* Summary footer */}
      <div className="mt-8 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
        <h3 className="font-semibold text-gray-800 mb-2">
          Analysis Tips
        </h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>
            <span className="font-medium text-emerald-700">Similarities:</span>{' '}
            Look for patterns across empires — shared trade routes, similar governance, common religious influences.
          </li>
          <li>
            <span className="font-medium text-orange-700">Differences:</span>{' '}
            Go beyond surface-level. Why did these societies diverge? What conditions led to different outcomes?
          </li>
          <li>
            <span className="font-medium text-blue-700">CCOT:</span>{' '}
            Track what evolved and what persisted. Ask: what <em>caused</em> the change? What forces maintained continuity?
          </li>
        </ul>
      </div>
    </div>
  );
}
