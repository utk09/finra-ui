import { forwardRef, type HTMLAttributes, type ReactNode, useEffect, useRef } from "react";

import { getTabbables, resolveTabStop } from "../../logic/focus";
import { mergeRefs } from "../../utils/mergeRefs";

export interface FocusScopeProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  /** Trap Tab / Shift+Tab focus within the scope. Default true. */
  trapped?: boolean;
  /** Move focus into the scope (first tabbable, else the container) on mount. Default true. */
  focusOnMount?: boolean;
  /** Restore focus to the previously focused element on unmount. Default true. */
  restoreFocus?: boolean;
}

/**
 * Keeps keyboard focus inside its content while mounted - the focus half of an
 * accessible overlay (Dialog, Popover). Pairs with `DismissableLayer` and
 * `Portal`. The tabbable scan and wrap logic live in `logic/focus`.
 */
export const FocusScope = forwardRef<HTMLDivElement, FocusScopeProps>(
  (
    { children, trapped = true, focusOnMount = true, restoreFocus = true, tabIndex, ...rest },
    ref,
  ) => {
    const innerRef = useRef<HTMLDivElement>(null);

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
        if (restoreFocus && previouslyFocused && typeof previouslyFocused.focus === "function") {
          previouslyFocused.focus();
        }
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
