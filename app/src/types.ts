import type { ColorName } from "./theme";

export interface WorkRole {
  id: string;
  title: string;
  text: string;
  category: string;
  skills: string[];
  tasks: string[];
  knowledge: string[];
  /** Share of each color among the role's colored (non-center) skills. */
  mix: Partial<Record<ColorName, number>>;
  /** "Blue", "Hybrid: Yellow/Green", or "General". */
  label: string;
}

export interface Skill {
  id: string;
  /** Short display name, a few words at most. */
  title: string;
  /** Full statement, shown as hover detail. */
  text: string;
  workRoles: string[];
  color: ColorName;
  group?: string;
  x: number;
  y: number;
}

export interface GraphData {
  meta: {
    source: string;
    sourceVersion: string;
    workRoleCount: number;
    skillCount: number;
    documents: string[];
  };
  categories: Record<string, string>;
  workRoles: Record<string, WorkRole>;
  skills: Record<string, Skill>;
}

export interface WorkRoleJobTitles {
  work_role_id: string;
  work_role_title: string;
  job_titles: string[];
}

export interface JobTitlesData {
  work_role_job_titles: WorkRoleJobTitles[];
}

export type AssessmentValue = "have" | "partial" | "missing";

export type Assessment = Record<string, AssessmentValue>;

