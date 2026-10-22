import type { AssessmentValue } from "./types";

export const MARK_OPTIONS: { value: AssessmentValue; label: string }[] = [
  { value: "have", label: "Have" },
  { value: "partial", label: "Partial" },
  { value: "missing", label: "Missing" },
];
