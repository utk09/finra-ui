import { forwardRef, type InputHTMLAttributes } from "react";

import { useFormField } from "../../hooks/useFormField";
import { Slot } from "../Slot";

export interface NumberInputBaseProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  asChild?: boolean;
}

export const NumberInputBase = forwardRef<HTMLInputElement, NumberInputBaseProps>(
  ({ asChild = false, ...props }, ref) => {
    // Wire into an enclosing FormField (works at any depth; no-op standalone).
    const fieldProps = useFormField(props);
    const Comp = asChild ? Slot : "input";

    return <Comp ref={ref} inputMode="decimal" {...fieldProps} />;
  },
);

NumberInputBase.displayName = "NumberInputBase";
