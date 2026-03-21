import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";
import { forwardRef, type HTMLAttributes, type ReactNode } from "react";

import type { Sentiment } from "../../types/variants";
import { componentIds, FINRA_UI_ATTR } from "../componentIds";
import styles from "./Badge.module.scss";

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

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {
  sentiment?: BadgeSentiment;
  children: ReactNode;
}

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
