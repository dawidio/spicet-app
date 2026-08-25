import { getThemeKeywords, getThemeOrder } from '../data/theme-keywords';

export function classifyEntry(claim = '', evidence = '', course = 'apwhm') {
  const text = `${claim} ${evidence}`.toLowerCase();
  const keywords = getThemeKeywords(course);
  const order = getThemeOrder(course);
  const matched = [];
  for (const abbr of order) {
    const { keywords: kws } = keywords[abbr];
    if (kws.some(kw => text.includes(kw))) matched.push(abbr);
  }
  return matched;
}

export function classifyChart(chart) {
  const course = chart.course || 'apwhm';
  const result = {};
  for (const [cat, catData] of Object.entries(chart.categories || {})) {
    result[cat] = {};
    const entries = catData.entries || [];
    entries.forEach((entry, idx) => {
      if (entry.claim?.trim()) {
        result[cat][idx] = classifyEntry(entry.claim, entry.evidence, course);
      }
    });
  }
  return result;
}
