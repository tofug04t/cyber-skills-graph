#!/usr/bin/env python3
"""
Validate data/skill-colors.csv against the skills in the forked dataset.

The CSV is the source of truth for each skill's color tag; edit the `color` and
`blue_group` columns directly. Rows with `review` set are the tags to look at
first. Wheel order: red, purple, blue, green, yellow, orange, white.
  red     offense: attacking, testing, breaking
  purple  turning findings into fixes: threat hunting, purple teaming, adversary emulation for defense
  blue    defense: monitoring, threat intel, DFIR (blue_group: monitoring, threat-intel, forensics, incident-response)
  green   securing and automating infrastructure and operations
  yellow  securing software as it's built, including product security
  orange  teaching security, technical and awareness
  white   security governance, risk, compliance, and leadership
  center  the middle: non-security skills, technical or not
"""

import csv
import json
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FORK = ROOT / "data" / "nice-framework-v2-2-0-forked.json"
TAGS = ROOT / "data" / "skill-colors.csv"

COLORS = ["red", "purple", "blue", "green", "yellow", "orange", "white", "center"]
BLUE_GROUPS = ["monitoring", "threat-intel", "forensics", "incident-response"]


def main():
    skills = {
        e["element_identifier"]
        for e in json.loads(FORK.read_text())["elements"]
        if e["element_type"] == "skill"
    }
    rows = list(csv.DictReader(TAGS.open(newline="")))
    errors = []
    seen = set()
    for r in rows:
        sid = r["id"]
        if sid in seen:
            errors.append(f"{sid}: duplicate row")
        seen.add(sid)
        if r["color"] not in COLORS:
            errors.append(f"{sid}: color '{r['color']}' is not one of {COLORS}")
        if r["color"] == "blue" and r["blue_group"] not in BLUE_GROUPS:
            errors.append(f"{sid}: blue skills need a blue_group from {BLUE_GROUPS}")
        if r["color"] != "blue" and r["blue_group"]:
            errors.append(f"{sid}: blue_group is only for blue skills")
    for sid in sorted(skills - seen):
        errors.append(f"{sid}: skill has no row")
    for sid in sorted(seen - skills):
        errors.append(f"{sid}: row for a skill that does not exist")
    if errors:
        print("\n".join(errors))
        sys.exit(1)

    counts = Counter(r["color"] for r in rows)
    print(f"{len(rows)} skills tagged; {sum(1 for r in rows if r['review'])} flagged for review")
    for c in COLORS:
        print(f"  {c:7} {counts[c]:4}")
    print("  blue groups:", dict(Counter(r["blue_group"] for r in rows if r["color"] == "blue")))


if __name__ == "__main__":
    main()
