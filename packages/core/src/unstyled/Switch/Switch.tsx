import { forwardRef, type InputHTMLAttributes } from "react";

import { useFormField } from "../../hooks/useFormField";

export interface SwitchBaseProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "role"
> {}

export const SwitchBase = forwardRef<HTMLInputElement, SwitchBaseProps>((props, ref) => {
  // Wire into an enclosing FormField (works at any depth; no-op standalone).
  const fieldProps = useFormField(props);
  return <input ref={ref} type="checkbox" role="switch" {...fieldProps} />;
});

SwitchBase.displayName = "SwitchBase";
