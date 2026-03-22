import {
  ComboBoxBase,
  type ComboBoxClassNames,
  type ComboBoxOption,
} from "@utk09/finra-ui/unstyled";
import { forwardRef, type HTMLAttributes, type ReactNode, useCallback, useMemo } from "react";

import { parseTenor, STANDARD_TENORS } from "../../utils/tenor";

export interface TenorInputClassNames extends ComboBoxClassNames {}

export interface TenorInputBaseProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "onChange" | "defaultValue"
> {
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
  placeholder?: string;
  disabled?: boolean;

  // Open state
  open?: boolean;
  onOpenChange?: (open: boolean) => void;

  // Style injection (same pattern as ComboBox)
  classNames?: TenorInputClassNames;
  dataAttributes?: Record<string, string>;
  renderCheckIcon?: () => ReactNode;
  renderIndicator?: (isOpen: boolean) => ReactNode;
  renderPillRemoveIcon?: () => ReactNode;
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
        dataAttributes={dataAttributes}
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
