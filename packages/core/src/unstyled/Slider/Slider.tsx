import { forwardRef, type InputHTMLAttributes } from "react";

export interface SliderBaseProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {}

export const SliderBase = forwardRef<HTMLInputElement, SliderBaseProps>((props, ref) => {
  return <input ref={ref} type="range" {...props} />;
});

SliderBase.displayName = "SliderBase";
