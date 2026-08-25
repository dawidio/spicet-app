import { useState, useEffect } from 'react';
import { getAllCharts, deleteChart, saveChart, getDueReviewCount } from '../lib/db';
import { AP_WORLD_UNITS } from '../data/units';
import { getCategoriesOrder, getCategoryConfig } from '../data/prompts';
import { exportChartPDF } from '../lib/export';
import ThemeView from './ThemeView';
import PromptLab from './PromptLab';
import ProgressMap from './ProgressMap';
import ImportChart from './ImportChart';
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
  Brain,
  Tag,
  Target,
  TrendingUp,
  Upload,
  BookOpen,
  Globe,
} from 'lucide-react';

const TABS = [
  { id: 'charts', label: 'My Charts', icon: null },
  { id: 'theme', label: 'By Theme', icon: Tag },
  { id: 'promptlab', label: 'Prompt Lab', icon: Target },
  { id: 'progress', label: 'Progress', icon: TrendingUp },
];

const COURSE_OPTIONS = [
  {
    id: 'apwhm',
    label: 'AP World History: Modern',
    abbr: 'APWHM',
    description: '6 CED themes: ENV · CDI · GOV · ECN · SIO · TEC',
    icon: Globe,
    badge: 'bg-emerald-100 text-emerald-700',
  },
  {
    id: 'apush',
    label: 'AP United States History',
    abbr: 'APUSH',
    description: '8 CED themes: NAT · WOR · GEO · MIG · PCE · WXT · SOC · ARC',
    icon: BookOpen,
    badge: 'bg-blue-100 text-blue-700',
  },
];

