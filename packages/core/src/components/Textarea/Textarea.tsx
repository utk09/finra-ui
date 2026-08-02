import { cva } from "class-variance-authority";
import { clsx } from "clsx";
import {
  type ChangeEvent,
  forwardRef,
  type TextareaHTMLAttributes,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { componentIds, FINRA_UI_ATTR } from "../../componentIds";
import { useFormField } from "../../hooks/useFormField";
import type { Variant } from "../../types/variants";
import type { ValidationStatus } from "../Input/Input";
import styles from "./Textarea.module.scss";

const textareaVariants = cva(styles.wrapper, {
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
 * Props for the styled Textarea.
 *
 * @remarks
 * `size` is deliberately omitted - sizing comes from the density system
 * (`data-density` on any ancestor), and the field's height from `minRows` /
 * `maxRows`.
 *
 * @example
 * ```tsx
 * <Textarea autoResize minRows={3} maxRows={10} maxLength={500} showCharCount />
 * ```
 */
export interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "size"> {
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
   * Show a "used / limit" counter below the field.
   *
   * @remarks
   * Needs `maxLength` to render a limit. The counter is a live region, so it is
   * announced as it changes rather than only on blur.
   */
  showCharCount?: boolean;
  /**
   * Fraction of `maxLength` at which the counter turns warning-coloured, as
   * `0`-`1`.
   *
   * @remarks
   * Colour is not the only signal - the counter's text carries the numbers
   * regardless.
   *
   * @defaultValue `0.9`
   */
  warningThreshold?: number;
  /** Grow the field with its content, between `minRows` and `maxRows`. */
  autoResize?: boolean;
  /** Smallest height in rows, and the initial height when `autoResize` is on. */
  minRows?: number;
  /** Largest height in rows before the field starts scrolling instead of growing. */
  maxRows?: number;
  /** Stretch to fill the container's inline size. */
  fullWidth?: boolean;
}

/**
 * A multi-line text field with optional auto-resize and character count.
 *
 * @see {@link TextareaProps}
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      variant,
      validationStatus,
      showCharCount,
      warningThreshold,
      autoResize,
      minRows = 3,
      maxRows,
      fullWidth,
      maxLength,
      disabled,
      readOnly,
      value,
      defaultValue,
      onChange,
      ...props
    },
    ref,
  ) => {
    const internalRef = useRef<HTMLTextAreaElement>(null);
    const textareaRef = (ref as React.RefObject<HTMLTextAreaElement>) || internalRef;

    // Wire into an enclosing FormField (works at any depth; no-op standalone).
    const fieldProps = useFormField({ ...props, disabled });
    const isDisabled = fieldProps.disabled;

    const [charCount, setCharCount] = useState(() => {
      const initial = (value ?? defaultValue ?? "") as string;
      return initial.length;
    });

    // Sync charCount when controlled value changes
    useEffect(() => {
      if (value !== undefined) {
        setCharCount((value as string).length);
      }
    }, [value]);

    const adjustHeight = useCallback(() => {
      const textarea = textareaRef.current;
      if (!textarea || !autoResize) return;

      textarea.style.height = "auto";
      const lineHeight = parseFloat(getComputedStyle(textarea).lineHeight);
      const minHeight = lineHeight * minRows;
      const maxHeight = maxRows ? lineHeight * maxRows : Infinity;
      const scrollHeight = textarea.scrollHeight;

      textarea.style.height = `${Math.min(Math.max(scrollHeight, minHeight), maxHeight)}px`;
      textarea.style.overflowY = scrollHeight > maxHeight ? "auto" : "hidden";
    }, [autoResize, minRows, maxRows, textareaRef]);

    // `value` is a re-run trigger, not something adjustHeight reads. Drop it and
    // a controlled textarea stops resizing when its value changes from outside.
    // biome-ignore lint/correctness/useExhaustiveDependencies: re-run trigger, see above
    useEffect(() => {
      adjustHeight();
    }, [value, adjustHeight]);

    const handleChange = useCallback(
      (e: ChangeEvent<HTMLTextAreaElement>) => {
        setCharCount(e.target.value.length);
        adjustHeight();
        onChange?.(e);
      },
      [onChange, adjustHeight],
    );

    const isOverWarning =
      warningThreshold !== undefined && maxLength !== undefined && charCount >= warningThreshold;
    const isAtLimit = maxLength !== undefined && charCount >= maxLength;

    const countStatus: ValidationStatus | undefined = isAtLimit
      ? "error"
      : isOverWarning
        ? "warning"
        : undefined;

    const effectiveValidation = validationStatus ?? countStatus;

    return (
      <div
        {...{ [FINRA_UI_ATTR]: componentIds.textarea }}
        className={clsx(
          textareaVariants({ variant }),
          effectiveValidation && validationClasses[effectiveValidation],
          isDisabled && styles.disabled,
          fullWidth && styles.fullWidth,
          className,
        )}>
        <textarea
          ref={textareaRef}
          {...{ [FINRA_UI_ATTR]: componentIds.textareaField }}
          className={styles.field}
          rows={minRows}
          maxLength={maxLength}
          readOnly={readOnly}
          value={value}
          defaultValue={defaultValue}
          onChange={handleChange}
          {...fieldProps}
        />
        {showCharCount && maxLength !== undefined ? (
          <span
            {...{ [FINRA_UI_ATTR]: componentIds.textareaCount }}
            className={clsx(
              styles.charCount,
              countStatus === "warning" && styles.charCountWarning,
              countStatus === "error" && styles.charCountError,
            )}>
            {charCount}/{maxLength}
          </span>
        ) : null}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";
