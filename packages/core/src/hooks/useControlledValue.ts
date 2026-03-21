import { useCallback, useEffect, useState } from "react";

/**
 * Manages the controlled/uncontrolled value pattern.
 *
 * When `controlledValue` is not `undefined`, the component is controlled:
 *   - `setValue` only fires `onChange`, the parent owns the state.
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

  // Sync controlled value → internal (keeps internal in sync for transitions)
  useEffect(() => {
    if (isControlled) {
      setInternalValue(controlledValue);
    }
  }, [isControlled, controlledValue]);

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
