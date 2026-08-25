# SPICE-T App — Study Tool Features

**Audience:** Claude Code, picking this up to implement.
**Goal:** Turn the existing chart-building tool into a real study tool. Five additive features, in priority order.

---

## Context

The current app lets a student author SPICE-T charts (one chart per empire/state, six categories, multiple entries per category) and compare two charts side-by-side. Persistence is local-first (Dexie/IndexedDB). There is already a `CompareView` and an `AITutor` component. No backend, no login.

The features below build **on top of** the student's own charts. We are not adding a master reference dataset — the student studies against the work they themselves have written. That's the pedagogical bet: encoding by writing, retrieving by recalling.

**Stack assumptions** (do not change without reason):
- React 19 + Vite 6 + Tailwind 4
- Dexie for storage, additive schema migrations only
- `lucide-react` for icons
- WebLLM (local) with Gemini fallback for AI calls
- `jspdf` + `html2canvas` for export

---

## Design principles

1. **Local-first, no login.** Many students are in mainland China. Anything that requires a sign-in or a CDN that may be blocked is out.
2. **Student voice in copy.** "Quiz me," "Show me where I'm fuzzy," "Try one." Not "Begin assessment" or "Performance analytics."
3. **One tap to start studying.** A student should be able to open the app and be in a recall session within two clicks.
4. **Elegant over clever.** Plain typography, generous whitespace, no novelty animations. The chart itself is the hero.
5. **Mobile and print friendly.** A student studying on a phone on the bus and a student printing for a study group both need this to work. Test both at every step.
6. **Additive, not destructive.** Don't refactor existing components unless required. New features live in new components and new Dexie tables.
7. **Honest about state.** If a feature depends on the student having ≥N charts filled in, show a friendly empty state explaining what to do, not a broken view.

---

## Data model additions

Add a single Dexie schema bump (`db.version(2)`) with two new tables. Keep all existing tables and shapes unchanged.

```js
db.version(2).stores({
  // existing: charts, comparisons, settings
  reviews: '++id, chartId, category, entryIndex, rating, reviewedAt, nextDueAt',
  studySessions: '++id, mode, startedAt, endedAt, itemsTotal, itemsCorrect',
});
```

**`reviews`** — one row per recall attempt on a single entry. Used by Recall Mode and Progress Map.
- `chartId` — FK to `charts`
- `category` — `'social' | 'political' | 'interactions' | 'cultural' | 'economic' | 'technological'`
- `entryIndex` — index into that category's `entries` array (entries don't have stable IDs; if that becomes a problem, mint UUIDs on the entries themselves in v3)
- `rating` — `'got_it' | 'fuzzy' | 'no_idea'`
- `reviewedAt` — epoch ms
- `nextDueAt` — epoch ms; computed by the scheduler (see Recall Mode)

**`studySessions`** — one row per study session for progress over time.
- `mode` — `'recall' | 'compare' | 'prompt'`
- `itemsTotal`, `itemsCorrect` — for the end-of-session summary

**Theme tags on entries.** Add an optional `themes: string[]` field on each entry (`{ claim, evidence, citation, themes? }`). Six valid tags: `GOV, ECN, CDI, SIO, TEC, ENV`. Existing entries default to `[]`. Theme Lens (Feature 4) populates and reads this.

**Provenance fields on charts.** Add two optional fields on the `charts` row:
- `importedFrom?: { authorName: string, authorClassPeriod?: string, importedAt: number, sourceHash: string }` — populated only on charts brought in via PDF import (Feature 7). Renders a permanent "Imported" badge in the UI. Cannot be edited away by the student.
- `originExportHash?: string` — content hash of the last exported PDF for this chart. Used by Folder Auto-Save (Feature 6) to skip writes when nothing meaningful changed.

**New settings keys** (in the existing `settings` table):
- `stayLocalOnly: boolean` — default `true`. Governs the Gemini fallback (see Data & Privacy).
- `autoExportEnabled: boolean` — default `false`. See Feature 6.
- `autoExportDirHandle: FileSystemDirectoryHandle | null` — the user-chosen folder. `FileSystemDirectoryHandle` is structured-cloneable, so it stores in IndexedDB as-is. Permission may need re-granting per session — handle gracefully.
- `autoExportLastError?: string` — surfaces in Settings so a student knows if backups stopped working.

