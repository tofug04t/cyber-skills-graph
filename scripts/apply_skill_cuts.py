#!/usr/bin/env python3
"""
Apply approved skill cuts to the forked NICE dataset.

Source of cuts: data/skill-cuts.json  ({skill_id: {"text", "reason"}})
Edits in place: data/nice-framework-v2-2-0-forked.json

Removes each cut skill element and every relationship that touches it.
Runs after apply_skill_merges.py. Safe to re-run: cuts already applied are
skipped. Fails if a cut skill is also a merge target, since that would drop
mappings that were moved onto it. Reports any Work Role left with no skills.
"""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FORK = ROOT / "data" / "nice-framework-v2-2-0-forked.json"
CUTS = ROOT / "data" / "skill-cuts.json"
MERGES = ROOT / "data" / "skill-merges.json"


def main():
    raw = json.loads(FORK.read_text())
    cuts = set(json.loads(CUTS.read_text())["cuts"])
    merge_targets = {v["into"] for v in json.loads(MERGES.read_text())["merges"].values()}
    clash = cuts & merge_targets
    if clash:
        raise SystemExit(f"Cut skills are merge targets: {sorted(clash)}")

    present = {e["element_identifier"] for e in raw["elements"]} & cuts
    if not present:
        print("All cuts already applied; nothing to do.")
        return

    before = len(raw["relationships"])
    raw["elements"] = [e for e in raw["elements"] if e["element_identifier"] not in present]
    raw["relationships"] = [
        r for r in raw["relationships"]
        if r["source_element_identifier"] not in present and r["dest_element_identifier"] not in present
    ]
    FORK.write_text(json.dumps(raw, indent=2))

    types = {e["element_identifier"]: e for e in raw["elements"]}
    with_skills = {
        r["source_element_identifier"] for r in raw["relationships"]
        if types.get(r["source_element_identifier"], {}).get("element_type") == "work_role"
        and types.get(r["dest_element_identifier"], {}).get("element_type") == "skill"
    }
    empty = sorted(
        f'{eid} {e["title"]}' for eid, e in types.items()
        if e["element_type"] == "work_role" and eid not in with_skills
    )
    print(f"Cut {len(present)} skills; removed {before - len(raw['relationships'])} relationships.")
    if empty:
        print("Work Roles with no skills: " + "; ".join(empty))


if __name__ == "__main__":
    main()
