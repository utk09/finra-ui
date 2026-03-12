import { forwardRef, type InputHTMLAttributes, useCallback } from "react";

import { mergeRefs } from "../../utils/mergeRefs";

export interface CheckboxBaseProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  indeterminate?: boolean;
}

export const CheckboxBase = forwardRef<HTMLInputElement, CheckboxBaseProps>(
  ({ indeterminate, ...props }, forwardedRef) => {
    const setIndeterminate = useCallback(
      (node: HTMLInputElement | null) => {
        if (node) {
          node.indeterminate = indeterminate ?? false;
        }
      },
      [indeterminate],
    );

    return <input ref={mergeRefs(forwardedRef, setIndeterminate)} type="checkbox" {...props} />;
  },
);

CheckboxBase.displayName = "CheckboxBase";
