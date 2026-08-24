/**
 * SHA-256 content hash for chart de-duplication.
 * Returns a 16-char hex prefix (enough for collision resistance at this scale).
 */
export async function hashChart(chart) {
  const canonical = JSON.stringify({
    empireName: chart.empireName || '',
    region: chart.region || '',
    dateRange: chart.dateRange || '',
    unitNumber: chart.unitNumber || null,
    categories: chart.categories || {},
  });
  const buf = new TextEncoder().encode(canonical);
  const hashBuf = await crypto.subtle.digest('SHA-256', buf);
  const arr = Array.from(new Uint8Array(hashBuf));
  return arr.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
}
