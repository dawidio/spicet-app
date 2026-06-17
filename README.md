# SPICE-T Charts

A local-first study tool for AP World History: Modern. Students create SPICE-T charts (Social, Political, Interactions, Cultural, Economic, Technological), compare empires side-by-side, and study with an AI tutor that reasons only over their own work.

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
