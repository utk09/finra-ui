import { clsx } from "clsx";
import { forwardRef } from "react";

import { RadioButtonBase, type RadioButtonBaseProps } from "../../unstyled/RadioButton/RadioButton";
import { componentIds, FINRA_UI_ATTR } from "../componentIds";
import styles from "./RadioButton.module.scss";

/**
 * Props for the styled RadioButton.
 *
 * @remarks
 * One radio on its own is not a control - give every button in a set the same
 * `name` so the browser groups them, makes them mutually exclusive, and lets
 * arrow keys move between them. Wrap the set in a `FormField` (or your own
 * `role="radiogroup"`) to name the choice itself.
 *
 * @example
 * ```tsx
 * <RadioButton name="side" value="buy" label="Buy" defaultChecked />
 * <RadioButton name="side" value="sell" label="Sell" />
 * ```
 */
export interface RadioButtonProps extends Omit<RadioButtonBaseProps, "className"> {
  /** Visible label rendered beside the control, and wired as its accessible name. */
  label?: string;
  /** Additional CSS class for the root wrapper. */
  className?: string;
}

/**
 * One radio in a group. Give every member the same `name`.
 *
 * @see {@link RadioButtonProps}
 */
export const RadioButton = forwardRef<HTMLInputElement, RadioButtonProps>(
  ({ className, label, disabled, ...props }, ref) => {
    return (
      <label
        {...{ [FINRA_UI_ATTR]: componentIds.radioButton }}
        className={clsx(styles.radio, disabled && styles.disabled, className)}>
        <RadioButtonBase ref={ref} className={styles.input} disabled={disabled} {...props} />
        <span
          className={styles.indicator}
          aria-hidden="true"
          {...{ [FINRA_UI_ATTR]: componentIds.radioButtonIndicator }}>
          <span className={styles.dot} />
        </span>
        {label ? (
          <span className={styles.label} {...{ [FINRA_UI_ATTR]: componentIds.radioButtonLabel }}>
            {label}
          </span>
        ) : null}
      </label>
    );
  },
);

RadioButton.displayName = "RadioButton";
