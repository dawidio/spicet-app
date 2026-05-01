import { useState } from 'react';
import { ChevronDown, ChevronRight, GitCompare, ArrowRightLeft, TrendingUp } from 'lucide-react';
import { preventPaste, preventDrop } from '../lib/anti-paste';

export default function AnnotationStrip({ categoryKey, annotation, onUpdate }) {
  const [expanded, setExpanded] = useState(true);

  const hasSomeContent =
    annotation.similarities.trim() ||
    annotation.differences.trim() ||
    annotation.ccot.trim();

  const fields = [
    {
      key: 'similarities',
      label: 'Similarities',
      icon: <GitCompare size={14} className="text-emerald-600" />,
      placeholder: 'What do these societies/empires have in common in this category?',
      borderColor: 'border-l-emerald-400',
      bgColor: 'bg-emerald-50',
      focusRing: 'focus:ring-emerald-300',
    },
    {
      key: 'differences',
      label: 'Differences',
      icon: <ArrowRightLeft size={14} className="text-orange-600" />,
      placeholder: 'How do they differ in this category? What makes each unique?',
      borderColor: 'border-l-orange-400',
      bgColor: 'bg-orange-50',
      focusRing: 'focus:ring-orange-300',
    },
    {
      key: 'ccot',
      label: 'Change & Continuity Over Time',
      icon: <TrendingUp size={14} className="text-blue-600" />,
      placeholder: 'What changed between these time periods? What stayed the same? Why?',
      borderColor: 'border-l-blue-400',
      bgColor: 'bg-blue-50',
      focusRing: 'focus:ring-blue-300',
    },
  ];

  return (
    <div className="my-2 rounded-lg border border-dashed border-gray-300 bg-gray-50/50 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-2 flex items-center gap-2 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
      >
        {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        <span>Your Analysis</span>
        {hasSomeContent && (
          <span className="ml-auto text-xs text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
            Notes added
          </span>
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {fields.map((field) => (
            <div
              key={field.key}
              className={`border-l-3 ${field.borderColor} pl-3`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                {field.icon}
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  {field.label}
                </label>
              </div>
              <textarea
                value={annotation[field.key]}
                onChange={(e) => onUpdate(field.key, e.target.value)}
                onPaste={preventPaste}
                onDrop={preventDrop}
                placeholder={field.placeholder}
                rows={2}
                className={`w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-y ${field.focusRing} focus:ring-2 focus:border-transparent outline-none min-h-[52px] ${field.bgColor}/30`}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
