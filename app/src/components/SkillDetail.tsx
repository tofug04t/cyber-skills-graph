import type { Assessment, AssessmentValue, GraphData, Skill } from "../types";
import { skillLabel } from "../filters";
import { MEANINGS } from "../theme";
import { ColorMark } from "./ColorMark";
import { MarkButtons } from "./MarkButtons";
import { SpectralStrip } from "./SpectralStrip";

interface SkillDetailProps {
  graph: GraphData;
  skill: Skill;
  related: Skill[];
  assessment: Assessment;
  defaultOpen: boolean;
  onAssess: (skillId: string, value: AssessmentValue) => void;
  onToggleRole: (roleId: string) => void;
  onAddSkill: (skillId: string) => void;
  onRemove: () => void;
}

export function SkillDetail({
  graph,
  skill,
  related,
  assessment,
  defaultOpen,
  onAssess,
  onToggleRole,
  onAddSkill,
  onRemove,
}: SkillDetailProps) {
  const roles = skill.workRoles.map((id) => graph.workRoles[id]).filter(Boolean);
  return (
    <details className="card role-detail" open={defaultOpen}>
      <summary className="role-detail__header">
        <ColorMark color={skill.color} />
        <h3>{skillLabel(skill)}</h3>
        <span className="role-detail__label" title={MEANINGS[skill.color].blurb}>
          {MEANINGS[skill.color].name}
        </span>
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
      <p className="role-detail__text">{skill.text}</p>

      <div className="role-detail__section">
        <h4 className="subheading">Your level</h4>
        <MarkButtons value={assessment[skill.id] ?? "missing"} onChange={(v) => onAssess(skill.id, v)} />
      </div>

      <div className="role-detail__section">
        <h4 className="subheading">
          Used by ({roles.length} {roles.length === 1 ? "role" : "roles"})
        </h4>
        <ul className="list">
          {roles.map((role) => (
            <li key={role.id}>
              <button type="button" className="role-row" onClick={() => onToggleRole(role.id)}>
                <SpectralStrip mix={role.mix} label={role.label} />
                <span className="role-row__title">{role.title}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {related.length > 0 && (
        <div className="role-detail__section">
          <h4 className="subheading">Often used alongside</h4>
          <div className="chips">
            {related.map((r) => (
              <button
                key={r.id}
                type="button"
                className="chip chip--plain"
                title={r.text}
                onClick={() => onAddSkill(r.id)}
              >
                {skillLabel(r)}
              </button>
            ))}
          </div>
        </div>
      )}
    </details>
  );
}
