import { describe, expect, it } from "vitest";
import { buildUrlQuery, parseUrlState, type UrlState } from "./urlState";

const state: UrlState = {
  roleIds: ["PD-WRL-001", "PD-WRL-011"],
  skillIds: ["S0542", "S9003"],
  title: "soc analyst",
  skillMode: "any",
  roleMode: "all",
  assessment: { S0558: "have", S0559: "have", S0563: "partial", S0588: "missing", S9001: "have" },
};

describe("link format", () => {
  it("round-trips a full state", () => {
    expect(parseUrlState(`?${buildUrlQuery(state)}`)).toEqual(state);
  });

  it("writes plain commas and no S prefixes on skills", () => {
    const query = buildUrlQuery(state);
    expect(query).toContain("roles=PD-WRL-001,PD-WRL-011");
    expect(query).toContain("skills=0542,9003");
    expect(query).toContain("h=0558,0559,9001");
    expect(query).not.toMatch(/%2C|%3A/i);
  });

  it("writes nothing for the default, empty state", () => {
    const empty: UrlState = { roleIds: [], skillIds: [], title: null, skillMode: "all", roleMode: "any", assessment: {} };
    expect(buildUrlQuery(empty)).toBe("");
    expect(parseUrlState("")).toEqual(empty);
  });

  it("is much shorter than the earlier format when there are many ratings", () => {
    const assessment = Object.fromEntries(Array.from({ length: 40 }, (_, i) => [`S${String(500 + i).padStart(4, "0")}`, "have" as const]));
    const compact = buildUrlQuery({ ...state, assessment });
    const earlier = `a=${Object.entries(assessment).map(([id, v]) => encodeURIComponent(`${id}:${v}`)).join("%2C")}`;
    expect(compact.length).toBeLessThan(earlier.length / 2);
  });

  it("still opens links in the earlier format", () => {
    const parsed = parseUrlState(
      "?roles=DD-WRL-012%2CPD-WRL-001&a=S0558%3Ahave%2CS0563%3Apartial%2CS0588%3Amissing&skills=S0542%2CS9003&skillMatch=any"
    );
    expect(parsed.roleIds).toEqual(["DD-WRL-012", "PD-WRL-001"]);
    expect(parsed.skillIds).toEqual(["S0542", "S9003"]);
    expect(parsed.assessment).toEqual({ S0558: "have", S0563: "partial", S0588: "missing" });
    expect(parsed.skillMode).toBe("any");
  });

  it("reads the earlier single-role parameter and ignores junk", () => {
    expect(parseUrlState("?role=PD-WRL-001&roles=PD-WRL-001,PD-WRL-002&a=bad,S1:wrong&h=,&x=1").roleIds).toEqual([
      "PD-WRL-001",
      "PD-WRL-002",
    ]);
    expect(parseUrlState("?a=bad,S1:wrong&h=,").assessment).toEqual({});
  });

  it("keeps awkward titles intact", () => {
    const awkward = { ...state, title: "dev/sec & ops, tier 1" };
    expect(parseUrlState(`?${buildUrlQuery(awkward)}`).title).toBe("dev/sec & ops, tier 1");
  });
});
