#!/usr/bin/env python3
"""
Apply approved role changes and additions to the forked NICE dataset and its
companion files.

Source of changes: data/role-changes.json
Edits in place:    data/nice-framework-v2-2-0-forked.json
                   data/work-role-job-titles.json
                   data/adjacent-role-pathways.json
                   data/work-role-color-wheel.json

Steps, in order (runs after apply_skill_merges.py and apply_skill_cuts.py):
  1. Add authored skills and Work Roles (tagged with the fork's doc id).
  2. Merge Work Roles: every skill, task, and knowledge mapping on a merged
     role moves to the role it merges into; companion entries follow
     (job titles are combined, pathways re-pointed, color entries dropped).
  3. Update titles and descriptions.
  4. Add and remove individual role-to-skill mappings.
  5. Trim roles to an approved skill list.

Safe to re-run. Fails if a merge loses a mapping, if any skill ends up with
no Work Role, or if any Work Role ends up with no skills.
"""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
FORK = DATA / "nice-framework-v2-2-0-forked.json"
CHANGES = DATA / "role-changes.json"
JOBS = DATA / "work-role-job-titles.json"
PATHS = DATA / "adjacent-role-pathways.json"
COLORS = DATA / "work-role-color-wheel.json"
DOC = "MHP_SKILLS_GRAPH_FORK_1_0"


def load(p):
    return json.loads(p.read_text())


def save(p, d):
    p.write_text(json.dumps(d, indent=2))


def main():
    raw, cfg = load(FORK), load(CHANGES)
    jobs, paths, colors = load(JOBS), load(PATHS), load(COLORS)
    el = {e["element_identifier"]: e for e in raw["elements"]}

    def rel(src, dst):
        return {
            "source_element_identifier": src,
            "source_doc_identifier": el[src]["doc_identifier"],
            "dest_element_identifier": dst,
            "dest_doc_identifier": el[dst]["doc_identifier"],
            "relationship_identifier": "projection",
            "provenance_doc_identifier": DOC,
        }

    rels = raw["relationships"]

    # 1. Additions
    for s in cfg["newSkills"]:
        if s["id"] not in el:
            e = {"element_type": "skill", "element_identifier": s["id"], "title": s["title"],
                 "text": s["text"], "doc_identifier": DOC}
            raw["elements"].append(e)
            el[s["id"]] = e
    for r in cfg["newRoles"]:
        if r["id"] not in el:
            e = {"element_type": "work_role", "element_identifier": r["id"], "title": r["title"],
                 "text": r["text"], "doc_identifier": DOC}
            raw["elements"].append(e)
            el[r["id"]] = e
            rels.append(rel(r["category"], r["id"]))
        rels.extend(rel(r["id"], sid) for sid in r["skills"])
        if not any(j["work_role_id"] == r["id"] for j in jobs["work_role_job_titles"]):
            jobs["work_role_job_titles"].append(
                {"work_role_id": r["id"], "work_role_title": r["title"], "job_titles": r["jobTitles"]})

    # 2. Role merges
    merges = {k: v for k, v in cfg["roleMerges"].items() if k in el}
    for src, dst in merges.items():
        if dst in cfg["roleMerges"] or dst not in el:
            raise SystemExit(f"Bad role merge {src} -> {dst}")
    before = {}
    for r in rels:
        before.setdefault(r["source_element_identifier"], set()).add(r["dest_element_identifier"])
    kept = []
    for r in rels:
        s, d = r["source_element_identifier"], r["dest_element_identifier"]
        if d in merges:
            continue  # category -> merged role
        if s in merges:
            r = rel(merges[s], d)
        kept.append(r)
    rels[:] = kept
    raw["elements"] = [e for e in raw["elements"] if e["element_identifier"] not in merges]
    for m in merges:
        el.pop(m)

    entries = {j["work_role_id"]: j for j in jobs["work_role_job_titles"]}
    for src, dst in merges.items():
        if src in entries:
            for t in entries[src]["job_titles"]:
                if t not in entries[dst]["job_titles"]:
                    entries[dst]["job_titles"].append(t)
    jobs["work_role_job_titles"] = [j for j in jobs["work_role_job_titles"] if j["work_role_id"] not in merges]
    for feeder in paths["feeder_roles"]:
        seen, targets = set(), []
        for t in feeder["targets"]:
            t["work_role_id"] = merges.get(t["work_role_id"], t["work_role_id"])
            if t["work_role_id"] in seen:
                continue
            seen.add(t["work_role_id"])
            targets.append(t)
        feeder["targets"] = targets
    colors["work_role_colors"] = [c for c in colors["work_role_colors"] if c["work_role_id"] not in merges]

    # 3. Title and description updates
    for rid, upd in cfg["roleUpdates"].items():
        el[rid].update(upd)

    # 4. Mapping adds and removes
    for role, skill in cfg["addMappings"]:
        rels.append(rel(role, skill))
    drop = {tuple(x) for x in cfg["removeMappings"]}

    # 5. Trims
    trims = {r: set(keep) for r, keep in cfg["trims"].items()}

    def keep_rel(r):
        s, d = r["source_element_identifier"], r["dest_element_identifier"]
        if (s, d) in drop:
            return False
        if s in trims and el.get(d, {}).get("element_type") == "skill" and d not in trims[s]:
            return False
        return True

    seen, final = set(), []
    for r in rels:
        key = (r["source_element_identifier"], r["dest_element_identifier"])
        if key in seen or not keep_rel(r):
            continue
        seen.add(key)
        final.append(r)
    raw["relationships"] = final

    # Keep every title in the companion files in step with the fork
    titles = {k: e["title"] for k, e in el.items() if e["element_type"] == "work_role"}
    for j in jobs["work_role_job_titles"]:
        j["work_role_title"] = titles[j["work_role_id"]]
    for feeder in paths["feeder_roles"]:
        for t in feeder["targets"]:
            t["work_role_title"] = titles[t["work_role_id"]]
    for c in colors["work_role_colors"]:
        c["work_role_title"] = titles.get(c["work_role_id"], c["work_role_title"])

    # Checks
    after = {}
    for r in final:
        after.setdefault(r["source_element_identifier"], set()).add(r["dest_element_identifier"])
    for src, dst in merges.items():
        lost = {d for d in before.get(src, set())
                if el.get(d, {}).get("element_type") in ("task", "knowledge")} - after.get(dst, set())
        if lost:
            raise SystemExit(f"Merging {src} into {dst} lost task/knowledge mappings: {sorted(lost)[:5]}")
    role_ids = [k for k, e in el.items() if e["element_type"] == "work_role"]
    mapped = {d for r in role_ids for d in after.get(r, set())}
    orphans = sorted(k for k, e in el.items() if e["element_type"] == "skill" and k not in mapped)
    if orphans:
        raise SystemExit(f"Skills with no Work Role: {orphans}")
    empty = sorted(r for r in role_ids
                   if not any(el.get(d, {}).get("element_type") == "skill" for d in after.get(r, set())))
    if empty:
        raise SystemExit(f"Work Roles with no skills: {empty}")

    for p, d in ((FORK, raw), (JOBS, jobs), (PATHS, paths), (COLORS, colors)):
        save(p, d)
    print(f"{len(role_ids)} Work Roles, "
          f"{sum(1 for e in el.values() if e['element_type'] == 'skill')} skills; "
          f"merged {len(merges)} roles; every role has skills and every skill has a role.")


if __name__ == "__main__":
    main()
