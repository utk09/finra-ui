import type { Ref, RefObject } from "react";

/**
 * Combine several refs into one callback ref.
 *
 * @remarks
 * A node can only carry one `ref`, but a component often needs both its own
 * internal ref and a forwarded one. This assigns to every ref given, handling
 * callback refs and object refs alike, and skipping `undefined` so optional
 * refs need no guarding at the call site.
 *
 * @typeParam T - The element type being referenced.
 * @param refs - Refs to populate, in order. Undefined entries are ignored.
 * @returns A callback ref to attach to the node.
 *
 * @example
 * ```tsx
 * const inner = useRef<HTMLInputElement>(null);
 * <input ref={mergeRefs(forwardedRef, inner)} />
 * ```
 */
export function mergeRefs<T>(...refs: (Ref<T> | undefined)[]): (value: T | null) => void {
  return (value: T | null) => {
    for (const ref of refs) {
      if (typeof ref === "function") {
        ref(value);
      } else if (ref) {
        (ref as RefObject<T | null>).current = value;
      }
    }
  };
}
