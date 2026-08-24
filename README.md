# AP Theme Charts

A local-first study tool for AP World History: Modern. Students build charts organized by the six official CED themes — Humans & the Environment (ENV), Cultural Developments & Interactions (CDI), Governance (GOV), Economic Systems (ECN), Social Interactions & Organization (SIO), and Technology & Innovation (TEC) — compare empires side-by-side, and study with an AI tutor that reasons only over their own work.

*(Formerly "SPICE-T Charts" — the course now uses the CED's official theme names. Internal category keys are unchanged, so existing saved charts carry over.)*

**Live app:** https://spicet-app.vercel.app

## Stack
- React 19 + Vite 6
- Tailwind CSS v4
- IndexedDB via Dexie (no backend)
- WebLLM (local AI) + Gemini fallback
- jsPDF for export

## Local development
```bash
npm install
npm run dev
```

## Build
```bash
npm run build    # production build
npm run preview  # serve the production build locally
```

## License
All rights reserved. OER content under public domain / CC-BY where noted.
