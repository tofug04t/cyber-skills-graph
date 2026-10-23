#!/usr/bin/env python3
"""
Build-time validation + copy for the companion datasets that join to the
forked NICE data by work_role_id.

Sources (data/):  work-role-job-titles.json, role-quiz.json, adjacent-role-pathways.json
Output (app/public/data/): work-role-job-titles.json and role-quiz.json, unchanged, once validated.
adjacent-role-pathways.json is validated but not shipped: the Background feeder
interaction was removed pending a redesign (see decision-log.md).

Checks against data/nice-framework-v2-2-0-forked.json:
  - every work_role_id in a companion file must exist in the fork (error)
  - every fork Work Role must have a job-titles entry (error)
  - companion work_role_title should match the fork's title (warning)
  - role-quiz.json: every skill id must exist in the fork, interest colors must be
    valid names, credits and weights must be in range, ids must be unique (error)
  - Work Roles with no feeder pathway are reported (info; expected for roles
    reached by internal progression, and for roles added after the pathways
    file was authored)

work-role-color-wheel.json is deliberately not shipped yet (color wheel design
is deferred), so it is not copied here.
"""

import json
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
OUT = ROOT / "app" / "public" / "data"


INTEREST_COLORS = {"red", "purple", "blue", "green", "yellow", "orange", "white"}


def validate_quiz(quiz, skills):
    errors = []

    def check_skills(where, ids):
        for sid in ids:
            if sid not in skills:
                errors.append(f"quiz: {where} uses unknown skill {sid}")

    def check_unique(where, items):
        ids = [i["id"] for i in items]
        for dup in sorted({i for i in ids if ids.count(i) > 1}):
            errors.append(f"quiz: duplicate id '{dup}' in {where}")

    field = quiz["background"]["field"]["options"]
    activities = quiz["background"]["activities"]["items"]
    cards = quiz["interests"]["cards"]
    check_unique("field options", field)
    check_unique("activities", activities)
    check_unique("interest cards", cards)
    for o in field:
        check_skills(f"field '{o['id']}'", o["skills"])
    for a in activities:
        if not a["skills"]:
            errors.append(f"quiz: activity '{a['id']}' maps to no skills")
        check_skills(f"activity '{a['id']}'", a["skills"])
    for c in cards:
        if c["color"] not in INTEREST_COLORS:
            errors.append(f"quiz: card '{c['id']}' has invalid color '{c['color']}'")

    scoring = quiz["scoring"]
    if scoring["coverageScale"] <= 0:
        errors.append("quiz: scoring.coverageScale must be positive")
    for key in ("fieldCredit", "adaptiveSkip", "dropoff"):
        if not 0 <= scoring[key] <= 1:
            errors.append(f"quiz: scoring.{key} must be between 0 and 1")
    if not 1 <= scoring["minPicks"] <= scoring["maxPicks"]:
        errors.append("quiz: scoring needs 1 <= minPicks <= maxPicks")
    for key, value in scoring["weights"].items():
        if value < 0:
            errors.append(f"quiz: weight {key} must not be negative")
    for o in quiz["appetite"]["time"]["options"]:
        if not 0 <= o["gapTolerance"] <= 1:
            errors.append(f"quiz: time option '{o['id']}' gapTolerance must be between 0 and 1")
    for o in quiz["appetite"]["coding"]["options"]:
        if not 0 <= o["codingPenalty"] <= 1:
            errors.append(f"quiz: coding option '{o['id']}' penalty must be between 0 and 1")
    return errors


def main():
    fork = json.loads((DATA / "nice-framework-v2-2-0-forked.json").read_text())
    roles = {
        e["element_identifier"]: e["title"]
        for e in fork["elements"]
        if e["element_type"] == "work_role"
    }

    skills = {e["element_identifier"] for e in fork["elements"] if e["element_type"] == "skill"}

    titles = json.loads((DATA / "work-role-job-titles.json").read_text())
    quiz = json.loads((DATA / "role-quiz.json").read_text())
    pathways = json.loads((DATA / "adjacent-role-pathways.json").read_text())

    errors, warnings = [], []

    title_entries = titles["work_role_job_titles"]
    title_ids = {t["work_role_id"] for t in title_entries}
    for unknown in sorted(title_ids - roles.keys()):
        errors.append(f"job-titles: unknown work_role_id {unknown}")
    for missing in sorted(roles.keys() - title_ids):
        errors.append(f"job-titles: no entry for {missing} ({roles[missing]})")
    for t in title_entries:
        fork_title = roles.get(t["work_role_id"])
        if fork_title and fork_title != t["work_role_title"]:
            warnings.append(
                f"job-titles: {t['work_role_id']} titled '{t['work_role_title']}' "
                f"but fork says '{fork_title}'"
            )

    reached = set()
    for feeder in pathways["feeder_roles"]:
        for target in feeder["targets"]:
            rid = target["work_role_id"]
            reached.add(rid)
            if rid not in roles:
                errors.append(f"pathways: {feeder['feeder_id']} targets unknown {rid}")
            elif roles[rid] != target["work_role_title"]:
                warnings.append(
                    f"pathways: {rid} titled '{target['work_role_title']}' "
                    f"but fork says '{roles[rid]}'"
                )

    errors += validate_quiz(quiz, skills)

    for w in warnings:
        print(f"warning: {w}")
    if errors:
        for e in errors:
            print(f"error: {e}")
        sys.exit(1)

    unreached = sorted(roles.keys() - reached)
    print(f"info: {len(unreached)} of {len(roles)} Work Roles have no feeder pathway:")
    for rid in unreached:
        print(f"  {rid} {roles[rid]}")

    OUT.mkdir(parents=True, exist_ok=True)
    for name in ("work-role-job-titles.json", "role-quiz.json"):
        shutil.copyfile(DATA / name, OUT / name)
    print(f"Copied 2 companion files to {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
