import type { Assessment, AssessmentValue, Skill, WorkRole } from "../types";
import { SkillChecklist } from "./SkillChecklist";
import { SpectralStrip } from "./SpectralStrip";

interface RoleDetailProps {
  role: WorkRole;
  skills: Skill[];
  titles: string[];
  assessment: Assessment;
  /** Start expanded; with several roles selected only the first ones need to be. */
  defaultOpen: boolean;
  onAssess: (skillId: string, value: AssessmentValue) => void;
  onTitle: (title: string) => void;
  onResetMarks: () => void;
  onRemove: () => void;
}

export function RoleDetail({
  role,
  skills,
  titles,
  assessment,
  defaultOpen,
  onAssess,
  onTitle,
  onResetMarks,
  onRemove,
}: RoleDetailProps) {
  return (
    <details className="card role-detail" open={defaultOpen}>
      <summary className="role-detail__header">
        <SpectralStrip mix={role.mix} label={role.label} />
        <h3>{role.title}</h3>
        <span className="role-detail__label">{role.label}</span>
        <button
          type="button"
          className="link-button"
          onClick={(e) => {
            e.preventDefault();
            onRemove();
          }}
        >
          Remove
        </button>
      </summary>
      <p className="role-detail__text">{role.text}</p>

      {titles.length > 0 && (
        <div className="role-detail__section">
          <h4 className="subheading">Common job titles</h4>
          <div className="chips">
            {titles.map((t) => (
              <button key={t} type="button" className="chip chip--plain" onClick={() => onTitle(t)}>
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="role-detail__section">
        <div className="role-detail__skills-header">
          <h4 className="subheading">Skills ({skills.length})</h4>
          {skills.some((s) => assessment[s.id] && assessment[s.id] !== "missing") && (
            <button type="button" className="link-button" onClick={onResetMarks}>
              Reset marks
            </button>
          )}
        </div>
        <SkillChecklist skills={skills} assessment={assessment} onChange={onAssess} />
      </div>
    </details>
  );
}
