// The shareable link: selections, ratings and match modes, packed compactly.
//   ?roles=PD-WRL-001,PD-WRL-011&skills=0542,9003&h=0558,0559&p=0563&n=0588&title=...&skillMatch=any&roleMatch=all
// h / p / n list the skills rated Strong / Some / None, without the leading "S". Links in the earlier,
// longer format (`a=S0558:have,...`) still open.
import type { Assessment, AssessmentValue, MatchMode } from "./types";

export interface UrlState {
  roleIds: string[];
  skillIds: string[];
  title: string | null;
  skillMode: MatchMode;
  roleMode: MatchMode;
  assessment: Assessment;
}

const RATING_KEYS: [string, AssessmentValue][] = [
  ["h", "have"],
  ["p", "partial"],
  ["n", "missing"],
];

const list = (value: string | null): string[] => (value ?? "").split(",").filter(Boolean);
const fullSkillId = (id: string): string => (/^\d+$/.test(id) ? `S${id}` : id);

export function parseUrlState(search: string): UrlState {
  const params = new URLSearchParams(search);
  const assessment: Assessment = {};

  // earlier format first, so a compact entry for the same skill wins
  for (const pair of list(params.get("a"))) {
    const [id, value] = pair.split(":");
    if (id && (value === "have" || value === "partial" || value === "missing")) assessment[fullSkillId(id)] = value;
  }
  for (const [key, value] of RATING_KEYS) {
    for (const id of list(params.get(key))) assessment[fullSkillId(id)] = value;
  }

  return {
    roleIds: [...new Set([...list(params.get("roles")), ...list(params.get("role"))])],
    skillIds: list(params.get("skills")).map(fullSkillId),
    title: params.get("title"),
    skillMode: params.get("skillMatch") === "any" ? "any" : "all",
    roleMode: params.get("roleMatch") === "all" ? "all" : "any",
    assessment,
  };
}

/** The query string (no leading "?"), empty when there is nothing to share. Commas stay literal. */
export function buildUrlQuery(state: UrlState): string {
  const parts: string[] = [];
  if (state.roleIds.length > 0) parts.push(`roles=${state.roleIds.join(",")}`);
  if (state.skillIds.length > 0) parts.push(`skills=${state.skillIds.map((id) => id.replace(/^S/, "")).join(",")}`);
  for (const [key, value] of RATING_KEYS) {
    const ids = Object.entries(state.assessment)
      .filter(([, v]) => v === value)
      .map(([id]) => id.replace(/^S/, ""));
    if (ids.length > 0) parts.push(`${key}=${ids.join(",")}`);
  }
  if (state.title) parts.push(`title=${encodeURIComponent(state.title)}`);
  // only the non-default modes are written
  if (state.skillMode === "any") parts.push("skillMatch=any");
  if (state.roleMode === "all") parts.push("roleMatch=all");
  return parts.join("&");
}
