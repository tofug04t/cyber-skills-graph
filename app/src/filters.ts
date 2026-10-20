import type {
  FeederRole,
  GraphData,
  JobTitlesData,
  PathwaysData,
  PathwayTarget,
  Skill,
  TransitionDifficulty,
} from "./types";

export const DIFFICULTY_ORDER: Record<TransitionDifficulty, number> = { Low: 0, Medium: 1, High: 2 };

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

export interface PathwayIn {
  feeder: FeederRole;
  target: PathwayTarget;
}

export function pathwaysIntoRole(pathways: PathwaysData, roleId: string): PathwayIn[] {
  const found: PathwayIn[] = [];
  for (const feeder of pathways.feeder_roles) {
    for (const target of feeder.targets) {
      if (target.work_role_id === roleId) found.push({ feeder, target });
    }
  }
  return found.sort(
    (a, b) =>
      DIFFICULTY_ORDER[a.target.transition_difficulty] - DIFFICULTY_ORDER[b.target.transition_difficulty]
  );
}

export interface FilterState {
  skillIds: string[];
  titleKey: string | null;
  feederId: string | null;
}

export interface Candidates {
  active: boolean;
  roleIds: string[];
  skillOverlap: Map<string, number>;
  pathway: Map<string, PathwayTarget>;
}

export function computeCandidates(
  graph: GraphData,
  filters: FilterState,
  titleIndex: TitleIndex,
  pathways: PathwaysData
): Candidates {
  const skillOverlap = new Map<string, number>();
  const pathway = new Map<string, PathwayTarget>();
  const sets: Set<string>[] = [];

  if (filters.skillIds.length > 0) {
    for (const skillId of filters.skillIds) {
      for (const roleId of graph.skills[skillId]?.workRoles ?? []) {
        skillOverlap.set(roleId, (skillOverlap.get(roleId) ?? 0) + 1);
      }
    }
    sets.push(new Set(skillOverlap.keys()));
  }

  if (filters.titleKey) {
    sets.push(new Set(titleIndex.get(filters.titleKey)?.roleIds ?? []));
  }

  if (filters.feederId) {
    const feeder = pathways.feeder_roles.find((f) => f.feeder_id === filters.feederId);
    for (const target of feeder?.targets ?? []) pathway.set(target.work_role_id, target);
    sets.push(new Set(pathway.keys()));
  }

  if (sets.length === 0) {
    return { active: false, roleIds: Object.keys(graph.workRoles), skillOverlap, pathway };
  }

  const roleIds = [...sets[0]].filter((id) => sets.every((s) => s.has(id)) && graph.workRoles[id]);
  roleIds.sort(
    (a, b) =>
      (skillOverlap.get(b) ?? 0) - (skillOverlap.get(a) ?? 0) ||
      DIFFICULTY_ORDER[pathway.get(a)?.transition_difficulty ?? "High"] -
        DIFFICULTY_ORDER[pathway.get(b)?.transition_difficulty ?? "High"] ||
      graph.workRoles[a].title.localeCompare(graph.workRoles[b].title)
  );
  return { active: true, roleIds, skillOverlap, pathway };
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

export function matchFeeders(pathways: PathwaysData, query: string): FeederRole[] {
  const q = normalize(query);
  return pathways.feeder_roles
    .filter(
      (f) =>
        !q || f.feeder_title.toLowerCase().includes(q) || f.typical_background.toLowerCase().includes(q)
    )
    .sort((a, b) => a.feeder_title.localeCompare(b.feeder_title));
}
