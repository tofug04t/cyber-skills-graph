// Role quiz scoring: pure functions, no React. Content and every tuning number live in
// data/role-quiz.json. The quiz only reads the person's marks; it never writes them.
import type { Assessment, GraphData, WorkRole } from "./types";
import type { ColorName } from "./theme";

export type Rating = "no" | "some" | "yes";

const RATING_CREDIT: Record<Rating, number> = { no: 0, some: 0.5, yes: 1 };
const MARK_CREDIT = { have: 1, partial: 0.5, missing: 0 } as const;
const INTEREST_COLORS: ColorName[] = ["red", "purple", "blue", "green", "yellow", "orange", "white"];

export interface QuizData {
  version: number;
  scoring: {
    smoothing: number;
    /** Smoothed coverage at which the coverage term reaches its maximum. */
    coverageScale: number;
    fieldCredit: number;
    /** A "close to where you are" pick needs at least this many skills already covered. */
    minCloseSkills: number;
    /** Share of an activity's skills already marked at which the question is skipped. */
    adaptiveSkip: number;
    minPicks: number;
    maxPicks: number;
    /** Stop adding suggestions beyond minPicks once a score falls below this share of the best. */
    dropoff: number;
    weights: { coverage: number; interest: number; gap: number; coding: number; starting: number };
  };
  /** Common first roles in security; they get a bonus that fades as the person already covers the role. */
  startingRoles: string[];
  background: {
    field: { question: string; options: { id: string; label: string; skills: string[] }[] };
    activities: { question: string; items: QuizActivity[] };
  };
  appetite: {
    time: { question: string; options: { id: string; label: string; gapTolerance: number }[] };
    coding: { question: string; options: { id: string; label: string; codingPenalty: number }[] };
  };
  interests: {
    pickQuestion: string;
    excludeQuestion: string;
    maxPick: number;
    cards: { id: string; text: string; phrase: string; color: ColorName }[];
  };
}

export interface QuizActivity {
  id: string;
  text: string;
  skills: string[];
}

export interface QuizAnswers {
  field: string | null;
  activities: Record<string, Rating>;
  time: string | null;
  coding: string | null;
  /** Interest card ids. */
  picked: string[];
  excluded: string[];
}

export const EMPTY_ANSWERS: QuizAnswers = { field: null, activities: {}, time: null, coding: null, picked: [], excluded: [] };

export interface QuizSuggestion {
  roleId: string;
  reason: string;
}

interface Scored {
  role: WorkRole;
  coverage: number;
  interest: number;
  gapPenalty: number;
  codingPenalty: number;
  score: number;
  coverageTerm: number;
  interestTerm: number;
  startingTerm: number;
  known: number;
  /** Share of the role's Middle skills the person already has; only a tiebreaker. */
  middle: number;
}

/** True when most of an activity's skills are already marked, so asking would be redundant. */
export function shouldSkipActivity(activity: QuizActivity, assessment: Assessment, threshold: number): boolean {
  if (activity.skills.length === 0) return false;
  const marked = activity.skills.filter((id) => assessment[id] !== undefined).length;
  return marked / activity.skills.length >= threshold;
}

/** Credit per skill, 0 to 1. A mark wins (an explicit None stays 0); otherwise the best inferred answer. */
export function knownCredits(data: QuizData, answers: QuizAnswers, assessment: Assessment): Map<string, number> {
  const credits = new Map<string, number>();
  const infer = (skills: string[], credit: number) => {
    for (const id of skills) credits.set(id, Math.max(credits.get(id) ?? 0, credit));
  };
  const field = data.background.field.options.find((o) => o.id === answers.field);
  if (field) infer(field.skills, data.scoring.fieldCredit);
  for (const item of data.background.activities.items) {
    const rating = answers.activities[item.id];
    if (rating) infer(item.skills, RATING_CREDIT[rating]);
  }
  for (const [id, mark] of Object.entries(assessment)) credits.set(id, MARK_CREDIT[mark]);
  return credits;
}

