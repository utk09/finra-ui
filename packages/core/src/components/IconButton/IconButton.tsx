import { cva } from "class-variance-authority";
import { clsx } from "clsx";
import { forwardRef } from "react";

import { componentIds, FINRA_UI_ATTR } from "../../componentIds";
import type { Sentiment, Variant } from "../../types/variants";
import { IconButtonBase, type IconButtonBaseProps } from "../../unstyled/IconButton/IconButton";
import styles from "./IconButton.module.scss";

/**
 * Colour meaning for an icon button.
 *
 * @remarks
 * Orthogonal to `variant`, which sets emphasis - a tertiary danger icon button
 * is a quiet destructive action.
 */
export type IconButtonSentiment = Sentiment;

const sentimentClasses: Record<IconButtonSentiment, string> = {
  danger: styles.sentimentDanger,
  success: styles.sentimentSuccess,
  warning: styles.sentimentWarning,
  info: styles.sentimentInfo,
};

const iconButtonVariants = cva(styles.iconButton, {
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

/**
 * Props for the styled icon-only button.
 *
 * @remarks
 * `aria-label` is required by the base type. An icon-only control has no text
 * to name it, so the compiler enforces one rather than leaving it to review.
 * Describe the action ("Close"), not the glyph ("X").
 *
 * @example
 * ```tsx
 * <IconButton icon={<TrashIcon />} aria-label="Delete order" sentiment="danger" />
 * ```
 */
export interface IconButtonProps extends IconButtonBaseProps {
  /**
   * Visual emphasis - how loud the button is.
   *
   * @remarks
   * Orthogonal to `sentiment`, which changes hue rather than emphasis. Icon
   * buttons in a toolbar usually want `tertiary` so the icons carry the weight.
   *
   * @defaultValue "primary"
   */
  variant?: Variant;
  /** Colour meaning. Orthogonal to `variant`. */
  sentiment?: IconButtonSentiment;
}

/**
 * An icon-only button. Requires an `aria-label`.
 *
 * @see {@link IconButtonProps}
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant, sentiment, ...props }, ref) => {
    return (
      <IconButtonBase
        ref={ref}
        type="button"
        {...{ [FINRA_UI_ATTR]: componentIds.iconButton }}
        className={clsx(
          iconButtonVariants({ variant }),
          sentiment && sentimentClasses[sentiment],
          className,
        )}
        {...props}
      />
    );
  },
);

IconButton.displayName = "IconButton";
