import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getChart,
  findComparisonByChartIds,
  createEmptyComparison,
  saveComparison,
  getStudentProfile,
} from '../lib/db';
import { getCategoriesOrder, getCategoryConfig } from '../data/prompts';
import { getThemeKeywords } from '../data/theme-keywords';
import AnnotationStrip from './AnnotationStrip';
import ImportedBadge from './ImportedBadge';
import { Save, CheckCircle, FileDown, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { exportComparisonPDF } from '../lib/export';
import { diffCategory } from '../lib/diff';

const DIFF_PILL = {
  similar: 'bg-green-100 text-green-700 border border-green-200',
  different: 'bg-orange-100 text-orange-700 border border-orange-200',
  unique: 'bg-gray-100 text-gray-500 border border-gray-200',
};

const DIFF_LABEL = {
  similar: '≈ Similar',
  different: '≠ Different',
  unique: '◆ Unique',
};

function ThesisStarter({ catKey, charts, course }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');

  const catConfig = getCategoryConfig(course);
  const emp1 = charts[0]?.empireName || '[Entry 1]';
  const emp2 = charts[1]?.empireName || '[Entry 2]';
  const catLabel = catConfig[catKey]?.label || catKey;

  const template = `While both ${emp1} and ${emp2} shared [similarity area] in their ${catLabel}, they differed significantly in [difference area], suggesting that...`;

  useEffect(() => {
    setText(template);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catKey, emp1, emp2]);

  return (
    <div className="mt-2 border border-blue-100 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2 bg-blue-50 hover:bg-blue-100 text-xs text-blue-700 font-medium transition-colors"
      >
        <span>Thesis Starter</span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {open && (
        <div className="p-3">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            rows={3}
            className="w-full px-2 py-2 text-xs border border-blue-100 rounded-lg focus:ring-1 focus:ring-blue-300 outline-none resize-y text-gray-700 leading-relaxed"
          />
          <p className="text-xs text-gray-400 mt-1">Edit this draft thesis. It won't be saved automatically.</p>
        </div>
      )}
    </div>
  );
}

export default function CompareView({ chartIds, onBack }) {
  const [charts, setCharts] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const saveTimerRef = useRef(null);

  useEffect(() => {
    async function load() {
      const loadedCharts = (
        await Promise.all(chartIds.map((id) => getChart(id)))
      ).filter(Boolean);
      setCharts(loadedCharts);

      let comp = await findComparisonByChartIds(chartIds);
      // Seed annotations for the course's own themes — AnnotationStrip reads
      // annotation.similarities directly, so the slots have to exist.
      if (!comp) comp = createEmptyComparison(chartIds, loadedCharts[0]?.course || 'apwhm');
      setComparison(comp);
      setLoading(false);
    }
    load();
  }, [chartIds]);

  const doSave = useCallback(async (compData) => {
    setSaving(true);
    try {
      const id = await saveComparison(compData);
      if (!compData.id) setComparison((prev) => ({ ...prev, id }));
      setLastSaved(new Date());
    } catch (err) {
      console.error('Save comparison failed:', err);
    }
    setSaving(false);
  }, []);

  const scheduleAutosave = useCallback((updatedComp) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => doSave(updatedComp), 800);
  }, [doSave]);

  const updateAnnotation = useCallback((categoryKey, field, value) => {
    setComparison((prev) => {
      const updated = {
        ...prev,
        annotations: {
          ...prev.annotations,
          [categoryKey]: { ...prev.annotations[categoryKey], [field]: value },
        },
      };
      scheduleAutosave(updated);
      return updated;
    });
  }, [scheduleAutosave]);

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

  // Cross-course guard
  const courses = [...new Set(charts.map(c => c.course || 'apwhm'))];
  if (courses.length > 1) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <AlertTriangle size={40} className="mx-auto mb-4 text-amber-500" />
        <h2 className="text-xl font-bold text-gray-800 mb-2">Cross-course comparison not supported</h2>
        <p className="text-gray-500 mb-6">
          You've selected charts from different courses (APWHM and APUSH). Compare charts from the same course — they use different theme categories and can't be meaningfully compared side by side.
        </p>
        <button
          onClick={onBack}
          className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const course = courses[0] || 'apwhm';
  const categoriesOrder = getCategoriesOrder(course);
  const categoryConfig = getCategoryConfig(course);
  const themeKeywords = getThemeKeywords(course);

  // Build a category color lookup from theme keywords (keyed by abbr = catKey)
  function getCatHeaderClass(catKey) {
    const color = themeKeywords[catKey]?.color || 'text-gray-600 bg-gray-50 border-gray-200';
    // color is e.g. "text-green-700 bg-green-50 border-green-200" — use bg + border-l
    return color; // reuse theme color string directly for the header
  }

  const columnColors = [
    { border: 'border-t-blue-500', bg: 'bg-blue-50', dot: 'bg-blue-500' },
    { border: 'border-t-emerald-500', bg: 'bg-emerald-50', dot: 'bg-emerald-500' },
    { border: 'border-t-amber-500', bg: 'bg-amber-50', dot: 'bg-amber-500' },
    { border: 'border-t-purple-500', bg: 'bg-purple-50', dot: 'bg-purple-500' },
  ];

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
              <><Save size={16} className="animate-pulse" />Saving...</>
            ) : lastSaved ? (
              <><CheckCircle size={16} className="text-green-500" />Saved {lastSaved.toLocaleTimeString()}</>
            ) : (
              <span className="text-gray-400">Auto-saves as you type</span>
            )}
          </div>
        </div>
      </div>

      {/* Chart column headers */}
      <div
        className="grid gap-3 mb-4 sticky top-[57px] z-10"
        style={{ gridTemplateColumns: `repeat(${charts.length}, minmax(220px, 1fr))` }}
      >
        {charts.map((chart, i) => (
          <div
            key={chart.id}
            className={`rounded-lg border-t-4 ${columnColors[i].border} ${columnColors[i].bg} p-3 shadow-sm`}
          >
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${columnColors[i].dot} shrink-0`} />
              <h3 className="font-bold text-gray-900 truncate">{chart.empireName || 'Untitled'}</h3>
            </div>
            <p className="text-sm text-gray-600 mt-0.5">
              {chart.region}{chart.dateRange ? ` • ${chart.dateRange}` : ''}
            </p>
            {chart.unitNumber && (
              <span className="inline-block mt-1 text-xs bg-white/70 text-gray-600 px-2 py-0.5 rounded-full">
                Unit {chart.unitNumber}
              </span>
            )}
            {chart.importedFrom && (
              <div className="mt-1.5">
                <ImportedBadge importedFrom={chart.importedFrom} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Categories */}
      {categoriesOrder.map((catKey) => {
        const config = categoryConfig[catKey];
        const diffTags = diffCategory(charts, catKey);
        const headerColor = getCatHeaderClass(catKey);

        return (
          <div key={catKey} className="mb-6">
            <div className={`border-l-4 rounded-t-lg px-4 py-2.5 ${headerColor}`}>
              <h4 className="font-semibold text-gray-800 text-lg flex items-center gap-2">
                {config.abbr && (
                  <span className="text-xs font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-white/70 text-gray-700 border border-gray-200">
                    {config.abbr}
                  </span>
                )}
                {config.label}
              </h4>
            </div>

            <div
              className="grid gap-3 bg-white border-x border-gray-200 p-4"
              style={{ gridTemplateColumns: `repeat(${charts.length}, minmax(220px, 1fr))` }}
            >
              {charts.map((chart, i) => {
                const entries = chart.categories?.[catKey]?.entries || [];
                const filledEntries = entries.filter((e) => e.claim.trim());
                const tagRow = diffTags[i] || [];
                return (
                  <div key={chart.id} className="space-y-2">
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className={`w-2 h-2 rounded-full ${columnColors[i].dot}`} />
                      <span className="text-xs font-medium text-gray-500">{chart.empireName}</span>
                    </div>
                    {filledEntries.length === 0 ? (
                      <p className="text-sm text-gray-400 italic py-2">No entries yet</p>
                    ) : (
                      filledEntries.map((entry, j) => {
                        const tag = tagRow[j] || 'unique';
                        return (
                          <div key={j} className="bg-gray-50 rounded-lg p-3 text-sm border border-gray-100">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <p className="text-gray-800 font-medium leading-snug flex-1">{entry.claim}</p>
                              <span className={`text-xs px-1.5 py-0.5 rounded-full whitespace-nowrap shrink-0 ${DIFF_PILL[tag]}`}>
                                {DIFF_LABEL[tag]}
                              </span>
                            </div>
                            {entry.evidence && (
                              <p className="text-gray-600 mt-1.5 text-xs leading-relaxed">
                                <span className="font-semibold text-gray-500">Evidence:</span>{' '}
                                {entry.evidence}
                              </p>
                            )}
                            {entry.citation && (
                              <p className="text-gray-400 mt-1 text-xs italic">{entry.citation}</p>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                );
              })}
            </div>

            <div className="border-x border-b border-gray-200 rounded-b-lg bg-white px-4 pb-3">
              <AnnotationStrip
                categoryKey={catKey}
                annotation={
                  comparison.annotations?.[catKey] || {
                    similarities: '',
                    differences: '',
                    ccot: '',
                  }
                }
                onUpdate={(field, value) => updateAnnotation(catKey, field, value)}
              />
              <ThesisStarter catKey={catKey} charts={charts} course={course} />
            </div>
          </div>
        );
      })}

      <div className="mt-8 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
        <h3 className="font-semibold text-gray-800 mb-2">Analysis Tips</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>
            <span className="font-medium text-emerald-700">Similarities:</span>{' '}
            Look for patterns across charts — shared trade networks, similar governance, common influences.
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
