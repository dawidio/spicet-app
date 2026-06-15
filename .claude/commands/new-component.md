---
description: Scaffold a new React component following this repo's conventions
argument-hint: <ComponentName> [one-line purpose]
allowed-tools: Read, Write, Edit, Bash(npm run build)
---

Create a new component named `$1` in `src/components/$1.jsx`.

Follow the existing conventions in this repo (look at `src/components/EntryRow.jsx`
and `src/components/Header.jsx` first):

- Function component, **default export**, named exactly `$1` (PascalCase).
- Hooks only (`useState`/`useEffect`/`useCallback`). No class components, no new
  state libraries.
- Style with Tailwind utility classes inline. Reuse theme tokens from
  `src/index.css` (e.g. `focus:ring-primary-light`, category color names) —
  never hardcode hex values.
- Icons come from `lucide-react`.
- Read/write persisted data only through helpers in `src/lib/db.js`.

Purpose / context: $2

After creating it, wire it into wherever it's used (commonly `App.jsx`'s screen
state machine or a parent component), then run `/build-check`.
