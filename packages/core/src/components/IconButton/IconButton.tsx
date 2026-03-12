import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";
import { forwardRef } from "react";

import { IconButtonBase, type IconButtonBaseProps } from "../../unstyled/IconButton/IconButton";
import { componentIds, FINRA_UI_ATTR } from "../componentIds";
import styles from "./IconButton.module.scss";

export type IconButtonSentiment = "danger" | "success" | "warning" | "info";

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

export interface IconButtonProps
  extends IconButtonBaseProps, VariantProps<typeof iconButtonVariants> {
  sentiment?: IconButtonSentiment;
}

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
