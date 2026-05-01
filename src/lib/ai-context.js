import { CATEGORIES_ORDER, CATEGORY_CONFIG } from '../data/prompts';
import { AP_WORLD_UNITS } from '../data/units';

/**
 * Serializes a student's SPICE-T charts into a text context block
 * that the AI tutor can reason over.
 */
export function buildChartContext(charts) {
  if (!charts || charts.length === 0) {
    return 'The student has not created any SPICE-T charts yet.';
  }

  let context = `The student has created ${charts.length} SPICE-T chart(s):\n\n`;

  for (const chart of charts) {
    const unit = AP_WORLD_UNITS.find((u) => u.number === chart.unitNumber);
    const unitLabel = unit
      ? `Unit ${unit.number}: ${unit.name} (${unit.dateRange})`
      : 'No unit assigned';

    context += `═══════════════════════════════════════\n`;
    context += `CHART: ${chart.empireName || 'Untitled'}\n`;
    context += `Region: ${chart.region || 'Not specified'}\n`;
    context += `Date Range: ${chart.dateRange || 'Not specified'}\n`;
    context += `${unitLabel}\n`;
    context += `═══════════════════════════════════════\n\n`;

    for (const catKey of CATEGORIES_ORDER) {
      const config = CATEGORY_CONFIG[catKey];
      const entries = chart.categories?.[catKey]?.entries || [];
      const filledEntries = entries.filter((e) => e.claim.trim());

      context += `--- ${config.label.toUpperCase()} ---\n`;

      if (filledEntries.length === 0) {
        context += '(No entries)\n\n';
      } else {
        filledEntries.forEach((entry, i) => {
          context += `  ${i + 1}. Claim: ${entry.claim}\n`;
          if (entry.evidence.trim()) {
            context += `     Evidence: ${entry.evidence}\n`;
          }
          if (entry.citation.trim()) {
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

  const chartNames = charts
    .map((c) => c.empireName || 'Untitled')
    .join(' vs. ');

  let context = `\nThe student has a comparison between: ${chartNames}\n\n`;

  for (const catKey of CATEGORIES_ORDER) {
    const config = CATEGORY_CONFIG[catKey];
    const ann = comparison.annotations?.[catKey];
    if (!ann) continue;

    const hasSomething =
      ann.similarities?.trim() ||
      ann.differences?.trim() ||
      ann.ccot?.trim();

    if (hasSomething) {
      context += `--- ${config.label.toUpperCase()} ANALYSIS ---\n`;
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
  return `You are an AP World History: Modern study tutor embedded in a SPICE-T chart application. Your role is to help students develop historical thinking skills by reasoning ONLY over the SPICE-T charts they have created.

STRICT RULES:
1. NEVER generate new chart content, fill in entries, or write information the student hasn't entered.
2. NEVER write essays, DBQs, LEQs, or SAQs for the student.
3. NEVER answer questions unrelated to AP World History or the student's charts.
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
- Point out gaps in their charts that might strengthen their analysis. Example: "Your Mongol Empire chart has strong Social entries but nothing in Economic — how might trade have connected to the social hierarchy you described?"
- If they ask about connections between empires, reference the specific entries from each chart.
- Keep responses concise and focused. Students are studying, not reading essays.
- Use encouraging but honest tone. Praise strong analysis, gently redirect weak claims.

THE STUDENT'S CHARTS:
${chartContext}
${comparisonContext}
${oerContext}`;
}
