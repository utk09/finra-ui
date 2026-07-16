import { forwardRef, type InputHTMLAttributes, useCallback } from "react";

import { useFormField } from "../../hooks/useFormField";
import { mergeRefs } from "../../utils/mergeRefs";

export interface CheckboxBaseProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  indeterminate?: boolean;
}

export const CheckboxBase = forwardRef<HTMLInputElement, CheckboxBaseProps>(
  ({ indeterminate, ...props }, forwardedRef) => {
    // Wire into an enclosing FormField (works at any depth; no-op standalone).
    const fieldProps = useFormField(props);

    const setIndeterminate = useCallback(
      (node: HTMLInputElement | null) => {
        if (node) {
          node.indeterminate = indeterminate ?? false;
        }
      },
      [indeterminate],
    );

    return (
      <input ref={mergeRefs(forwardedRef, setIndeterminate)} type="checkbox" {...fieldProps} />
    );
  },
);

CheckboxBase.displayName = "CheckboxBase";
