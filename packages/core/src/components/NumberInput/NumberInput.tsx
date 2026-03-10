import {
  forwardRef,
  useState,
  useCallback,
  useRef,
  useEffect,
  type KeyboardEvent,
  type ChangeEvent,
  type InputHTMLAttributes,
} from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";
import { MinusIcon, PlusIcon } from "../../assets/icons";
import { FINRA_UI_ATTR, componentIds } from "../componentIds";
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

export interface NumberInputProps
  extends
    Omit<
      InputHTMLAttributes<HTMLInputElement>,
      "type" | "size" | "onChange" | "value" | "defaultValue" | "min" | "max" | "step"
    >,
    VariantProps<typeof numberInputVariants> {
  validationStatus?: ValidationStatus;
  value?: number | "";
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
  onChange?: (value: number | undefined) => void;
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
        if (!isNaN(num)) {
          if (!isControlled) setInternalValue(raw);
          onChange?.(num);
        }
      },
      [isControlled, onChange],
    );

    const handleBlur = useCallback(() => {
      const num = parseFloat(displayValue as string);
      if (isNaN(num)) {
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
          disabled && styles.disabled,
          fullWidth && styles.fullWidth,
          className,
        )}>
        <button
          type="button"
          {...{ [FINRA_UI_ATTR]: componentIds.numberInputDecrement }}
          className={styles.stepButton}
          onClick={() => stepValue(-1)}
          disabled={
            disabled ||
            readOnly ||
            (min !== undefined && (parseFloat(displayValue as string) || 0) <= min)
          }
          aria-label="Decrement"
          tabIndex={-1}>
          <MinusIcon />
        </button>
        <input
          ref={inputRef}
          {...{ [FINRA_UI_ATTR]: componentIds.numberInputField }}
          className={styles.field}
          inputMode="decimal"
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          readOnly={readOnly}
          role="spinbutton"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={
            typeof displayValue === "string" ? parseFloat(displayValue) || undefined : displayValue
          }
          {...props}
        />
        <button
          type="button"
          {...{ [FINRA_UI_ATTR]: componentIds.numberInputIncrement }}
          className={styles.stepButton}
          onClick={() => stepValue(1)}
          disabled={
            disabled ||
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
