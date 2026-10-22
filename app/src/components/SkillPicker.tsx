import type { Assessment, AssessmentValue, Skill } from "../types";
import { skillLabel } from "../filters";
import { ColorMark } from "./ColorMark";
import { MARK_OPTIONS } from "../constants";

interface SkillPickerProps {
  skills: Skill[];
  selected: string[];
  assessment: Assessment;
  onAssess: (skillId: string, value: AssessmentValue) => void;
  onToggle: (skillId: string) => void;
}

export function SkillPicker({
  skills,
  selected,
  assessment,
  onAssess,
  onToggle,
}: SkillPickerProps) {
  return (
    <div className="skill-picker">
      {selected.length === 0 && (
        <p className="hint">Pick one or more skills. The roles that use them are listed under Role.</p>
      )}
      {skills.length === 0 ? (
        <p className="empty">No matching skills.</p>
      ) : (
        <ul className="list facet__scroll">
          {skills.map((skill) => {
            const isSelected = selected.includes(skill.id);
            return (
              <li key={skill.id} className="skill-row">
                <button
                  type="button"
                  className={"role-row" + (isSelected ? " role-row--focused" : "")}
                  aria-pressed={isSelected}
                  onClick={() => onToggle(skill.id)}
                >
                  <ColorMark color={skill.color} />
                  <span className="role-row__title" title={skill.text}>
                    {skillLabel(skill)}
                  </span>
                  {skill.workRoles.length > 1 && (
                    <span className="badge">{skill.workRoles.length} roles</span>
                  )}
                </button>
                <select
                  className="mark-select"
                  aria-label={`Your level: ${skillLabel(skill)}`}
                  value={assessment[skill.id] ?? ""}
                  onChange={(e) => onAssess(skill.id, e.target.value as AssessmentValue)}
                >
                  <option value="" disabled>
                    Rate
                  </option>
                  {MARK_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
