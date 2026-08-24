import Dexie from 'dexie';
import { getCategoriesOrder } from '../data/prompts';
import { createReviewState, applyMark } from './spacing';

// Dexie database name is a persisted identifier — do not rename (existing
// student data lives under it), even though the app now brands as AP Theme Charts.
const db = new Dexie('SpiceTApp');

// Old SPICE-T category keys → CED theme keys. Used by the v4 upgrade to remap
// both chart category keys and the categoryKey segment of review row ids.
const SPICET_TO_CED = {
  interactions: 'ENV',
  cultural: 'CDI',
  political: 'GOV',
  economic: 'ECN',
  social: 'SIO',
  technological: 'TEC',
};

const APWHM_KEYS = ['ENV', 'CDI', 'GOV', 'ECN', 'SIO', 'TEC'];
const APUSH_KEYS = ['NAT', 'WOR', 'GEO', 'MIG', 'PCE', 'WXT', 'SOC', 'ARC'];

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

// v3: study-session logging. Purely additive — no data migration needed.
db.version(3).stores({
  charts: '++id, empireName, unitNumber, createdAt, updatedAt',
  comparisons: '++id, createdAt',
  settings: 'key',
  reviews: 'id, nextDue, chartId',
  studySessions: '++id, mode, startedAt, endedAt, itemsTotal, itemsCorrect',
});

// v4: dual-course support. Charts gain a `course` index (defaulting to
// 'apwhm') and their SPICE-T category keys are remapped to CED theme keys.
// Review rows carry the category key inside their primary key, so the same
// remap is applied there — otherwise every existing review orphans against a
// category key that no longer exists.
db.version(4)
  .stores({
    charts: '++id, empireName, unitNumber, course, createdAt, updatedAt',
    comparisons: '++id, createdAt',
    settings: 'key',
    reviews: 'id, nextDue, chartId',
    studySessions: '++id, mode, startedAt, endedAt, itemsTotal, itemsCorrect',
  })
  .upgrade(async (tx) => {
    await tx
      .table('charts')
      .toCollection()
      .modify((chart) => {
        if (!chart.course) chart.course = 'apwhm';
        if (!chart.categories) return;

        const newCats = {};
        for (const [oldKey, newKey] of Object.entries(SPICET_TO_CED)) {
          if (chart.categories[oldKey] !== undefined) {
            newCats[newKey] = chart.categories[oldKey];
          }
        }
        // Pass through any keys that are already CED acronyms
        for (const key of [...APWHM_KEYS, ...APUSH_KEYS]) {
          if (chart.categories[key] !== undefined && !newCats[key]) {
            newCats[key] = chart.categories[key];
          }
        }
        chart.categories = newCats;
      });

    // Review ids embed the category key, so they must be rewritten, not
    // modified in place (Dexie will not let you change a primary key).
    const reviews = await tx.table('reviews').toArray();
    const remapped = [];
    let anyRemapped = false;

    for (const row of reviews) {
      const parts = typeof row.id === 'string' ? row.id.split(':') : [];
      const oldKey = row.categoryKey ?? (parts.length === 3 ? parts[1] : undefined);
      const newKey = SPICET_TO_CED[oldKey];
      if (!newKey) {
        remapped.push(row);
        continue;
      }
      anyRemapped = true;
      const chartId = row.chartId ?? (parts.length === 3 ? Number(parts[0]) : undefined);
      const entryId = row.entryId ?? (parts.length === 3 ? parts[2] : undefined);
      // nextDue / stage / successes / history all ride along untouched.
      remapped.push({
        ...row,
        categoryKey: newKey,
        chartId,
        entryId,
        id: `${chartId}:${newKey}:${entryId}`,
      });
    }

    if (anyRemapped) {
      await tx.table('reviews').clear();
      await tx.table('reviews').bulkPut(remapped);
    }
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

// Default empty chart, scoped to a course's CED themes
export function createEmptyChart(course = 'apwhm') {
  return {
    empireName: '',
    region: '',
    dateRange: '',
    unitNumber: null,
    course,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    categories: Object.fromEntries(
      getCategoriesOrder(course).map((key) => [key, createEmptyCategory()])
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

export async function getStayLocalOnly() {
  const val = await getSetting('stayLocalOnly');
  return val === null ? true : val;
}

export async function getAutoExportEnabled() {
  const val = await getSetting('autoExportEnabled');
  return val === null ? false : val;
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

export async function getChartsForCourse(course) {
  const all = await getAllCharts();
  return all.filter((c) => (c.course || 'apwhm') === course);
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
export function createEmptyAnnotations(course = 'apwhm') {
  const annotations = {};
  for (const cat of getCategoriesOrder(course)) {
    annotations[cat] = { similarities: '', differences: '', ccot: '' };
  }
  return annotations;
}

export function createEmptyComparison(chartIds, course = 'apwhm') {
  return {
    chartIds,
    course,
    annotations: createEmptyAnnotations(course),
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
  return joinReviewsWithEntries(due);
}

// Every review row, joined with live entry content — used by the scope picker
// when the student wants to drill charts that aren't due yet.
export async function getAllReviewCards() {
  return joinReviewsWithEntries(await db.reviews.toArray());
}

async function joinReviewsWithEntries(rows) {
  if (rows.length === 0) return [];

  const chartIds = [...new Set(rows.map((r) => r.chartId))];
  const charts = await db.charts.bulkGet(chartIds);
  const chartById = new Map(charts.filter(Boolean).map((c) => [c.id, c]));

  const cards = [];
  for (const review of rows) {
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

// Per-theme calibration stats across all review history. Powers the
// Progress view: entries tracked, mastered (past the learning phase), and
// the honest knew/lucky/wrong tallies.
export async function getReviewStats() {
  await syncReviews();
  const rows = await db.reviews.toArray();
  const stats = {};
  for (const row of rows) {
    const cat = row.categoryKey;
    if (!stats[cat]) {
      stats[cat] = {
        total: 0,
        mastered: 0,
        marks: { knew: 0, lucky: 0, wrong: 0 },
      };
    }
    const s = stats[cat];
    s.total += 1;
    if (row.stage > 0) s.mastered += 1;
    for (const h of row.history || []) {
      if (s.marks[h.mark] !== undefined) s.marks[h.mark] += 1;
    }
  }
  return stats;
}

// Raw review rows (current scheduling state + history[]). ProgressMap reads
// these directly rather than an event log.
export async function getAllReviews() {
  return db.reviews.toArray();
}

export async function recordReviewMark(reviewId, mark, now = Date.now()) {
  const row = await db.reviews.get(reviewId);
  if (!row) return null;
  const next = { ...row, ...applyMark(row, mark, now) };
  await db.reviews.put(next);
  return next;
}

// ── Study sessions ─────────────────────────────────────────────────────────
export async function startStudySession(mode) {
  return db.studySessions.add({
    mode,
    startedAt: Date.now(),
    endedAt: null,
    itemsTotal: 0,
    itemsCorrect: 0,
  });
}

export async function endStudySession(id, itemsTotal, itemsCorrect) {
  await db.studySessions.update(id, { endedAt: Date.now(), itemsTotal, itemsCorrect });
}

export async function getAllStudySessions() {
  return db.studySessions.orderBy('startedAt').reverse().toArray();
}

export default db;
