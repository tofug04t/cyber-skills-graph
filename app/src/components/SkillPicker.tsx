import type { GraphData, Skill } from "../types";
import { skillLabel, type SkillRole } from "../filters";
import { ColorMark } from "./ColorMark";
import { SpectralStrip } from "./SpectralStrip";

interface SkillPickerProps {
  graph: GraphData;
  skills: Skill[];
  selected: string[];
  /** Roles that use the selected skills, most overlap first. */
  roles: SkillRole[];
  selectedRoleIds: string[];
  onToggle: (skillId: string) => void;
  onToggleRole: (roleId: string) => void;
}

export const MAX_SKILLS = 2;

export function SkillPicker({ graph, skills, selected, roles, selectedRoleIds, onToggle, onToggleRole }: SkillPickerProps) {
  const full = selected.length >= MAX_SKILLS;

  return (
    <div className="skill-picker">
      {selected.length > 0 ? (
        <div className="skill-roles">
          <h4 className="subheading">
            {selected.length === 1 ? "Used by" : "Used by either skill"} ({roles.length}{" "}
            {roles.length === 1 ? "role" : "roles"})
          </h4>
          <ul className="list skill-roles__list">
            {roles.map(({ roleId, overlap }) => {
              const role = graph.workRoles[roleId];
              const isSelected = selectedRoleIds.includes(roleId);
              return (
                <li key={roleId}>
                  <button
                    type="button"
                    className={"role-row" + (isSelected ? " role-row--focused" : "")}
                    aria-pressed={isSelected}
                    onClick={() => onToggleRole(roleId)}
                  >
                    <SpectralStrip mix={role.mix} label={role.label} />
                    <span className="role-row__title">{role.title}</span>
                    {selected.length > 1 && (
                      <span className="badge">
                        {overlap}/{selected.length} skills
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <p className="hint">Pick up to {MAX_SKILLS} skills to see the roles that use them.</p>
      )}
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
