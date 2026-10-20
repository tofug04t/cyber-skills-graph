#!/usr/bin/env python3
"""
Apply approved skill merges to the forked NICE dataset.

Source of merges: data/skill-merges.json  ({merged_id: {"into": target_id, ...}})
Edits in place:   data/nice-framework-v2-2-0-forked.json

For each merged skill:
  - every relationship that points at it (work_role -> skill and
    competency_area -> skill) is re-pointed at the skill it merges into,
    so the target inherits all of the merged skill's role mappings;
  - duplicate relationships created by re-pointing are dropped;
  - the merged skill element itself is removed.

Safe to re-run: merges already applied are skipped. Fails if a merge target
is missing or is itself merged away (no chains), or if any Work Role ends up
with fewer distinct skills than it had before, after resolving merges.
"""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FORK = ROOT / "data" / "nice-framework-v2-2-0-forked.json"
MERGES = ROOT / "data" / "skill-merges.json"
FORK_DOC = "MHP_SKILLS_GRAPH_FORK_1_0"


def role_skill_sets(raw, resolve):
    types = {e["element_identifier"]: e["element_type"] for e in raw["elements"]}
    out = {}
    for r in raw["relationships"]:
        s, d = r["source_element_identifier"], r["dest_element_identifier"]
        if types.get(s) == "work_role" and d.startswith("S"):
            out.setdefault(s, set()).add(resolve(d))
    return out


def main():
    raw = json.loads(FORK.read_text())
    merges = {k: v["into"] for k, v in json.loads(MERGES.read_text())["merges"].items()}
    elements = {e["element_identifier"]: e for e in raw["elements"]}

    for src, dst in merges.items():
        if dst in merges:
            raise SystemExit(f"Merge chain: {src} -> {dst}, but {dst} is also merged away")
        if dst not in elements:
            raise SystemExit(f"Merge target {dst} (for {src}) is not in the fork")

    pending = {k: v for k, v in merges.items() if k in elements}
    if not pending:
        print("All merges already applied; nothing to do.")
        return

    resolve = lambda sid: merges.get(sid, sid)
    before = role_skill_sets(raw, resolve)

    seen = set()
    relationships = []
    moved = 0
    for r in raw["relationships"]:
        d = r["dest_element_identifier"]
        if d in pending:
            r = dict(r)
            r["dest_element_identifier"] = pending[d]
            r["dest_doc_identifier"] = elements[pending[d]]["doc_identifier"]
            r["provenance_doc_identifier"] = FORK_DOC
            moved += 1
        key = (r["source_element_identifier"], r["dest_element_identifier"], r["relationship_identifier"])
        if key in seen:
            continue
        seen.add(key)
        relationships.append(r)

    dropped = len(raw["relationships"]) - len(relationships)
    raw["relationships"] = relationships
    raw["elements"] = [e for e in raw["elements"] if e["element_identifier"] not in pending]

    after = role_skill_sets(raw, resolve)
    for role, skills in before.items():
        if after.get(role) != skills:
            raise SystemExit(f"{role} lost mappings during merge: {sorted(skills - after.get(role, set()))}")

    FORK.write_text(json.dumps(raw, indent=2))
    print(f"Merged {len(pending)} skills; re-pointed {moved} relationships, "
          f"dropped {dropped} duplicates. Every Work Role keeps all its mappings.")


if __name__ == "__main__":
    main()
