---
name: spiral-studio
description: >
  The Spiral Studio operating system for David's AP history courses (APWHM
  primary, APUSH via conversion notes). Turns the 70-block calendar into
  ready-to-teach weeks: Studio-skeleton day plans, flipped pre-work with entry
  checks, lagged retrieval openers, writing reps with an assigned scoring mode,
  and relearning-deck reminders. Trigger on: "plan my week," "spiral studio,"
  "what block are we on," "next block," "studio day plan," or any weekly AP
  planning request once the Spiral Studio course design is in use.
---

# Spiral Studio OS

The weekly engine for the course design in `docs/ap-history-70-day-playbook.md`.
It exists to close four gaps that documents alone don't close: flipped
accountability, exam-weighted pacing, student-side scoring, and game film
before peer scoring. (The fifth gap — the retrieval/spacing scheduler — is
software: the app's Review mode, `src/lib/spacing.js`.)

## Intake (resolve, don't interrogate)

1. **Course** — APWHM unless clearly APUSH. APUSH remaps via the conversion
   notes at the end of `docs/ap-history-70-day-pacing.md`.
2. **Current block number** — ask David ("what block are we on?") or infer
   from what he says he taught last. Everything keys off this.
3. **Disruptions** — lost days, sub days, schedule changes this week. Apply
   the calendar's cut-order rules, never silently skip writing reps or openers.
4. **Calendar shape** — if the real section calendar gives fewer review
   blocks than the default 12, use the compressed-review variant in the
   pacing doc (6 blocks; the daily openers carry the spiral).

## The weekly build

Read `docs/ap-history-70-day-pacing.md` for the blocks in scope, then read
`references/day-skeletons.md`. For **each block this week** produce:

1. **Day type + main event** from the calendar row.
2. **The Studio skeleton** filled in for this content (retrieval opener →
   sentence sprint → clarification → main event → writing rep → exit +
   prequestions). Brief `ap-world-lesson-planner` with this skeleton —
   override its default mini-lecture structure; the skeleton wins.
3. **Flipped pre-work spec** (see `references/flipped-pipeline.md`): the
   video/article assignment AND its accountability artifact. Never assign
   pre-work without a check.
4. **Lagged opener spec**: 4–6 items, ~half current unit, ~half from the
   spiral sources listed in the calendar row (or ≥2 units back by default).
   **Wire before you write**: check David's existing banks first (the field
   audit found a 180-item recall bank + key in `Warm-Ups/`) and map bank
   items to the spiral calendar; then AP Classroom Question Bank; only then
   have `ap-world-assessment-builder` author new items.
5. **Writing rep + scoring mode** from the rotation table in
   `references/day-skeletons.md`. If the rep's skill is being peer-scored for
   the first time, schedule the norming session FIRST
   (`references/norming-protocol.md`) — game film before anyone scores a peer.
6. **Relearning reminder**: which unit decks are in their +2wk / +5wk / April
   windows this week (count back from the block numbers when units closed).
   Students run these in the app's Review mode; the reminder goes in the
   day's exit slide.

## Platform rules (AP Classroom + Schoology)

- **Entry checks**: assign via AP Classroom Topic Questions when a matching
  topic exists; otherwise a 3–5 item Schoology quiz (autograded). Completion
  credit only — accuracy grading kills honest data.
- **Progress Checks**: AP Classroom at unit close, completion credit; reteach
  the top 1–2 weakest skills from the class report before moving on.
- **Schoology gradebook**: only summative, teacher-scored work posts, converted
  through the SASPD tables in `ap-world-assessment-builder`. Peer scores,
  self scores, opener results, and app review data NEVER enter the gradebook —
  they're formative signal, and saying so out loud is what keeps marks honest.
- Mastery retakes on objective checks stay open until the unit deadline
  ("mastery within, deadlines between").

## Output

One Word document (via `docx` skill, Calibri) per week: a one-page week
overview (blocks, day types, pre-work due, decks due, what to print), then one
page per block with the filled skeleton. David's voice — direct, warm, no
jargon. Assume a colleague could teach from it.

## Guardrails

- Never plan first-exposure lecture into a block; content acquisition is
  homework. The in-class instruction segment is for *clarifying what the
  entry checks showed was misunderstood*.
- Never drop the opener or the writing rep to make room — those are the
  course. Cut main-event scope instead (the calendar's cut-order list governs).
- Peer scoring before norming is a sequencing error — flag it, don't build it.
