export function prefersReducedMotion(): boolean {
  const setting = document.documentElement.dataset.motion;
  if (setting === "reduce") return true;
  if (setting === "full") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function scrollBehavior(): ScrollBehavior {
  return prefersReducedMotion() ? "auto" : "smooth";
}
