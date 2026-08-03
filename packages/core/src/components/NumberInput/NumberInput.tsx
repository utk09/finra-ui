import { MinusIcon, PlusIcon } from "@utk09/finra-ui-icons/react";
import { cva } from "class-variance-authority";
import { clsx } from "clsx";
import {
  type ChangeEvent,
  forwardRef,
  type InputHTMLAttributes,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { componentIds, FINRA_UI_ATTR } from "../../componentIds";
import { useFormField } from "../../hooks/useFormField";
import type { Variant } from "../../types/variants";
import { NumberInputBase } from "../../unstyled/NumberInput/NumberInput";
import type { ValidationStatus } from "../Input/Input";
import styles from "./NumberInput.module.scss";

const numberInputVariants = cva(styles.wrapper, {
  variants: {
    variant: {
      primary: styles.variantPrimary,
      secondary: styles.variantSecondary,
      tertiary: styles.variantTertiary,
    },
  },
  defaultVariants: {
    variant: "primary",
  },
});

const validationClasses: Record<ValidationStatus, string> = {
  error: styles.statusError,
  warning: styles.statusWarning,
  success: styles.statusSuccess,
};

/**
 * Props for the styled NumberInput - a spinbutton with increment and decrement
 * controls.
 *
 * @remarks
 * Partial input is allowed while typing: `"-"` and `"."` are held without
 * reporting, so a negative or decimal number can be entered a character at a
 * time. Bounds and precision apply on commit, never mid-keystroke.
 *
 * `size`, `min`, `max` and `step` are re-declared as numbers rather than the
 * DOM's strings, so they are usable without conversion.
 *
 * @example
 * ```tsx
 * <NumberInput aria-label="Quantity" min={0} max={100} step={5} precision={0} />
 * ```
 */
export interface NumberInputProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "type" | "size" | "onChange" | "value" | "defaultValue" | "min" | "max" | "step"
  > {
  /**
   * Visual emphasis of the field chrome.
   *
   * @remarks
   * Changes the weight of the border and background only. It does not signal
   * validity - that is `validationStatus`, which is orthogonal and takes over
   * the border colour when set.
   *
   * @defaultValue "primary"
   */
  variant?: Variant;
  /** Validation state. `"error"` also sets `aria-invalid`. */
  validationStatus?: ValidationStatus;
  /**
   * Controlled value. Use `""` for "deliberately empty".
   *
   * @remarks
   * Controlled means controlled: typing, stepping and blurring all report
   * through `onChange` without the field redrawing itself, so a parent that
   * ignores the callback keeps its value.
   */
  value?: number | "";
  /** Initial value when uncontrolled. Ignored if `value` is set. */
  defaultValue?: number;
  /** Lower bound. Applied on blur and on stepping, not while typing. */
  min?: number;
  /** Upper bound. Applied on blur and on stepping, not while typing. */
  max?: number;
  /**
   * Amount added or removed per step.
   *
   * @defaultValue `1`
   */
  step?: number;
  /** Decimal places to format to on commit. Omit to leave the typed precision alone. */
  precision?: number;
  /**
   * Fired on commit - typing a valid number, stepping, or blurring.
   *
   * @remarks
   * Reports `undefined`, not `NaN` or `0`, when the field is emptied, so
   * "no value" is distinguishable from "zero".
   */
  onChange?: (value: number | undefined) => void;
  /** Stretch to fill the container's inline size. */
  fullWidth?: boolean;
}

function clampValue(val: number, min?: number, max?: number): number {
  let result = val;
  if (min !== undefined) result = Math.max(result, min);
  if (max !== undefined) result = Math.min(result, max);
  return result;
}

function formatValue(val: number, precision?: number): string {
  if (precision !== undefined) return val.toFixed(precision);
  return String(val);
}

/**
 * A spinbutton with increment and decrement controls.
 *
 * @see {@link NumberInputProps}
 */
export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      className,
      variant,
      validationStatus,
      value: controlledValue,
      defaultValue,
      min,
      max,
      step = 1,
      precision,
      onChange,
      fullWidth,
      disabled,
      readOnly,
      ...props
    },
    ref,
  ) => {
    const internalRef = useRef<HTMLInputElement>(null);
    const inputRef = (ref as React.RefObject<HTMLInputElement>) || internalRef;

    // Wire into an enclosing FormField (works at any depth; no-op standalone).
    const fieldProps = useFormField({ ...props, disabled });
    const isDisabled = fieldProps.disabled;

    const isControlled = controlledValue !== undefined;
    const [internalValue, setInternalValue] = useState<string>(() =>
      defaultValue !== undefined ? formatValue(defaultValue, precision) : "",
    );

    const displayValue = isControlled
      ? controlledValue === ""
        ? ""
        : formatValue(controlledValue as number, precision)
      : internalValue;

    // Sync display when controlled value changes
    useEffect(() => {
      if (isControlled && controlledValue !== "") {
        setInternalValue(formatValue(controlledValue as number, precision));
      }
    }, [controlledValue, precision, isControlled]);

    const commitValue = useCallback(
      (raw: number) => {
        const clamped = clampValue(raw, min, max);
        const display = formatValue(clamped, precision);
        if (!isControlled) setInternalValue(display);
        onChange?.(clamped);
      },
      [min, max, precision, isControlled, onChange],
    );

    const stepValue = useCallback(
      (direction: 1 | -1) => {
        const current = parseFloat(displayValue as string) || 0;
        commitValue(current + step * direction);
      },
      [displayValue, step, commitValue],
    );

    const handleChange = useCallback(
      (e: ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        // Allow empty, minus sign, or valid partial numbers while typing
        if (raw === "" || raw === "-" || raw === ".") {
          if (!isControlled) setInternalValue(raw);
          if (raw === "") onChange?.(undefined);
          return;
        }
        const num = parseFloat(raw);
        if (!Number.isNaN(num)) {
          if (!isControlled) setInternalValue(raw);
          onChange?.(num);
        }
      },
      [isControlled, onChange],
    );

    const handleBlur = useCallback(() => {
      const num = parseFloat(displayValue as string);
      if (Number.isNaN(num)) {
        if (!isControlled) setInternalValue("");
        onChange?.(undefined);
      } else {
        commitValue(num);
      }
    }, [displayValue, isControlled, onChange, commitValue]);

    const handleKeyDown = useCallback(
      (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "ArrowUp") {
          e.preventDefault();
          stepValue(1);
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          stepValue(-1);
        }
      },
      [stepValue],
    );

    return (
      <div
        {...{ [FINRA_UI_ATTR]: componentIds.numberInput }}
        className={clsx(
          numberInputVariants({ variant }),
          validationStatus && validationClasses[validationStatus],
          isDisabled && styles.disabled,
          fullWidth && styles.fullWidth,
          className,
        )}>
        <button
          type="button"
          {...{ [FINRA_UI_ATTR]: componentIds.numberInputDecrement }}
          className={styles.stepButton}
          onClick={() => stepValue(-1)}
          disabled={
            isDisabled ||
            readOnly ||
            (min !== undefined && (parseFloat(displayValue as string) || 0) <= min)
          }
          aria-label="Decrement"
          tabIndex={-1}>
          <MinusIcon />
        </button>
        {/* The field is `NumberInputBase`, not a bare <input>, so both entry
            points run one implementation. It supplies `inputMode`. `fieldProps`
            is already merged here because the wrapper needs the resolved
            disabled state; the base merges again and `mergeControlA11y` is
            idempotent. */}
        <NumberInputBase
          ref={inputRef}
          className={styles.field}
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          readOnly={readOnly}
          role="spinbutton"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={
            typeof displayValue === "string" ? parseFloat(displayValue) || undefined : displayValue
          }
          {...fieldProps}
        />
        <button
          type="button"
          {...{ [FINRA_UI_ATTR]: componentIds.numberInputIncrement }}
          className={styles.stepButton}
          onClick={() => stepValue(1)}
          disabled={
            isDisabled ||
            readOnly ||
            (max !== undefined && (parseFloat(displayValue as string) || 0) >= max)
          }
          aria-label="Increment"
          tabIndex={-1}>
          <PlusIcon />
        </button>
      </div>
    );
  },
);

NumberInput.displayName = "NumberInput";
