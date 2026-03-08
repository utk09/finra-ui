import { forwardRef, type InputHTMLAttributes } from "react";

export interface SwitchBaseProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "role"
> {}

export const SwitchBase = forwardRef<HTMLInputElement, SwitchBaseProps>((props, ref) => {
  return <input ref={ref} type="checkbox" role="switch" {...props} />;
});

SwitchBase.displayName = "SwitchBase";
