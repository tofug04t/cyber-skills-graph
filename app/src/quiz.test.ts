/// <reference types="node" />
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { EMPTY_ANSWERS, knownCredits, shouldSkipActivity, suggestRoles, type QuizAnswers, type QuizData } from "./quiz";
import type { Assessment, GraphData } from "./types";

const read = <T>(file: string): T => JSON.parse(readFileSync(new URL(`../public/data/${file}`, import.meta.url), "utf8"));
const graph = read<GraphData>("skills-graph.json");
const data = read<QuizData>("role-quiz.json");

const answers = (overrides: Partial<QuizAnswers>): QuizAnswers => ({ ...EMPTY_ANSWERS, ...overrides });
const titles = (a: QuizAnswers, marks: Assessment = {}) =>
  suggestRoles(graph, data, a, marks).map((s) => graph.workRoles[s.roleId].title);

// Personas from the spec. They check plausibility (not exact lists) and that no role wins every run.
const PERSONAS: Record<string, { answers: QuizAnswers; marks?: Assessment }> = {
  "student interested in investigating": {
    answers: answers({ field: "student", time: "year", coding: "some", picked: ["watch"] }),
  },
  "IT help desk worker": {
    answers: answers({
      field: "helpdesk",
      activities: { troubleshoot: "yes", machines: "some", network: "some" },
      time: "year",
      coding: "some",
      picked: ["watch"],
    }),
  },
  "teacher moving into security": {
    answers: answers({
      field: "teaching",
      activities: { explain: "yes", docs: "yes" },
      time: "year",
      coding: "avoid",
      picked: ["teach", "rules"],
    }),
  },
  developer: {
    answers: answers({
      field: "developer",
      activities: { software: "yes", script: "yes" },
      time: "months",
      coding: "enjoy",
      picked: ["software", "break"],
    }),
  },
  "someone with many Strong marks": {
    answers: answers({ time: "long", coding: "some", picked: ["watch", "fix"] }),
    marks: Object.fromEntries(
      Object.values(graph.skills)
        .filter((s) => s.color === "blue" || s.color === "purple")
        .map((s) => [s.id, "have" as const])
    ),
  },
};

describe("role quiz scoring", () => {
  it("suggests no more than the cap, and at least the minimum, for every persona", () => {
    for (const [name, p] of Object.entries(PERSONAS)) {
      const found = suggestRoles(graph, data, p.answers, p.marks ?? {});
      expect(found.length, name).toBeGreaterThanOrEqual(data.scoring.minPicks);
      expect(found.length, name).toBeLessThanOrEqual(data.scoring.maxPicks);
      for (const s of found) {
        expect(graph.workRoles[s.roleId], `${name}: ${s.roleId}`).toBeDefined();
        expect(s.reason.length).toBeGreaterThan(0);
      }
      if (process.env.QUIZ_VERBOSE) {
        console.log(`\n${name}`);
        for (const s of found) console.log(`  ${graph.workRoles[s.roleId].title}: ${s.reason}`);
      }
    }
  });

  it("offers a common first role to someone coming from help desk work", () => {
    const found = titles(PERSONAS["IT help desk worker"].answers);
    expect(found).toContain("SOC Analyst");
  });

  it("stops boosting a first role the person already covers", () => {
    const strong = Object.fromEntries(graph.workRoles["PD-WRL-001"].skills.map((id) => [id, "have" as const]));
    const found = suggestRoles(graph, data, answers({ picked: ["watch"] }), strong).find((s) => s.roleId === "PD-WRL-001");
    // covered in full: it may still be suggested, but as a close match, not as a first step
    expect(found?.reason ?? "").not.toMatch(/common first role/);
  });

  it("is deterministic", () => {
    for (const p of Object.values(PERSONAS)) {
      expect(suggestRoles(graph, data, p.answers, p.marks ?? {})).toEqual(suggestRoles(graph, data, p.answers, p.marks ?? {}));
    }
  });

  it("never changes the marks it reads", () => {
    const marks: Assessment = { S9001: "have", S9002: "partial", S9004: "missing" };
    const before = JSON.stringify(marks);
    suggestRoles(graph, data, PERSONAS["IT help desk worker"].answers, marks);
    expect(JSON.stringify(marks)).toBe(before);
  });

  it("no single role appears in every persona's results", () => {
    const runs = Object.values(PERSONAS).map((p) => new Set(suggestRoles(graph, data, p.answers, p.marks ?? {}).map((s) => s.roleId)));
    const everywhere = [...runs[0]].filter((id) => runs.every((r) => r.has(id)));
    expect(everywhere).toEqual([]);
  });

  it("leans toward the roles that match the picked interest", () => {
    const watch = titles(PERSONAS["student interested in investigating"].answers);
    const mixOf = (title: string) => Object.values(graph.workRoles).find((r) => r.title === title)!.mix.blue ?? 0;
    expect(Math.max(...watch.map(mixOf))).toBeGreaterThan(0.4);
  });

  it("drops roles whose dominant color the person excluded", () => {
    const base = answers({ field: "sysadmin", picked: ["build"], coding: "some", time: "year" });
    const without = suggestRoles(graph, data, { ...base, excluded: ["rules"] }, {}).map((s) => graph.workRoles[s.roleId]);
    for (const role of without) {
      const top = Object.entries(role.mix).sort((a, b) => b[1] - a[1])[0][0];
      expect(top, role.title).not.toBe("white");
    }
  });

  it("an explicit None stays zero even when an answer would infer the skill", () => {
    const credits = knownCredits(data, answers({ field: "sysadmin" }), { S9001: "missing", S9002: "have" });
    expect(credits.get("S9001")).toBe(0);
    expect(credits.get("S9002")).toBe(1);
    expect(credits.get("S9003")).toBe(data.scoring.fieldCredit);
  });

  it("with interests only, still fills the board", () => {
    expect(titles(answers({ picked: ["rules"] })).length).toBeGreaterThanOrEqual(data.scoring.minPicks);
  });

  it("returns nothing when there is no signal at all", () => {
    expect(suggestRoles(graph, data, EMPTY_ANSWERS, {})).toEqual([]);
  });

  it("skips an activity once most of its skills are marked", () => {
    const activity = data.background.activities.items.find((a) => a.id === "script")!;
    const marks = Object.fromEntries(activity.skills.slice(0, 3).map((id) => [id, "have" as const]));
    expect(shouldSkipActivity(activity, marks, data.scoring.adaptiveSkip)).toBe(true);
    expect(shouldSkipActivity(activity, {}, data.scoring.adaptiveSkip)).toBe(false);
  });
});
