import { FINRA_UI_ATTR, type ValidationStatus } from "@utk09/finra-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";
import { forwardRef, useMemo } from "react";

import type {
  AmountInputBaseProps,
  AmountInputClassNames,
  AmountInputHandle,
} from "../../unstyled/AmountInput/AmountInput";
import { AmountInputBase } from "../../unstyled/AmountInput/AmountInput";
import { componentIds } from "../componentIds";
import styles from "./AmountInput.module.scss";

const rootVariants = cva(styles.root, {
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
 * Props for the styled AmountInput - a notional entry field that understands
 * trader shorthand.
 *
 * @remarks
 * Accepts `10m`, `2bn`, `1.5k`, `(2m)` for negative, and plain grouped digits,
 * committing a **scalar number**. Currency is a separate concern: it selects
 * precision and the resting symbol, but never becomes part of the value - so
 * the number your form submits is just a number.
 *
 * The display is tied to the committed value, not the keystrokes: the field
 * shows editable digits while focused and the formatted amount at rest.
 *
 * @example
 * ```tsx
 * <AmountInput aria-label="Notional" currency="USD" step={1_000_000}
 *   onChange={(value) => setNotional(value)} />
 * // typing "10m" then blurring reports 10000000 and rests as "$10M"
 * ```
 */
export interface AmountInputProps
  extends
    Omit<AmountInputBaseProps, "classNames" | "dataAttributes">,
    VariantProps<typeof rootVariants> {
  /** Visual validation status. */
  validationStatus?: ValidationStatus;
  /** Stretch to fill the container width. */
  fullWidth?: boolean;
  /** Additional CSS class for the root wrapper. */
  className?: string;
}

const dataAttributes = { [FINRA_UI_ATTR]: componentIds.amountInput } as const;

/**
 * A notional field that understands trader shorthand (`10m`, `2bn`).
 *
 * @see {@link AmountInputProps}
 */
export const AmountInput = forwardRef<AmountInputHandle, AmountInputProps>(
  ({ className, variant, validationStatus, fullWidth, disabled, ...props }, ref) => {
    const classNames = useMemo<AmountInputClassNames>(
      () => ({
        root: clsx(
          rootVariants({ variant }),
          fullWidth && styles.fullWidth,
          disabled && styles.disabled,
          validationStatus && validationClasses[validationStatus],
          className,
        ),
        input: styles.input,
      }),
      [className, variant, validationStatus, fullWidth, disabled],
    );

    return (
      <AmountInputBase
        ref={ref}
        disabled={disabled}
        classNames={classNames}
        dataAttributes={dataAttributes}
        {...props}
      />
    );
  },
);

AmountInput.displayName = "AmountInput";
