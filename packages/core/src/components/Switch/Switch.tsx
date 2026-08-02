import { clsx } from "clsx";
import { forwardRef } from "react";

import { componentIds, FINRA_UI_ATTR } from "../../componentIds";
import { SwitchBase, type SwitchBaseProps } from "../../unstyled/Switch/Switch";
import styles from "./Switch.module.scss";

/**
 * Props for the styled Switch.
 *
 * @remarks
 * A switch takes effect immediately. Use Checkbox instead when the change only
 * applies once a form is submitted - the two look similar but promise
 * different things about when something happens.
 *
 * Supply either `label` or an `aria-label`.
 */
export interface SwitchProps extends Omit<SwitchBaseProps, "className"> {
  /** Visible label rendered beside the track, and wired as its accessible name. */
  label?: string;
  /** Additional CSS class for the root wrapper. */
  className?: string;
}

/**
 * An on/off control that takes effect immediately.
 *
 * @see {@link SwitchProps}
 */
export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, disabled, ...props }, ref) => {
    return (
      <label
        {...{ [FINRA_UI_ATTR]: componentIds.switch }}
        className={clsx(styles.switch, disabled && styles.disabled, className)}>
        <SwitchBase
          ref={ref}
          {...{ [FINRA_UI_ATTR]: componentIds.switchInput }}
          className={styles.input}
          disabled={disabled}
          {...props}
        />
        <span
          className={styles.track}
          aria-hidden="true"
          {...{ [FINRA_UI_ATTR]: componentIds.switchTrack }}>
          <span className={styles.thumb} {...{ [FINRA_UI_ATTR]: componentIds.switchThumb }} />
        </span>
        {label ? (
          <span className={styles.label} {...{ [FINRA_UI_ATTR]: componentIds.switchLabel }}>
            {label}
          </span>
        ) : null}
      </label>
    );
  },
);

Switch.displayName = "Switch";
