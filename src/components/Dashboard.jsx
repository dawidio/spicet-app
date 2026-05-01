import { useState, useEffect } from 'react';
import { getAllCharts, deleteChart, getStudentProfile } from '../lib/db';
import { AP_WORLD_UNITS } from '../data/units';
import { CATEGORIES_ORDER, CATEGORY_CONFIG } from '../data/prompts';
import { exportChartPDF } from '../lib/export';
import {
  Plus,
  Search,
  GitCompare,
  Trash2,
  Edit3,
  Calendar,
  MapPin,
  Hash,
  CheckSquare,
  Square,
  FileDown,
  X,
} from 'lucide-react';

export default function Dashboard({ onEditChart, onNewChart, onCompare }) {
  const [charts, setCharts] = useState([]);
  const [search, setSearch] = useState('');
  const [unitFilter, setUnitFilter] = useState(null);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    loadCharts();
  }, []);

  async function loadCharts() {
    const all = await getAllCharts();
    setCharts(all);
  }

  async function handleDelete(id, e) {
    e.stopPropagation();
    if (confirm('Delete this chart? This cannot be undone.')) {
      await deleteChart(id);
      loadCharts();
    }
  }

  function toggleSelect(id) {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((i) => i !== id);
      if (prev.length >= 4) return prev; // max 4
      return [...prev, id];
    });
  }

  function handleCompareStart() {
    if (selectedIds.length >= 2) {
      onCompare(selectedIds);
    }
  }

  const filtered = charts.filter((c) => {
    const matchSearch =
      !search ||
      c.empireName.toLowerCase().includes(search.toLowerCase()) ||
      c.region.toLowerCase().includes(search.toLowerCase());
    const matchUnit = unitFilter === null || c.unitNumber === unitFilter;
    return matchSearch && matchUnit;
  });

  // Count non-empty entries in a chart
  function getEntryCount(chart) {
    let count = 0;
    for (const cat of CATEGORIES_ORDER) {
      const entries = chart.categories?.[cat]?.entries || [];
      count += entries.filter((e) => e.claim.trim()).length;
    }
    return count;
  }

  function getUnitLabel(num) {
    const unit = AP_WORLD_UNITS.find((u) => u.number === num);
    return unit ? `Unit ${unit.number}: ${unit.name}` : '';
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search charts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-light focus:border-primary-light outline-none"
          />
        </div>

        <select
          value={unitFilter ?? ''}
          onChange={(e) =>
            setUnitFilter(e.target.value ? Number(e.target.value) : null)
          }
          className="px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-primary-light outline-none"
        >
          <option value="">All Units</option>
          {AP_WORLD_UNITS.map((u) => (
            <option key={u.number} value={u.number}>
              Unit {u.number}: {u.name}
            </option>
          ))}
        </select>

        <div className="flex gap-2">
          {!compareMode ? (
            <button
              onClick={() => setCompareMode(true)}
              disabled={charts.length < 2}
              className="px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <GitCompare size={18} />
              <span className="hidden sm:inline">Compare</span>
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleCompareStart}
                disabled={selectedIds.length < 2}
                className="px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <GitCompare size={18} />
                Compare ({selectedIds.length}/4)
              </button>
              <button
                onClick={() => {
                  setCompareMode(false);
                  setSelectedIds([]);
                }}
                className="px-3 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <X size={18} />
              </button>
            </div>
          )}

          <button
            onClick={onNewChart}
            className="px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2 font-medium"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">New Chart</span>
          </button>
        </div>
      </div>

      {compareMode && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
          Select 2–4 charts to compare side by side. Click charts to select them.
        </div>
      )}

      {/* Charts Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          {charts.length === 0 ? (
            <>
              <div className="text-6xl mb-4">📊</div>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">
                No charts yet
              </h2>
              <p className="text-gray-500 mb-6">
                Create your first SPICE-T chart to start studying!
              </p>
              <button
                onClick={onNewChart}
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors inline-flex items-center gap-2 font-medium"
              >
                <Plus size={20} />
                Create Your First Chart
              </button>
            </>
          ) : (
            <>
              <div className="text-4xl mb-4">🔍</div>
              <p className="text-gray-500">
                No charts match your search or filter.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((chart) => {
            const isSelected = selectedIds.includes(chart.id);
            const entryCount = getEntryCount(chart);
            return (
              <div
                key={chart.id}
                onClick={() => {
                  if (compareMode) {
                    toggleSelect(chart.id);
                  } else {
                    onEditChart(chart.id);
                  }
                }}
                className={`
                  bg-white rounded-xl border-2 p-5 cursor-pointer transition-all hover:shadow-md
                  ${isSelected ? 'border-primary bg-blue-50 shadow-md' : 'border-gray-200 hover:border-gray-300'}
                `}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate text-lg">
                      {chart.empireName || 'Untitled Chart'}
                    </h3>
                    {chart.region && (
                      <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                        <MapPin size={14} />
                        <span className="truncate">{chart.region}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    {compareMode ? (
                      isSelected ? (
                        <CheckSquare size={22} className="text-primary" />
                      ) : (
                        <Square size={22} className="text-gray-300" />
                      )
                    ) : (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditChart(chart.id);
                          }}
                          className="p-1.5 rounded-lg hover:bg-gray-100"
                          title="Edit"
                        >
                          <Edit3 size={16} className="text-gray-400" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(chart.id, e)}
                          className="p-1.5 rounded-lg hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 size={16} className="text-gray-400 hover:text-red-500" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  {chart.unitNumber && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full">
                      <Hash size={12} />
                      Unit {chart.unitNumber}
                    </span>
                  )}
                  {chart.dateRange && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                      <Calendar size={12} />
                      {chart.dateRange}
                    </span>
                  )}
                </div>

                {/* Category fill indicators */}
                <div className="flex gap-1">
                  {CATEGORIES_ORDER.map((cat) => {
                    const entries = chart.categories?.[cat]?.entries || [];
                    const filled = entries.some((e) => e.claim.trim());
                    const config = CATEGORY_CONFIG[cat];
                    return (
                      <div
                        key={cat}
                        className={`flex-1 h-2 rounded-full ${
                          filled ? `bg-${config.color}` : 'bg-gray-200'
                        }`}
                        title={`${config.label}: ${filled ? 'has entries' : 'empty'}`}
                      />
                    );
                  })}
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-xs text-gray-400">
                    {entryCount} {entryCount === 1 ? 'entry' : 'entries'}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(chart.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
