import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, HelpCircle } from 'lucide-react';
import EntryRow from './EntryRow';
import { createEmptyEntry } from '../lib/db';

// Full class names written out so Tailwind's scanner picks them up
const COLOR_TABLE = {
  // APWHM — reuses existing CSS token names
  social:        { border: 'border-l-social',        headerBg: 'bg-social-bg',        badge: 'bg-social text-white' },
  political:     { border: 'border-l-political',     headerBg: 'bg-political-bg',     badge: 'bg-political text-white' },
  interactions:  { border: 'border-l-interactions',  headerBg: 'bg-interactions-bg',  badge: 'bg-interactions text-white' },
  cultural:      { border: 'border-l-cultural',      headerBg: 'bg-cultural-bg',      badge: 'bg-cultural text-white' },
  economic:      { border: 'border-l-economic',      headerBg: 'bg-economic-bg',      badge: 'bg-economic text-white' },
  technological: { border: 'border-l-technological', headerBg: 'bg-technological-bg', badge: 'bg-technological text-white' },
  // APUSH — new CSS tokens defined in index.css
  nat: { border: 'border-l-nat', headerBg: 'bg-nat-bg', badge: 'bg-nat text-white' },
  wor: { border: 'border-l-wor', headerBg: 'bg-wor-bg', badge: 'bg-wor text-white' },
  geo: { border: 'border-l-geo', headerBg: 'bg-geo-bg', badge: 'bg-geo text-white' },
  mig: { border: 'border-l-mig', headerBg: 'bg-mig-bg', badge: 'bg-mig text-white' },
  pce: { border: 'border-l-pce', headerBg: 'bg-pce-bg', badge: 'bg-pce text-white' },
  wxt: { border: 'border-l-wxt', headerBg: 'bg-wxt-bg', badge: 'bg-wxt text-white' },
  soc: { border: 'border-l-soc', headerBg: 'bg-soc-bg', badge: 'bg-soc text-white' },
  arc: { border: 'border-l-arc', headerBg: 'bg-arc-bg', badge: 'bg-arc text-white' },
};

const FALLBACK_COLORS = { border: 'border-l-gray-300', headerBg: 'bg-gray-50', badge: 'bg-gray-500 text-white' };

export default function CategorySection({ config, entries, onUpdate }) {
  const [expanded, setExpanded] = useState(true);
  const [showPrompts, setShowPrompts] = useState(false);

  const colors = COLOR_TABLE[config.color] || FALLBACK_COLORS;
  const filledCount = entries.filter(e => e.claim.trim()).length;

  function addEntry() {
    onUpdate([...entries, createEmptyEntry()]);
  }

  function removeEntry(index) {
    if (entries.length <= 1) return;
    onUpdate(entries.filter((_, i) => i !== index));
  }

  function updateEntry(index, field, value) {
    onUpdate(entries.map((entry, i) => i === index ? { ...entry, [field]: value } : entry));
  }

  return (
    <div className={`bg-white rounded-xl border border-gray-200 border-l-4 ${colors.border} shadow-sm overflow-hidden`}>
      <div
        className={`${colors.headerBg} px-5 py-3 flex items-center justify-between cursor-pointer`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          {expanded ? <ChevronDown size={20} className="text-gray-600" /> : <ChevronRight size={20} className="text-gray-600" />}
          <h3 className="font-semibold text-gray-800 text-lg flex items-center gap-2">
            <span className={`text-xs font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${colors.badge}`}>
              {config.abbr}
            </span>
            {config.label}
          </h3>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors.badge}`}>
            {filledCount} {filledCount === 1 ? 'entry' : 'entries'}
          </span>
        </div>
        <button
          onClick={e => { e.stopPropagation(); setShowPrompts(!showPrompts); }}
          className="p-1.5 rounded-lg hover:bg-white/50 transition-colors"
          title="Show guiding questions"
        >
          <HelpCircle size={18} className="text-gray-500" />
        </button>
      </div>

      {showPrompts && (
        <div className={`${colors.headerBg} px-5 py-3 border-b border-gray-100`}>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Guiding Questions</p>
          <ul className="space-y-1.5">
            {config.prompts.map((prompt, i) => (
              <li key={i} className="text-sm text-gray-600 flex gap-2">
                <span className="text-gray-400 shrink-0">•</span>
                {prompt}
              </li>
            ))}
          </ul>
        </div>
      )}

      {expanded && (
        <div className="p-5">
          <div className="hidden sm:grid grid-cols-12 gap-3 mb-2">
            <div className="col-span-5 text-xs font-medium text-gray-500 uppercase tracking-wide">Claim / Information</div>
            <div className="col-span-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Evidence</div>
            <div className="col-span-2 text-xs font-medium text-gray-500 uppercase tracking-wide">Citation</div>
            <div className="col-span-1" />
          </div>
          <div className="space-y-3">
            {entries.map((entry, index) => (
              <EntryRow
                key={index}
                entry={entry}
                index={index}
                canDelete={entries.length > 1}
                onUpdate={(field, value) => updateEntry(index, field, value)}
                onRemove={() => removeEntry(index)}
              />
            ))}
          </div>
          <button
            onClick={addEntry}
            className="mt-3 px-4 py-2 text-sm text-gray-600 border border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:text-gray-700 transition-colors flex items-center gap-2 w-full justify-center"
          >
            <Plus size={16} />
            Add Entry
          </button>
        </div>
      )}
    </div>
  );
}
