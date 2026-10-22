# Cyber Skills Graph

An explorable map of cybersecurity roles and the skills they use. Search by role, skill, or job title, then mark the skills you have to see your gaps on the graph.

**Live site:** https://tofug04t.github.io/cyber-skills-graph/

## Feedback

Found a problem or have an idea? [Share feedback](https://forms.gle/EPC65MYimKe3G7Dc6).

## About the data

The roles, skills, and job titles are one person's interpretation, not an official standard. They were inspired by the [NIST NICE Framework](https://www.nist.gov/itl/applied-cybersecurity/nice/nice-framework-resource-center) (SP 800-181 Rev. 1) and other sources. [`decision-log.md`](decision-log.md) records how the dataset was built and changed. See the About dialog in the app for credits.

## Run it locally

Requires [just](https://github.com/casey/just), Node 22+, and Python 3.

```bash
just dev      # dev server at http://localhost:5173/cyber-skills-graph/
just check    # regenerate data, type-check, lint, build
just          # list all recipes
```

## How it fits together

A static React + TypeScript + Vite app, with the graph drawn by Cytoscape.js. There is no backend; the app loads two JSON files from `app/public/data/`. Python scripts in `scripts/` rebuild those files from the source data in `data/`, and `just data` runs them all.

## License

No license is granted at this time; all rights reserved.
