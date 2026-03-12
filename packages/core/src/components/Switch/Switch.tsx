import { clsx } from "clsx";
import { forwardRef } from "react";

import { SwitchBase, type SwitchBaseProps } from "../../unstyled/Switch/Switch";
import { componentIds, FINRA_UI_ATTR } from "../componentIds";
import styles from "./Switch.module.scss";

export interface SwitchProps extends Omit<SwitchBaseProps, "className"> {
  label?: string;
  className?: string;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, disabled, ...props }, ref) => {
    return (
      <label
        {...{ [FINRA_UI_ATTR]: componentIds.switch }}
        className={clsx(styles.switch, disabled && styles.disabled, className)}>
        <SwitchBase ref={ref} className={styles.input} disabled={disabled} {...props} />
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
