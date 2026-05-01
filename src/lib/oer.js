/**
 * OER Knowledge Base Loader
 * Loads unit-specific OER content and builds context for the AI tutor.
 */

const cache = {};

export async function loadUnitOER(unitNumber) {
  if (cache[unitNumber]) return cache[unitNumber];

  try {
    const response = await fetch(`/oer-knowledge/unit${unitNumber}.json`);
    if (!response.ok) return null;
    const data = await response.json();
    cache[unitNumber] = data;
    return data;
  } catch (err) {
    console.warn(`Failed to load OER for unit ${unitNumber}:`, err);
    return null;
  }
}

export async function loadAllOER() {
  const units = [];
  for (let i = 1; i <= 9; i++) {
    const data = await loadUnitOER(i);
    if (data) units.push(data);
  }
  return units;
}

/**
 * Build OER context string for units relevant to the student's charts
 */
export async function buildOERContext(charts) {
  const unitNumbers = [...new Set(charts.map((c) => c.unitNumber).filter(Boolean))];
  if (unitNumbers.length === 0) return '';

  const oerData = await Promise.all(unitNumbers.map(loadUnitOER));
  const loaded = oerData.filter(Boolean);

  if (loaded.length === 0) return '';

  let context = '\n\nREFERENCE KNOWLEDGE (from OER sources — use to provide context, not to fill student charts):\n\n';

  for (const unit of loaded) {
    context += `── Unit ${unit.unit}: ${unit.name} (${unit.dateRange}) ──\n`;
    context += `${unit.overview}\n\n`;

    for (const topic of unit.keyTopics) {
      context += `  ${topic.region} (${topic.empires.join(', ')}):\n`;
      for (const [cat, text] of Object.entries(topic.highlights)) {
        context += `    ${cat.charAt(0).toUpperCase() + cat.slice(1)}: ${text}\n`;
      }
      context += '\n';
    }
  }

  return context;
}