**No breaking migration.** Old charts continue to work because all new fields are optional.

---

## Feature 1 — Recall Mode

**The single highest-leverage feature.** Active recall is the difference between a chart and a study tool.

### User story

A student opens the app the night before a unit test. They tap "Quiz me." The app picks one of their entries, shows them just enough to identify it (empire + category), and asks them to recall the rest. They self-rate. Repeat for ~10 minutes. Done.

### Entry points

- A primary "Quiz me" button on the Dashboard, prominent.
- A secondary "Quiz this chart" button on each chart card and inside `ChartEditor`.
- Optional URL: `/?mode=recall&scope=chart:42` so students can bookmark a recall session for one chart.

### Scope picker (one screen, three choices)

Before the session starts, the student picks a scope. Default is "All my charts." Other options: a specific unit (1–9), or a specific chart. No multi-select, no advanced filters.

If the student has fewer than 3 entries across the chosen scope, show an empty state: *"You need a few more entries before quizzing. Add some, then come back."* with a button to the editor. Don't crash, don't half-load.

### Card flow (the core loop)

For each item:

1. **Prompt card** — shows: empire name, category (with color chip), and the entry's `claim` field. Hides `evidence` and `citation`.
2. **Self-recall pause** — student thinks. Optional: tap-and-hold to dim the prompt and force eyes-closed recall (nice but optional for v1).
3. **Reveal** — single tap shows `evidence` and `citation`.
4. **Self-rate** — three buttons: "Got it" / "Fuzzy" / "No idea." Tapping any of them logs a `reviews` row and advances.

That's it. No typing input in v1. We're optimizing for low-friction, train-or-bus-ride study. Free-text recall with grading is a v2 question because it requires good fuzzy matching.

### Scheduler (Leitner-lite)

Map ratings to next-due intervals:

| Rating | Next due |
|---|---|
| Got it | +3 days, capped at 14 |
| Fuzzy | +1 day |
| No idea | +30 minutes (in-session) and again +1 day |

For each entry, the next session draws from items whose `nextDueAt <= now`. If fewer than 10 items are due, fill the rest with random entries the student hasn't seen recently. **Never quiz the same entry twice in the same session** unless the rating was "no idea."

This is intentionally not full SM-2/Anki. We want a kid to feel forward motion without a power user's UI burden.

### End of session

Show a clean summary card:

- "You did 12 cards in 6 minutes."
- "8 you've got, 3 are fuzzy, 1 is new territory."
- A list of the "no idea" entries with a one-tap link back to that chart's editor at the right entry.
- Encouragement copy in David's voice: *"Solid run. The fuzzy ones are where the work is — look at those tomorrow."*

Persist a `studySessions` row.

### Acceptance criteria

