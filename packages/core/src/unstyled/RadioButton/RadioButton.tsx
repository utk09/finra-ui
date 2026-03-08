import { forwardRef, type InputHTMLAttributes } from "react";

export interface RadioButtonBaseProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {}

export const RadioButtonBase = forwardRef<HTMLInputElement, RadioButtonBaseProps>((props, ref) => {
  return <input ref={ref} type="radio" {...props} />;
});

RadioButtonBase.displayName = "RadioButtonBase";
