import { clsx } from "clsx";
import { forwardRef, useCallback, useMemo } from "react";

import { parseTenor, STANDARD_TENORS } from "../../utils/tenor";
import { ComboBox, type ComboBoxOption, type ComboBoxProps } from "../ComboBox/ComboBox";
import { componentIds, FINRA_UI_ATTR } from "../componentIds";

export interface TenorInputProps extends Omit<
  ComboBoxProps<string>,
  | "options"
  | "multiple"
  | "creatable"
  | "onCreateOption"
  | "formatCreateLabel"
  | "value"
  | "onChange"
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

export const TenorInput = forwardRef<HTMLInputElement, TenorInputProps>(
  (
    {
      value,
      onChange,
      extraTenors,
      allowedTenors,
      allowCustom = false,
      placeholder = "Select tenor...",
      className,
      noOptionsMessage = "No matching tenors",
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
      <div {...{ [FINRA_UI_ATTR]: componentIds.tenorInput }}>
        <ComboBox<string>
          ref={ref}
          options={options}
          value={value}
          onChange={handleChange}
          filterFn={tenorFilterFn}
          creatable={allowCustom}
          onCreateOption={allowCustom ? handleCreateOption : undefined}
          formatCreateLabel={allowCustom ? (v) => `Use "${v.toUpperCase()}"` : undefined}
          placeholder={placeholder}
          className={clsx(className)}
          noOptionsMessage={noOptionsMessage}
          {...props}
        />
      </div>
    );
  },
);

TenorInput.displayName = "TenorInput";
