# Cyber Skills Graph

An explorable map of cybersecurity Work Roles, the skills they use, and the paths into them. Search by role, skill, job title, or the background you're coming from, then mark the skills you have to see your gaps on the graph.

**Live site:** https://tofug04t.github.io/cyber-skills-graph/

## About the data

The roles, skills, job titles, and pathways are one person's interpretation, not an official standard. They were inspired by the [NIST NICE Framework](https://www.nist.gov/itl/applied-cybersecurity/nice/nice-framework-resource-center) (SP 800-181 Rev. 1) and other sources. [`decision-log.md`](decision-log.md) records how the dataset was built and changed. See the About dialog in the app for credits.

## Run it locally

Requires [just](https://github.com/casey/just), Node 22+, and Python 3.

```bash
just dev      # dev server at http://localhost:5173/cyber-skills-graph/
just check    # regenerate data, type-check, lint, build
just          # list all recipes
```

## How it fits together

A static React + TypeScript + Vite app, with the graph drawn by Cytoscape.js. There is no backend; the app loads three JSON files from `app/public/data/`. Python scripts in `scripts/` rebuild those files from the source data in `data/`, and `just data` runs them all.

## License

No license is granted at this time; all rights reserved.
