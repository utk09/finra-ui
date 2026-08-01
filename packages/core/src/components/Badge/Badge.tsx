import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";
import { forwardRef, type HTMLAttributes, type ReactNode } from "react";

import type { Sentiment } from "../../types/variants";
import { componentIds, FINRA_UI_ATTR } from "../componentIds";
import styles from "./Badge.module.scss";

/**
 * Colour meaning for a badge.
 *
 * @remarks
 * Orthogonal to `variant`, which sets emphasis. Leave it unset for a neutral
 * badge - a count or a tag that carries no status of its own.
 */
export type BadgeSentiment = Sentiment;

const sentimentClasses: Record<BadgeSentiment, string> = {
  danger: styles.sentimentDanger,
  success: styles.sentimentSuccess,
  warning: styles.sentimentWarning,
  info: styles.sentimentInfo,
};

const badgeVariants = cva(styles.badge, {
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
 * Props for the Badge - a small inline status or count.
 *
 * @remarks
 * Renders a `<span>` with no role, so it is read as plain text in context.
 * Colour alone must never be the only carrier of meaning: put the meaning in
 * the text ("Restricted", not a bare red dot).
 *
 * @example
 * ```tsx
 * <Badge sentiment="danger" variant="secondary">Restricted</Badge>
 * ```
 */
export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /** Colour meaning. Omit for a neutral badge. */
  sentiment?: BadgeSentiment;
  /** Badge text. Keep it short - this is a label, not a container. */
  children: ReactNode;
}

/**
 * A small inline status or count.
 *
 * @see {@link BadgeProps}
 */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, sentiment, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        {...{ [FINRA_UI_ATTR]: componentIds.badge }}
        className={clsx(
          badgeVariants({ variant }),
          sentiment && sentimentClasses[sentiment],
          className,
        )}
        {...props}>
        {children}
      </span>
    );
  },
);

Badge.displayName = "Badge";
