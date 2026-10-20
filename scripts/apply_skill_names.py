#!/usr/bin/env python3
"""
Apply approved short display names to NIST-sourced skills in the fork.

Source of names: data/skill-names.json  ({skill_id: short name})
Edits in place:  data/nice-framework-v2-2-0-forked.json

Sets each skill's (previously empty) title to its short name and leaves the
original statement in text, where the app shows it as hover detail. Safe to
re-run. Fails if a named skill is missing from the fork, or if any skill is
left without a title.
"""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FORK = ROOT / "data" / "nice-framework-v2-2-0-forked.json"
NAMES = ROOT / "data" / "skill-names.json"


def main():
    raw = json.loads(FORK.read_text())
    names = json.loads(NAMES.read_text())["names"]
    skills = {e["element_identifier"]: e for e in raw["elements"] if e["element_type"] == "skill"}

    unknown = sorted(set(names) - skills.keys())
    if unknown:
        raise SystemExit(f"Named skills not in the fork: {unknown}")

    changed = 0
    for sid, name in names.items():
        if skills[sid]["title"] != name:
            skills[sid]["title"] = name
            changed += 1

    untitled = sorted(sid for sid, e in skills.items() if not e.get("title"))
    if untitled:
        raise SystemExit(f"Skills with no short name: {untitled}")

    if changed:
        FORK.write_text(json.dumps(raw, indent=2))
    print(f"Named {changed} skills; all {len(skills)} skills have a short name.")


if __name__ == "__main__":
    main()
