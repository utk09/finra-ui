/**
 * Framework-agnostic body scroll lock for modal overlays. Ref-counted so nested
 * locks (a dialog opening a dialog) don't release early, and the scrollbar width
 * is compensated with padding to avoid a layout shift when it disappears.
 */

let lockCount = 0;
let previousOverflow = "";
let previousPaddingRight = "";

/**
 * Lock scrolling on `document.body`. Returns an unlock function; the body is
 * only restored once every lock has been released. No-op outside the browser.
 */
export function lockBodyScroll(): () => void {
  /* istanbul ignore next -- SSR guard: unreachable in a DOM test environment */
  if (typeof document === "undefined") return () => undefined;

  lockCount += 1;
  if (lockCount === 1) {
    const { body, documentElement } = document;
    const scrollbarWidth = window.innerWidth - documentElement.clientWidth;

    previousOverflow = body.style.overflow;
    previousPaddingRight = body.style.paddingRight;

    body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      const currentPadding = Number.parseInt(window.getComputedStyle(body).paddingRight, 10) || 0;
      body.style.paddingRight = `${currentPadding + scrollbarWidth}px`;
    }
  }

  let released = false;
  return () => {
    if (released) return;
    released = true;
    lockCount -= 1;
    if (lockCount === 0) {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
    }
  };
}
