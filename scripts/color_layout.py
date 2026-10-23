"""
Derive role colors and wheel positions from skill color tags.

A role's color mix is the share of each color among its skills, with `center`
skills left out so roles don't all drift toward the middle. Positions come
from the same mix: each color has a wedge on the wheel, a role sits at the
weighted direction of its colors, and the less pure the mix the closer to the
center it lands. Center skills cluster in the middle, near the roles using them.
Everything is deterministic so the committed data only changes when tags do.
"""

import math

from ids import natural_key

WHEEL = ["red", "purple", "blue", "green", "yellow", "orange", "white"]
BLUE_GROUPS = ["monitoring", "threat-intel", "forensics", "incident-response"]

MIN_COLORED = 3  # fewer colored skills than this: the role is "general"
DOMINANT_SHARE = 0.45  # a color dominates when it has this share...
DOMINANT_LEAD = 1.5  # ...and this multiple of the runner-up
WHITE_LEAD_SHARE = 0.5   # white names a role only as a majority of its mix
WHITE_SECOND_SHARE = 0.2 # white is named second only above this share

STEP = 2 * math.pi / len(WHEEL)


def wedge_angle(color, group=None):
    """Screen angle (y down) of a color's wedge, red at the top, clockwise."""
    angle = -math.pi / 2 + WHEEL.index(color) * STEP
    if color == "blue" and group:
        # spread the blue groups across the wedge so it has structure
        spread = STEP * 0.8
        angle += (BLUE_GROUPS.index(group) / (len(BLUE_GROUPS) - 1) - 0.5) * spread
    return angle


def polar(radius, angle):
    return (radius * math.cos(angle), radius * math.sin(angle))


def role_mix(skill_ids, tags):
    counts = {}
    for sid in skill_ids:
        color = tags[sid]["color"]
        if color != "center":
            counts[color] = counts.get(color, 0) + 1
    total = sum(counts.values())
    mix = {c: counts[c] / total for c in WHEEL if c in counts} if total else {}
    return mix, total


def classify(mix, total):
    if total < MIN_COLORED:
        return None, "General"
    ranked = sorted(mix.items(), key=lambda kv: -kv[1])
    # White guardrail (label only; the mix itself is unchanged): white leads a
    # label only as a majority, and is named second only above a small share.
    if ranked[0][0] == "white" and ranked[0][1] < WHITE_LEAD_SHARE:
        rest = ranked[1:]
        rest_total = sum(s for _, s in rest)
        ranked = [(c, s / rest_total) for c, s in rest]
    elif len(ranked) > 1 and ranked[1][0] == "white" and ranked[1][1] <= WHITE_SECOND_SHARE:
        ranked = ranked[:1] + ranked[2:]
    if len(ranked) < 2:
        return ranked[0][0], ranked[0][0].capitalize()
    (c1, s1), second = ranked[0], ranked[1]
    if s1 >= DOMINANT_SHARE and s1 >= DOMINANT_LEAD * second[1]:
        return c1, c1.capitalize()
    return None, f"Hybrid: {c1.capitalize()}/{second[0].capitalize()}"


def _relax(points, targets, min_dist, spring, iterations):
    """Push overlapping points apart while a spring holds them near their targets."""
    n = len(points)
    for _ in range(iterations):
        for i in range(n):
            for j in range(i + 1, n):
                dx, dy = points[j][0] - points[i][0], points[j][1] - points[i][1]
                d = math.hypot(dx, dy)
                need = min_dist(i, j)
                if d < need:
                    if d == 0:
                        dx, dy, d = 1e-4, 0.0, 1e-4
                    push = (need - d) / 2 * 0.5
                    ux, uy = dx / d, dy / d
                    points[i][0] -= ux * push
                    points[i][1] -= uy * push
                    points[j][0] += ux * push
                    points[j][1] += uy * push
        for i in range(n):
            points[i][0] += (targets[i][0] - points[i][0]) * spring
            points[i][1] += (targets[i][1] - points[i][1]) * spring


