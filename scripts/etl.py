#!/usr/bin/env python3
"""
Build-time ETL: NICE Framework Components JSON -> compact static graph data.

Source: data/nice-framework-v2-2-0-forked.json (fork of NIST SP 800-181 Rev. 1,
        NICE Framework Components v2.2.0; see decision-log.md)
Output: app/public/data/skills-graph.json

Data model:
  - Nodes: Work Roles (grouped by Category) and Skills.
  - Edges: Skill <-> Work Role, from the NICE "projection" relationships.
  - Task/Knowledge statements are not graph nodes; their text is attached to
    each Work Role as click/hover detail.
  - Skills/Knowledge/Tasks are many-to-many with Work Roles in the fork.
  - Each skill carries a short display name (title) and its full statement
    (text); the script fails if any skill has no title.
  - The fork resolves every orphaned statement, so every skill must project
    onto at least one Work Role; the script fails if that ever stops holding.
"""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "data" / "nice-framework-v2-2-0-forked.json"
OUTPUT = ROOT / "app" / "public" / "data" / "skills-graph.json"


def main():
    with SOURCE.open() as f:
        raw = json.load(f)

    elements = {e["element_identifier"]: e for e in raw["elements"]}
    relationships = raw["relationships"]

    def etype(element_id):
        el = elements.get(element_id)
        return el["element_type"] if el else None

    def by_pair(source_type, dest_type):
        pairs = {}
        for r in relationships:
            if (
                etype(r["source_element_identifier"]) == source_type
                and etype(r["dest_element_identifier"]) == dest_type
            ):
                pairs.setdefault(r["source_element_identifier"], []).append(
                    r["dest_element_identifier"]
                )
        return pairs

    category_of_role = {}
    for r in relationships:
        if etype(r["source_element_identifier"]) == "category" and etype(
            r["dest_element_identifier"]
        ) == "work_role":
            category_of_role[r["dest_element_identifier"]] = r["source_element_identifier"]

    role_to_skills = by_pair("work_role", "skill")
    role_to_tasks = by_pair("work_role", "task")
    role_to_knowledge = by_pair("work_role", "knowledge")

    categories = {
        eid: el["title"]
        for eid, el in elements.items()
        if el["element_type"] == "category"
    }

    work_roles = {}
    skill_to_roles = {}

    for eid, el in elements.items():
        if el["element_type"] != "work_role":
            continue
        skill_ids = role_to_skills.get(eid, [])
        work_roles[eid] = {
            "id": eid,
            "title": el["title"],
            "text": el["text"],
            "category": category_of_role[eid],
            "skills": sorted(set(skill_ids)),
            "tasks": sorted({elements[t]["text"] for t in role_to_tasks.get(eid, [])}),
            "knowledge": sorted(
                {elements[k]["text"] for k in role_to_knowledge.get(eid, [])}
            ),
        }
        for sid in skill_ids:
            skill_to_roles.setdefault(sid, set()).add(eid)

    skills = {
        sid: {
            "id": sid,
            "title": elements[sid]["title"],
            "text": elements[sid]["text"],
            "workRoles": sorted(role_ids),
        }
        for sid, role_ids in skill_to_roles.items()
    }

    unmapped = sorted(
        eid
        for eid, el in elements.items()
        if el["element_type"] == "skill" and eid not in skills
    )
    if unmapped:
        raise SystemExit(
            f"{len(unmapped)} skills have no Work Role projection: {', '.join(unmapped[:10])}..."
        )

    untitled = sorted(sid for sid, s in skills.items() if not s["title"])
    if untitled:
        raise SystemExit(
            f"{len(untitled)} skills have no short name (title): {', '.join(untitled[:10])}..."
        )

    document_names = [d["name"] for d in raw["documents"]]

    output = {
        "meta": {
            "source": document_names[0],
            "sourceVersion": raw["documents"][0]["version"],
            "documents": document_names,
            "workRoleCount": len(work_roles),
            "skillCount": len(skills),
        },
        "categories": categories,
        "workRoles": work_roles,
        "skills": skills,
    }

    OUTPUT.write_text(json.dumps(output, indent=2, sort_keys=True))
    print(f"Wrote {OUTPUT.relative_to(ROOT)}")
    print(f"  {len(categories)} categories, {len(work_roles)} work roles, "
          f"{len(skills)} skills")


if __name__ == "__main__":
    main()
