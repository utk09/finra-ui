import {
  forwardRef,
  useState,
  useCallback,
  useEffect,
  useRef,
  type TextareaHTMLAttributes,
  type ChangeEvent,
} from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";
import { FINRA_UI_ATTR, componentIds } from "../componentIds";
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

export interface TextareaProps
  extends
    Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "size">,
    VariantProps<typeof textareaVariants> {
  validationStatus?: ValidationStatus;
  showCharCount?: boolean;
  warningThreshold?: number;
  autoResize?: boolean;
  minRows?: number;
  maxRows?: number;
  fullWidth?: boolean;
}

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
          disabled && styles.disabled,
          fullWidth && styles.fullWidth,
          className,
        )}>
        <textarea
          ref={textareaRef}
          {...{ [FINRA_UI_ATTR]: componentIds.textareaField }}
          className={styles.field}
          rows={minRows}
          maxLength={maxLength}
          disabled={disabled}
          readOnly={readOnly}
          value={value}
          defaultValue={defaultValue}
          onChange={handleChange}
          {...props}
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
