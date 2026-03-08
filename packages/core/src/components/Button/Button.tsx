import { forwardRef, type ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";
import { ButtonBase, type ButtonBaseProps } from "../../unstyled/Button/Button";
import { FINRA_UI_ATTR, componentIds } from "../componentIds";
import styles from "./Button.module.scss";

export type ButtonSentiment = "danger" | "success" | "warning" | "info";

const sentimentClasses: Record<ButtonSentiment, string> = {
  danger: styles.sentimentDanger,
  success: styles.sentimentSuccess,
  warning: styles.sentimentWarning,
  info: styles.sentimentInfo,
};

const buttonVariants = cva(styles.button, {
  variants: {
    variant: {
      primary: styles.variantPrimary,
      secondary: styles.variantSecondary,
      tertiary: styles.variantTertiary,
    },
    fullWidth: {
      true: styles.fullWidth,
    },
  },
  defaultVariants: {
    variant: "primary",
  },
});

export interface ButtonProps extends ButtonBaseProps, VariantProps<typeof buttonVariants> {
  sentiment?: ButtonSentiment;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, fullWidth, sentiment, startIcon, endIcon, children, ...props }, ref) => {
    return (
      <ButtonBase
        ref={ref}
        type="button"
        {...{ [FINRA_UI_ATTR]: componentIds.button }}
        className={clsx(
          buttonVariants({ variant, fullWidth }),
          sentiment && sentimentClasses[sentiment],
          className,
        )}
        {...props}>
        {startIcon ? <span className={styles.icon}>{startIcon}</span> : null}
        {children}
        {endIcon ? <span className={styles.icon}>{endIcon}</span> : null}
      </ButtonBase>
    );
  },
);

Button.displayName = "Button";
