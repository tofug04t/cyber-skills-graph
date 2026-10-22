import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { FEEDBACK_URL } from "../credits";
import { copyLink } from "../copyLink";

const COPIED_MS = 1200;

export function HeaderMenu({ onAbout }: { onAbout: () => void }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const items = () => [...(rootRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])];

  const close = () => {
    setOpen(false);
    setCopied(false);
  };

  useEffect(() => {
    if (!open) return;
    items()[0]?.focus();
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape" && open) {
      e.preventDefault(); // keeps the app-wide Esc (clear filters) from also firing
      close();
      triggerRef.current?.focus();
    } else if (open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      e.preventDefault();
      const list = items();
      const next = list.indexOf(document.activeElement as HTMLElement) + (e.key === "ArrowDown" ? 1 : -1);
      list[(next + list.length) % list.length]?.focus();
    }
  };

  const onCopy = async () => {
    if (await copyLink()) {
      setCopied(true);
      setTimeout(close, COPIED_MS);
    } else {
      close();
    }
  };

  return (
    <div className="menu" ref={rootRef} onKeyDown={onKeyDown}>
      <button
        ref={triggerRef}
        type="button"
        className="menu__trigger"
        aria-label="More options"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <circle cx="3" cy="8" r="1.5" />
          <circle cx="8" cy="8" r="1.5" />
          <circle cx="13" cy="8" r="1.5" />
        </svg>
      </button>
      {open && (
        <div className="menu__list" role="menu">
          <button type="button" role="menuitem" className="menu__item" onClick={onCopy}>
            {copied ? "Link copied" : "Copy link"}
          </button>
          <a
            role="menuitem"
            className="menu__item"
            href={FEEDBACK_URL}
            target="_blank"
            rel="noreferrer"
            onClick={close}
          >
            Feedback
          </a>
          <button
            type="button"
            role="menuitem"
            className="menu__item"
            onClick={() => {
              close();
              onAbout();
            }}
          >
            About
          </button>
        </div>
      )}
    </div>
  );
}
