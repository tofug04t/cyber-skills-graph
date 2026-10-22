import type { GraphData, Skill } from "../types";
import { skillLabel } from "../filters";
import { ColorMark } from "./ColorMark";
import { SpectralStrip } from "./SpectralStrip";

interface SkillPickerProps {
  graph: GraphData;
  skills: Skill[];
  selected: string[];
  /** Roles that use every selected skill. */
  roles: string[];
  selectedRoleIds: string[];
  onToggle: (skillId: string) => void;
  onToggleRole: (roleId: string) => void;
}

export function SkillPicker({ graph, skills, selected, roles, selectedRoleIds, onToggle, onToggleRole }: SkillPickerProps) {
  return (
    <div className="skill-picker">
      {selected.length > 0 ? (
        <div className="skill-roles">
          <h4 className="subheading">
            {selected.length === 1 ? "Used by" : "Used by all of these skills"} ({roles.length}{" "}
            {roles.length === 1 ? "role" : "roles"})
          </h4>
          {roles.length === 0 ? (
            <p className="empty">No role uses all of these skills. Remove one to widen the match.</p>
          ) : (
            <ul className="list skill-roles__list">
              {roles.map((roleId) => {
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
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : (
        <p className="hint">Pick one or more skills. Roles that use all of them are listed here.</p>
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
