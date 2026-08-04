import {
  forwardRef,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useRef,
  useState,
} from "react";

import { componentIds, FINRA_UI_ATTR } from "../../componentIds";
import { useControlledValue } from "../../hooks/useControlledValue";
import { useFormField } from "../../hooks/useFormField";
import type { AriaInvalid } from "../../logic/formField";
import { mergeRefs } from "../../utils/mergeRefs";

/**
 * Props for the unstyled pill input - free-text entry that commits each entry
 * as a removable pill.
 *
 * @remarks
 * For arbitrary values (tags, addresses, ad-hoc codes). When the values come
 * from a known list, use ComboBox in `multiple` mode instead.
 *
 * Controlled: pass `values` and handle `onChange`.
 */
export interface PillInputClassNames {
  /** The pill wrapper around one value. */
  pill?: string;
  /** The value's text inside the pill. */
  pillText?: string;
  /** The pill's remove button. */
  pillRemove?: string;
  /** The typing input. */
  input?: string;
}

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
  /** CSS class names for the inner parts. The root uses `className`. */
  classNames?: PillInputClassNames;
  /**
   * Render a pill's remove button icon. Defaults to a `×` character.
   *
   * @remarks
   * The unstyled layer ships no icons, so the default is a text glyph rather
   * than an SVG. The button carries its own `aria-label`, so whatever this
   * returns is decorative and the accessible name is unaffected.
   */
  renderPillRemoveIcon?: () => ReactNode;
}

/**
 * Unstyled pill input.
 *
 * @see {@link PillInputBaseProps}
 */
export const PillInputBase = forwardRef<HTMLInputElement, PillInputBaseProps>(
  (
    {
      values: controlledValues,
      onChange,
      placeholder,
      disabled,
      maxPills,
      delimiters = [],
      classNames,
      renderPillRemoveIcon,
      id,
      "aria-describedby": ariaDescribedBy,
      "aria-invalid": ariaInvalid,
      // Pulled out of `props` and composed below. Left in, they would be
      // spread *over* this component's own handlers rather than alongside
      // them, and the container would stop forwarding focus to the input -
      // the behaviour that makes the whole surface act like one field.
      onClick: onClickProp,
      onKeyDown: onKeyDownProp,
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

    // The consumer's handler runs first and can claim the gesture with
    // `preventDefault()`; otherwise the container still forwards focus.
    const handleContainerClick = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        onClickProp?.(e);
        if (e.defaultPrevented || isDisabled) return;
        internalRef.current?.focus();
      },
      [isDisabled, onClickProp],
    );

    const handleContainerKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLDivElement>) => {
        onKeyDownProp?.(e);
        if (e.defaultPrevented || isDisabled) return;
        if (e.key === "Enter" || e.key === " ") {
          internalRef.current?.focus();
        }
      },
      [isDisabled, onKeyDownProp],
    );

    return (
      // Each part stamps its own id, so an unstyled pill input is reachable by
      // the same selectors as a styled one. `props` follows on the root, so a
      // caller can still replace it.
      <div
        {...{ [FINRA_UI_ATTR]: componentIds.pillInput }}
        role="toolbar"
        {...props}
        onClick={handleContainerClick}
        onKeyDown={handleContainerKeyDown}>
        {values.map((pill) => (
          <span
            key={pill}
            className={classNames?.pill}
            {...{ [FINRA_UI_ATTR]: componentIds.pillInputPill }}>
            <span
              className={classNames?.pillText}
              {...{ [FINRA_UI_ATTR]: componentIds.pillInputPillText }}>
              {pill}
            </span>
            {!isDisabled ? (
              <button
                {...{ [FINRA_UI_ATTR]: componentIds.pillInputPillRemove }}
                type="button"
                className={classNames?.pillRemove}
                onClick={(e) => {
                  e.stopPropagation();
                  removePill(values.indexOf(pill));
                }}
                aria-label={`Remove ${pill}`}
                tabIndex={-1}>
                {renderPillRemoveIcon ? renderPillRemoveIcon() : "×"}
              </button>
            ) : null}
          </span>
        ))}
        <input
          ref={mergeRefs(forwardedRef, internalRef)}
          className={classNames?.input}
          {...{ [FINRA_UI_ATTR]: componentIds.pillInputField }}
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
