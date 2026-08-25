import { getCategoriesOrder, getCategoryConfig } from '../data/prompts';
import { AP_WORLD_UNITS, APUSH_PERIODS } from '../data/units';

function unitsForCourse(course) {
  return course === 'apush' ? APUSH_PERIODS : AP_WORLD_UNITS;
}

function unitWord(course) {
  return course === 'apush' ? 'Period' : 'Unit';
}

/**
 * Serializes a student's theme charts into a text context block
 * that the AI tutor can reason over.
 */
export function buildChartContext(charts) {
  if (!charts || charts.length === 0) {
    return 'The student has not created any theme charts yet.';
  }

  let context = `The student has created ${charts.length} theme chart(s), each organized by the official College Board CED themes for its course:\n\n`;

  for (const chart of charts) {
    const course = chart.course || 'apwhm';
    const categoriesOrder = getCategoriesOrder(course);
    const categoryConfig = getCategoryConfig(course);
    const unit = unitsForCourse(course).find((u) => u.number === chart.unitNumber);
    const unitLabel = unit
      ? `${unitWord(course)} ${unit.number}: ${unit.name} (${unit.dateRange})`
      : `No ${unitWord(course).toLowerCase()} assigned`;

    context += `═══════════════════════════════════════\n`;
    context += `CHART: ${chart.empireName || 'Untitled'}\n`;
    context += `Course: ${course === 'apush' ? 'AP United States History' : 'AP World History: Modern'}\n`;
    context += `Region: ${chart.region || 'Not specified'}\n`;
    context += `Date Range: ${chart.dateRange || 'Not specified'}\n`;
    context += `${unitLabel}\n`;
    context += `═══════════════════════════════════════\n\n`;

    for (const catKey of categoriesOrder) {
      const config = categoryConfig[catKey];
      const entries = chart.categories?.[catKey]?.entries || [];
      const filledEntries = entries.filter((e) => e.claim?.trim());

      context += `--- ${config.abbr} — ${config.label.toUpperCase()} ---\n`;

      if (filledEntries.length === 0) {
        context += '(No entries)\n\n';
      } else {
        filledEntries.forEach((entry, i) => {
          context += `  ${i + 1}. Claim: ${entry.claim}\n`;
          if (entry.evidence?.trim()) {
            context += `     Evidence: ${entry.evidence}\n`;
          }
          if (entry.citation?.trim()) {
            context += `     Citation: ${entry.citation}\n`;
          }
        });
        context += '\n';
      }
    }
    context += '\n';
  }

  return context;
}

/**
 * Serializes comparison annotations into context
 */
export function buildComparisonContext(comparison, charts) {
  if (!comparison) return '';

  const course = comparison.course || charts?.[0]?.course || 'apwhm';
  const categoriesOrder = getCategoriesOrder(course);
  const categoryConfig = getCategoryConfig(course);

  const chartNames = charts
    .map((c) => c.empireName || 'Untitled')
    .join(' vs. ');

  let context = `\nThe student has a comparison between: ${chartNames}\n\n`;

  for (const catKey of categoriesOrder) {
    const config = categoryConfig[catKey];
    const ann = comparison.annotations?.[catKey];
    if (!ann) continue;

    const hasSomething =
      ann.similarities?.trim() ||
      ann.differences?.trim() ||
      ann.ccot?.trim();

    if (hasSomething) {
      context += `--- ${config.abbr} — ${config.label.toUpperCase()} ANALYSIS ---\n`;
      if (ann.similarities?.trim()) {
        context += `  Similarities: ${ann.similarities}\n`;
      }
      if (ann.differences?.trim()) {
        context += `  Differences: ${ann.differences}\n`;
      }
      if (ann.ccot?.trim()) {
        context += `  Change & Continuity Over Time: ${ann.ccot}\n`;
      }
      context += '\n';
    }
  }

  return context;
}

/**
 * Builds the full system prompt for the AI tutor
 */
export function buildSystemPrompt(chartContext, comparisonContext, oerContext = '') {
  return `You are an AP history study tutor embedded in a theme-chart application serving two courses: AP World History: Modern and AP United States History. Students organize their notes by the official College Board CED themes for their course.

AP World History: Modern — Humans and the Environment (ENV), Cultural Developments and Interactions (CDI), Governance (GOV), Economic Systems (ECN), Social Interactions and Organization (SIO), Technology and Innovation (TEC).

AP United States History — American and National Identity (NAT), America in the World (WOR), Geography and the Environment (GEO), Migration and Settlement (MIG), Politics and Civic Engagement (PCE), Work, Exchange, and Technology (WXT), Social Structures (SOC), American and Regional Culture (ARC).

Use these CED theme names and abbreviations when discussing categories, and use the ones that belong to the chart's own course. Your role is to help students develop historical thinking skills by reasoning ONLY over the theme charts they have created.

STRICT RULES:
1. NEVER generate new chart content, fill in entries, or write information the student hasn't entered.
2. NEVER write essays, DBQs, LEQs, or SAQs for the student.
3. NEVER answer questions unrelated to AP history or the student's charts.
4. ONLY reason over the data the student has already entered in their charts and annotations.
5. If a student asks about something not in their charts, say: "I don't see that in your charts yet. Add entries about that topic and I can help you analyze them."
6. Always CITE specific charts by name when referencing information. Example: "Looking at your Mongol Empire chart (Unit 2)..."

RESPONSE STYLE — Frame answers using AP exam historical thinking skills:

CCOT (Continuity and Change Over Time):
- "Between [date] and [date], [thing] changed from X to Y because... While [other thing] remained continuous because..."

Comparison:
- "Both [A] and [B] shared... However, they differed in... This difference is significant because..."

Causation:
- "This development was caused by... and led to... The short-term effect was... while the long-term consequence was..."

Contextualization:
- "This occurred in the broader context of... which helps explain why..."

Sourcing:
- "Based on your evidence in [chart name], this suggests... Consider what perspective this evidence comes from."

ADDITIONAL BEHAVIORS:
- When a student asks a vague question, help them sharpen it into a specific historical thinking skill question.
- Point out gaps in their charts that might strengthen their analysis. Example: "Your Mongol Empire chart has strong Social Interactions and Organization (SIO) entries but nothing in Economic Systems (ECN) — how might trade have connected to the social hierarchy you described?"
- If they ask about connections between charts, reference the specific entries from each chart.
- Keep responses concise and focused. Students are studying, not reading essays.
- Use encouraging but honest tone. Praise strong analysis, gently redirect weak claims.

THE STUDENT'S CHARTS:
${chartContext}
${comparisonContext}
${oerContext}`;
}
