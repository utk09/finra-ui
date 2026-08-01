import { CloseIcon } from "@utk09/finra-ui-icons/react";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";
import {
  forwardRef,
  type InputHTMLAttributes,
  type MouseEvent,
  type ReactNode,
  useCallback,
  useRef,
} from "react";

import { useFormField } from "../../hooks/useFormField";
import type { ValidationStatus as _ValidationStatus } from "../../types/variants";
import { componentIds, FINRA_UI_ATTR } from "../componentIds";
import styles from "./Input.module.scss";

/**
 * Validation state shared by every form control in the library.
 *
 * @remarks
 * Only `"error"` changes ARIA - it sets `aria-invalid` on the control. The
 * others are visual, so a field can read as warning or success without being
 * announced as invalid.
 */
export type ValidationStatus = _ValidationStatus;

const inputVariants = cva(styles.wrapper, {
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
 * Props for the styled Input.
 *
 * @remarks
 * `size` is deliberately omitted from the underlying input attributes - sizing
 * comes from the density system (`data-density` on any ancestor), never from a
 * per-component prop.
 *
 * Wrap in a `FormField` for a label, helper text and error wiring; the field
 * injects the ARIA attributes automatically.
 *
 * @example
 * ```tsx
 * <Input clearable placeholder="Search" startAdornment={<SearchIcon />} />
 * ```
 */
export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {
  /** Validation state. `"error"` also sets `aria-invalid`. */
  validationStatus?: ValidationStatus;
  /** Decorative element before the text, inside the border. Not focusable. */
  startAdornment?: ReactNode;
  /** Decorative element after the text, inside the border. Not focusable. */
  endAdornment?: ReactNode;
  /**
   * Show a clear button once the field has a value.
   *
   * @remarks
   * Hidden when the field is empty, disabled or read-only, so it is never a
   * dead control.
   */
  clearable?: boolean;
  /**
   * Called instead of the built-in clear.
   *
   * @remarks
   * Without it the component clears the DOM value itself and dispatches a
   * native `input` event, so an uncontrolled field and its form both see the
   * change. Supply this for a controlled field, and reset your own state.
   */
  onClear?: () => void;
  /** Stretch to fill the container's inline size. */
  fullWidth?: boolean;
}

/**
 * A single-line text field with optional adornments and a clear button.
 *
 * @see {@link InputProps}
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      variant,
      validationStatus,
      startAdornment,
      endAdornment,
      clearable,
      onClear,
      fullWidth,
      disabled,
      readOnly,
      value,
      defaultValue,
      onChange,
      ...props
    },
    ref,
  ) => {
    const internalRef = useRef<HTMLInputElement>(null);
    const inputRef = (ref as React.RefObject<HTMLInputElement>) || internalRef;

    // Wire into an enclosing FormField (id, aria-describedby, aria-invalid,
    // aria-required, disabled). Works at any depth; no-op when standalone.
    const fieldProps = useFormField({ ...props, disabled });
    const isDisabled = fieldProps.disabled;

    const handleClear = useCallback(
      (e: MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        if (onClear) {
          onClear();
        } else if (inputRef.current) {
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            HTMLInputElement.prototype,
            "value",
          )?.set;
          nativeInputValueSetter?.call(inputRef.current, "");
          inputRef.current.dispatchEvent(new Event("input", { bubbles: true }));
        }
        inputRef.current?.focus();
      },
      [onClear, inputRef],
    );

    const showClear = clearable && !isDisabled && !readOnly && (value ?? defaultValue ?? "") !== "";

    return (
      <div
        {...{ [FINRA_UI_ATTR]: componentIds.input }}
        className={clsx(
          inputVariants({ variant }),
          validationStatus && validationClasses[validationStatus],
          isDisabled && styles.disabled,
          fullWidth && styles.fullWidth,
          className,
        )}>
        {startAdornment ? <span className={styles.adornment}>{startAdornment}</span> : null}
        <input
          ref={inputRef}
          {...{ [FINRA_UI_ATTR]: componentIds.inputField }}
          className={styles.field}
          readOnly={readOnly}
          value={value}
          defaultValue={defaultValue}
          onChange={onChange}
          {...fieldProps}
        />
        {showClear ? (
          <button
            type="button"
            className={styles.clearButton}
            onClick={handleClear}
            aria-label="Clear input"
            tabIndex={-1}>
            <CloseIcon />
          </button>
        ) : null}
        {endAdornment ? <span className={styles.adornment}>{endAdornment}</span> : null}
      </div>
    );
  },
);

Input.displayName = "Input";
