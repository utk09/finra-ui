import { forwardRef, type HTMLAttributes } from "react";

import { componentIds, FINRA_UI_ATTR } from "../../componentIds";
import { progressState } from "../../logic/progress";

/** CSS class overrides injected by the styled layer. */
export interface ProgressClassNames {
  /** The groove the fill travels along. */
  track?: string;
  /** The filled portion. */
  fill?: string;
  /** The visible percentage, when `showLabel` is set. */
  label?: string;
}

/**
 * Props for the unstyled progress bar.
 *
 * @remarks
 * Determinate by default and indeterminate when `value` is omitted, which is
 * the correct state for work whose total is not yet known. An indeterminate bar
 * carries no `aria-valuenow` at all rather than a stand-in number.
 *
 * The fill's inline size is set here because it is data, not decoration: it
 * comes from `value` and cannot be expressed in a stylesheet the caller writes.
 */
export interface ProgressBaseProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /** Current progress. Omit for an indeterminate bar. */
  value?: number;
  /**
   * @defaultValue `100`
   */
  max?: number;
  /**
   * Accessible name. Required: a progressbar with no name fails axe, and
   * "67%" on its own tells a screen-reader user nothing about what is loading.
   */
  label: string;
  /**
   * Render the percentage beside the bar. Nothing is rendered while
   * indeterminate, because there is no percentage to show.
   *
   * @defaultValue `false`
   */
  showLabel?: boolean;
  /** Format the visible label. Defaults to a whole percentage. */
  formatLabel?: (percent: number, value: number, max: number) => string;
  /** CSS class overrides injected by the styled layer. */
  classNames?: ProgressClassNames;
}

function defaultFormatLabel(percent: number): string {
  return `${Math.round(percent)}%`;
}

/**
 * Unstyled progress bar. Determinate, or indeterminate with no `value`.
 *
 * @see {@link ProgressBaseProps}
 */
export const ProgressBase = forwardRef<HTMLDivElement, ProgressBaseProps>(
  (
    {
      value,
      max = 100,
      label,
      showLabel = false,
      formatLabel = defaultFormatLabel,
      classNames: cn,
      ...props
    },
    ref,
  ) => {
    const { percent, valueNow, indeterminate } = progressState(value, max);

    return (
      <div
        ref={ref}
        {...{ [FINRA_UI_ATTR]: componentIds.progress }}
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        {...(valueNow === null ? {} : { "aria-valuenow": valueNow })}
        data-indeterminate={indeterminate || undefined}
        {...props}>
        <div {...{ [FINRA_UI_ATTR]: componentIds.progressTrack }} className={cn?.track}>
          <div
            {...{ [FINRA_UI_ATTR]: componentIds.progressFill }}
            className={cn?.fill}
            style={percent === null ? undefined : { inlineSize: `${percent}%` }}
          />
        </div>
        {showLabel && percent !== null ? (
          <span {...{ [FINRA_UI_ATTR]: componentIds.progressLabel }} className={cn?.label}>
            {formatLabel(percent, valueNow ?? 0, max)}
          </span>
        ) : null}
      </div>
    );
  },
);

ProgressBase.displayName = "ProgressBase";
