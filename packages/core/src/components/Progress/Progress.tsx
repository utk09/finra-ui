import { clsx } from "clsx";
import { forwardRef } from "react";

import type { Sentiment } from "../../types/variants";
import { ProgressBase, type ProgressBaseProps } from "../../unstyled/Progress/Progress";
import styles from "./Progress.module.scss";

/**
 * Colour meaning for a progress bar.
 *
 * @remarks
 * Never the sole carrier of the meaning: a red bar says nothing on its own, so
 * the surrounding copy has to say what went wrong.
 */
export type ProgressSentiment = Sentiment;

const sentimentClasses: Record<ProgressSentiment, string> = {
  danger: styles.sentimentDanger,
  success: styles.sentimentSuccess,
  warning: styles.sentimentWarning,
  info: styles.sentimentInfo,
};

/**
 * Props for the styled progress bar.
 *
 * @remarks
 * Adds only colour to the base. Height and width are layout decisions the
 * consumer makes in CSS against `[data-finra-ui="progress-track"]`.
 *
 * @example
 * ```tsx
 * <Progress value={42} label="Uploading trades" showLabel />
 * ```
 */
export interface ProgressProps extends Omit<ProgressBaseProps, "classNames"> {
  /** Colour meaning. Omit for the default neutral track and accent fill. */
  sentiment?: ProgressSentiment;
}

/**
 * A determinate or indeterminate progress bar.
 *
 * @see {@link ProgressProps}
 */
export const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, sentiment, ...rest }, ref) => (
    <ProgressBase
      ref={ref}
      className={clsx(styles.progress, sentiment && sentimentClasses[sentiment], className)}
      classNames={{ track: styles.track, fill: styles.fill, label: styles.label }}
      {...rest}
    />
  ),
);

Progress.displayName = "Progress";
