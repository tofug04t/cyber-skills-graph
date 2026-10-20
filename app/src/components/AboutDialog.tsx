import { useEffect, useRef } from "react";
import { CREDITS } from "../credits";

interface AboutDialogProps {
  open: boolean;
  onClose: () => void;
}

export function AboutDialog({ open, onClose }: AboutDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="about"
      aria-labelledby="about-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="about__content">
        <div className="about__header">
          <h2 id="about-title">About Cyber Skills Graph</h2>
          <button type="button" className="link-button" onClick={onClose}>
            Close
          </button>
        </div>

        <p>
          An explorable map of cybersecurity Work Roles, the skills they use, and the paths into
          them. The roles, skills, job titles, and pathways are one person's interpretation, not an
          official standard. They were inspired by the NIST NICE Framework (SP 800-181 Rev. 1) and
          other sources.
        </p>

        <h3 className="subheading">Credits</h3>
        <ul className="about__credits">
          {CREDITS.map((credit) => (
            <li key={credit.name}>
              {credit.url ? (
                <a href={credit.url} target="_blank" rel="noreferrer">
                  {credit.name}
                </a>
              ) : (
                <strong>{credit.name}</strong>
              )}{" "}
              {credit.reason}
            </li>
          ))}
        </ul>
      </div>
    </dialog>
  );
}
