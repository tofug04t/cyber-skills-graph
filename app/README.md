# Cyber Skills Graph — App

React + TypeScript + Vite + Cytoscape.js. See the repository README for the project overview.

## Development

```bash
npm install
npm run dev
```

Data files under `public/data/` are generated from `../data/` by `../scripts/etl.py` (`skills-graph.json`) and `../scripts/etl_companions.py` (validates and copies the job-titles and pathways files) — re-run both after updating the source data, then restart the dev server.

## Scripts

- `npm run dev` — dev server
- `npm run build` — type-check (`tsc -b`) and production build to `dist/`
- `npm run lint` — oxlint
