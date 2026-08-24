import { useState, useMemo } from 'react';
import { BookOpen, Copy, Check, Target } from 'lucide-react';
import { setSetting } from '../lib/db';
import { getCategoriesOrder, getCategoryConfig } from '../data/prompts';

const EXERCISE_TYPES = [
  {
    id: 'ccot',
    label: 'CCOT Thesis',
    description: 'Change and continuity over time',
    minCharts: 1,
  },
  {
    id: 'comparison',
    label: 'Comparison Thesis',
    description: 'Similarities and differences',
    minCharts: 2,
  },
  {
    id: 'causation',
    label: 'Causation Argument',
    description: 'Causes and effects',
    minCharts: 1,
  },
  {
    id: 'context',
    label: 'Contextualization',
    description: 'Broader historical context',
    minCharts: 1,
  },
];

function buildPrompt(exerciseId, selectedCharts, categoryKey, categoryConfig) {
  const catLabel = categoryConfig[categoryKey]?.label || categoryKey;
  const emp1 = selectedCharts[0]?.empireName || '[Entry 1]';
  const emp2 = selectedCharts[1]?.empireName || '[Entry 2]';
  const dateRange = selectedCharts[0]?.dateRange || '[date range]';

  switch (exerciseId) {
    case 'ccot':
      return `Using your theme chart data for ${emp1}, write a CCOT thesis that identifies ONE significant change AND ONE continuity in [${catLabel}] from ${dateRange}. Your thesis must: (1) make a historically defensible claim, (2) establish a time frame, (3) explain what changed or continued AND why.`;
    case 'comparison':
      return `Using your theme chart data for ${emp1} and ${emp2}, write a comparison thesis that identifies ONE significant similarity AND ONE significant difference in their [${catLabel}] characteristics. Address the extent to which these societies were similar.`;
    case 'causation':
      return `Using your theme chart data for ${emp1}, write a causation argument that identifies the most significant cause of a major development in [${catLabel}] during ${dateRange}. Explain the cause-and-effect relationship.`;
    case 'context':
      return `Using your theme chart data for ${emp1} (${dateRange}), write a contextualization claim that connects ONE broader historical development BEFORE or OUTSIDE of ${emp1} to the developments shown in your theme chart.`;
    default:
      return '';
  }
}

export default function PromptLab({ charts, profile }) {
  const [exerciseId, setExerciseId] = useState('ccot');
  const [selectedChartIds, setSelectedChartIds] = useState(
    charts.length > 0 ? [charts[0].id] : []
  );
  const [copied, setCopied] = useState(false);
  const [draft, setDraft] = useState('');
  const [saved, setSaved] = useState(false);

  const selectedCharts = charts.filter(c => selectedChartIds.includes(c.id));

  // Derive course and categories from the first selected chart
  const primaryCourse = selectedCharts[0]?.course || charts[0]?.course || 'apwhm';
  const categoriesOrder = getCategoriesOrder(primaryCourse);
  const categoryConfig = getCategoryConfig(primaryCourse);
  const [categoryKey, setCategoryKey] = useState(categoriesOrder[0]);

  // Reset categoryKey when course changes
  const resolvedCategoryKey = categoriesOrder.includes(categoryKey) ? categoryKey : categoriesOrder[0];

  const exercise = EXERCISE_TYPES.find(e => e.id === exerciseId);
  const prompt = buildPrompt(exerciseId, selectedCharts, resolvedCategoryKey, categoryConfig);

  function toggleChart(id) {
    if (exerciseId === 'comparison') {
      setSelectedChartIds(prev => {
        if (prev.includes(id)) return prev.filter(x => x !== id);
        if (prev.length >= 2) return [prev[1], id];
        return [...prev, id];
      });
    } else {
      setSelectedChartIds([id]);
    }
  }

  async function handleSave() {
    const key = `promptLab_draft_${Date.now()}`;
    await setSetting(key, { exerciseId, draft, prompt, savedAt: Date.now() });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(draft || prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Target size={20} className="text-primary" />
        <h3 className="text-lg font-bold text-gray-800">Prompt Lab</h3>
        <span className="text-xs text-gray-400 ml-1">AP thesis writing practice</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left column: Controls */}
        <div className="space-y-4">
          {/* Exercise type */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Exercise Type</h4>
            <div className="space-y-2">
              {EXERCISE_TYPES.map(ex => (
                <button
                  key={ex.id}
                  onClick={() => {
                    setExerciseId(ex.id);
                    if (ex.id !== 'comparison') {
                      setSelectedChartIds(prev => prev.slice(0, 1));
                    }
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg border transition-colors ${
                    exerciseId === ex.id
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="text-sm font-medium">{ex.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{ex.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Chart selection */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">
              {exerciseId === 'comparison' ? 'Select 2 Charts' : 'Select Chart'}
            </h4>
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {charts.map(chart => (
                <label key={chart.id} className="flex items-center gap-2 cursor-pointer p-1.5 rounded-lg hover:bg-gray-50">
                  <input
                    type={exerciseId === 'comparison' ? 'checkbox' : 'radio'}
                    name="chartSelect"
                    checked={selectedChartIds.includes(chart.id)}
                    onChange={() => toggleChart(chart.id)}
                    className="accent-primary"
                  />
                  <span className="text-sm text-gray-800 truncate">
                    {chart.empireName || 'Untitled'}
                  </span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ml-1 shrink-0 ${
                    (chart.course || 'apwhm') === 'apush' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'
                  }`}>
                    {(chart.course || 'apwhm') === 'apush' ? 'APUSH' : 'APWHM'}
                  </span>
                  {chart.dateRange && (
                    <span className="text-xs text-gray-400 ml-auto shrink-0">{chart.dateRange}</span>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Category selection */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">AP Theme Focus</h4>
            <select
              value={resolvedCategoryKey}
              onChange={e => setCategoryKey(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-light outline-none bg-white"
            >
              {categoriesOrder.map(cat => (
                <option key={cat} value={cat}>
                  {categoryConfig[cat].abbr ? `${categoryConfig[cat].abbr} — ` : ''}{categoryConfig[cat].label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right column: Prompt + Draft */}
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen size={16} className="text-blue-700" />
              <h4 className="text-sm font-semibold text-blue-800">Your Prompt</h4>
            </div>
            <p className="text-sm text-blue-900 leading-relaxed">{prompt}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Your Draft Thesis</h4>
            <textarea
              value={draft}
              onChange={e => setDraft(e.target.value)}
              placeholder="Write your thesis here..."
              rows={8}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-light outline-none resize-y"
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleSave}
                className="px-3 py-2 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary-dark transition-colors"
              >
                {saved ? 'Saved!' : 'Save Draft'}
              </button>
              <button
                onClick={handleCopy}
                className="px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors flex items-center gap-1.5"
              >
                {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy to Clipboard'}
              </button>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 space-y-1">
            <p className="font-semibold">Writing Tips:</p>
            <ul className="list-disc list-inside space-y-0.5 text-amber-700">
              <li>State your argument in the first sentence</li>
              <li>Include specific time period and place</li>
              <li>Explain WHY, not just WHAT</li>
              <li>Avoid starting with "I" or "In this essay"</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