function interestVector(data: QuizData, answers: QuizAnswers): Partial<Record<ColorName, number>> {
  const vector: Partial<Record<ColorName, number>> = {};
  for (const card of data.interests.cards) {
    if (answers.picked.includes(card.id)) vector[card.color] = 1;
    else if (answers.excluded.includes(card.id)) vector[card.color] = -1;
  }
  const norm = Math.hypot(...Object.values(vector));
  if (norm === 0) return {};
  for (const color of INTEREST_COLORS) if (vector[color]) vector[color] = (vector[color] as number) / norm;
  return vector;
}

function dominantColor(role: WorkRole): ColorName | null {
  let best: ColorName | null = null;
  for (const color of INTEREST_COLORS) {
    if ((role.mix[color] ?? 0) > (role.mix[best as ColorName] ?? 0)) best = color;
  }
  return best;
}

/** Pick 3 to 5 roles for the answers and existing marks, each with a one-line reason. */
export function suggestRoles(
  graph: GraphData,
  data: QuizData,
  answers: QuizAnswers,
  assessment: Assessment
): QuizSuggestion[] {
  const { scoring } = data;
  const credits = knownCredits(data, answers, assessment);
  const vector = interestVector(data, answers);
  const hasInterest = answers.picked.length > 0;
  const hasBackground = [...credits.values()].some((c) => c > 0);
  if (!hasInterest && !hasBackground) return [];

  const time = data.appetite.time.options.find((o) => o.id === answers.time);
  const coding = data.appetite.coding.options.find((o) => o.id === answers.coding);
  const excludedColors = new Set(
    data.interests.cards.filter((c) => answers.excluded.includes(c.id) && !answers.picked.includes(c.id)).map((c) => c.color)
  );

  const scored: Scored[] = Object.values(graph.workRoles)
    .filter((role) => {
      const dominant = dominantColor(role);
      return !(dominant && excludedColors.has(dominant));
    })
    .map((role) => {
      const n = role.skills.length;
      const known = role.skills.reduce((sum, id) => sum + (credits.get(id) ?? 0), 0);
      const coverage = known / (n + scoring.smoothing);
      const interest = INTEREST_COLORS.reduce((sum, c) => sum + (role.mix[c] ?? 0) * (vector[c] ?? 0), 0);
      // Share of the role's skills still to learn, beyond what the time available tolerates (0 to 1).
      const tolerance = time?.gapTolerance ?? 1;
      const gapPenalty = tolerance >= 1 ? 0 : Math.max(0, (n - known) / n - tolerance) / (1 - tolerance);
      const codingPenalty = (coding?.codingPenalty ?? 0) * ((role.mix.green ?? 0) + (role.mix.yellow ?? 0));
      const middleSkills = role.skills.filter((id) => graph.skills[id]?.color === "center");
      const middle = middleSkills.length
        ? middleSkills.reduce((sum, id) => sum + (credits.get(id) ?? 0), 0) / middleSkills.length
        : 0;
      return { role, coverage, interest, gapPenalty, codingPenalty, score: 0, coverageTerm: 0, interestTerm: 0, startingTerm: 0, known, middle };
    });

  // Interest is stretched across roles so the weights compare like with like; coverage saturates
  // at coverageScale, so a trivial overlap can't look like a strong one.
  const minInterest = Math.min(0, ...scored.map((s) => s.interest));
  const interestRange = Math.max(0, ...scored.map((s) => s.interest)) - minInterest;
  const w = scoring.weights;
  for (const s of scored) {
    s.coverageTerm = Math.min(1, s.coverage / scoring.coverageScale);
    s.interestTerm = interestRange > 0 ? (s.interest - minInterest) / interestRange : 0;
    s.startingTerm = data.startingRoles.includes(s.role.id) ? 1 - s.coverageTerm : 0;
    s.score =
      w.coverage * s.coverageTerm +
      w.interest * s.interestTerm +
      w.starting * s.startingTerm -
      w.gap * s.gapPenalty -
      w.coding * s.codingPenalty;
  }

  const byTitle = (a: Scored, b: Scored) => a.role.title.localeCompare(b.role.title);

  // With no background at all, rank by interest; Middle-skill coverage only breaks ties.
  if (!hasBackground) {
    return pick(scored, data, (a, b) => b.interest - a.interest || b.middle - a.middle || byTitle(a, b), answers);
  }
  return pick(scored, data, (a, b) => b.score - a.score || byTitle(a, b), answers);
}

