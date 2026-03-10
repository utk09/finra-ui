import { forwardRef, useEffect, useRef, type InputHTMLAttributes } from "react";
import { mergeRefs } from "../../utils/mergeRefs";

export interface CheckboxBaseProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  indeterminate?: boolean;
}

export const CheckboxBase = forwardRef<HTMLInputElement, CheckboxBaseProps>(
  ({ indeterminate, ...props }, forwardedRef) => {
    const internalRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      if (internalRef.current) {
        internalRef.current.indeterminate = indeterminate ?? false;
      }
    }, [indeterminate]);

    return <input ref={mergeRefs(forwardedRef, internalRef)} type="checkbox" {...props} />;
  },
);

CheckboxBase.displayName = "CheckboxBase";
