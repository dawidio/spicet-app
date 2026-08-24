/**
 * Chart import — parse .json files with embedded theme chart data.
 * Also handles future PDF+JSON export bundles.
 */

// Current export envelope version. Readers accept every version in this list;
// writers (export.js, auto-export.js) emit SPICET_EXPORT_VERSION.
export const SPICET_EXPORT_VERSION = 2;
export const SUPPORTED_EXPORT_VERSIONS = [1, 2];

/**
 * Parse a dropped file into a chart object.
 * Returns { chart, authorName, authorClassPeriod, importedAt, sourceHash } or throws.
 */
export async function parseImportFile(file) {
  if (file.name.endsWith('.json') || file.type === 'application/json') {
    return parseJSONFile(file);
  }
  if (file.name.endsWith('.pdf') || file.type === 'application/pdf') {
    throw new Error('PDF import coming soon. For now, share the .json file exported alongside the PDF, or use "Export JSON" from the chart menu.');
  }
  throw new Error(`Unsupported file type: ${file.type || file.name}. Drop a .json file exported from AP Theme Charts.`);
}

async function parseJSONFile(file) {
  const text = await file.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Invalid JSON file. Make sure you're importing a file exported from AP Theme Charts.");
  }

  if (!data.spicetVersion || !data.chart) {
    throw new Error("This doesn't look like an AP Theme Charts export file. Missing required fields.");
  }

  if (!SUPPORTED_EXPORT_VERSIONS.includes(data.spicetVersion)) {
    throw new Error(
      `This export was made by a newer version of AP Theme Charts (format ${data.spicetVersion}). Update the app, then import again.`
    );
  }

  const chart = data.chart;
  const meta = data.meta || {};

  return {
    chart,
    authorName: meta.studentName || chart.studentName || null,
    authorClassPeriod: meta.classPeriod || chart.classPeriod || null,
    importedAt: Date.now(),
    sourceHash: data.contentHash || null,
  };
}
