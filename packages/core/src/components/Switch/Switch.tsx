import { forwardRef } from "react";
import { clsx } from "clsx";
import { SwitchBase, type SwitchBaseProps } from "../../unstyled/Switch/Switch";
import { FINRA_UI_ATTR, componentIds } from "../componentIds";
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
        <span className={styles.track} aria-hidden="true">
          <span className={styles.thumb} />
        </span>
        {label ? <span className={styles.label}>{label}</span> : null}
      </label>
    );
  },
);

Switch.displayName = "Switch";
