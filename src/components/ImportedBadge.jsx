import { Upload } from 'lucide-react';

export default function ImportedBadge({ importedFrom }) {
  if (!importedFrom) return null;

  const { authorName, authorClassPeriod, importedAt } = importedFrom;

  const dateStr = importedAt
    ? new Date(importedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 border border-gray-200 rounded-full text-xs text-gray-600">
      <Upload size={11} className="text-gray-400 shrink-0" />
      <span>
        {authorName ? (
          <>
            <span className="font-medium">Shared by {authorName}</span>
            {authorClassPeriod && <span className="text-gray-400"> &bull; {authorClassPeriod}</span>}
            {dateStr && <span className="text-gray-400"> &bull; imported {dateStr}</span>}
          </>
        ) : (
          <span>
            Imported chart
            {dateStr && <span className="text-gray-400"> &bull; {dateStr}</span>}
          </span>
        )}
      </span>
    </div>
  );
}
