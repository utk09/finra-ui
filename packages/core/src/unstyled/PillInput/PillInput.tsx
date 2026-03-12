import {
  forwardRef,
  type HTMLAttributes,
  type KeyboardEvent,
  useCallback,
  useRef,
  useState,
} from "react";

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
      ...props
    },
    forwardedRef,
  ) => {
    const [internalValues, setInternalValues] = useState<string[]>([]);
    const [inputValue, setInputValue] = useState("");
    const internalRef = useRef<HTMLInputElement>(null);

    const values = controlledValues ?? internalValues;

    const updateValues = useCallback(
      (next: string[]) => {
        if (!controlledValues) {
          setInternalValues(next);
        }
        onChange?.(next);
      },
      [controlledValues, onChange],
    );

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
      if (!disabled) {
        internalRef.current?.focus();
      }
    }, [disabled]);

    const handleContainerKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (!disabled && (e.key === "Enter" || e.key === " ")) {
          internalRef.current?.focus();
        }
      },
      [disabled],
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
            {!disabled ? (
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
          disabled={disabled}
          aria-label={props["aria-label"]}
          aria-labelledby={props["aria-labelledby"]}
        />
      </div>
    );
  },
);

PillInputBase.displayName = "PillInputBase";
