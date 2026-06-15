# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this is

**SPICE-T Charts** is a local-first study tool for **AP World History: Modern**.
Students build SPICE-T charts (Social, Political, Interactions, Cultural,
Economic, Technological), compare empires side-by-side, and study with an AI
tutor that reasons **only over the student's own work**. There is no backend —
everything lives in the browser.

Live app: https://spicet-app.vercel.app

## Stack

- **React 19** + **Vite 6** (ESM, `"type": "module"`)
- **Tailwind CSS v4** via `@tailwindcss/vite` (no `tailwind.config.js`; theme
  lives in `src/index.css`)
- **Dexie** (IndexedDB) for all persistence — no server, no auth
- **WebLLM** (`@mlc-ai/web-llm`) for in-browser local AI, with a **Gemini**
  (BYO API key) fallback
- **jsPDF** + **html2canvas** for PDF export
- **lucide-react** for icons

## Commands

```bash
npm install      # install deps (run once per fresh clone — see SessionStart hook)
npm run dev      # Vite dev server with HMR
npm run build    # production build — USE THIS to verify changes (there are no tests/linter)
npm run preview  # serve the production build locally
```

There is **no test suite and no ESLint/Prettier config**. `npm run build` is the
canonical correctness check — it surfaces import errors, syntax errors, and most
breakage. Run it before considering a change done.

## Architecture

```
src/
  main.jsx              # React entry
  App.jsx               # Top-level screen router (state machine, no router lib)
  index.css             # Tailwind v4 import + theme tokens (category colors live here)
  components/           # One component per file, default export, PascalCase
    Dashboard, ChartEditor, CompareView, Settings, WelcomeSetup,
    Header, AITutor, CategorySection, EntryRow, AnnotationStrip
  lib/
    db.js               # Dexie schema + all CRUD (charts, comparisons, settings)
    ai.js               # AI engine: WebLLM <-> Gemini backend switching + streaming
    ai-context.js       # Serializes student charts into the tutor's system prompt
    oer.js              # Loads /public/oer-knowledge/unitN.json reference content
    export.js           # PDF export
    anti-paste.js       # Disables paste/drop on entry fields (anti-cheating)
  data/
    units.js            # AP_WORLD_UNITS — the 9 College Board units + date ranges
    prompts.js          # CATEGORY_CONFIG + CATEGORIES_ORDER — the SPICE-T categories
public/
  oer-knowledge/unitN.json  # Open Educational Resource knowledge per unit (1–9)
```

### Navigation
`App.jsx` is a hand-rolled screen state machine (`screen` = `loading` |
`welcome` | `dashboard` | `editor` | `compare` | `settings`). There is **no
router library** — add new screens by extending this switch, not by adding
react-router.

### Data model (Dexie, `src/lib/db.js`)
- `charts`: `++id, empireName, unitNumber, createdAt, updatedAt`. Each chart has
  `categories` keyed by the six SPICE-T category keys, each holding
  `entries: [{ claim, evidence, citation }]`.
- `comparisons`: `++id, createdAt`. Holds `chartIds` + per-category
  `annotations` (`similarities`, `differences`, `ccot`).
- `settings`: `key`-keyed store used for student profile + the Gemini API key.

When changing persisted shapes, bump the Dexie version in `db.js` and add a
migration — never silently change `db.version(1)`.

### The SPICE-T categories (read before touching category logic)
The six categories — `social`, `political`, `interactions`, `cultural`,
`economic`, `technological` — are the spine of the app. Their canonical
definition is `CATEGORY_CONFIG` / `CATEGORIES_ORDER` in `src/data/prompts.js`.

⚠️ **The category list is currently duplicated** in a few places (e.g. the
hardcoded `categories` object in `db.js`'s `createEmptyChart`, the hardcoded
array in `createEmptyAnnotations`, and the iteration in `ai-context.js`). If you add, remove, or rename a category you
**must** update every site or charts/AI context will silently drift. Prefer
importing `CATEGORIES_ORDER` from `data/prompts.js` over re-hardcoding the list.
Run `/check-spicet-consistency` after any category change.

### AI tutor (the core pedagogical constraint)
`lib/ai.js` picks a backend at call time: WebLLM if the model is loaded,
otherwise Gemini if a key is set, otherwise it throws. `lib/ai-context.js`
builds the system prompt. The tutor is **deliberately constrained**: it must
reason only over the student's entered data and must **never** generate chart
content or write essays/DBQs/LEQs/SAQs. Preserve these guardrails — they are the
product's reason for existing, not an arbitrary limitation. The same goes for
`anti-paste.js`: paste/drop are disabled on entry fields on purpose.

## Conventions

- **Components**: function components, default export, named after the file.
  Hooks (`useState`/`useEffect`/`useCallback`) only — no class components.
- **Styling**: Tailwind utility classes inline. Category and brand colors come
  from theme tokens defined in `src/index.css` (e.g. `focus:ring-primary-light`,
  category color names) — reuse tokens, don't hardcode hex.
- **Icons**: import from `lucide-react`.
- **Persistence**: always go through the helpers in `lib/db.js`; don't touch the
  Dexie instance directly from components.
- **No backend / no network deps** for core features — keep it local-first.
  The only outbound call is the optional Gemini fallback (user's own key).
- Keep new code consistent with the file you're editing (comment density,
  section banners like `// ── Foo ──`, naming).

## Definition of done

1. `npm run build` passes.
2. If you changed a persisted data shape, the Dexie version/migration is handled.
3. If you changed the SPICE-T categories, every duplicate site is updated
   (`/check-spicet-consistency`).
4. AI tutor guardrails and anti-paste behavior are preserved.
