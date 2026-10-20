export interface WorkRole {
  id: string;
  title: string;
  text: string;
  category: string;
  skills: string[];
  tasks: string[];
  knowledge: string[];
}

export interface Skill {
  id: string;
  /** Short display name, a few words at most. */
  title: string;
  /** Full statement, shown as hover detail. */
  text: string;
  workRoles: string[];
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

export type TransitionDifficulty = "Low" | "Medium" | "High";

export interface PathwayTarget {
  work_role_id: string;
  work_role_title: string;
  transition_difficulty: TransitionDifficulty;
  rationale: string;
}

export interface FeederRole {
  feeder_id: string;
  feeder_title: string;
  typical_background: string;
  targets: PathwayTarget[];
}

export interface PathwaysData {
  notes: string[];
  feeder_roles: FeederRole[];
}

export type AssessmentValue = "have" | "partial" | "missing";

export type Assessment = Record<string, AssessmentValue>;

export type ViewMode = "overview" | "gap" | "discovery";
