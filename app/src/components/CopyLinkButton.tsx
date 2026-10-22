import { useState } from "react";
import { copyLink } from "../copyLink";

export function CopyLinkButton({ label }: { label: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!(await copyLink())) return;
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button type="button" className="link-button" aria-live="polite" onClick={copy}>
      {copied ? "Link copied" : label}
    </button>
  );
}
