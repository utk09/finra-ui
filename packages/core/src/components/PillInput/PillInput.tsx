import { CloseSmallIcon } from "@utk09/finra-ui-icons/react";
import { clsx } from "clsx";
import { forwardRef, type ReactNode } from "react";

import { useFormField } from "../../hooks/useFormField";
import type { AriaInvalid } from "../../logic/formField";
import { PillInputBase, type PillInputBaseProps } from "../../unstyled/PillInput/PillInput";
import styles from "./PillInput.module.scss";

/**
 * Props for PillInput - free-text entry that commits each entry as a removable
 * pill.
 *
 * @remarks
 * For arbitrary values (tags, email addresses, ad-hoc codes). When the values
 * come from a known list, use ComboBox in `multiple` mode instead - it gives
 * filtering and prevents typos.
 *
 * Controlled: pass `values` and handle `onChange`.
 */
export interface PillInputProps extends Omit<PillInputBaseProps, "classNames"> {}

function styledRenderPillRemoveIcon(): ReactNode {
  return <CloseSmallIcon />;
}

/**
 * Free-text entry that commits each entry as a removable pill.
 *
 * @see {@link PillInputProps}
 */
export const PillInput = forwardRef<HTMLInputElement, PillInputProps>(
  (
    {
      className,
      disabled,
      id,
      "aria-describedby": ariaDescribedBy,
      "aria-invalid": ariaInvalid,
      renderPillRemoveIcon,
      ...props
    },
    forwardedRef,
  ) => {
    // Resolved here as well as in the base, because the root's disabled styling
    // has to follow an enclosing FormField and not just the prop. Reading the
    // context twice is idempotent.
    const field = useFormField({
      id,
      "aria-describedby": ariaDescribedBy,
      "aria-invalid": ariaInvalid as AriaInvalid | undefined,
      disabled,
    });

    return (
      <PillInputBase
        ref={forwardedRef}
        id={id}
        disabled={disabled}
        aria-describedby={ariaDescribedBy}
        aria-invalid={ariaInvalid}
        className={clsx(styles.pillInput, field.disabled && styles.disabled, className)}
        classNames={{
          pill: styles.pill,
          pillText: styles.pillText,
          pillRemove: styles.pillRemove,
          input: styles.input,
        }}
        renderPillRemoveIcon={renderPillRemoveIcon ?? styledRenderPillRemoveIcon}
        {...props}
      />
    );
  },
);

PillInput.displayName = "PillInput";
