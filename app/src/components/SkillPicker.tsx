import type { Skill } from "../types";
import { skillLabel } from "../filters";
import { ColorMark } from "./ColorMark";

interface SkillPickerProps {
  skills: Skill[];
  selected: string[];
  onToggle: (skillId: string) => void;
}

export const MAX_SKILLS = 2;

export function SkillPicker({ skills, selected, onToggle }: SkillPickerProps) {
  const full = selected.length >= MAX_SKILLS;

  return (
    <div className="skill-picker">
      <p className="hint">Pick up to {MAX_SKILLS} skills to see the roles that use them.</p>
      {skills.length === 0 ? (
        <p className="empty">No matching skills.</p>
      ) : (
        <ul className="list facet__scroll">
          {skills.map((skill) => {
            const isSelected = selected.includes(skill.id);
            return (
              <li key={skill.id}>
                <button
                  type="button"
                  className={"role-row" + (isSelected ? " role-row--focused" : "")}
                  aria-pressed={isSelected}
                  disabled={full && !isSelected}
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
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
