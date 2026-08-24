import { useState, useRef, useCallback } from 'react';
import { Upload, X, FileJson, Check, AlertTriangle } from 'lucide-react';
import { parseImportFile } from '../lib/pdf-import';
import { getCategoriesOrder, getCategoryConfig } from '../data/prompts';

export default function ImportChart({ onImport, onCancel }) {
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState(null); // { chart, authorName, authorClassPeriod, importedAt }
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  const processFile = useCallback(async (file) => {
    setLoading(true);
    setError(null);
    setPreview(null);
    try {
      const result = await parseImportFile(file);
      setPreview(result);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }, []);

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }

  function handleFileInput(e) {
    const file = e.target.files[0];
    if (file) processFile(file);
  }

  function handleConfirmImport() {
    if (!preview) return;
    const chart = {
      ...preview.chart,
      id: undefined, // strip old id so db assigns a new one
      createdAt: Date.now(),
      updatedAt: Date.now(),
      importedFrom: {
        authorName: preview.authorName,
        authorClassPeriod: preview.authorClassPeriod,
        importedAt: preview.importedAt,
        sourceHash: preview.sourceHash,
      },
    };
    onImport(chart, {
      authorName: preview.authorName,
      authorClassPeriod: preview.authorClassPeriod,
    });
  }

  function getEntryCount(chart) {
    let count = 0;
    for (const cat of getCategoriesOrder(chart.course || 'apwhm')) {
      const entries = chart.categories?.[cat]?.entries || [];
      count += entries.filter(e => e.claim?.trim()).length;
    }
    return count;
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Upload size={22} className="text-primary" />
            <h2 className="text-xl font-bold text-gray-900">Import Chart</h2>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {!preview ? (
          <>
            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
                dragging
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-300 hover:border-primary hover:bg-gray-50'
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileInput}
                className="hidden"
              />
              <FileJson size={40} className="mx-auto mb-3 text-gray-300" />
              <p className="text-gray-700 font-medium mb-1">
                Drop a theme-chart .json file here
              </p>
              <p className="text-sm text-gray-400">
                or click to select a file
              </p>
              {loading && (
                <p className="text-sm text-primary mt-3 animate-pulse">Parsing file...</p>
              )}
            </div>

            {error && (
              <div className="mt-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <p className="text-xs text-gray-400 text-center mt-4">
              Only .json files exported from AP Theme Charts are supported.
            </p>
          </>
        ) : (
          <>
            {/* Preview */}
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 mb-5">
              <h3 className="font-bold text-gray-900 text-lg mb-1">
                {preview.chart.empireName || 'Untitled Chart'}
              </h3>
              <div className="flex flex-wrap gap-2 text-sm text-gray-600 mb-3">
                {preview.chart.region && <span>{preview.chart.region}</span>}
                {preview.chart.dateRange && <span>&bull; {preview.chart.dateRange}</span>}
                {preview.chart.unitNumber && <span>&bull; Unit {preview.chart.unitNumber}</span>}
              </div>

              {/* Attribution */}
              {(preview.authorName || preview.authorClassPeriod) && (
                <div className="flex items-center gap-1.5 mb-3 text-xs text-gray-500">
                  <Upload size={12} />
                  <span>
                    Chart by{' '}
                    <span className="font-medium text-gray-700">{preview.authorName || 'Unknown'}</span>
                    {preview.authorClassPeriod && (
                      <span>, {preview.authorClassPeriod}</span>
                    )}
                  </span>
                </div>
              )}

              {/* Category entry counts */}
              <div className="space-y-1">
                {getCategoriesOrder(preview.chart.course || 'apwhm').map(cat => {
                  const config = getCategoryConfig(preview.chart.course || 'apwhm')[cat];
                  const entries = preview.chart.categories?.[cat]?.entries || [];
                  const count = entries.filter(e => e.claim?.trim()).length;
                  if (count === 0 || !config) return null;
                  return (
                    <div key={cat} className="flex items-center gap-2 text-xs text-gray-600">
                      {config.abbr && (
                        <span className="font-bold uppercase text-gray-500 w-9 shrink-0">{config.abbr}</span>
                      )}
                      <span className="font-medium w-44">{config.label}</span>
                      <span>{count} {count === 1 ? 'entry' : 'entries'}</span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 text-xs text-gray-400">
                Total: {getEntryCount(preview.chart)} entries
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setPreview(null); setError(null); }}
                className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmImport}
                className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
              >
                <Check size={16} />
                Import Chart
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