def layout(work_roles, skills, tags, scale=1000):
    """Add color/mix/label to roles and color/x/y to skills (in place).

    Roles are not drawn on the map, so only skills keep coordinates; role
    positions exist just to place the skills near the roles that use them.
    """
    role_ids = sorted(work_roles, key=natural_key)
    for rid in role_ids:
        mix, total = role_mix(work_roles[rid]["skills"], tags)
        dominant, label = classify(mix, total)
        work_roles[rid].update(
            mix={c: round(v, 3) for c, v in mix.items()},
            coloredSkills=total,
            dominant=dominant,
            label=label,
        )

    # roles: direction from the mix, distance from how pure it is
    role_targets = []
    for k, rid in enumerate(role_ids):
        mix = work_roles[rid]["mix"]
        if not mix:
            role_targets.append(polar(0.14, k * 2.4))  # general roles sit near the middle
            continue
        vx = sum(s * math.cos(wedge_angle(c)) for c, s in mix.items())
        vy = sum(s * math.sin(wedge_angle(c)) for c, s in mix.items())
        magnitude = min(1.0, math.hypot(vx, vy))
        role_targets.append(polar(0.3 + 0.7 * magnitude, math.atan2(vy, vx)))
    role_pts = [[t[0] + 0.01 * math.cos(i), t[1] + 0.01 * math.sin(i)] for i, t in enumerate(role_targets)]
    _relax(role_pts, role_targets, lambda i, j: 0.17, 0.05, 250)
    role_pos = {rid: tuple(role_pts[i]) for i, rid in enumerate(role_ids)}

    # skills: between their roles and their own wedge; center skills gather in the middle
    skill_ids = sorted(skills, key=natural_key)
    skill_targets = []
    for sid in skill_ids:
        roles = skills[sid]["workRoles"]
        bx = sum(role_pos[r][0] for r in roles) / len(roles)
        by = sum(role_pos[r][1] for r in roles) / len(roles)
        tag = tags[sid]
        if tag["color"] == "center":
            skill_targets.append((0.35 * bx, 0.35 * by))
        else:
            wx, wy = polar(0.85, wedge_angle(tag["color"], tag["blue_group"]))
            skill_targets.append((0.5 * bx + 0.5 * wx, 0.5 * by + 0.5 * wy))
    points = [[t[0] + 0.01 * math.cos(i * 1.7), t[1] + 0.01 * math.sin(i * 1.7)] for i, t in enumerate(skill_targets)]
    points += [list(role_pos[r]) for r in role_ids]
    targets = skill_targets + [role_pos[r] for r in role_ids]
    n_skills = len(skill_ids)

    def min_dist(i, j):
        i_role, j_role = i >= n_skills, j >= n_skills
        if i_role and j_role:
            return 0.0  # role spacing is already settled
        return 0.05 if (i_role or j_role) else 0.035

    _relax_with_anchors(points, targets, n_skills, min_dist)

    for i, sid in enumerate(skill_ids):
        skills[sid].update(
            color=tags[sid]["color"],
            x=round(points[i][0] * scale, 1),
            y=round(points[i][1] * scale, 1),
        )
        if tags[sid]["blue_group"]:
            skills[sid]["group"] = tags[sid]["blue_group"]


def _relax_with_anchors(points, targets, n_skills, min_dist, iterations=200):
    """Like _relax, but role points (the tail of the list) never move."""
    n = len(points)
    for _ in range(iterations):
        for i in range(n_skills):
            for j in range(i + 1, n):
                dx, dy = points[j][0] - points[i][0], points[j][1] - points[i][1]
                d = math.hypot(dx, dy)
                need = min_dist(i, j)
                if d < need:
                    if d == 0:
                        dx, dy, d = 1e-4, 0.0, 1e-4
                    ux, uy = dx / d, dy / d
                    if j >= n_skills:  # skill vs fixed role: only the skill moves
                        points[i][0] -= ux * (need - d)
                        points[i][1] -= uy * (need - d)
                    else:
                        push = (need - d) / 2
                        points[i][0] -= ux * push
                        points[i][1] -= uy * push
                        points[j][0] += ux * push
                        points[j][1] += uy * push
        for i in range(n_skills):
            points[i][0] += (targets[i][0] - points[i][0]) * 0.04
            points[i][1] += (targets[i][1] - points[i][1]) * 0.04
