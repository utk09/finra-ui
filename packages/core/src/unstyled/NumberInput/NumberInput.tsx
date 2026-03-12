import { forwardRef, type InputHTMLAttributes } from "react";

import { Slot } from "../Slot";

export interface NumberInputBaseProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  asChild?: boolean;
}

export const NumberInputBase = forwardRef<HTMLInputElement, NumberInputBaseProps>(
  ({ asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "input";

    return <Comp ref={ref} inputMode="decimal" {...props} />;
  },
);

NumberInputBase.displayName = "NumberInputBase";
