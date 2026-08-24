/**
 * Folder Auto-Save via File System Access API.
 * Chromium-only; gracefully degrades on unsupported browsers.
 */
import { getSetting, setSetting } from './db';
import { SPICET_EXPORT_VERSION } from './pdf-import';

export const FSSA_SUPPORTED = typeof window !== 'undefined' && 'showDirectoryPicker' in window;

let _dirHandle = null;
let _writeTimer = null;

/**
 * Request folder access from the user and store the handle.
 * Returns the DirectoryFileSystemHandle or null on cancel/error.
 */
export async function requestFolderAccess() {
  if (!FSSA_SUPPORTED) return null;
  try {
    const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
    _dirHandle = handle;
    await setSetting('autoExportEnabled', true);
    return handle;
  } catch (err) {
    if (err.name === 'AbortError') return null;
    console.error('Folder access error:', err);
    await setSetting('autoExportLastError', err.message);
    return null;
  }
}

/**
 * Write a chart JSON to the auto-save folder.
 * Debounced: rapid calls collapse into one write 1.5 seconds later.
 */
export async function scheduleAutoExport(chart) {
  if (!_dirHandle) return;
  const chartData = chart;
  if (_writeTimer) clearTimeout(_writeTimer);
  _writeTimer = setTimeout(async () => {
    try {
      await writeChartToFolder(_dirHandle, chartData);
    } catch (err) {
      console.warn('Auto-export write failed:', err);
      await setSetting('autoExportLastError', err.message);
    }
  }, 1500);
}

async function writeChartToFolder(dirHandle, chart) {
  const name = sanitize(chart.empireName || 'untitled');
  const filename = `APThemes_${name}_${chart.id || 'new'}.json`;
  const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
  const writable = await fileHandle.createWritable();
  const json = JSON.stringify({
    spicetVersion: SPICET_EXPORT_VERSION,
    kind: 'chart',
    exportedAt: new Date().toISOString(),
    chart,
  }, null, 2);
  await writable.write(json);
  await writable.close();
}

function sanitize(name) {
  return name.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 40);
}

/**
 * Check if auto-export is enabled and we have a folder handle.
 */
export function hasAutoExportFolder() {
  return !!_dirHandle;
}

/**
 * Get the current folder handle name (if set).
 */
export function getAutoExportFolderName() {
  return _dirHandle ? _dirHandle.name : null;
}

/**
 * Clear the folder handle (disable auto-export).
 */
export async function disableAutoExport() {
  _dirHandle = null;
  await setSetting('autoExportEnabled', false);
}

/**
 * Restore the dir handle from a persisted permission (only works in same session).
 * Call this on app startup if autoExportEnabled is true.
 */
export async function getStoredAutoExportStatus() {
  const enabled = await getSetting('autoExportEnabled');
  return { enabled: !!enabled, hasHandle: !!_dirHandle };
}
