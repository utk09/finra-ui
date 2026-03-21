import { type RefObject, useEffect } from "react";

/**
 * Calls `onClickOutside` when a mousedown event occurs outside the referenced element.
 * Automatically subscribes/unsubscribes based on the `enabled` flag.
 */
export function useClickOutside(
  ref: RefObject<HTMLElement | null>,
  onClickOutside: () => void,
  enabled: boolean,
): void {
  useEffect(() => {
    if (!enabled) return;

    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClickOutside();
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, onClickOutside, enabled]);
}
