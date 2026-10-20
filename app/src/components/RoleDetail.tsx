import type { Assessment, AssessmentValue, Skill, WorkRole } from "../types";
import { CATEGORY_COLORS } from "../constants";
import type { PathwayIn } from "../filters";
import { SkillChecklist } from "./SkillChecklist";

interface RoleDetailProps {
  role: WorkRole;
  skills: Skill[];
  titles: string[];
  pathways: PathwayIn[];
  assessment: Assessment;
  onAssess: (skillId: string, value: AssessmentValue) => void;
  onTitle: (title: string) => void;
  onResetMarks: () => void;
  onClose: () => void;
}

export function RoleDetail({
  role,
  skills,
  titles,
  pathways,
  assessment,
  onAssess,
  onTitle,
  onResetMarks,
  onClose,
}: RoleDetailProps) {
  return (
    <div className="card role-detail">
      <div className="role-detail__header">
        <span className="role-row__dot" style={{ background: CATEGORY_COLORS[role.category] }} />
        <h3>{role.title}</h3>
        <button type="button" className="link-button" onClick={onClose}>
          All roles
        </button>
      </div>
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
        <h4 className="subheading">Ways in</h4>
        {pathways.length > 0 ? (
          <ul className="pathway-list">
            {pathways.map(({ feeder, target }) => (
              <li key={feeder.feeder_id}>
                <span className="pathway-list__title">{feeder.feeder_title}</span>
                <span className={`badge badge--${target.transition_difficulty.toLowerCase()}`}>
                  {target.transition_difficulty}
                </span>
                <p className="role-row__note">{target.rationale}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="hint">
            No entry pathways from other fields are mapped for this role yet. It may be reached from
            other cybersecurity roles.
          </p>
        )}
      </div>

      <div className="role-detail__section">
        <div className="role-detail__skills-header">
          <h4 className="subheading">Your skills ({skills.length})</h4>
          {skills.some((s) => assessment[s.id] && assessment[s.id] !== "missing") && (
            <button type="button" className="link-button" onClick={onResetMarks}>
              Reset marks
            </button>
          )}
        </div>
        <SkillChecklist skills={skills} assessment={assessment} onChange={onAssess} />
      </div>
    </div>
  );
}
