import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";
import { forwardRef, type ReactNode } from "react";

import type { Sentiment } from "../../types/variants";
import { ButtonBase, type ButtonBaseProps } from "../../unstyled/Button/Button";
import { componentIds, FINRA_UI_ATTR } from "../componentIds";
import styles from "./Button.module.scss";

/**
 * Colour meaning for a button.
 *
 * @remarks
 * Orthogonal to `variant`, which sets emphasis. Leave it unset for the neutral
 * default; reach for `"danger"` on destructive actions so the colour reinforces
 * what the label already says.
 */
export type ButtonSentiment = Sentiment;

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

/**
 * Props for the styled Button.
 *
 * @remarks
 * `variant` and `sentiment` are orthogonal, and that separation is deliberate:
 * `variant` sets **emphasis** (primary / secondary / tertiary - how loud), while
 * `sentiment` sets **meaning** (danger / success / warning / info - what
 * colour). A tertiary danger button is a quiet delete; a primary danger button
 * is a loud one. Neither implies the other.
 *
 * There is no `size` prop anywhere in this library - sizing comes from the
 * density system, set with `data-density` on any ancestor.
 *
 * @example
 * ```tsx
 * <Button variant="tertiary" sentiment="danger" startIcon={<TrashIcon />}>
 *   Delete
 * </Button>
 * ```
 */
export interface ButtonProps extends ButtonBaseProps, VariantProps<typeof buttonVariants> {
  /** Colour meaning. Orthogonal to `variant` - it changes hue, not emphasis. */
  sentiment?: ButtonSentiment;
  /**
   * Decorative element before the label.
   *
   * @remarks
   * Marked `aria-hidden`, so it adds nothing to the accessible name. An
   * icon-only button belongs in `IconButton`, which requires a label.
   */
  startIcon?: ReactNode;
  /** Decorative element after the label. Also `aria-hidden`. */
  endIcon?: ReactNode;
}

/**
 * A clickable action. `variant` sets emphasis, `sentiment` sets meaning.
 *
 * @see {@link ButtonProps}
 */
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
