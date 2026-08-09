import { SpinnerIcon } from "@utk09/finra-ui-icons/react";
import { clsx } from "clsx";
import { forwardRef, type ReactNode } from "react";

import { componentIds, FINRA_UI_ATTR } from "../../componentIds";
import { SpinnerBase, type SpinnerBaseProps } from "../../unstyled/Spinner/Spinner";
import styles from "./Spinner.module.scss";

/**
 * Props for the styled activity indicator.
 *
 * @remarks
 * Takes no size and no colour. It sizes from `--finra-density-icon-size` and
 * inherits `currentColor`, so it follows the density and the text colour of
 * whatever it sits in. To size one instance differently, write a rule against
 * `[data-finra-ui="spinner"]`.
 *
 * @example
 * ```tsx
 * <Spinner label="Loading positions" />
 * ```
 */
export interface SpinnerProps extends Omit<SpinnerBaseProps, "renderIndicator" | "children"> {
  /**
   * Replace the default glyph. Pass `null` to render none, which leaves the
   * label as the visible content.
   */
  icon?: ReactNode | null;
}

/**
 * An indeterminate activity indicator.
 *
 * @see {@link SpinnerProps}
 */
export const Spinner = forwardRef<HTMLSpanElement, SpinnerProps>(
  ({ className, icon, ...rest }, ref) => (
    <SpinnerBase
      ref={ref}
      className={clsx(styles.spinner, className)}
      renderIndicator={() =>
        icon === undefined ? (
          <SpinnerIcon
            {...{ [FINRA_UI_ATTR]: componentIds.spinnerGlyph }}
            className={styles.glyph}
            aria-hidden="true"
          />
        ) : (
          icon
        )
      }
      {...rest}
    />
  ),
);

Spinner.displayName = "Spinner";
