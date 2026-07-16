/**
 * Framework-agnostic focus utilities for overlays: find the tabbable elements
 * inside a container and decide where Tab / Shift+Tab should move to keep focus
 * trapped. The React `FocusScope` and a future Lit adapter share this core.
 *
 * Tab order follows DOM order; positive `tabindex` re-ordering is intentionally
 * not modelled (APG guidance is to avoid positive tabindex). Visibility is
 * checked via attributes (`hidden`, `disabled`, `aria-hidden`, negative
 * `tabindex`) rather than layout, so it stays correct without a rendering engine
 * (a display:none element with no `hidden` attribute is a rare false positive).
 */

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
  "audio[controls]",
  "video[controls]",
  '[contenteditable]:not([contenteditable="false"])',
].join(",");

function isTabbable(el: HTMLElement): boolean {
  if (el.hasAttribute("disabled")) return false;
  if (el.getAttribute("aria-hidden") === "true") return false;
  if (el.hidden) return false;
  const tabindex = el.getAttribute("tabindex");
  if (tabindex !== null && Number.parseInt(tabindex, 10) < 0) return false;
  return true;
}

/** All tabbable elements inside `container`, in tab (DOM) order. */
export function getTabbables(container: Element): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(isTabbable);
}

/**
 * Resolve where Tab / Shift+Tab should move focus to keep it within the scope:
 * - focus outside the scope is pulled back to the first (or last, for Shift) tabbable;
 * - Tab from the last tabbable wraps to the first; Shift+Tab from the first wraps to the last;
 * - an interior tab returns `null` (let the browser move focus normally).
 */
export function resolveTabStop(
  tabbables: HTMLElement[],
  active: Element | null,
  shiftKey: boolean,
): HTMLElement | null {
  if (tabbables.length === 0) return null;

  const first = tabbables[0];
  const last = tabbables[tabbables.length - 1];
  const activeIndex = active ? tabbables.indexOf(active as HTMLElement) : -1;

  if (activeIndex === -1) return shiftKey ? last : first;
  if (shiftKey && active === first) return last;
  if (!shiftKey && active === last) return first;
  return null;
}
