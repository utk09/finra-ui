import { useCallback, useRef, useState } from "react";

// Module-scoped ambient so the dev-only NODE_ENV guard type-checks wherever this
// source is compiled — including consumers that resolve `@utk09/finra-ui` to
// source via tsconfig paths and don't have @types/node. Shadows any global
// `process`; bundlers replace `process.env.NODE_ENV` at build.
declare const process: { env: { NODE_ENV?: string } };

/**
 * Manages the controlled/uncontrolled value pattern.
 *
 * When `controlledValue` is not `undefined`, the component is controlled:
 *   - the returned value is always the prop; `setValue` only fires `onChange`.
 * When `controlledValue` is `undefined`, the component is uncontrolled:
 *   - `setValue` updates internal state AND fires `onChange`.
 *
 * @returns `[value, setValue]` - current value and a setter that respects mode.
 */
export function useControlledValue<T>(
  controlledValue: T | undefined,
  defaultValue: T,
  onChange?: (next: T) => void,
): [T, (next: T) => void] {
  const [internalValue, setInternalValue] = useState<T>(defaultValue);

  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;

  const wasControlled = useRef(isControlled);
  if (process.env.NODE_ENV !== "production" && wasControlled.current !== isControlled) {
    // eslint-disable-next-line no-console -- intentional dev-only warning
    console.error(
      `A component is switching between controlled and uncontrolled. ` +
        `Decide between a controlled value (always pass one) or uncontrolled ` +
        `(pass a default and never change to a value) for the lifetime of the component.`,
    );
    wasControlled.current = isControlled;
  }

  const setValue = useCallback(
    (next: T) => {
      if (!isControlled) {
        setInternalValue(next);
      }
      onChange?.(next);
    },
    [isControlled, onChange],
  );

  return [value, setValue];
}
