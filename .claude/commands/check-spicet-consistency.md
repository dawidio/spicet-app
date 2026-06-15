---
description: Verify the six SPICE-T categories are consistent across every file that references them
allowed-tools: Read, Grep, Bash(npm run build)
---

The six SPICE-T categories (`social`, `political`, `interactions`, `cultural`,
`economic`, `technological`) are duplicated across several files and must stay in
sync. The canonical source is `CATEGORY_CONFIG` / `CATEGORIES_ORDER` in
`src/data/prompts.js`.

Check that the category set matches in **all** of these and report any drift:

1. `src/data/prompts.js` — `CATEGORY_CONFIG` keys and `CATEGORIES_ORDER` (source
   of truth).
2. `src/lib/db.js` — `createEmptyChart` (`categories` keys) and
   `createEmptyAnnotations` (the hardcoded array).
3. `src/lib/ai-context.js` — category iteration.
4. Any component that iterates categories (grep for the category names).

For each location, list which categories are present. If they all agree, say so.
If anything is missing, extra, or misspelled, point to the exact file/line and
propose the fix — ideally by importing `CATEGORIES_ORDER` from `data/prompts.js`
rather than re-hardcoding. Finish with `npm run build`.
