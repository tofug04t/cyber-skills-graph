import { describe, expect, it } from "vitest";
import { buildUrlQuery, parseUrlState, type UrlState } from "./urlState";

const state: UrlState = {
  roleIds: ["r18", "r27"],
  skillIds: ["s171", "s381"],
  title: "soc analyst",
  skillMode: "any",
  roleMode: "all",
  assessment: { s58: "have", s59: "have", s63: "partial", s88: "missing", s301: "have" },
};

describe("link format", () => {
  it("round-trips a full state", () => {
    expect(parseUrlState(`?${buildUrlQuery(state)}`)).toEqual(state);
  });

  it("writes plain numbers and commas", () => {
    const query = buildUrlQuery(state);
    expect(query).toContain("roles=18,27");
    expect(query).toContain("skills=171,381");
    expect(query).toContain("h=58,59,301");
    expect(query).not.toMatch(/%2C|%3A|[a-z]\d/i);
  });

  it("writes nothing for the default, empty state", () => {
    const empty: UrlState = { roleIds: [], skillIds: [], title: null, skillMode: "all", roleMode: "any", assessment: {} };
    expect(buildUrlQuery(empty)).toBe("");
    expect(parseUrlState("")).toEqual(empty);
  });

  it("stays short with many ratings", () => {
    const assessment = Object.fromEntries(Array.from({ length: 100 }, (_, i) => [`s${200 + i}`, "have" as const]));
    expect(buildUrlQuery({ ...state, assessment }).length).toBeLessThan(500);
  });

  it("ignores anything that is not a number, and repeated roles", () => {
    expect(parseUrlState("?roles=PD-WRL-001,4,4,x&skills=S0542,,7&h=,&p=abc&a=s1:have").roleIds).toEqual(["r4"]);
    const parsed = parseUrlState("?roles=PD-WRL-001,4,4,x&skills=S0542,,7&h=,&p=abc&a=s1:have");
    expect(parsed.skillIds).toEqual(["s7"]);
    expect(parsed.assessment).toEqual({});
  });

  it("keeps awkward titles intact", () => {
    const awkward = { ...state, title: "dev/sec & ops, tier 1" };
    expect(parseUrlState(`?${buildUrlQuery(awkward)}`).title).toBe("dev/sec & ops, tier 1");
  });
});