function pick(
  scored: Scored[],
  data: QuizData,
  order: (a: Scored, b: Scored) => number,
  answers: QuizAnswers
): QuizSuggestion[] {
  const { minPicks, maxPicks, dropoff } = data.scoring;
  const ranked = [...scored].sort(order);
  if (ranked.length === 0) return [];

  const chosen: Scored[] = [];
  const add = (s: Scored | undefined) => {
    if (s && !chosen.includes(s)) chosen.push(s);
  };
  // One pick that is closest to where the person is, one that best matches their interests.
  const close = [...ranked].sort((a, b) => b.coverage - a.coverage || order(a, b))[0];
  const interest = [...ranked].sort((a, b) => b.interest - a.interest || order(a, b))[0];
  const kinds = new Map<Scored, "close" | "interest">();
  if (close.known >= data.scoring.minCloseSkills) {
    add(close);
    kinds.set(close, "close");
  }
  if (answers.picked.length > 0 && !chosen.includes(interest)) {
    add(interest);
    kinds.set(interest, "interest");
  }

  const best = ranked[0].score;
  for (const s of ranked) {
    if (chosen.length >= maxPicks) break;
    if (chosen.includes(s)) continue;
    if (chosen.length >= minPicks && !(best > 0 && s.score >= dropoff * best)) break;
    add(s);
  }

  return chosen
    .sort(order)
    .slice(0, maxPicks)
    .map((s) => ({
      roleId: s.role.id,
      reason: reasonFor(
        s,
        kinds.get(s) ?? strongestTerm(s, data),
        data,
        answers
      ),
    }));
}

type Kind = "close" | "interest" | "start";

/** Which part of the score did most for a role that was not a guaranteed pick. */
function strongestTerm(s: Scored, data: QuizData): Kind {
  const w = data.scoring.weights;
  const terms: [Kind, number][] = [
    ["close", w.coverage * s.coverageTerm],
    ["interest", w.interest * s.interestTerm],
    ["start", w.starting * s.startingTerm],
  ];
  return terms.sort((a, b) => b[1] - a[1])[0][0];
}

function reasonFor(s: Scored, kind: Kind, data: QuizData, answers: QuizAnswers): string {
  const covered = s.known >= data.scoring.minCloseSkills ? Math.round(s.known) : 0;
  const coverNote = `you already cover ${covered} of its ${s.role.skills.length} skills`;
  if (kind === "close" && covered) return `Close to where you are: ${coverNote}.`;
  // The picked interest this role leans on most.
  const cards = data.interests.cards.filter((c) => answers.picked.includes(c.id));
  const top = cards.sort((a, b) => (s.role.mix[b.color] ?? 0) - (s.role.mix[a.color] ?? 0))[0];
  if (kind === "start") {
    const fits = top && (s.role.mix[top.color] ?? 0) >= 0.3 ? ` that fits your interest in ${top.phrase}` : "";
    return `A common first role in security${fits}${covered ? `; ${coverNote}` : ""}.`;
  }
  if (!top) return "Fits your answers.";
  const first = s.startingTerm > 0.5 ? " and is a common first role in security" : "";
  return `Matches your interest in ${top.phrase}${first}; ${covered ? coverNote : "a bigger stretch"}.`;
}
