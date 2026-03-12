import { clsx } from "clsx";
import { forwardRef } from "react";

import { SliderBase, type SliderBaseProps } from "../../unstyled/Slider/Slider";
import { componentIds, FINRA_UI_ATTR } from "../componentIds";
import styles from "./Slider.module.scss";

export interface SliderProps extends Omit<SliderBaseProps, "className"> {
  label?: string;
  showValue?: boolean;
  className?: string;
}

export const Slider = forwardRef<HTMLInputElement, SliderProps>(
  ({ className, label, showValue, disabled, value, defaultValue, ...props }, ref) => {
    const displayValue = value ?? defaultValue ?? "";

    return (
      <label
        {...{ [FINRA_UI_ATTR]: componentIds.slider }}
        className={clsx(styles.slider, disabled && styles.disabled, className)}>
        {label || showValue ? (
          <span className={styles.header} {...{ [FINRA_UI_ATTR]: componentIds.sliderHeader }}>
            {label ? <span className={styles.label}>{label}</span> : null}
            {showValue ? <span className={styles.value}>{displayValue}</span> : null}
          </span>
        ) : null}
        <SliderBase
          ref={ref}
          className={styles.input}
          disabled={disabled}
          value={value}
          defaultValue={defaultValue}
          {...props}
        />
      </label>
    );
  },
);

Slider.displayName = "Slider";
