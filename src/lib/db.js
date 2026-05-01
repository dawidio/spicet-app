import Dexie from 'dexie';

const db = new Dexie('SpiceTApp');

db.version(1).stores({
  charts: '++id, empireName, unitNumber, createdAt, updatedAt',
  comparisons: '++id, createdAt',
  settings: 'key',
});

// Default empty category data
export function createEmptyCategory() {
  return {
    entries: [{ claim: '', evidence: '', citation: '' }],
  };
}

// Default empty chart
export function createEmptyChart() {
  return {
    empireName: '',
    region: '',
    dateRange: '',
    unitNumber: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    categories: {
      social: createEmptyCategory(),
      political: createEmptyCategory(),
      interactions: createEmptyCategory(),
      cultural: createEmptyCategory(),
      economic: createEmptyCategory(),
      technological: createEmptyCategory(),
    },
  };
}

// Settings helpers
export async function getSetting(key) {
  const row = await db.settings.get(key);
  return row ? row.value : null;
}

export async function setSetting(key, value) {
  await db.settings.put({ key, value });
}

// Student profile helpers
export async function getStudentProfile() {
  const name = await getSetting('studentName');
  const classPeriod = await getSetting('classPeriod');
  return { name: name || '', classPeriod: classPeriod || '' };
}

export async function setStudentProfile(name, classPeriod) {
  await setSetting('studentName', name);
  await setSetting('classPeriod', classPeriod);
}

// Chart CRUD
export async function getAllCharts() {
  return db.charts.orderBy('updatedAt').reverse().toArray();
}

export async function getChart(id) {
  return db.charts.get(id);
}

export async function saveChart(chart) {
  chart.updatedAt = Date.now();
  if (chart.id) {
    await db.charts.put(chart);
    return chart.id;
  } else {
    return db.charts.add(chart);
  }
}

export async function deleteChart(id) {
  await db.charts.delete(id);
}

// Comparison helpers
export function createEmptyAnnotations() {
  const annotations = {};
  const categories = ['social', 'political', 'interactions', 'cultural', 'economic', 'technological'];
  for (const cat of categories) {
    annotations[cat] = { similarities: '', differences: '', ccot: '' };
  }
  return annotations;
}

export function createEmptyComparison(chartIds) {
  return {
    chartIds,
    annotations: createEmptyAnnotations(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

// Comparison CRUD
export async function getAllComparisons() {
  return db.comparisons.orderBy('createdAt').reverse().toArray();
}

export async function getComparison(id) {
  return db.comparisons.get(id);
}

export async function findComparisonByChartIds(chartIds) {
  // Find an existing comparison that matches these exact chart IDs (order-independent)
  const sorted = [...chartIds].sort((a, b) => a - b);
  const all = await db.comparisons.toArray();
  return all.find((c) => {
    const cSorted = [...c.chartIds].sort((a, b) => a - b);
    return cSorted.length === sorted.length && cSorted.every((id, i) => id === sorted[i]);
  });
}

export async function saveComparison(comparison) {
  comparison.updatedAt = Date.now();
  if (comparison.id) {
    await db.comparisons.put(comparison);
    return comparison.id;
  } else {
    return db.comparisons.add(comparison);
  }
}

export async function deleteComparison(id) {
  await db.comparisons.delete(id);
}

export default db;
