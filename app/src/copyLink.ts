/** Copies the current address (the URL holds selections, ratings and match settings). False if the clipboard was blocked. */
export async function copyLink(): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(window.location.href);
    return true;
  } catch {
    // clipboard blocked (insecure context or denied): let the person copy by hand
    window.prompt("Copy this link", window.location.href);
    return false;
  }
}
