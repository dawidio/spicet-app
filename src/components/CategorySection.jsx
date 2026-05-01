import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Trash2, HelpCircle } from 'lucide-react';
import EntryRow from './EntryRow';

export default function CategorySection({ config, entries, onUpdate }) {
  const [expanded, setExpanded] = useState(true);
  const [showPrompts, setShowPrompts] = useState(false);

  function addEntry() {
    onUpdate([...entries, { claim: '', evidence: '', citation: '' }]);
  }

  function removeEntry(index) {
    if (entries.length <= 1) return;
    const updated = entries.filter((_, i) => i !== index);
    onUpdate(updated);
  }

  function updateEntry(index, field, value) {
    const updated = entries.map((entry, i) =>
      i === index ? { ...entry, [field]: value } : entry
    );
    onUpdate(updated);
  }

  const filledCount = entries.filter((e) => e.claim.trim()).length;

  // Dynamic color classes based on category
  const colorClasses = {
    social: {
      border: 'border-l-social',
      bg: 'bg-social-bg',
      badge: 'bg-social text-white',
      headerBg: 'bg-social-bg',
    },
    political: {
      border: 'border-l-political',
      bg: 'bg-political-bg',
      badge: 'bg-political text-white',
      headerBg: 'bg-political-bg',
    },
    interactions: {
      border: 'border-l-interactions',
      bg: 'bg-interactions-bg',
      badge: 'bg-interactions text-white',
      headerBg: 'bg-interactions-bg',
    },
    cultural: {
      border: 'border-l-cultural',
      bg: 'bg-cultural-bg',
      badge: 'bg-cultural text-white',
      headerBg: 'bg-cultural-bg',
    },
    economic: {
      border: 'border-l-economic',
      bg: 'bg-economic-bg',
      badge: 'bg-economic text-white',
      headerBg: 'bg-economic-bg',
    },
    technological: {
      border: 'border-l-technological',
      bg: 'bg-technological-bg',
      badge: 'bg-technological text-white',
      headerBg: 'bg-technological-bg',
    },
  };

  const colors = colorClasses[config.key];

  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 border-l-4 ${colors.border} shadow-sm overflow-hidden`}
    >
      {/* Category Header */}
      <div
        className={`${colors.headerBg} px-5 py-3 flex items-center justify-between cursor-pointer`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          {expanded ? (
            <ChevronDown size={20} className="text-gray-600" />
          ) : (
            <ChevronRight size={20} className="text-gray-600" />
          )}
          <h3 className="font-semibold text-gray-800 text-lg">
            {config.label}
          </h3>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors.badge}`}
          >
            {filledCount} {filledCount === 1 ? 'entry' : 'entries'}
          </span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowPrompts(!showPrompts);
          }}
          className="p-1.5 rounded-lg hover:bg-white/50 transition-colors"
          title="Show guiding questions"
        >
          <HelpCircle size={18} className="text-gray-500" />
        </button>
      </div>

      {/* Guiding Prompts */}
      {showPrompts && (
        <div className={`${colors.bg} px-5 py-3 border-b border-gray-100`}>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Guiding Questions
          </p>
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

      {/* Entries */}
      {expanded && (
        <div className="p-5">
          {/* Column headers */}
          <div className="hidden sm:grid grid-cols-12 gap-3 mb-2">
            <div className="col-span-5 text-xs font-medium text-gray-500 uppercase tracking-wide">
              Claim / Information
            </div>
            <div className="col-span-4 text-xs font-medium text-gray-500 uppercase tracking-wide">
              Evidence
            </div>
            <div className="col-span-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
              Citation
            </div>
            <div className="col-span-1"></div>
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