function CourseBadge({ course }) {
  const opt = COURSE_OPTIONS.find(o => o.id === course);
  if (!opt) return null;
  return (
    <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${opt.badge}`}>
      {opt.abbr}
    </span>
  );
}

function CoursePickerModal({ onSelect, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-1">New Theme Chart</h2>
        <p className="text-sm text-gray-500 mb-5">Which course is this chart for?</p>
        <div className="space-y-3">
          {COURSE_OPTIONS.map(opt => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.id}
                onClick={() => onSelect(opt.id)}
                className="w-full text-left px-4 py-3 rounded-xl border-2 border-gray-200 hover:border-primary hover:bg-blue-50 transition-colors flex items-center gap-3"
              >
                <Icon size={22} className="text-gray-500 shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{opt.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{opt.description}</p>
                </div>
              </button>
            );
          })}
        </div>
        <button
          onClick={onCancel}
          className="mt-4 w-full py-2 text-sm text-gray-500 hover:text-gray-700"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function Dashboard({ onEditChart, onNewChart, onCompare, onReview, onProgress, profile }) {
  const [charts, setCharts] = useState([]);
  const [search, setSearch] = useState('');
  const [unitFilter, setUnitFilter] = useState(null);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showImport, setShowImport] = useState(false);
  const [showCoursePicker, setShowCoursePicker] = useState(false);
  const [activeTab, setActiveTab] = useState('charts');
  const [dueCount, setDueCount] = useState(0);

  useEffect(() => {
    loadCharts();
    getDueReviewCount().then(setDueCount);
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
      if (prev.length >= 4) return prev;
      return [...prev, id];
    });
  }

  function handleCompareStart() {
    if (selectedIds.length >= 2) {
      onCompare(selectedIds);
    }
  }

  async function handleImport(chart) {
    const id = await saveChart(chart);
    setShowImport(false);
    await loadCharts();
    onEditChart(id);
  }

  function handleNewChartClick() {
    setShowCoursePicker(true);
  }

  function handleCourseSelect(course) {
    setShowCoursePicker(false);
    onNewChart(course);
  }

  const filtered = charts.filter((c) => {
    const matchSearch =
      !search ||
      c.empireName.toLowerCase().includes(search.toLowerCase()) ||
      (c.region || '').toLowerCase().includes(search.toLowerCase());
    const matchUnit = unitFilter === null || c.unitNumber === unitFilter;
    return matchSearch && matchUnit;
  });

  function getEntryCount(chart) {
    const order = getCategoriesOrder(chart.course || 'apwhm');
    let count = 0;
    for (const cat of order) {
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
      {showImport && (
        <ImportChart
          onImport={handleImport}
          onCancel={() => setShowImport(false)}
        />
      )}

      {showCoursePicker && (
        <CoursePickerModal
          onSelect={handleCourseSelect}
          onCancel={() => setShowCoursePicker(false)}
        />
      )}

      {/* Retrieval queue banner */}
      {charts.length > 0 && (
        <div
          className={`mb-6 rounded-xl border-2 p-4 flex flex-col sm:flex-row sm:items-center gap-3 ${
            dueCount > 0 ? 'border-accent bg-accent/5' : 'border-gray-200 bg-white'
          }`}
        >
          <div className="flex items-center gap-3 flex-1">
            <div className={`rounded-lg p-2 ${dueCount > 0 ? 'bg-accent' : 'bg-gray-200'}`}>
              <Brain size={20} className="text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                {dueCount > 0
                  ? `${dueCount} ${dueCount === 1 ? 'entry is' : 'entries are'} due for retrieval`
                  : 'Retrieval queue is clear'}
              </p>
              <p className="text-sm text-gray-500">
                {dueCount > 0
                  ? 'Recall each one from memory before you check — that’s what makes it stick.'
                  : 'Entries come back on a spaced schedule as the exam approaches.'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {/* Calibration tracker (knew/lucky/wrong across all history) —
                distinct from the "Progress" tab below, which maps mastery
                per chart per theme. */}
            <button
              onClick={onProgress}
              className="px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium whitespace-nowrap"
            >
              Calibration
            </button>
            <button
              onClick={onReview}
              className="px-5 py-2.5 bg-accent text-white rounded-lg hover:bg-accent-light transition-colors font-medium whitespace-nowrap"
            >
              Start review
            </button>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
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
          onChange={(e) => setUnitFilter(e.target.value ? Number(e.target.value) : null)}
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
                onClick={() => { setCompareMode(false); setSelectedIds([]); }}
                className="px-3 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <X size={18} />
              </button>
            </div>
          )}

          <button
            onClick={handleNewChartClick}
            className="px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2 font-medium"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">New Chart</span>
          </button>
        </div>
      </div>

      {/* Tab bar */}
      {charts.length > 0 && (
        <div className="flex gap-1 mb-5 border-b border-gray-200">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {Icon && <Icon size={15} />}
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      {compareMode && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
          Select 2–4 charts to compare side by side. Charts must be from the same course.
        </div>
      )}

      {activeTab === 'theme' && charts.length > 0 && <ThemeView charts={charts} />}
      {activeTab === 'promptlab' && charts.length > 0 && (
        <PromptLab charts={charts} profile={profile || { name: '', classPeriod: '' }} />
      )}
      {activeTab === 'progress' && charts.length > 0 && <ProgressMap charts={charts} />}

      {activeTab === 'charts' && (
        <>
          {filtered.length === 0 ? (
            <div className="text-center py-20">
              {charts.length === 0 ? (
                <>
                  <div className="text-6xl mb-4">📊</div>
                  <h2 className="text-xl font-semibold text-gray-700 mb-2">No charts yet</h2>
                  <p className="text-gray-500 mb-6">Create your first theme chart to start studying!</p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={handleNewChartClick}
                      className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors inline-flex items-center gap-2 font-medium"
                    >
                      <Plus size={20} />
                      Create Your First Chart
                    </button>
                    <button
                      onClick={() => setShowImport(true)}
                      className="px-6 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:text-primary transition-colors inline-flex items-center gap-2 text-gray-600"
                    >
                      <Upload size={20} />
                      Import Shared Chart
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-4xl mb-4">🔍</div>
                  <p className="text-gray-500">No charts match your search or filter.</p>
                </>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((chart) => {
                  const isSelected = selectedIds.includes(chart.id);
                  const entryCount = getEntryCount(chart);
                  const chartCourse = chart.course || 'apwhm';
                  const catOrder = getCategoriesOrder(chartCourse);
                  const catConfig = getCategoryConfig(chartCourse);
                  return (
                    <div
                      key={chart.id}
                      onClick={() => {
                        if (compareMode) toggleSelect(chart.id);
                        else onEditChart(chart.id);
                      }}
                      className={`
                        bg-white rounded-xl border-2 p-5 cursor-pointer transition-all hover:shadow-md
                        ${isSelected ? 'border-primary bg-blue-50 shadow-md' : 'border-gray-200 hover:border-gray-300'}
                      `}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="font-semibold text-gray-900 truncate text-lg">
                              {chart.empireName || 'Untitled Chart'}
                            </h3>
                            <CourseBadge course={chartCourse} />
                          </div>
                          {chart.region && (
                            <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                              <MapPin size={14} />
                              <span className="truncate">{chart.region}</span>
                            </div>
                          )}
                          {chart.importedFrom && (
                            <div className="mt-1">
                              <span className="text-xs text-gray-400 flex items-center gap-1">
                                <Upload size={11} />
                                Imported
                                {chart.importedFrom.authorName && ` from ${chart.importedFrom.authorName}`}
                              </span>
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
                                onClick={(e) => { e.stopPropagation(); onEditChart(chart.id); }}
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
                            {chartCourse === 'apush' ? 'Period' : 'Unit'} {chart.unitNumber}
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
                        {catOrder.map((cat) => {
                          const entries = chart.categories?.[cat]?.entries || [];
                          const filled = entries.some((e) => e.claim.trim());
                          const config = catConfig[cat];
                          return (
                            <div
                              key={cat}
                              className={`flex-1 h-2 rounded-full ${filled ? `bg-${config.color}` : 'bg-gray-200'}`}
                              title={`${config.abbr} — ${config.label}: ${filled ? 'has entries' : 'empty'}`}
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

              <div className="mt-6 flex justify-center">
                <button
                  onClick={() => setShowImport(true)}
                  className="px-5 py-3 border-2 border-dashed border-gray-300 rounded-xl hover:border-primary hover:text-primary transition-colors flex items-center gap-2 text-gray-500 text-sm font-medium"
                >
                  <Upload size={18} />
                  Import Shared Chart
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
