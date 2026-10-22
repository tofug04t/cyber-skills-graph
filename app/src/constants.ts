import type { AssessmentValue } from "./types";

export const MARK_OPTIONS: { value: AssessmentValue; label: string }[] = [
  { value: "have", label: "Strong" },
  { value: "partial", label: "Some" },
  { value: "missing", label: "None" },
];
