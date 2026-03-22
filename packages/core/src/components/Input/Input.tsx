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

import type { ValidationStatus as _ValidationStatus } from "../../types/variants";
import { componentIds, FINRA_UI_ATTR } from "../componentIds";
import styles from "./Input.module.scss";

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

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size">, VariantProps<typeof inputVariants> {
  validationStatus?: ValidationStatus;
  startAdornment?: ReactNode;
  endAdornment?: ReactNode;
  clearable?: boolean;
  onClear?: () => void;
  fullWidth?: boolean;
}

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

    const showClear = clearable && !disabled && !readOnly && (value ?? defaultValue ?? "") !== "";

    return (
      <div
        {...{ [FINRA_UI_ATTR]: componentIds.input }}
        className={clsx(
          inputVariants({ variant }),
          validationStatus && validationClasses[validationStatus],
          disabled && styles.disabled,
          fullWidth && styles.fullWidth,
          className,
        )}>
        {startAdornment ? <span className={styles.adornment}>{startAdornment}</span> : null}
        <input
          ref={inputRef}
          {...{ [FINRA_UI_ATTR]: componentIds.inputField }}
          className={styles.field}
          disabled={disabled}
          readOnly={readOnly}
          value={value}
          defaultValue={defaultValue}
          onChange={onChange}
          {...props}
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
