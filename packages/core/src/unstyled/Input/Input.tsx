import { forwardRef, type InputHTMLAttributes } from "react";
import { Slot } from "../Slot";

export interface InputBaseProps extends InputHTMLAttributes<HTMLInputElement> {
  asChild?: boolean;
}

export const InputBase = forwardRef<HTMLInputElement, InputBaseProps>(
  ({ asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "input";

    return <Comp ref={ref} {...props} />;
  },
);

InputBase.displayName = "InputBase";
