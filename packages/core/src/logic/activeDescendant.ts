/**
 * Keeping the active row of an `aria-activedescendant` listbox visible.
 *
 * In that pattern DOM focus stays on the input or trigger while the highlight
 * moves, so the browser has nothing to follow and never scrolls the list. Any
 * popup that caps its height has to do it here instead.
 */

/**
 * Scroll the element named by `activeId` into view.
 *
 * `block: "nearest"` moves the list only when the row is outside it, so
 * arrowing between rows that are already visible leaves the scroll position
 * alone.
 *
 * No-op when nothing is active, when no element carries the id, and where the
 * environment implements no scrolling.
 */
export function scrollActiveDescendantIntoView(activeId: string | null | undefined): void {
  if (!activeId) return;
  /* istanbul ignore next -- SSR guard: unreachable in a DOM test environment */
  if (typeof document === "undefined") return;
  document.getElementById(activeId)?.scrollIntoView?.({ block: "nearest" });
}
