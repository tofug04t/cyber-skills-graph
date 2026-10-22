import type { GraphData, JobTitlesData, Skill } from "./types";

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
  titleKey: string | null;
}

export interface Candidates {
  active: boolean;
  roleIds: string[];
}

export function computeCandidates(
  graph: GraphData,
  filters: FilterState,
  titleIndex: TitleIndex
): Candidates {
  const sets: Set<string>[] = [];

  if (filters.skillIds.length > 0) sets.push(new Set(rolesForSkills(graph, filters.skillIds)));

  if (filters.titleKey) {
    sets.push(new Set(titleIndex.get(filters.titleKey)?.roleIds ?? []));
  }

  if (sets.length === 0) {
    return { active: false, roleIds: Object.keys(graph.workRoles) };
  }

  const roleIds = [...sets[0]].filter((id) => sets.every((s) => s.has(id)) && graph.workRoles[id]);
  roleIds.sort((a, b) => graph.workRoles[a].title.localeCompare(graph.workRoles[b].title));
  return { active: true, roleIds };
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

export function skillsOfRoles(graph: GraphData, roleIds: string[]): Set<string> {
  const ids = new Set<string>();
  for (const roleId of roleIds) for (const sid of graph.workRoles[roleId]?.skills ?? []) ids.add(sid);
  return ids;
}

/** Roles that use every one of the given skills, sorted by title. */
export function rolesForSkills(graph: GraphData, skillIds: string[]): string[] {
  return Object.values(graph.workRoles)
    .filter((role) => skillIds.every((sid) => graph.skills[sid]?.workRoles.includes(role.id)))
    .map((role) => role.id)
    .sort((a, b) => graph.workRoles[a].title.localeCompare(graph.workRoles[b].title));
}
