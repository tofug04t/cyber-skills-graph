#!/usr/bin/env python3
"""
Build-time validation + copy for the companion datasets that join to the
forked NICE data by work_role_id.

Sources (data/):  work-role-job-titles.json, adjacent-role-pathways.json
Output (app/public/data/): work-role-job-titles.json, unchanged, once validated.
adjacent-role-pathways.json is validated but not shipped: the Background feeder
interaction was removed pending a redesign (see decision-log.md).

Checks against data/nice-framework-v2-2-0-forked.json:
  - every work_role_id in a companion file must exist in the fork (error)
  - every fork Work Role must have a job-titles entry (error)
  - companion work_role_title should match the fork's title (warning)
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


def main():
    fork = json.loads((DATA / "nice-framework-v2-2-0-forked.json").read_text())
    roles = {
        e["element_identifier"]: e["title"]
        for e in fork["elements"]
        if e["element_type"] == "work_role"
    }

    titles = json.loads((DATA / "work-role-job-titles.json").read_text())
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
    shutil.copyfile(DATA / "work-role-job-titles.json", OUT / "work-role-job-titles.json")
    print(f"Copied the job-titles file to {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