- A student with 10+ entries can complete a 10-card session in under a minute of clicking (no laggy reveal).
- Closing the tab mid-session and reopening starts a fresh session — partial sessions are not resumable in v1 (keep it simple).
- The scope picker, the card, and the summary all work on a 360-px-wide phone viewport.
- Print stylesheet hides the recall flow entirely (it's not meant to be printed).

---

## Feature 2 — Comparison Diff (enhance existing `CompareView`)

The comparison view exists. Right now it shows two charts side-by-side with annotation strips. Two additions make it dramatically more useful for studying.

### Addition A: Auto-diff highlights

For each of the six SPICE-T rows, compute and display:

- **Continuity tag** — when both empires share an evidence pattern (rough heuristic: any entry in chart A's category has ≥2 stemmed-word overlap with any entry in chart B's category, ignoring stopwords). Tag color: muted gray.
- **Change tag** — entries present in one chart's category but with no overlap match in the other. Tag color: terracotta.
- **New development tag** — entries in the later-period chart that contain any of the cue phrases *"first," "new," "introduced," "began,"* etc. Tag color: green.

These are **suggestions, not assertions** — render them as soft pills near each entry the student can dismiss. The pedagogical value is that the student sees the AP comparison/CCOT skill physically taking shape on their own work.

Heuristic must be deterministic and run in <50 ms for two full charts. No AI dependency.

### Addition B: Comparison thesis stub

At the top of `CompareView`, generate a copyable thesis stub:

> *"Although both **{empireA}** and **{empireB}** {shared continuity in N categories}, they differed most notably in {category with most change tags}, where {empireA} {one-line claim} while {empireB} {one-line claim}."*

Filled in mechanically from the diff results. Click "Copy" — copies plain text. Click "Practice" — opens Prompt Lab (Feature 3) pre-loaded with this comparison.

This is not the AI tutor's job. It's a templated string. Boring on purpose, because it gives the student a visible scaffold they can edit, not a black-box answer.

### Acceptance criteria

- Diff tags appear within 100 ms of opening the comparison.
- Tags can be hidden via a single toggle (some students will find them noisy mid-thinking).
- Thesis stub gracefully handles edge cases (empty categories, charts with one entry, identical empires).
- Existing `AnnotationStrip` continues to work unchanged.

---

## Feature 3 — Prompt Lab

Turn the chart into a thesis-writing gym.

### User story

A student wants to practice LEQ writing but doesn't know what to practice. They tap "Prompt Lab." The app generates a prompt grounded in their own charts, gives them a thesis scaffold, and lets them write a draft they can save or share with their teacher.

### Entry points

- "Prompt Lab" tab in the Dashboard nav.
- "Practice this comparison" button inside `CompareView` (passes the two charts in).

### Generation logic

The student picks a prompt type:

- **Comparison** — needs ≥2 charts. Generate: *"Compare and contrast the {category} characteristics of {empireA} and {empireB} in the period {dateRange}."*
- **Causation** — needs ≥1 chart with ≥2 entries in the same category. Generate: *"Analyze the causes of {claim} in {empire}, {dateRange}."*
- **Continuity & Change Over Time** — needs ≥2 charts in different units. Generate: *"To what extent did {category} structures change in {region/timespan}?"*

These are templated, not AI-generated, by design. Determinism > novelty here — students need to be able to practice the same prompt twice and feel progress.

### The writing surface

Three stacked sections:

1. **The prompt** — locked card at top.
2. **Thesis scaffold** — pre-filled from chart data, editable. Student can rewrite freely.
3. **Body bullets** — three editable bullets, each pre-loaded with one entry from the relevant charts. Hint text: *"Make it your own — these are your starting points."*

A "Hide hints" toggle lets the student blank everything and write from scratch.

### Save / share

- "Save draft" — writes to a new Dexie table `promptDrafts` (add to v2 migration if you didn't above; otherwise add a v3 schema bump).
- "Export to PDF" — uses existing `lib/export.js` patterns. Output: prompt, student's thesis, body, with their name and class period.
- "Show me a model thesis" — only here can the student call the AI tutor. Use the existing `AITutor` component scoped to "improve this thesis" mode. Model output is labeled clearly as suggestion, not answer key.

### Acceptance criteria

- Prompt generation feels instant (< 50 ms).
- All three prompt types produce readable, AP-appropriate prompts even when chart data is sparse.
- Drafts persist across page reloads.
- PDF export opens correctly in Word and Preview.

---

## Feature 4 — Theme Lens

Cross-cuts the SPICE-T chart by AP theme. Same data, second view.

### Why

The AP exam organizes itself by themes (GOV, ECN, CDI, SIO, TEC, ENV) more than by SPICE-T. Letting students re-slice their own work by theme means one chart serves both ways the exam asks them to think.

### How

Each entry can carry a `themes: string[]` field with any of the six valid tags. Students tag their entries either:

- Manually, via a small set of toggle pills under each entry in the editor, OR
- Automatically, via a simple keyword classifier (`lib/theme-classifier.js`) that runs on save. Don't use AI — a keyword map is plenty (e.g., "tax," "trade," "merchant" → ECN; "religion," "art," "language" → CDI). Suggestions only; the toggle pills are still authoritative.

### The Theme view

A new tab on the Dashboard: "By Theme." Layout:

- Six rows (one per theme), each labeled with its name and a one-line description.
- Each row contains every entry across all the student's charts that carries that theme tag, grouped by chart.
- Each entry card shows its source: empire, category, dateRange.
- Click any entry to jump to its chart in the editor.

This is essentially a saved query, not a new data structure. Cheap to build, high pedagogical value.

### Empty / sparse states

- If a theme has no entries: *"Nothing tagged {THEME} yet. Tag some entries in the editor and they'll show up here."*
- If the student has tagged nothing: show a one-time onboarding card explaining themes with a "Try the auto-tagger" button.

### Acceptance criteria

- Tagging an entry in `ChartEditor` updates the Theme view without a full reload.
- Auto-tagger keyword map is a separate file (`src/data/theme-keywords.js`) so David can tweak it.
- Theme view is print-friendly: each theme starts on a new page with a clean header.

---

## Feature 5 — Progress Map

A bird's-eye view of where the student is strong, weak, and silent.

### Layout

A compact 6×N grid (6 SPICE-T categories × N charts the student has built), each cell colored by mastery state derived from `reviews`:

- **Untouched** — pale gray. No `reviews` rows for any entry in this cell.
- **Learning** — light terracotta. Has reviews; most recent rating is "fuzzy" or "no idea."
- **Solid** — sage green. Most recent rating is "got it" and `nextDueAt` is in the future.
- **Due** — gold ring around any state. `nextDueAt <= now`.

Click any cell — jump to that category in the editor for that chart.

Above the grid, three numbers in plain prose: *"You've got 34 entries. 12 are solid, 7 need work, 15 you haven't quizzed yet."*

A "Study what's weakest" button starts a Recall session scoped to all "Learning" cells.

### Why this beats a generic dashboard

It maps directly onto the SPICE-T mental model the student is already using. They don't have to learn a new visualization — it's the chart they've been building, recolored by what they actually know.

### Acceptance criteria

- Grid renders for any number of charts (1 to 50+) without horizontal scroll on a phone — wrap to multiple rows if needed.
- Cell color updates within one second of completing a recall session.
- Print version of the Progress Map is one page, fits-letter, useful for a parent or teacher to see at a glance.

---

## Feature 6 — Folder Auto-Save (PDF Mirror)

The "lost device, lost work" problem solved without a server.

### The idea

The student picks a folder once. From then on, every time they save a chart, the app writes a fresh PDF of that chart into the folder. If the student points the folder at iCloud Drive, OneDrive, Dropbox, or Google Drive, **their cloud sync software handles the backup for free**. We never touch the cloud. They get device-portability and disaster-recovery without us holding any data.

### How it works

Use the **File System Access API** (`window.showDirectoryPicker`). Available in Chromium browsers (Chrome, Edge, Brave, Arc); not in Safari or Firefox. On unsupported browsers, the toggle is disabled with a one-line note explaining why and offering manual export instead.

```js
// rough sketch — see lib/auto-export.js below
const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
await setSetting('autoExportDirHandle', dirHandle);
```

The handle persists in IndexedDB. On first chart save in a new session, request permission renewal:

```js
const perm = await dirHandle.queryPermission({ mode: 'readwrite' });
if (perm !== 'granted') {
  // Show a tiny banner: "Re-grant access to your backup folder?"
  await dirHandle.requestPermission({ mode: 'readwrite' });
}
```

If the user denies, mark `autoExportEnabled = false` and surface a non-blocking banner in Settings. Don't keep nagging.

### When it triggers

- On `saveChart()` success, debounced 2 seconds. (A student typing into ChartEditor saves often; we don't want a write per keystroke.)
- On `saveComparison()` success, same debounce.
- A "Back up everything now" button in Settings forces a full sweep.
- Skip the write if the chart's `originExportHash` matches the new content hash — nothing changed worth saving.

### Filename convention

```
{empire-slug}_unit{N}.pdf
```

So `ottoman-empire_unit3.pdf`. Always overwrite the same filename — the folder shows the **latest** version of each chart, not a history. Keep it tidy. Slug `empireName` aggressively (lowercase, hyphenate, ASCII-only).

A second file at the folder root, `_spicet-index.pdf`, contains a one-page directory of every chart with last-saved timestamps. Useful for a teacher receiving the folder, and gives the student a single thing to print if they want a snapshot.

Snapshots / version history are explicitly out of scope for v1. The student's cloud sync software (or the OS's file versioning) handles that for them.

### What gets written to the PDF

Two layers:

1. **Human-readable**: a clean rendered PDF of the chart — same layout you'd want printed. Use the same export pipeline Feature 7 needs (move from `jspdf` to **`pdf-lib`**; jspdf can't attach files or write structured custom metadata reliably). Existing `lib/export.js` should be refactored as part of this work.
2. **Machine-readable**: the chart serialized as JSON, embedded two ways — as a custom metadata key (`/SpicetChart`) AND as an attached file (`spicet-chart.json`). Redundancy because not all PDF readers preserve both. See Feature 7 for the JSON schema.

This dual encoding is what makes Feature 7 (import) possible.

### UI

In `Settings.jsx`, new "Auto-Save" section:

- Toggle: "Save my work to a folder automatically"
- "Choose folder…" button — opens the directory picker
- Status line: "Last saved: 3 minutes ago to /Documents/SPICET-Backup" (live)
- Error line (only when applicable): "Couldn't save to that folder. Pick a new one?"
- Help text: *"Pick any folder — even one that syncs to iCloud or OneDrive. Your work goes there as PDFs you can read, print, or import on another device."*

In `Header.jsx`, add a tiny indicator (lucide `cloud-check` icon, no color) next to the chart title in the editor: gray when off, soft green when enabled and last-write succeeded, soft amber when enabled but pending. Tooltip on hover.

### Acceptance criteria

- Toggling on, picking a folder, and editing a chart results in a valid PDF in that folder within 5 seconds.
- The PDF round-trips through Feature 7 import to produce an equal chart (verified by content hash).
- Browser support: feature detects `showDirectoryPicker`; on unsupported browsers, the Auto-Save section shows a "Not supported in this browser — try Chrome or Edge" message and a "Manual export" button instead.
- No write happens when the chart hasn't materially changed (hash match).
- Permission revoked mid-session degrades gracefully — student sees one banner, not a console of errors.

---

## Feature 7 — Chart Sharing via PDF (the sneakernet)

The other half of the round-trip. Students share PDFs by email, AirDrop, USB stick, school network share, whatever — and the receiver imports them as charts. Computers never talk to each other; files do.

### The idea

A SPICE-T export is **both** a printable PDF and a portable data file. We embed the chart's JSON in two places (custom metadata + attachment) when exporting. On import, we extract the JSON, validate it, preview it for the student, and add it to their chart database with a clear "Imported from {Name}" label.

This solves a real classroom problem: a student misses class, a friend has full notes, and they want to study from those notes. Today they'd photograph someone's paper or copy-paste from a Google Doc. With this, they share the same PDF the friend already exports for backup, and it imports as a fully searchable, quizzable, comparable chart — clearly attributed to the original author.

### Embedded JSON schema (v1)

```json
{
  "spicetVersion": 1,
  "kind": "chart",
  "exportedAt": 1735689600000,
  "author": { "name": "Wei Chen", "classPeriod": "B Block" },
  "chart": {
    "empireName": "Ottoman Empire",
    "region": "Anatolia, Balkans, Levant",
    "dateRange": "1450–1750",
    "unitNumber": 3,
    "categories": {
      "social": { "entries": [{ "claim": "...", "evidence": "...", "citation": "...", "themes": ["SIO"] }] },
      "...": {}
    }
  },
  "contentHash": "sha256-..."
}
```

A second `kind: "comparison"` payload is allowed — embeds two `chart` payloads plus the annotation strip. Defer comparison-import to v1.1 if it stretches scope; charts alone unlock the core value.

`contentHash` is computed over the canonicalized `chart` object (sorted keys, normalized whitespace) and is what `originExportHash` (Feature 6) compares against.

### Export side

Already covered by Feature 6's PDF writer. Make sure:

- Exports include a small visible footer: *"Created by {name} · Exported {date} · Reimport at spicet-app.vercel.app"*. This way, a printout is still attributable, and a recipient who got the PDF without context knows what to do with it.
- A standalone "Export this chart" button exists in `ChartEditor` for one-off shares without enabling auto-save.

### Import side (the new surface)

A new component, `ImportChart.jsx`, accessible from:

- A "Import a PDF" button on the Dashboard.
- Drag-and-drop on the Dashboard background (with a clear drop overlay).
- A "+ Add" menu item next to "New chart."

Flow:

1. **Pick or drop** — accept `.pdf` files only.
2. **Parse** — `lib/pdf-import.js` uses `pdf-lib`'s `PDFDocument.load` to read custom metadata, falling back to attachments. If neither yields a valid `spicetVersion: 1` payload, show a clear error: *"This PDF doesn't look like a SPICE-T chart export. Make sure it was exported from this app."*
3. **Validate** — strict schema check (use a small hand-rolled validator; no AJV needed). Reject anything with extra unknown top-level keys, missing required fields, or `spicetVersion > 1`.
4. **Preview** — render a non-editable preview of what will be imported: empire, unit, dates, entry counts per category, the original author's name. Two action buttons:
   - **"Add as a new chart"** (default) — creates a new row; preserves attribution.
   - **"Discard"**.
5. **De-duplicate** — if any existing chart has the same `originExportHash` as the import's `contentHash`, skip with a friendly message: *"You already have this exact chart from {Name}."*
6. **Conflict on empire+unit** — if the student already has a chart with the same `empireName` + `unitNumber`, don't merge. Add the new one with a numeric suffix (`Ottoman Empire (from Wei)`). Merging is a foot-gun and breaks attribution.
7. **Commit** — save with `importedFrom` populated. Toast: *"Imported Ottoman Empire from Wei. You'll see it on your dashboard."*

### Attribution UI (load-bearing)

Imported charts must always render a permanent badge somewhere visible:

- On the Dashboard card: a small pill `Imported from Wei` next to the chart title.
- In `ChartEditor`: a banner across the top — *"Imported from Wei (B Block) on Apr 28. This is study material, not your original work. Make your own version to learn it."*
- In `CompareView`: imported charts get the badge in their column header.
- In `ProgressMap` (Feature 5): cells from imported charts use a hatched fill pattern to distinguish them from original work. Quizzing imported entries is allowed — that's the point — but they're visually marked.

The student cannot remove the badge. They *can* delete the imported chart, or "fork" it (a button that creates an editable copy, blanks all the entries, and links back to the import as a reference). Forking is the right path if they want to use it as a starter.

### Academic integrity copy

In David's voice, baked into the import flow:

> *"This is someone else's work. Use it to learn from — quiz yourself against it, compare it to yours, see how they explained things. Don't copy it into your own charts and call it yours. Your teacher will see the 'Imported' label on every printout."*

Put this as a check-once-then-dismiss banner the first time a student imports anything. After that, it's a tooltip.

### Selective import (nice to have, defer if needed)

In the preview step, let the student check which categories to include. Default all on. Useful when the friend's chart has Social filled in beautifully but Cultural is a mess.

### Trust model

The import path parses **JSON only**. Never `eval`, never render arbitrary HTML from imported strings. All chart text is treated as plain text and React-escaped. PDFs are parsed by `pdf-lib`, which is a known-good library; we don't execute any embedded scripts.

### Acceptance criteria

- Round-trip integrity: export a chart → import the resulting PDF → the imported chart's content hash matches the source's.
- Importing a non-SPICET PDF (e.g., a student's homework PDF) shows the friendly error and never crashes.
- Importing the same PDF twice never produces duplicates.
- Attribution badge is present in every place the imported chart appears.
- Drag-and-drop works on Chrome/Edge/Safari/Firefox. (Reading the embedded data works only where pdf-lib runs, which is everywhere.)

### Library choice

Use **`pdf-lib`** for both export and import going forward. Add it as a dependency. Keep `jspdf` only if migration is non-trivial; otherwise remove it. The export pipeline in `lib/export.js` should be the single place PDFs are produced.

---

## Voice & copy guide

Apply this to every new string introduced in the features above.

- **Buttons:** verb + object, low ceremony. "Quiz me," "Try one," "Show me where I'm fuzzy," "See the diff," "Save this draft."
- **Empty states:** acknowledge the situation, give a next step. *"Nothing tagged ENV yet. Tag some entries and they'll show up here."*
- **Encouragement:** earned, specific, never generic. ✅ *"Solid run. The fuzzy ones are where the work is."* ❌ *"Great job!"*
- **Errors:** plain language, no stack traces, always offer a next move. *"Couldn't save. Check your connection or try again."*
- **No jargon:** "spaced repetition" → "we'll bring back the ones you missed." "Heuristic diff" → "what looks similar / what looks different."

When in doubt, write it the way Mr. Jacobson would say it to a 10th grader — direct, warm, never condescending.

---

## Data & Privacy

This is core to the product, not a footnote.

### What's true today

All student data lives in the browser's IndexedDB on the student's own device. Charts, comparisons, profile (name + class period), and — once the new features ship — review history, theme tags, and saved drafts. There is no server-side database, no account, no login, and no copy of student work on Vercel or anywhere else we control.

The student's chart contents do not leave their device, with one exception: the existing AI tutor's Gemini fallback. When the in-browser WebLLM model fails to load, calls fall back to Google's API, and the prompt — which often includes chart text — travels with the request. That's the one place data leaves the device today.

### `Stay local only` toggle (Settings)

Add a single boolean setting, **default ON**, exposed in `Settings.jsx` under a new "Privacy" section.

- Setting key: `stayLocalOnly` (in the existing `settings` Dexie table).
- When ON: `lib/ai.js` must refuse to call the Gemini fallback. If WebLLM isn't ready, the AI tutor shows a friendly message — *"The local tutor is still loading. We won't send your work to outside servers, so this might take a minute on a slow connection."* — and a "Try again" button.
- When OFF: behavior is today's behavior. The toggle's helper text must clearly explain what flipping it off means: *"Allow the tutor to send your work to Google's servers when the local model can't load. Faster, but your text leaves the device."*
- The toggle must persist across sessions and survive cache clears as long as IndexedDB isn't wiped.
- On first run, surface the setting briefly in `WelcomeSetup` — one sentence, one checkbox, no scary language. *"Your work stays on your device. The AI tutor runs locally too — leave this on."*

### Welcome screen language

In `WelcomeSetup.jsx`, add one short paragraph above the name field:

> *Your charts live on this device, in this browser. We don't have a copy. That means your work is private — and it also means if you switch devices or clear your browser, your charts won't follow. Use the auto-save folder (Settings) or PDF export to keep a backup.*

Plain, honest, no legalese.

### What David (the teacher) can and cannot see

He cannot pull student work from a server because there isn't one. The only way for him to see a student's chart is for the student to export a PDF and share it. That's a feature — students trust the tool more — but it should be communicated explicitly in any teacher-facing materials so it doesn't surprise anyone.

### Telemetry

None. No analytics SDK, no error reporter that sends payloads off-device. If we ever add error logging, it must log to the console only, never phone home. Privacy is a load-bearing claim of this product; do not undermine it for convenience.

---

## What's out of scope for v1

These are good ideas that intentionally do not ship in this round. Note them and move on.

- Free-text recall with fuzzy grading. (v2 — needs careful UX work for partial credit.)
- Account sync across devices. (Maybe never — local-first is the bet.)
- Teacher view / classroom mode. (Separate product surface.)
- AI-generated prompts. (Templates are better at this stage; prompts the AI invents drift away from the student's actual work.)
- Gamification (streaks, badges, XP). High-school students see through this fast and it cheapens the tool. Skip.
- Audio narration. (Small audience; high build cost.)
- Real-time collaborative editing. (Out — costs scale, benefit doesn't.)

---

## Suggested build order

Build in this sequence. Each step is independently shippable.

1. **Schema bump (`db.version(2)`)** — `reviews`, `studySessions`, optional `themes` on entries, new settings keys, `importedFrom` and `originExportHash` on charts. No UI yet. Verify migrations don't break existing charts.
2. **`Stay local only` toggle + Welcome screen privacy line** — small, fast, sets the tone. Affects copy in `WelcomeSetup` and `Settings`, plus a guard in `lib/ai.js`. Ship before anything that touches student data more deeply.
3. **PDF pipeline migration to `pdf-lib`** — refactor `lib/export.js` to produce PDFs with embedded JSON metadata + attachments. No new UI; verify exports still look right. This is the foundation for Features 6 and 7.
4. **Recall Mode** — scope picker → card flow → summary. End-to-end on Dashboard. Ship this alone before anything else student-facing; it's the feature that justifies the whole tool.
5. **Progress Map** — natural follow-on once `reviews` data exists.
6. **Folder Auto-Save** — needs the PDF pipeline from step 3. Settings UI + `lib/auto-export.js` + the header indicator.
7. **Chart Sharing via PDF (import side)** — needs the same pipeline. New `ImportChart.jsx`, `lib/pdf-import.js`, attribution UI everywhere imported charts surface.
8. **CompareView additions** — diff tags + thesis stub. Lowest risk because the view already exists.
9. **Prompt Lab** — biggest new pure-UI surface; build after the data flow is solid.
10. **Theme Lens** — last because it's the most additive. Tagging behavior should not block any of the above.

---

## Files Claude Code will likely touch

For orientation, not prescription. Use judgment.

- `src/lib/db.js` — schema bump, helpers for `reviews`, `studySessions`, new settings keys, provenance fields.
- `src/lib/ai.js` — honor `stayLocalOnly`; refuse Gemini fallback when on.
- `src/lib/export.js` — **refactor.** Migrate to `pdf-lib`. Single canonical PDF producer used by Features 6 and 7.
- `src/lib/auto-export.js` — **new.** File System Access API integration, debounced writes, permission handling, content-hash skip logic. Feature 6.
- `src/lib/pdf-import.js` — **new.** Read embedded JSON from a PDF (custom metadata + attachment), validate against schema, return a normalized chart object. Feature 7.
- `src/lib/recall.js` — **new.** Scheduler logic, item selection.
- `src/lib/diff.js` — **new.** Heuristic comparison for Feature 2.
- `src/lib/theme-classifier.js` + `src/data/theme-keywords.js` — **new.** Feature 4.
- `src/lib/hash.js` — **new.** Canonicalize + SHA-256 a chart object for `contentHash` / `originExportHash`.
- `src/components/RecallSession.jsx` — **new.** Feature 1 main surface.
- `src/components/ProgressMap.jsx` — **new.** Feature 5.
- `src/components/PromptLab.jsx` — **new.** Feature 3.
- `src/components/ThemeView.jsx` — **new.** Feature 4.
- `src/components/ImportChart.jsx` — **new.** Feature 7 (drop zone, preview, confirm).
- `src/components/ImportedBadge.jsx` — **new.** Reusable attribution badge used wherever imported charts surface.
- `src/components/CompareView.jsx` — extend with diff tags + thesis stub; show import badge in column headers.
- `src/components/Settings.jsx` — Privacy section (`Stay local only`) + Auto-Save section (Feature 6).
- `src/components/WelcomeSetup.jsx` — privacy paragraph + checkbox.
- `src/components/Header.jsx` — auto-save status indicator.
- `src/components/Dashboard.jsx` — add nav entries for the new modes; drag-drop import zone.
- `src/components/ChartEditor.jsx` — imported-chart banner; "Export this chart" button.
- `src/App.jsx` — register the new screens in the existing screen-state machine.

**New dependency:** `pdf-lib`. Likely removable: `jspdf`, `jspdf-autotable` (after migration).

---

## A note on the AI tutor

`AITutor` already exists. The features above deliberately avoid leaning on it for core flows. Reserve it for places where the student explicitly asks for help — the "Show me a model thesis" button in Prompt Lab, and the existing tutor conversations. Recall Mode, Compare diff, Theme Lens, and Progress Map should all work fully without AI. That keeps the tool fast, keeps it usable when WebLLM hasn't loaded, and keeps the student's own thinking at the center.

---

*Last updated: May 1, 2026. Author: Mr. Jacobson, with planning support from Claude.*
