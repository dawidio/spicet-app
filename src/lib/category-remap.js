/**
 * Legacy SPICE-T → CED theme key remapping.
 *
 * Kept in its own module, free of Dexie and React, so the v4 upgrade paths in
 * db.js can be exercised directly by a plain Node script — the remap is the
 * part that silently loses student work if it's wrong.
 */

export const SPICET_TO_CED = {
  interactions: 'ENV',
  cultural: 'CDI',
  political: 'GOV',
  economic: 'ECN',
  social: 'SIO',
  technological: 'TEC',
};

export const APWHM_KEYS = ['ENV', 'CDI', 'GOV', 'ECN', 'SIO', 'TEC'];
export const APUSH_KEYS = ['NAT', 'WOR', 'GEO', 'MIG', 'PCE', 'WXT', 'SOC', 'ARC'];

const ALL_CED_KEYS = [...APWHM_KEYS, ...APUSH_KEYS];

/**
 * Remap a category-keyed record — `chart.categories` or
 * `comparison.annotations` — from SPICE-T keys to CED theme keys.
 *
 * Values are carried across by reference, untouched. Keys already in CED form
 * pass through. Keys that are neither are dropped, which is what the WIP
 * migration did: they cannot be rendered by a UI that iterates the CED order.
 *
 * Returns null when there is nothing to remap, so callers can skip the write.
 */
export function remapCategoryKeys(source) {
  if (!source || typeof source !== 'object') return null;

  const out = {};
  for (const [oldKey, newKey] of Object.entries(SPICET_TO_CED)) {
    if (source[oldKey] !== undefined) out[newKey] = source[oldKey];
  }
  for (const key of ALL_CED_KEYS) {
    if (source[key] !== undefined && out[key] === undefined) out[key] = source[key];
  }
  return out;
}

/**
 * True when a category-keyed record still holds at least one SPICE-T key.
 */
export function needsCategoryRemap(source) {
  if (!source || typeof source !== 'object') return false;
  return Object.keys(SPICET_TO_CED).some((k) => source[k] !== undefined);
}

/**
 * Remap one review row. The category key is embedded in the row's primary
 * key, so the id string is rewritten alongside the field. Scheduling state
 * (nextDue, stage, successes, history) rides along untouched.
 *
 * Returns null when the row needs no remap.
 */
export function remapReviewRow(row) {
  const parts = typeof row.id === 'string' ? row.id.split(':') : [];
  const oldKey = row.categoryKey ?? (parts.length === 3 ? parts[1] : undefined);
  const newKey = SPICET_TO_CED[oldKey];
  if (!newKey) return null;

  const chartId = row.chartId ?? (parts.length === 3 ? Number(parts[0]) : undefined);
  const entryId = row.entryId ?? (parts.length === 3 ? parts[2] : undefined);

  return {
    ...row,
    categoryKey: newKey,
    chartId,
    entryId,
    id: `${chartId}:${newKey}:${entryId}`,
  };
}
