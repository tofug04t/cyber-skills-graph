// The shareable link: selections, ratings and match modes, packed compactly.
//   ?roles=4,12&skills=17,203&h=58,59&p=63&n=88&title=...&skillMatch=any&roleMatch=all
// Ids are numbers (skill s17 is written 17, role r4 is written 4). h / p / n list the skills rated
// Strong / Some / None. Anything that is not a number is ignored.
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

const numbers = (value: string | null, prefix: string): string[] =>
  (value ?? "")
    .split(",")
    .filter((n) => /^\d+$/.test(n))
    .map((n) => `${prefix}${n}`);
const digits = (id: string) => id.slice(1);

export function parseUrlState(search: string): UrlState {
  const params = new URLSearchParams(search);
  const assessment: Assessment = {};
  for (const [key, value] of RATING_KEYS) {
    for (const id of numbers(params.get(key), "s")) assessment[id] = value;
  }
  return {
    roleIds: [...new Set(numbers(params.get("roles"), "r"))],
    skillIds: numbers(params.get("skills"), "s"),
    title: params.get("title"),
    skillMode: params.get("skillMatch") === "any" ? "any" : "all",
    roleMode: params.get("roleMatch") === "all" ? "all" : "any",
    assessment,
  };
}

/** The query string (no leading "?"), empty when there is nothing to share. Commas stay literal. */
export function buildUrlQuery(state: UrlState): string {
  const parts: string[] = [];
  if (state.roleIds.length > 0) parts.push(`roles=${state.roleIds.map(digits).join(",")}`);
  if (state.skillIds.length > 0) parts.push(`skills=${state.skillIds.map(digits).join(",")}`);
  for (const [key, value] of RATING_KEYS) {
    const ids = Object.entries(state.assessment)
      .filter(([, v]) => v === value)
      .map(([id]) => digits(id));
    if (ids.length > 0) parts.push(`${key}=${ids.join(",")}`);
  }
  if (state.title) parts.push(`title=${encodeURIComponent(state.title)}`);
  // only the non-default modes are written
  if (state.skillMode === "any") parts.push("skillMatch=any");
  if (state.roleMode === "all") parts.push("roleMatch=all");
  return parts.join("&");
}
