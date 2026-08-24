/**
 * Stemmed-word overlap heuristic for comparing theme chart entries.
 * Deterministic, <5ms, no AI required.
 *
 * Returns 'similar' | 'different' | 'unique' based on overlap ratio.
 */

// Very light stemmer: lowercase, strip common suffixes
function stem(word) {
  return word
    .toLowerCase()
    .replace(/[^a-z]/g, '')
    .replace(/(ing|tion|ed|er|ly|ment|ness|ies|es|s)$/, '');
}

function tokenize(text) {
  const STOPWORDS = new Set(['the','a','an','and','or','but','in','on','at','to','for','of','with','by','is','was','were','are','be','been','being','have','had','has','it','its','this','that','these','those','from','as','not','no','he','she','they','we','you','i','his','her','their','our','your','my','what','which','who','when','where','how','why','also','both','each','all','more','most','than','then','so','if','do','did','does','can','could','would','should','may','might','will','shall','very','just','only','even','now','after','before','during','through','between','into','over','under','up','down','out','off','about','against','across','along','around','behind','below','beside','beyond','near','since','until','upon','within','without']);
  return text
    .toLowerCase()
    .split(/\W+/)
    .map(stem)
    .filter(w => w.length > 2 && !STOPWORDS.has(w));
}

function overlap(setA, setB) {
  if (!setA.size || !setB.size) return 0;
  let count = 0;
  for (const w of setA) if (setB.has(w)) count++;
  return count / Math.max(setA.size, setB.size);
}

/**
 * Tag two strings as similar/different/unique.
 * - 'similar'   → overlap >= 0.35
 * - 'different' → overlap > 0 but < 0.35
 * - 'unique'    → overlap === 0
 */
export function compareTexts(a, b) {
  if (!a?.trim() || !b?.trim()) return 'unique';
  const setA = new Set(tokenize(a));
  const setB = new Set(tokenize(b));
  const r = overlap(setA, setB);
  if (r >= 0.35) return 'similar';
  if (r > 0) return 'different';
  return 'unique';
}

/**
 * Compare all entries of a category across multiple charts.
 * Returns a matrix: tags[chartIndex][entryIndex] = 'similar'|'different'|'unique'
 */
export function diffCategory(charts, catKey) {
  const allEntries = charts.map(chart => {
    const entries = chart.categories?.[catKey]?.entries || [];
    return entries.filter(e => e.claim?.trim());
  });

  // For each (chart, entry), find the max overlap with any entry in any other chart
  const tags = allEntries.map((entries, ci) =>
    entries.map((entry) => {
      let bestTag = 'unique';
      for (let oi = 0; oi < allEntries.length; oi++) {
        if (oi === ci) continue;
        for (const other of allEntries[oi]) {
          const tag = compareTexts(entry.claim, other.claim);
          if (tag === 'similar') return 'similar'; // found best match
          if (tag === 'different') bestTag = 'different';
        }
      }
      return bestTag;
    })
  );

  return tags;
}
