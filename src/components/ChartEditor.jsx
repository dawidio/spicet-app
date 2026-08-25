import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { getChart, saveChart, createEmptyChart, getStudentProfile } from '../lib/db';
import { AP_WORLD_UNITS, APUSH_PERIODS } from '../data/units';
import { getCategoriesOrder, getCategoryConfig } from '../data/prompts';
import { getThemeKeywords } from '../data/theme-keywords';
import CategorySection from './CategorySection';
import ImportedBadge from './ImportedBadge';
import { Save, CheckCircle, FileDown, FileJson } from 'lucide-react';
import { exportChartPDF, exportChartJSON } from '../lib/export';
import { classifyChart } from '../lib/theme-classifier';

export default function ChartEditor({ chartId, initialCourse = 'apwhm', onBack }) {
  const [chart, setChart] = useState(null);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const saveTimerRef = useRef(null);

  useEffect(() => {
    if (chartId) {
      getChart(chartId).then((c) => {
        if (c) setChart(c);
        else setChart({ ...createEmptyChart(initialCourse), id: undefined });
      });
    } else {
      setChart(createEmptyChart(initialCourse));
    }
  }, [chartId, initialCourse]);

  const doSave = useCallback(async (chartData) => {
    setSaving(true);
    try {
      const id = await saveChart(chartData);
      if (!chartData.id) {
        setChart((prev) => ({ ...prev, id }));
      }
      setLastSaved(new Date());
    } catch (err) {
      console.error('Save failed:', err);
    }
    setSaving(false);
  }, []);

  const scheduleAutosave = useCallback((updatedChart) => {
    if (!updatedChart.empireName?.trim()) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      doSave(updatedChart);
    }, 800);
  }, [doSave]);

  const updateField = useCallback((field, value) => {
    setChart((prev) => {
      const updated = { ...prev, [field]: value };
      scheduleAutosave(updated);
      return updated;
    });
  }, [scheduleAutosave]);

  const updateCategory = useCallback((categoryKey, entries) => {
    setChart((prev) => {
      const updated = {
        ...prev,
        categories: { ...prev.categories, [categoryKey]: { entries } },
      };
      scheduleAutosave(updated);
      return updated;
    });
  }, [scheduleAutosave]);

  const handleExportPDF = useCallback(async () => {
    const profile = await getStudentProfile();
    exportChartPDF(chart, profile);
  }, [chart]);

  const handleExportJSON = useCallback(async () => {
    const profile = await getStudentProfile();
    await exportChartJSON(chart, profile);
  }, [chart]);

  const themeClassification = useMemo(() => {
    if (!chart) return {};
    return classifyChart(chart);
  }, [chart]);

  if (!chart) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-500">Loading chart...</div>
      </div>
    );
  }

  const course = chart.course || 'apwhm';
  const categoriesOrder = getCategoriesOrder(course);
  const categoryConfig = getCategoryConfig(course);
  const themeKeywords = getThemeKeywords(course);
  const unitOptions = course === 'apush' ? APUSH_PERIODS : AP_WORLD_UNITS;
  const unitLabel = course === 'apush' ? 'Period' : 'Unit';

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {chart.importedFrom && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
          <ImportedBadge importedFrom={chart.importedFrom} />
          <span className="text-sm text-amber-700">This chart was shared with you. Your edits are saved locally.</span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800">
            {chart.id ? 'Edit Chart' : 'New Theme Chart'}
          </h2>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${course === 'apush' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
            {course === 'apush' ? 'APUSH' : 'APWHM'}
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {chart.id && (
            <>
              <button
                onClick={handleExportJSON}
                className="px-2.5 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5 text-gray-600"
                title="Export as JSON (for sharing)"
              >
                <FileJson size={14} />
                <span className="hidden sm:inline">Export</span> JSON
              </button>
              <button
                onClick={handleExportPDF}
                className="px-2.5 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5 text-gray-600"
              >
                <FileDown size={14} />
                <span className="hidden sm:inline">Export</span> PDF
              </button>
            </>
          )}
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

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {course === 'apush' ? 'Topic / Event Name *' : 'Empire / Region Name *'}
            </label>
            <input
              type="text"
              value={chart.empireName}
              onChange={(e) => updateField('empireName', e.target.value)}
              placeholder={course === 'apush' ? 'e.g., Reconstruction Era' : 'e.g., Mongol Empire'}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-light focus:border-primary-light outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
            <input
              type="text"
              value={chart.region}
              onChange={(e) => updateField('region', e.target.value)}
              placeholder={course === 'apush' ? 'e.g., Southern United States' : 'e.g., Central Asia'}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-light focus:border-primary-light outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <input
              type="text"
              value={chart.dateRange}
              onChange={(e) => updateField('dateRange', e.target.value)}
              placeholder="e.g., 1865–1877"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-light focus:border-primary-light outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{unitLabel}</label>
            <select
              value={chart.unitNumber ?? ''}
              onChange={(e) =>
                updateField('unitNumber', e.target.value ? Number(e.target.value) : null)
              }
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-primary-light outline-none"
            >
              <option value="">Select {unitLabel}...</option>
              {unitOptions.map((u) => (
                <option key={u.number} value={u.number}>
                  {unitLabel} {u.number}: {u.name} ({u.dateRange})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {categoriesOrder.map((catKey) => {
          const catClassification = themeClassification[catKey] || {};
          const allThemes = new Set();
          Object.values(catClassification).forEach(themes => {
            themes.forEach(t => allThemes.add(t));
          });
          const themeList = Array.from(allThemes);

          return (
            <div key={catKey}>
              {themeList.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-1.5 px-1">
                  {themeList.map(abbr => {
                    const theme = themeKeywords[abbr];
                    if (!theme) return null;
                    return (
                      <span
                        key={abbr}
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${theme.color}`}
                        title={theme.label}
                      >
                        {abbr}
                      </span>
                    );
                  })}
                </div>
              )}
              <CategorySection
                config={categoryConfig[catKey]}
                entries={chart.categories[catKey]?.entries || []}
                onUpdate={(entries) => updateCategory(catKey, entries)}
              />
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex justify-center sm:hidden">
        <button
          onClick={() => doSave(chart)}
          className="px-6 py-3 bg-primary text-white rounded-lg font-medium flex items-center gap-2"
        >
          <Save size={18} />
          Save Chart
        </button>
      </div>
    </div>
  );
}
