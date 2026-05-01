import { useState, useEffect, useCallback, useRef } from 'react';
import { getChart, saveChart, createEmptyChart, getStudentProfile } from '../lib/db';
import { AP_WORLD_UNITS } from '../data/units';
import { CATEGORIES_ORDER, CATEGORY_CONFIG } from '../data/prompts';
import CategorySection from './CategorySection';
import { Save, CheckCircle, FileDown } from 'lucide-react';
import { exportChartPDF } from '../lib/export';

export default function ChartEditor({ chartId, onBack }) {
  const [chart, setChart] = useState(null);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const saveTimerRef = useRef(null);

  // Load or create chart
  useEffect(() => {
    if (chartId) {
      getChart(chartId).then((c) => {
        if (c) setChart(c);
        else setChart({ ...createEmptyChart(), id: undefined });
      });
    } else {
      setChart(createEmptyChart());
    }
  }, [chartId]);

  // Auto-save debounced
  const doSave = useCallback(
    async (chartData) => {
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
    },
    []
  );

  const scheduleAutosave = useCallback(
    (updatedChart) => {
      // Don't auto-save until the chart has at least an empire name
      if (!updatedChart.empireName?.trim()) return;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        doSave(updatedChart);
      }, 800);
    },
    [doSave]
  );

  // Update a top-level field
  const updateField = useCallback(
    (field, value) => {
      setChart((prev) => {
        const updated = { ...prev, [field]: value };
        scheduleAutosave(updated);
        return updated;
      });
    },
    [scheduleAutosave]
  );

  // Update a category's entries
  const updateCategory = useCallback(
    (categoryKey, entries) => {
      setChart((prev) => {
        const updated = {
          ...prev,
          categories: {
            ...prev.categories,
            [categoryKey]: { entries },
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
    exportChartPDF(chart, profile);
  }, [chart]);

  if (!chart) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-500">Loading chart...</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Save status bar */}
      <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
        <h2 className="text-lg sm:text-xl font-bold text-gray-800">
          {chart.id ? 'Edit Chart' : 'New SPICE-T Chart'}
        </h2>
        <div className="flex items-center gap-2 sm:gap-3">
          {chart.id && (
            <button
              onClick={handleExportPDF}
              className="px-2.5 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5 text-gray-600"
            >
              <FileDown size={14} />
              <span className="hidden sm:inline">Export</span> PDF
            </button>
          )}
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

      {/* Chart header fields */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Empire / Region Name *
            </label>
            <input
              type="text"
              value={chart.empireName}
              onChange={(e) => updateField('empireName', e.target.value)}
              placeholder="e.g., Mongol Empire"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-light focus:border-primary-light outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Region
            </label>
            <input
              type="text"
              value={chart.region}
              onChange={(e) => updateField('region', e.target.value)}
              placeholder="e.g., Central Asia"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-light focus:border-primary-light outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date Range
            </label>
            <input
              type="text"
              value={chart.dateRange}
              onChange={(e) => updateField('dateRange', e.target.value)}
              placeholder="e.g., 1206–1368"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-light focus:border-primary-light outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unit
            </label>
            <select
              value={chart.unitNumber ?? ''}
              onChange={(e) =>
                updateField(
                  'unitNumber',
                  e.target.value ? Number(e.target.value) : null
                )
              }
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-primary-light outline-none"
            >
              <option value="">Select Unit...</option>
              {AP_WORLD_UNITS.map((u) => (
                <option key={u.number} value={u.number}>
                  Unit {u.number}: {u.name} ({u.dateRange})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* SPICE-T Categories */}
      <div className="space-y-4">
        {CATEGORIES_ORDER.map((catKey) => (
          <CategorySection
            key={catKey}
            config={CATEGORY_CONFIG[catKey]}
            entries={chart.categories[catKey]?.entries || []}
            onUpdate={(entries) => updateCategory(catKey, entries)}
          />
        ))}
      </div>

      {/* Bottom save button for mobile */}
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
