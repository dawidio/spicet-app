/**
 * Tutor eval runner — the validation half of the harness-tuning loop.
 *
 *   node scripts/run-tutor-evals.js        # structural checks only (no key)
 *   GEMINI_API_KEY=... npm run eval:tutor  # + live behavioral probes
 *
 * Structural checks run everywhere (CI-safe, no model, no network): they assert
 * the composed system prompt still contains each guardrail block and that the
 * just-in-time reminder middleware behaves. Behavioral probes only run when a
 * GEMINI_API_KEY is present — they send each probe to Gemini against a fixture
 * chart and score the reply with the heuristics in tutor-evals.js.
 *
 * Exit code is non-zero if any check that actually ran failed.
 */

import {
  ROLE_BLOCK,
  GUARDRAILS_BLOCK,
  SKILLS_BLOCK,
  BEHAVIOR_BLOCK,
  TUTOR_GUARDRAIL_REMINDER,
  buildSystemPrompt,
  buildChartContext,
  withTurnReminder,
} from '../src/lib/ai-context.js';
import { TUTOR_EVALS, FIXTURE_CHARTS } from './tutor-evals.js';

const GREEN = (s) => `\x1b[32m${s}\x1b[0m`;
const RED = (s) => `\x1b[31m${s}\x1b[0m`;
const DIM = (s) => `\x1b[2m${s}\x1b[0m`;

let failures = 0;
function check(name, pass, detail = '') {
  const tag = pass ? GREEN('PASS') : RED('FAIL');
  console.log(`  ${tag}  ${name}${detail ? DIM('  — ' + detail) : ''}`);
  if (!pass) failures += 1;
}

// ── Structural checks (always) ──────────────────────────────────
console.log('\nStructural checks (system prompt + middleware)');

const systemPrompt = buildSystemPrompt(
  buildChartContext(FIXTURE_CHARTS),
  '',
  ''
);

check('system prompt contains role block', systemPrompt.includes(ROLE_BLOCK));
check(
  'system prompt contains guardrails block',
  systemPrompt.includes(GUARDRAILS_BLOCK)
);
check('system prompt contains skills block', systemPrompt.includes(SKILLS_BLOCK));
check(
  'system prompt contains behavior block',
  systemPrompt.includes(BEHAVIOR_BLOCK)
);
check(
  'guardrails enumerate all 6 strict rules',
  [1, 2, 3, 4, 5, 6].every((n) => GUARDRAILS_BLOCK.includes(`${n}.`))
);
check(
  'system prompt embeds the fixture chart by name',
  systemPrompt.includes('Mongol Empire')
);

// Just-in-time reminder middleware.
check(
  'reminder is short (rides on every turn)',
  TUTOR_GUARDRAIL_REMINDER.length > 0 && TUTOR_GUARDRAIL_REMINDER.length < 400,
  `${TUTOR_GUARDRAIL_REMINDER.length} chars`
);
const convo = [
  { role: 'user', content: 'first question' },
  { role: 'assistant', content: 'an answer' },
  { role: 'user', content: 'second question' },
];
const injected = withTurnReminder(convo);
check(
  'reminder is appended to the latest user turn',
  injected[2].content.includes(TUTOR_GUARDRAIL_REMINDER) &&
    injected[2].content.startsWith('second question')
);
check(
  'reminder does not leak onto earlier turns',
  !injected[0].content.includes(TUTOR_GUARDRAIL_REMINDER)
);
check(
  'middleware does not mutate the caller array',
  !convo[2].content.includes(TUTOR_GUARDRAIL_REMINDER)
);

// ── Behavioral checks (only with a key) ─────────────────────────
const apiKey = process.env.GEMINI_API_KEY;

async function askGemini(prompt) {
  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: withTurnReminder([{ role: 'user', content: prompt }]).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
    generationConfig: { temperature: 0.2, maxOutputTokens: 800 },
  };
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) {
    throw new Error(`Gemini API error ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

if (!apiKey) {
  console.log(
    '\n' +
      DIM(
        'Behavioral probes skipped — set GEMINI_API_KEY to run them live against the tutor.'
      )
  );
} else {
  console.log('\nBehavioral probes (Gemini, temp 0.2)');
  for (const evalCase of TUTOR_EVALS) {
    try {
      const reply = await askGemini(evalCase.prompt);
      const { pass, reason } = evalCase.expect(reply);
      check(`${evalCase.id} [${evalCase.guardrail}]`, pass, reason);
    } catch (err) {
      check(`${evalCase.id} [${evalCase.guardrail}]`, false, err.message);
    }
  }
}

// ── Summary ─────────────────────────────────────────────────────
console.log('');
if (failures > 0) {
  console.log(RED(`✗ ${failures} check(s) failed`));
  process.exit(1);
}
console.log(GREEN('✓ all checks passed'));
