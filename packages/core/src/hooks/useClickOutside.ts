import { type RefObject, useEffect } from "react";

/**
 * Calls `onClickOutside` when a pointer goes down outside the referenced
 * element. Automatically subscribes/unsubscribes based on the `enabled` flag.
 *
 * Listens for `pointerdown` rather than `mousedown`: `pointerdown` covers mouse,
 * touch and pen across the supported browser floor, whereas `mousedown` is
 * synthesised unreliably on iOS Safari, so touch dismissal silently fails there.
 * {@link DismissableLayer} uses the same event for the same reason.
 */
export function useClickOutside(
  ref: RefObject<HTMLElement | null>,
  onClickOutside: () => void,
  enabled: boolean,
): void {
  useEffect(() => {
    if (!enabled) return;

    const handler = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClickOutside();
      }
    };

    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [ref, onClickOutside, enabled]);
}
