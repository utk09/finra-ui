import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Slot } from "../Slot";

export interface IconButtonBaseProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  icon: ReactNode;
  "aria-label": string;
}

export const IconButtonBase = forwardRef<HTMLButtonElement, IconButtonBaseProps>(
  ({ asChild = false, icon, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp ref={ref} {...props}>
        {icon}
        {children}
      </Comp>
    );
  },
);

IconButtonBase.displayName = "IconButtonBase";
