# Harness tuning for the AI tutor

This app improves the tutor by **tuning the harness, not the model** — the
serving-side scaffolding (system prompt, just-in-time context, evals) rather
than model weights. That matters here because the model is not ours to retrain:
it's a small in-browser model (Llama-3.2-3B via WebLLM) or the user's own Gemini
key. Everything we can control lives in `src/lib/ai-context.js` and
`src/lib/ai.js`.

Adapted from LangChain's "tuning the harness, not the model" playbook.

## The pieces

### 1. Targeted prompt blocks — `src/lib/ai-context.js`

The system prompt is composed from short, single-purpose blocks
(`ROLE_BLOCK`, `GUARDRAILS_BLOCK`, `SKILLS_BLOCK`, `BEHAVIOR_BLOCK`) instead of
one monolithic string. Small focused blocks are easier to change in isolation,
easier for the small local model to follow, and directly assertable by the eval
suite. **Edit a behavior by editing its block** — don't grow one block into a
catch-all.

### 2. Just-in-time guardrail reminder — `withTurnReminder` (`ai-context.js`)

`TUTOR_GUARDRAIL_REMINDER` is a compact restatement of the guardrails that the
middleware appends to the student's **latest turn**, right before the model
generates. This is "context at the decision point": small local models drift
from front-loaded system-prompt rules over a long chat, and re-stating the
guardrails at the moment of decision measurably reduces that drift. It's applied
in both backends in `ai.js`. Keep the reminder short — it rides on every turn.

### 3. Behavioral evals — `scripts/tutor-evals.js` + `scripts/run-tutor-evals.js`

The guardrails (only reason over the student's charts; never generate chart
content; never write essays/DBQs/LEQs/SAQs; cite charts by name) are encoded as
probes so a harness change is validated, not eyeballed.

```bash
npm run eval:tutor                      # structural checks only (no key, CI-safe)
GEMINI_API_KEY=... npm run eval:tutor   # + live behavioral probes vs Gemini
```

- **Structural checks** always run: the composed prompt still contains every
  block, and the reminder middleware appends to the right turn without mutating
  the caller's array or leaking onto earlier turns.
- **Behavioral probes** run only when `GEMINI_API_KEY` is set: each probe hits
  Gemini against a fixture chart and is scored by a keyword heuristic. The
  heuristics are a fast regression signal, not a rubric grade.

## The loop

1. **Observe** a bad tutor response (a leaked essay, an invented entry, a
   drifted refusal).
2. **Encode** it as a probe in `scripts/tutor-evals.js`.
3. **Fix** the smallest thing — a single block or the reminder — in
   `ai-context.js`.
4. **Validate** with `npm run eval:tutor` (with a key for behavioral probes) and
   confirm no regressions.
5. `npm run build` and ship.

Prefer small, targeted block edits over broad rewrites, and always re-run the
suite so a fix for one probe doesn't regress another.
