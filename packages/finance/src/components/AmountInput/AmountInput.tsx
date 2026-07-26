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
