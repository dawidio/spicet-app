import { Trash2 } from 'lucide-react';
import { preventPaste, preventDrop } from '../lib/anti-paste';

export default function EntryRow({ entry, index, canDelete, onUpdate, onRemove }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-3">
      {/* Claim */}
      <div className="sm:col-span-5">
        <label className="sm:hidden text-xs font-medium text-gray-500 mb-1 block">
          Claim / Information
        </label>
        <textarea
          value={entry.claim}
          onChange={(e) => onUpdate('claim', e.target.value)}
          onPaste={preventPaste}
          onDrop={preventDrop}
          placeholder="What happened or was true about this society?"
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-y focus:ring-2 focus:ring-primary-light focus:border-primary-light outline-none min-h-[60px]"
        />
      </div>

      {/* Evidence */}
      <div className="sm:col-span-4">
        <label className="sm:hidden text-xs font-medium text-gray-500 mb-1 block">
          Evidence
        </label>
        <textarea
          value={entry.evidence}
          onChange={(e) => onUpdate('evidence', e.target.value)}
          onPaste={preventPaste}
          onDrop={preventDrop}
          placeholder="Specific facts, examples, or details"
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-y focus:ring-2 focus:ring-primary-light focus:border-primary-light outline-none min-h-[60px]"
        />
      </div>

      {/* Citation */}
      <div className="sm:col-span-2">
        <label className="sm:hidden text-xs font-medium text-gray-500 mb-1 block">
          Citation
        </label>
        <textarea
          value={entry.citation}
          onChange={(e) => onUpdate('citation', e.target.value)}
          onPaste={preventPaste}
          onDrop={preventDrop}
          placeholder="Source, page #"
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-y focus:ring-2 focus:ring-primary-light focus:border-primary-light outline-none min-h-[60px]"
        />
      </div>

      {/* Delete button */}
      <div className="sm:col-span-1 flex items-start justify-end sm:justify-center pt-1">
        {canDelete && (
          <button
            onClick={onRemove}
            className="p-2 rounded-lg hover:bg-red-50 transition-colors group"
            title="Remove entry"
          >
            <Trash2
              size={16}
              className="text-gray-300 group-hover:text-red-500 transition-colors"
            />
          </button>
        )}
      </div>
    </div>
  );
}
