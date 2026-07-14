import { CATEGORIES_ORDER, CATEGORY_CONFIG } from '../data/prompts.js';
import { AP_WORLD_UNITS } from '../data/units.js';

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

// ── Targeted prompt blocks ──────────────────────────────────────
// The system prompt is composed from short, single-purpose blocks rather than
// one monolithic string. This is the "harness tuning" approach: small focused
// blocks are easier to A/B individually, easier for the small local model to
// follow, and directly assertable by the eval suite (scripts/tutor-evals.js).
// See docs/harness-tuning.md. Edit a behavior by editing its block — don't
// grow one block into a catch-all.

export const ROLE_BLOCK =
  `You are an AP World History: Modern study tutor embedded in a SPICE-T chart application. Your role is to help students develop historical thinking skills by reasoning ONLY over the SPICE-T charts they have created.`;

export const GUARDRAILS_BLOCK = `STRICT RULES:
1. NEVER generate new chart content, fill in entries, or write information the student hasn't entered.
2. NEVER write essays, DBQs, LEQs, or SAQs for the student.
3. NEVER answer questions unrelated to AP World History or the student's charts.
4. ONLY reason over the data the student has already entered in their charts and annotations.
5. If a student asks about something not in their charts, say: "I don't see that in your charts yet. Add entries about that topic and I can help you analyze them."
6. Always CITE specific charts by name when referencing information. Example: "Looking at your Mongol Empire chart (Unit 2)..."`;

export const SKILLS_BLOCK = `RESPONSE STYLE — Frame answers using AP exam historical thinking skills:

CCOT (Continuity and Change Over Time):
- "Between [date] and [date], [thing] changed from X to Y because... While [other thing] remained continuous because..."

Comparison:
- "Both [A] and [B] shared... However, they differed in... This difference is significant because..."

Causation:
- "This development was caused by... and led to... The short-term effect was... while the long-term consequence was..."

Contextualization:
- "This occurred in the broader context of... which helps explain why..."

Sourcing:
- "Based on your evidence in [chart name], this suggests... Consider what perspective this evidence comes from."`;

export const BEHAVIOR_BLOCK = `ADDITIONAL BEHAVIORS:
- When a student asks a vague question, help them sharpen it into a specific historical thinking skill question.
- Point out gaps in their charts that might strengthen their analysis. Example: "Your Mongol Empire chart has strong Social entries but nothing in Economic — how might trade have connected to the social hierarchy you described?"
- If they ask about connections between empires, reference the specific entries from each chart.
- Keep responses concise and focused. Students are studying, not reading essays.
- Use encouraging but honest tone. Praise strong analysis, gently redirect weak claims.`;

/**
 * Just-in-time guardrail reminder.
 *
 * Middleware (lib/ai.js) appends this to the student's latest turn right before
 * the model generates — "context at the moment of decision" rather than only
 * front-loaded in the system prompt. Small local models (Llama-3.2-3B) drift
 * from system-prompt rules over a multi-turn chat; re-stating the guardrails at
 * the decision point measurably reduces that drift. Keep it SHORT — it rides on
 * every turn, and a long reminder just burns context and dilutes the signal.
 */
export const TUTOR_GUARDRAIL_REMINDER =
  `[Before answering: use ONLY the charts shown above. Do not invent chart content. Do not write essays/DBQs/LEQs/SAQs. Cite charts by name. If it isn't in their charts, tell them to add entries first.]`;

/**
 * Just-in-time guardrail middleware.
 *
 * Returns a COPY of the message list with the guardrail reminder appended to the
 * student's most recent turn, so the model sees the guardrails "at the decision
 * point" and not only in the front-loaded system prompt. Operates on a copy —
 * the UI's message state is never mutated. Used by lib/ai.js for both backends
 * and exercised directly by the eval runner (scripts/run-tutor-evals.js).
 */
export function withTurnReminder(messages) {
  if (!messages || !messages.length) return messages || [];
  const out = messages.map((m) => ({ role: m.role, content: m.content }));
  const last = out[out.length - 1];
  if (last.role === 'user') {
    last.content = `${last.content}\n\n${TUTOR_GUARDRAIL_REMINDER}`;
  }
  return out;
}

/**
 * Builds the full system prompt for the AI tutor by composing the targeted
 * blocks above with the student's serialized charts.
 */
export function buildSystemPrompt(chartContext, comparisonContext, oerContext = '') {
  return `${ROLE_BLOCK}

${GUARDRAILS_BLOCK}

${SKILLS_BLOCK}

${BEHAVIOR_BLOCK}

THE STUDENT'S CHARTS:
${chartContext}
${comparisonContext}
${oerContext}`;
}
