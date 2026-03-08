import { forwardRef } from "react";
import { clsx } from "clsx";
import { RadioButtonBase, type RadioButtonBaseProps } from "../../unstyled/RadioButton/RadioButton";
import { FINRA_UI_ATTR, componentIds } from "../componentIds";
import styles from "./RadioButton.module.scss";

export interface RadioButtonProps extends Omit<RadioButtonBaseProps, "className"> {
  label?: string;
  className?: string;
}

export const RadioButton = forwardRef<HTMLInputElement, RadioButtonProps>(
  ({ className, label, disabled, ...props }, ref) => {
    return (
      <label
        {...{ [FINRA_UI_ATTR]: componentIds.radioButton }}
        className={clsx(styles.radio, disabled && styles.disabled, className)}>
        <RadioButtonBase ref={ref} className={styles.input} disabled={disabled} {...props} />
        <span className={styles.indicator} aria-hidden="true">
          <span className={styles.dot} />
        </span>
        {label ? <span className={styles.label}>{label}</span> : null}
      </label>
    );
  },
);

RadioButton.displayName = "RadioButton";
