import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Slot } from "@radix-ui/react-slot";

export interface ButtonBaseProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

export const ButtonBase = forwardRef<HTMLButtonElement, ButtonBaseProps>(
  ({ asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return <Comp ref={ref} {...props} />;
  },
);

ButtonBase.displayName = "ButtonBase";
