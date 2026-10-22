import type { GraphData, JobTitlesData, MatchMode, Skill } from "./types";

export interface TitleEntry {
  title: string;
  roleIds: string[];
}

export type TitleIndex = Map<string, TitleEntry>;

export function titleKey(title: string): string {
  return title.trim().toLowerCase();
}

export function buildTitleIndex(data: JobTitlesData): TitleIndex {
  const index: TitleIndex = new Map();
  for (const wr of data.work_role_job_titles) {
    for (const raw of wr.job_titles) {
      const key = titleKey(raw);
      const entry = index.get(key);
      if (!entry) index.set(key, { title: raw.trim(), roleIds: [wr.work_role_id] });
      else if (!entry.roleIds.includes(wr.work_role_id)) entry.roleIds.push(wr.work_role_id);
    }
  }
  return index;
}

export function searchTitles(index: TitleIndex, query: string, limit = 6): TitleEntry[] {
  const q = titleKey(query);
  if (q.length < 2) return [];
  const matches: { key: string; entry: TitleEntry }[] = [];
  for (const [key, entry] of index) if (key.includes(q)) matches.push({ key, entry });
  matches.sort((a, b) => {
    const aStart = a.key.startsWith(q) ? 0 : 1;
    const bStart = b.key.startsWith(q) ? 0 : 1;
    return aStart - bStart || b.entry.roleIds.length - a.entry.roleIds.length || a.key.localeCompare(b.key);
  });
  return matches.slice(0, limit).map((m) => m.entry);
}

export function titlesForRole(data: JobTitlesData, roleId: string): string[] {
  return data.work_role_job_titles.find((w) => w.work_role_id === roleId)?.job_titles ?? [];
}

export interface FilterState {
  skillIds: string[];
  skillMode: MatchMode;
  titleKey: string | null;
}

export interface Candidates {
  active: boolean;
  roleIds: string[];
  /** For each role, how many of the selected skills it uses. */
  skillOverlap: Map<string, number>;
}

export function computeCandidates(
  graph: GraphData,
  filters: FilterState,
  titleIndex: TitleIndex
): Candidates {
  const sets: Set<string>[] = [];

  const skillOverlap = skillOverlapByRole(graph, filters.skillIds);
  if (filters.skillIds.length > 0) {
    sets.push(new Set(rolesForSkills(graph, filters.skillIds, filters.skillMode)));
  }

  if (filters.titleKey) {
    sets.push(new Set(titleIndex.get(filters.titleKey)?.roleIds ?? []));
  }

  if (sets.length === 0) {
    return { active: false, roleIds: Object.keys(graph.workRoles), skillOverlap };
  }

  const roleIds = [...sets[0]].filter((id) => sets.every((s) => s.has(id)) && graph.workRoles[id]);
  roleIds.sort(
    (a, b) =>
      (skillOverlap.get(b) ?? 0) - (skillOverlap.get(a) ?? 0) ||
      graph.workRoles[a].title.localeCompare(graph.workRoles[b].title)
  );
  return { active: true, roleIds, skillOverlap };
}

function normalize(query: string): string {
  return query.trim().toLowerCase();
}

/** A skill's display name: its short title, falling back to the full statement. */
export function skillLabel(skill: Pick<Skill, "title" | "text"> | undefined): string {
  if (!skill) return "";
  if (skill.title) return skill.title;
  const stripped = skill.text.replace(/^Skill in /i, "");
  return stripped.charAt(0).toUpperCase() + stripped.slice(1);
}

export function matchRoles(graph: GraphData, roleIds: string[], query: string): string[] {
  const q = normalize(query);
  return roleIds.filter((id) => !q || graph.workRoles[id].title.toLowerCase().includes(q));
}

export function matchSkills(graph: GraphData, query: string): Skill[] {
  const q = normalize(query);
  return Object.values(graph.skills)
    .filter((s) => !q || s.title.toLowerCase().includes(q) || s.text.toLowerCase().includes(q))
    .sort((a, b) => skillLabel(a).localeCompare(skillLabel(b)));
}

/** Skills used by every selected role ("all") or by at least one ("any"). */
export function skillsOfRoles(graph: GraphData, roleIds: string[], mode: MatchMode = "any"): Set<string> {
  const lists = roleIds.map((id) => graph.workRoles[id]?.skills ?? []);
  const counts = new Map<string, number>();
  for (const list of lists) for (const sid of list) counts.set(sid, (counts.get(sid) ?? 0) + 1);
  const needed = mode === "all" ? lists.length : 1;
  return new Set([...counts].filter(([, n]) => n >= needed).map(([sid]) => sid));
}

/** For each role, how many of the given skills it uses. */
export function skillOverlapByRole(graph: GraphData, skillIds: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const sid of skillIds) {
    for (const roleId of graph.skills[sid]?.workRoles ?? []) counts.set(roleId, (counts.get(roleId) ?? 0) + 1);
  }
  return counts;
}

/** Roles that use every given skill ("all") or at least one ("any"), sorted by title. */
export function rolesForSkills(graph: GraphData, skillIds: string[], mode: MatchMode = "all"): string[] {
  const needed = mode === "all" ? skillIds.length : 1;
  return [...skillOverlapByRole(graph, skillIds)]
    .filter(([roleId, n]) => n >= needed && graph.workRoles[roleId])
    .map(([roleId]) => roleId)
    .sort((a, b) => graph.workRoles[a].title.localeCompare(graph.workRoles[b].title));
}

/** Skills that share the most roles with this one (Jaccard overlap), best first. */
export function relatedSkills(graph: GraphData, skillId: string, limit = 6): Skill[] {
  const roles = new Set(graph.skills[skillId]?.workRoles ?? []);
  return Object.values(graph.skills)
    .filter((s) => s.id !== skillId)
    .map((s) => {
      const shared = s.workRoles.filter((r) => roles.has(r)).length;
      return { skill: s, score: shared / (roles.size + s.workRoles.length - shared) };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || skillLabel(a.skill).localeCompare(skillLabel(b.skill)))
    .slice(0, limit)
    .map((x) => x.skill);
}
