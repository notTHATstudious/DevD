export const PWA_STANDALONE_CLASS = "pwa-standalone";

export const STANDALONE_VIEWPORT =
  "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover";

/** Detect installed PWA (Android display-mode or iOS standalone). */
export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function getViewportMeta(): HTMLMetaElement | null {
  return document.querySelector('meta[name="viewport"]');
}

/** Apply native-app touch constraints only when running as an installed PWA. */
export function applyPwaStandaloneMode(): void {
  if (!isStandalone()) return;

  document.documentElement.classList.add(PWA_STANDALONE_CLASS);

  const viewport = getViewportMeta();
  if (viewport) {
    viewport.setAttribute("content", STANDALONE_VIEWPORT);
  }
}
