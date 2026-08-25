# Session: Spiral Studio — research, build, and launch
Date: 2026-08-23 → 2026-08-24 (UTC; overnight remote session)

## What we worked on
Started as research into evidence-based AP history teaching for a 70-day
calendar and ended as a shipped system. Five parallel research threads became
the Spiral Studio course design; the app moved from SPICE-T to the official
CED themes and grew a retrieval engine; the five design gaps got closed as
software plus a weekly-planning skill; the first field audit (Unit 3) ran
through the handoff loop and its findings were folded back in.

## Decisions
- Course design is the **Spiral Studio**: flipped content with entry checks,
  cumulative retrieval openers, component writing with a norm-first scoring
  rotation, spiral assessment (30% lagged unit tests), oral defense of major
  work. Full spec: `docs/ap-history-70-day-playbook.md`.
- **CED themes replace SPICE-T** everywhere (ENV, CDI, GOV, ECN, SIO, TEC);
  app rebranded AP Theme Charts; internal keys unchanged so student data
  survives.
- **HIPP** is the sourcing acronym for both courses (superseded the earlier
  HAPP call after the field audit showed HIPP is incumbent in live materials).
  ACE for SAQs; significance work lives in ID-card "so what" + thesis reps.
- Platforms: AP Classroom for entry checks/Question Bank; only SASPD-converted
  summative marks post to Schoology.
- This cohort sits the **new May 2027 exam format** — all materials assume it.
- PR #7 (the whole system) **merged to main**; production app now carries
  Review mode and CED themes.

## Open threads
- **PR #8 (draft, watched):** Progress view + launch materials — review and
  merge when ready.
- **Field-audit loop:** Unit 4 and one APUSH unit still to run through the
  handoff comparison; findings get pushed to the branch for integration.
- **App build list remaining:** teacher-side lagged-opener generator (#3),
  defense-prep mode (#5), Running Theme Tracker view (#6).
- **Setup weekend:** ID lists per unit from CED illustrative examples, map the
  180-item Warm-Ups bank to the spiral calendar, download CB anchor sets,
  Schoology categories.
- **Synced-skill caveat:** spiral-studio was copied into the synced skills
  directory and assessment-builder/lesson-planner were updated (HIPP table,
  Studio skeleton) in this remote container — verify these survived sync on
  the local machine; if not, re-apply from the repo copy and this log.
- Measurement baseline starts week one: opener scores + calibration accuracy.

## Files created
- `docs/ap-history-70-day-playbook.md` — the full course design with evidence tiers
- `docs/ap-history-70-day-pacing.md` — 70-block calendar + compressed 6-block review variant
- `docs/spiral-studio-handoff.md` — the comparison-protocol handoff for local sessions
- `docs/field-audit-2026-08-24-apwhm-unit3.md` — first field audit (from local session)
- `docs/launch-materials/` — Block 1 experiment kit, student one-pager, calibration tracker, Unit 1 pre-work (all .docx, also delivered in chat)
- `.claude/skills/spiral-studio/` — the weekly-planning OS skill + references
- App: `src/lib/spacing.js`, `src/components/ReviewSession.jsx`, `src/components/ProgressView.jsx`, Dexie v2 in `db.js`
- Artifact: "The Spiral Studio" — https://claude.ai/code/artifact/a761e91f-5fed-48cd-9751-88b6607998a8

## Memory updates applied
- Remote container can't write the local CLAUDE.md / memory directory — paste
  block below for the global file (one standing fact, conservatively):

> My AP courses run on the Spiral Studio system — spec and calendar live in
> the spicet-app repo under docs/. CED themes (not SPICE-T), HIPP (not
> HAPPY/HAPP) for sourcing, ACE for SAQs, new-2027 exam format assumed.
> Weekly planning goes through the spiral-studio skill.

## For tomorrow
Pick up with PR #8 — merge it, then print the launch kit and run the Block 1
experiment. The system is live; from here it's teaching, auditing units
through the handoff, and letting the loop improve the playbook.
