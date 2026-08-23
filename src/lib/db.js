import Dexie from 'dexie';
import { CATEGORIES_ORDER } from '../data/prompts';
import { createReviewState, applyMark } from './spacing';

// Dexie database name is a persisted identifier — do not rename (existing
// student data lives under it), even though the app now brands as AP Theme Charts.
const db = new Dexie('SpiceTApp');

db.version(1).stores({
  charts: '++id, empireName, unitNumber, createdAt, updatedAt',
  comparisons: '++id, createdAt',
  settings: 'key',
});

// v2: retrieval scheduling. Adds a stable `id` to every chart entry (review
// rows point at entries across edits) and a `reviews` store keyed by
// `${chartId}:${categoryKey}:${entryId}` holding successive-relearning state.
db.version(2)
  .stores({
    charts: '++id, empireName, unitNumber, createdAt, updatedAt',
    comparisons: '++id, createdAt',
    settings: 'key',
    reviews: 'id, nextDue, chartId',
  })
  .upgrade(async (tx) => {
    await tx
      .table('charts')
      .toCollection()
      .modify((chart) => {
        for (const cat of Object.values(chart.categories || {})) {
          for (const entry of cat.entries || []) {
            if (!entry.id) entry.id = makeEntryId();
          }
        }
      });
  });

export function makeEntryId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function createEmptyEntry() {
  return { id: makeEntryId(), claim: '', evidence: '', citation: '' };
}

// Default empty category data
export function createEmptyCategory() {
  return {
    entries: [createEmptyEntry()],
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
    categories: Object.fromEntries(
      CATEGORIES_ORDER.map((key) => [key, createEmptyCategory()])
    ),
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
  for (const cat of CATEGORIES_ORDER) {
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

// ── Retrieval scheduling (successive relearning over the student's own entries) ──

// Reconcile the reviews store with current chart content: every entry with a
// non-empty claim gets a review row; rows for deleted/emptied entries go away.
// Also backfills entry ids defensively for any entry created without one.
export async function syncReviews() {
  const charts = await db.charts.toArray();
  const validIds = new Set();

  for (const chart of charts) {
    let chartDirty = false;
    for (const [catKey, cat] of Object.entries(chart.categories || {})) {
      for (const entry of cat.entries || []) {
        if (!entry.id) {
          entry.id = makeEntryId();
          chartDirty = true;
        }
        if (!entry.claim?.trim()) continue;
        const reviewId = `${chart.id}:${catKey}:${entry.id}`;
        validIds.add(reviewId);
        const existing = await db.reviews.get(reviewId);
        if (!existing) {
          await db.reviews.put({
            id: reviewId,
            chartId: chart.id,
            categoryKey: catKey,
            entryId: entry.id,
            ...createReviewState(),
          });
        }
      }
    }
    if (chartDirty) await db.charts.put(chart);
  }

  const stale = (await db.reviews.toArray()).filter((r) => !validIds.has(r.id));
  for (const r of stale) await db.reviews.delete(r.id);
}

// Due queue, joined with live entry content. Call after syncReviews().
export async function getDueReviews(now = Date.now()) {
  const due = await db.reviews.where('nextDue').belowOrEqual(now).toArray();
  if (due.length === 0) return [];

  const chartIds = [...new Set(due.map((r) => r.chartId))];
  const charts = await db.charts.bulkGet(chartIds);
  const chartById = new Map(charts.filter(Boolean).map((c) => [c.id, c]));

  const cards = [];
  for (const review of due) {
    const chart = chartById.get(review.chartId);
    const entry = chart?.categories?.[review.categoryKey]?.entries?.find(
      (e) => e.id === review.entryId
    );
    if (!entry || !entry.claim?.trim()) continue;
    cards.push({ review, entry, chart });
  }
  return cards;
}

export async function getDueReviewCount(now = Date.now()) {
  await syncReviews();
  return db.reviews.where('nextDue').belowOrEqual(now).count();
}

export async function recordReviewMark(reviewId, mark, now = Date.now()) {
  const row = await db.reviews.get(reviewId);
  if (!row) return null;
  const next = { ...row, ...applyMark(row, mark, now) };
  await db.reviews.put(next);
  return next;
}

export default db;
