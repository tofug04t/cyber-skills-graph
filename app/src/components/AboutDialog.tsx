import { useEffect, useRef } from "react";
import { CREDITS, FEEDBACK_URL } from "../credits";

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
          An explorable map of cybersecurity roles and the skills they use. The roles, skills, and job titles are one person's interpretation, not an
          official standard. They were inspired by the NIST NICE Framework (SP 800-181 Rev. 1) and
          other sources.
        </p>

        <p>
          Spotted something off, or have an idea?{" "}
          <a href={FEEDBACK_URL} target="_blank" rel="noreferrer">
            Share feedback
          </a>
          .
        </p>

        <h3 className="subheading">Credits</h3>
        <ul className="about__credits">
          {CREDITS.map((credit) => (
            <li key={credit.name}>
              <strong>{credit.name}</strong>{" "}
              {credit.link ? (
                <>
                  {credit.reason.split(credit.link.text)[0]}
                  <a href={credit.link.url} target="_blank" rel="noreferrer">
                    {credit.link.text}
                  </a>
                  {credit.reason.split(credit.link.text)[1]}
                </>
              ) : (
                credit.reason
              )}
            </li>
          ))}
        </ul>
      </div>
    </dialog>
  );
}
