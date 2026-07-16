import {
  forwardRef,
  type HTMLAttributes,
  type KeyboardEvent,
  useCallback,
  useRef,
  useState,
} from "react";

import { useControlledValue } from "../../hooks/useControlledValue";
import { useFormField } from "../../hooks/useFormField";
import type { AriaInvalid } from "../../logic/formField";
import { mergeRefs } from "../../utils/mergeRefs";

export interface PillInputBaseProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** Current list of pills (controlled). */
  values?: string[];
  /** Called when the pill list changes. */
  onChange?: (values: string[]) => void;
  /** Placeholder shown when no pills and input is empty. */
  placeholder?: string;
  /** Disable the entire component. */
  disabled?: boolean;
  /** Maximum number of pills allowed. */
  maxPills?: number;
  /** Characters that trigger pill creation (default: Enter). */
  delimiters?: string[];
}

export const PillInputBase = forwardRef<HTMLInputElement, PillInputBaseProps>(
  (
    {
      values: controlledValues,
      onChange,
      placeholder,
      disabled,
      maxPills,
      delimiters = [],
      id,
      "aria-describedby": ariaDescribedBy,
      "aria-invalid": ariaInvalid,
      ...props
    },
    forwardedRef,
  ) => {
    const [values, updateValues] = useControlledValue(controlledValues, [] as string[], onChange);
    const [inputValue, setInputValue] = useState("");
    const internalRef = useRef<HTMLInputElement>(null);

    // Wire the typing input into an enclosing FormField (the input is the
    // labelable element). Works at any depth; no-op when standalone.
    const field = useFormField({
      id,
      "aria-describedby": ariaDescribedBy,
      "aria-invalid": ariaInvalid as AriaInvalid | undefined,
      disabled,
    });
    const isDisabled = field.disabled;

    const addPill = useCallback(
      (text: string) => {
        const trimmed = text.trim();
        if (!trimmed) return;
        if (values.includes(trimmed)) return;
        if (maxPills != null && values.length >= maxPills) return;
        updateValues([...values, trimmed]);
        setInputValue("");
      },
      [values, maxPills, updateValues],
    );

    const removePill = useCallback(
      (index: number) => {
        updateValues(values.filter((_, i) => i !== index));
        internalRef.current?.focus();
      },
      [values, updateValues],
    );

    const handleKeyDown = useCallback(
      (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
          e.preventDefault();
          addPill(inputValue);
          return;
        }
        if (e.key === "Backspace" && inputValue === "" && values.length > 0) {
          removePill(values.length - 1);
          return;
        }
        if (delimiters.includes(e.key)) {
          e.preventDefault();
          addPill(inputValue);
        }
      },
      [inputValue, values, delimiters, addPill, removePill],
    );

    const handleContainerClick = useCallback(() => {
      if (!isDisabled) {
        internalRef.current?.focus();
      }
    }, [isDisabled]);

    const handleContainerKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (!isDisabled && (e.key === "Enter" || e.key === " ")) {
          internalRef.current?.focus();
        }
      },
      [isDisabled],
    );

    return (
      <div
        role="toolbar"
        onClick={handleContainerClick}
        onKeyDown={handleContainerKeyDown}
        {...props}>
        {values.map((pill) => (
          <span key={pill}>
            {pill}
            {!isDisabled ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removePill(values.indexOf(pill));
                }}
                aria-label={`Remove ${pill}`}
                tabIndex={-1}>
                ×
              </button>
            ) : null}
          </span>
        ))}
        <input
          ref={mergeRefs(forwardedRef, internalRef)}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={values.length === 0 ? placeholder : undefined}
          id={field.id}
          aria-label={props["aria-label"]}
          aria-labelledby={props["aria-labelledby"]}
          aria-describedby={field["aria-describedby"]}
          aria-invalid={field["aria-invalid"]}
          aria-required={field["aria-required"]}
          disabled={isDisabled}
        />
      </div>
    );
  },
);

PillInputBase.displayName = "PillInputBase";
