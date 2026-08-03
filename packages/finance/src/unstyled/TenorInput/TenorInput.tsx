import { FINRA_UI_ATTR } from "@utk09/finra-ui";
import {
  ComboBoxBase,
  type ComboBoxClassNames,
  type ComboBoxOption,
} from "@utk09/finra-ui/unstyled";
import { forwardRef, type HTMLAttributes, type ReactNode, useCallback, useMemo } from "react";

import { componentIds } from "../../componentIds";
import { parseTenor, STANDARD_TENORS } from "../../utils/tenor";

/**
 * CSS class overrides for the deprecated flat tenor combo box.
 *
 * @deprecated Use `TenorPickerClassNames` with {@link TenorPickerBase} instead.
 *
 * @remarks
 * Identical to `ComboBoxClassNames` - this component is a thin wrapper over
 * core's ComboBox and adds no parts of its own.
 */
export interface TenorInputClassNames extends ComboBoxClassNames {}

/**
 * Props for the deprecated unstyled flat tenor combo box.
 *
 * @deprecated Use {@link TenorPickerBase} instead - a strict superset
 * (`grouped={false}` reproduces this flat list) that adds grouping, favourites
 * and flexible parsing. Will be removed in a future release.
 *
 * @remarks
 * Migration is close to a rename; the one behavioural difference is parsing,
 * since TenorPicker accepts long-form and compound tenors this rejects.
 */
export interface TenorInputBaseProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
  /** Selected tenor value. */
  value?: string | null;
  /** Called when tenor changes. */
  onChange?: (tenor: string | null) => void;
  /** Additional tenors beyond the standard set. */
  extraTenors?: string[];
  /** Restrict to only these tenors. */
  allowedTenors?: string[];
  /** Allow free-text tenor input (e.g. "4M"). */
  allowCustom?: boolean;
  /** Placeholder for the text field. */
  placeholder?: string;
  /** Disable the whole control. */
  disabled?: boolean;

  // Open state
  /** Controlled open state of the listbox. */
  open?: boolean;
  /** Fired whenever the listbox wants to open or close. */
  onOpenChange?: (open: boolean) => void;

  // Style injection (same pattern as ComboBox)
  /** CSS class names injected by the styled layer. */
  classNames?: TenorInputClassNames;
  /**
   * data-* attributes for the underlying combo box root.
   *
   * @remarks
   * Defaults to the tenor-input id, so an unstyled tenor input is
   * distinguishable from a plain combo box by selector. Supplying your own
   * replaces it.
   */
  dataAttributes?: Record<string, string>;
  /** Render the tick shown on the selected option. */
  renderCheckIcon?: () => ReactNode;
  /** Render the open/close affordance. Receives the current open state. */
  renderIndicator?: (isOpen: boolean) => ReactNode;
  /** Render a pill's remove glyph. Unused here - this control is single-select. */
  renderPillRemoveIcon?: () => ReactNode;
  /** Render the row shown while options are loading. */
  renderLoading?: () => ReactNode;
}

function buildTenorOptions(
  allowedTenors?: string[],
  extraTenors?: string[],
): ComboBoxOption<string>[] {
  let tenors: string[];

  if (allowedTenors) {
    tenors = allowedTenors;
  } else {
    tenors = [...STANDARD_TENORS];
    if (extraTenors) {
      for (const t of extraTenors) {
        if (!tenors.includes(t)) {
          tenors.push(t);
        }
      }
    }
  }

  return tenors.map((t) => ({ value: t, label: t }));
}

function tenorFilterFn(option: ComboBoxOption<string>, inputValue: string): boolean {
  const needle = inputValue.toUpperCase();
  return option.label.toUpperCase().includes(needle);
}

/**
 * @deprecated Use {@link TenorPickerBase} instead - a strict superset with
 * grouping, favourites, and flexible parsing (`grouped={false}` reproduces this
 * flat list). Will be removed in a future release.
 */
export const TenorInputBase = forwardRef<HTMLInputElement, TenorInputBaseProps>(
  (
    {
      value,
      onChange,
      extraTenors,
      allowedTenors,
      allowCustom = false,
      placeholder = "Select tenor...",
      disabled,
      open,
      onOpenChange,
      classNames,
      dataAttributes,
      renderCheckIcon,
      renderIndicator,
      renderPillRemoveIcon,
      renderLoading,
      ...props
    },
    ref,
  ) => {
    const options = useMemo(
      () => buildTenorOptions(allowedTenors, extraTenors),
      [allowedTenors, extraTenors],
    );

    const handleChange = useCallback(
      (val: string | string[] | null) => {
        // TenorInput is always single-select
        const tenor = Array.isArray(val) ? (val[0] ?? null) : val;
        onChange?.(tenor);
      },
      [onChange],
    );

    const handleCreateOption = useCallback(
      (inputValue: string) => {
        const parsed = parseTenor(inputValue);
        if (parsed.valid && parsed.tenor) {
          onChange?.(parsed.tenor);
        }
      },
      [onChange],
    );

    return (
      <ComboBoxBase<string>
        ref={ref}
        options={options}
        value={value}
        onChange={handleChange}
        filterFn={tenorFilterFn}
        creatable={allowCustom}
        onCreateOption={allowCustom ? handleCreateOption : undefined}
        formatCreateLabel={allowCustom ? (v) => `Use "${v.toUpperCase()}"` : undefined}
        placeholder={placeholder}
        disabled={disabled}
        open={open}
        onOpenChange={onOpenChange}
        classNames={classNames}
        dataAttributes={dataAttributes ?? { [FINRA_UI_ATTR]: componentIds.tenorInput }}
        renderCheckIcon={renderCheckIcon}
        renderIndicator={renderIndicator}
        renderPillRemoveIcon={renderPillRemoveIcon}
        renderLoading={renderLoading}
        noOptionsMessage="No matching tenors"
        {...props}
      />
    );
  },
);

TenorInputBase.displayName = "TenorInputBase";
