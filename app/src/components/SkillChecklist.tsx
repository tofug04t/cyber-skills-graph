import type { Assessment, AssessmentValue, Skill } from "../types";
import { skillLabel } from "../filters";
import { ColorMark } from "./ColorMark";
import { MarkButtons } from "./MarkButtons";

interface SkillChecklistProps {
  skills: Skill[];
  assessment: Assessment;
  onChange: (skillId: string, value: AssessmentValue) => void;
}

export function SkillChecklist({ skills, assessment, onChange }: SkillChecklistProps) {
  return (
    <ul className="skill-checklist">
      {skills.map((skill) => (
        <li key={skill.id} className="skill-checklist__row">
          <span className="skill-checklist__text" title={skill.text}>
            <ColorMark color={skill.color} /> {skillLabel(skill)}
          </span>
          <MarkButtons value={assessment[skill.id] ?? "missing"} onChange={(v) => onChange(skill.id, v)} />
        </li>
      ))}
    </ul>
  );
}
