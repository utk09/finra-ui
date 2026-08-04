import { forwardRef, type HTMLAttributes, type ReactNode, useEffect, useRef } from "react";

import { getTabbables, resolveTabStop } from "../../logic/focus";
import { mergeRefs } from "../../utils/mergeRefs";

/**
 * Props for FocusScope - the focus trap behind modal surfaces.
 *
 * @remarks
 * Trapping is only correct for genuinely modal content. Applying it to a
 * non-modal layer strands keyboard users inside a panel they should be able to
 * tab out of, so a Popover deliberately does not use it.
 */
export interface FocusScopeProps extends HTMLAttributes<HTMLDivElement> {
  /** Content whose focus is managed. */
  children?: ReactNode;
  /** Trap Tab / Shift+Tab focus within the scope. Default true. */
  trapped?: boolean;
  /** Move focus into the scope (first tabbable, else the container) on mount. Default true. */
  focusOnMount?: boolean;
  /** Restore focus to the previously focused element on unmount. Default true. */
  restoreFocus?: boolean;
  /**
   * Where to send focus on unmount when the element that had it is no longer in
   * the document.
   *
   * @remarks
   * A trigger often unmounts alongside the surface it opened: a row's menu
   * button when the row is deleted, a dialog's opener when the route changes.
   * Calling `focus()` on a detached element does nothing, so without this the
   * user's place collapses to `document.body` and the next Tab starts from the
   * top of the page. Pass a function to resolve the target at unmount rather
   * than at mount, since the element may not exist yet when the scope opens.
   *
   * Ignored while the previously focused element is still connected, and when
   * `restoreFocus` is false.
   */
  fallbackFocus?: HTMLElement | null | (() => HTMLElement | null);
}

/**
 * Keeps keyboard focus inside its content while mounted - the focus half of an
 * accessible overlay (Dialog, Popover). Pairs with `DismissableLayer` and
 * `Portal`. The tabbable scan and wrap logic live in `logic/focus`.
 */
export const FocusScope = forwardRef<HTMLDivElement, FocusScopeProps>(
  (
    {
      children,
      trapped = true,
      focusOnMount = true,
      restoreFocus = true,
      fallbackFocus,
      tabIndex,
      ...rest
    },
    ref,
  ) => {
    const innerRef = useRef<HTMLDivElement>(null);

    // Read at unmount, not at mount, and kept out of the focus effect's deps so
    // a new callback identity cannot re-run it and pull focus back inside.
    const fallbackFocusRef = useRef(fallbackFocus);
    useEffect(() => {
      fallbackFocusRef.current = fallbackFocus;
    }, [fallbackFocus]);

    // Focus in on mount, restore on unmount.
    useEffect(() => {
      const container = innerRef.current;
      if (!container) return;
      const previouslyFocused = document.activeElement as HTMLElement | null;

      if (focusOnMount) {
        const [firstTabbable] = getTabbables(container);
        (firstTabbable ?? container).focus();
      }

      return () => {
        if (!restoreFocus) return;
        // A detached element still has a `focus` method; calling it is a silent
        // no-op, so connectedness is what decides whether restoring is possible.
        if (previouslyFocused?.isConnected) {
          previouslyFocused.focus();
          return;
        }
        const fallback = fallbackFocusRef.current;
        (typeof fallback === "function" ? fallback() : fallback)?.focus();
      };
    }, [focusOnMount, restoreFocus]);

    // Trap Tab via a native listener (avoids an interactive handler on a static
    // element, and reliably sees keydowns bubbling from the focused child).
    useEffect(() => {
      const container = innerRef.current;
      if (!container || !trapped) return;

      const onKeyDown = (event: KeyboardEvent) => {
        if (event.defaultPrevented || event.key !== "Tab") return;
        const target = resolveTabStop(
          getTabbables(container),
          document.activeElement,
          event.shiftKey,
        );
        if (target) {
          event.preventDefault();
          target.focus();
        }
      };

      container.addEventListener("keydown", onKeyDown);
      return () => container.removeEventListener("keydown", onKeyDown);
    }, [trapped]);

    return (
      <div ref={mergeRefs(ref, innerRef)} tabIndex={tabIndex ?? -1} {...rest}>
        {children}
      </div>
    );
  },
);

FocusScope.displayName = "FocusScope";
