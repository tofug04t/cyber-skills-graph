import type { Assessment, AssessmentValue, Skill, WorkRole } from "../types";
import { SkillChecklist } from "./SkillChecklist";
import { CopyLinkButton } from "./CopyLinkButton";
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

function gapCounts(skills: Skill[], assessment: Assessment) {
  let have = 0;
  let partial = 0;
  for (const s of skills) {
    if (assessment[s.id] === "have") have++;
    else if (assessment[s.id] === "partial") partial++;
  }
  return { have, partial, total: skills.length };
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
  const { have, partial, total } = gapCounts(skills, assessment);
  return (
    <details className="card role-detail" open={defaultOpen}>
      <summary className="role-detail__header">
        <SpectralStrip mix={role.mix} label={role.label} />
        <h3>{role.title}</h3>
        <span className="role-detail__label">{role.label}</span>
        {have + partial > 0 && (
          <span className="badge" title={`Strong in ${have} of ${total} skills`}>
            {have}/{total}
          </span>
        )}
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
              Reset ratings
            </button>
          )}
        </div>
        {have + partial > 0 ? (
          <div className="gap-summary">
            <div
              className="gap-bar"
              role="img"
              aria-label={`${have} strong and ${partial} some, of ${total} skills`}
            >
              <span className="gap-bar__have" style={{ width: `${(have / total) * 100}%` }} />
              <span className="gap-bar__partial" style={{ width: `${(partial / total) * 100}%` }} />
            </div>
            <p className="gap-summary__text">
              <strong>{have}</strong> strong
              {partial > 0 && <>, {partial} some</>} of {total} skills
            </p>
            <CopyLinkButton label="Copy link to your results" />
          </div>
        ) : (
          <p className="hint">Rate each skill Strong, Some or None to see where you stand.</p>
        )}
        <SkillChecklist skills={skills} assessment={assessment} onChange={onAssess} />
      </div>
    </details>
  );
}
