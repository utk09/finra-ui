import { useFormField } from "@utk09/finra-ui";
import {
  type ChangeEvent,
  type FocusEvent,
  forwardRef,
  type InputHTMLAttributes,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  type AmountFormat,
  type AmountFormatOptions,
  type AmountParseOptions,
  type AmountParseResult,
  type AmountSuffixTable,
  currencyDecimals,
  formatAmount,
  parseAmount,
} from "../../utils/amount";
import { decimalPlaces } from "../../utils/decimal";
import { type IncrementAction, resolveIncrement } from "../../utils/increment";
import { createAmountKeymap, type KeyMap, resolveKey } from "../../utils/keymap";

//  Types

/** Result of value-level validation (after a successful parse). */
export interface AmountValidationResult {
  valid: boolean;
  value: number;
  error?: "min" | "max" | "custom";
}

/** Custom validator: return `false` or an error string to reject. */
export type AmountValidator = (value: number) => boolean | string;

/** Replaceable parser, so a desk can swap the whole notation grammar. */
export type AmountParser = (input: string, options: AmountParseOptions) => AmountParseResult;

/** Replaceable formatter for the resting (unfocused) display. */
export type AmountFormatter = (value: number | null, options: AmountFormatOptions) => string;

/** Imperative handle exposed via `ref`. */
export interface AmountInputHandle {
  focus: () => void;
  select: () => void;
  commit: () => void;
  revert: () => void;
  /** Step by `steps` increments of `step` (sign = direction). */
  step: (steps: number) => void;
  /** Apply any increment action programmatically. */
  increment: (action: IncrementAction, direction: 1 | -1) => void;
  getValue: () => number | null;
}

export interface AmountInputClassNames {
  root?: string;
  input?: string;
}

export interface AmountInputBaseProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "value" | "defaultValue" | "onChange" | "min" | "max" | "step" | "type" | "className"
> {
  /** Controlled canonical value. Always the expanded number, never `"1.2M"`. */
  value?: number | null;
  /** Initial value (uncontrolled). */
  defaultValue?: number | null;
  /** Fired when the committed value changes (null when cleared). */
  onChange?: (value: number | null) => void;
  /**
   * ISO currency code. Drives the resting display's symbol and decimal places.
   * Deliberately separate from `value`: an amount is a scalar, and pairing the
   * two into one object makes every consumer unpack it before doing arithmetic.
   */
  currency?: string;
  /** BCP-47 tag for grouping and the resting display. Default: runtime locale. */
  locale?: string;
  /** Decimal places. Defaults to the currency's, else the value's own. */
  decimals?: number;
  /**
   * Resting display format. Default `"compact"`, which abbreviates only when
   * that costs no precision - `1230000` rests as `1.23M`, but `1500123` rests
   * as `1,500,123` rather than rounding itself into a lie.
   */
  format?: AmountFormat;

  /** Extra suffixes, merged over the K/M/B/T defaults (e.g. lakh/crore). */
  suffixes?: AmountSuffixTable;
  /** Use `suffixes` alone, ignoring the defaults. Default false. */
  replaceSuffixes?: boolean;
  /** Match suffix casing exactly. Default false, so `10m` and `10M` agree. */
  caseSensitive?: boolean;
  /** Decimal mark for both typing and display. Default `"."`. */
  decimalSeparator?: string;
  /** Marks removed from digit groups while parsing. */
  groupSeparators?: readonly string[];
  /** Default true. */
  allowNegative?: boolean;
  /** Read `(1,234)` as `-1234`. Default true. */
  allowAccountingNegative?: boolean;
  /** Currency codes recognised inside the text (`EUR 5m`). */
  currencyCodes?: readonly string[];
  /** Fired when the typed text carried a currency code. */
  onCurrencyChange?: (currency: string) => void;

  /** Arrow-key increment. Default 1. */
  step?: number;
  /** Shift+Arrow and PageUp/PageDown increment. Default ten steps. */
  largeStep?: number;
  /** Minimum value. */
  min?: number;
  /** Maximum value. */
  max?: number;
  /** Custom validator run after parsing. */
  validate?: AmountValidator;
  /** Consumer keyboard map. Defaults to the step-driven amount map. */
  keymap?: KeyMap;
  /** Replaceable parser. Defaults to {@link parseAmount}. */
  parser?: AmountParser;
  /** Replaceable resting formatter. Defaults to {@link formatAmount}. */
  formatter?: AmountFormatter;
  /** Select the whole value on focus, so typing replaces it. Default false. */
  selectOnFocus?: boolean;

  disabled?: boolean;
  /** Read-only: increment keys are inert and typing is ignored. */
  readOnly?: boolean;
  /** Fired on an explicit commit (Enter / blur). */
  onCommit?: (value: number | null) => void;
  /** Fired on an increment, with the new value and direction. */
  onTick?: (value: number, direction: 1 | -1) => void;
  /** Fired on every parse attempt, including while typing. */
  onParse?: (result: AmountParseResult) => void;
  /** Fired on value-level validation. */
  onValidate?: (result: AmountValidationResult) => void;
  /** CSS class names injected by the styled layer. */
  classNames?: AmountInputClassNames;
  /** data-* attributes injected by the styled layer. */
  dataAttributes?: Record<string, string>;
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
  "aria-label"?: string;
}

//  Component

/**
 * An amount field that accepts human notation and resolves it to a real number.
 *
 * Typing `1.23M` and leaving the field yields `1230000` - and `1230000` is what
 * `onChange` reports, what `value` holds, and what re-focusing the field shows.
 * The shorthand is never the state; it is only ever an input grammar.
 *
 * ## Why the display swaps on focus
 *
 * Resting, the field shows the formatted value (`$1.23M`). Focused, it
 * shows the plain digits (`1230000`), because a caret in a string full of
 * symbols and group separators is hostile: every edit shifts the grouping under
 * the cursor, and backspacing into a `,` does nothing visible. Editing plain
 * digits and formatting on blur is what native date and number fields do, and
 * it keeps the parser's job to a grammar it fully controls.
 */
export const AmountInputBase = forwardRef<AmountInputHandle, AmountInputBaseProps>(
  (
    {
      value,
      defaultValue,
      onChange,
      currency,
      locale,
      decimals,
      format = "compact",
      suffixes,
      replaceSuffixes,
      caseSensitive,
      decimalSeparator = ".",
      groupSeparators,
      allowNegative = true,
      allowAccountingNegative = true,
      currencyCodes,
      onCurrencyChange,
      step = 1,
      largeStep,
      min,
      max,
      validate,
      keymap,
      parser = parseAmount,
      formatter = formatAmount,
      selectOnFocus = false,
      disabled,
      readOnly,
      onCommit,
      onTick,
      onParse,
      onValidate,
      classNames: cn,
      dataAttributes,
      id,
      "aria-describedby": ariaDescribedBy,
      "aria-invalid": ariaInvalid,
      "aria-label": ariaLabel,
      // Pulled out of `rest` so the callbacks below can depend on the handlers
      // themselves: `rest` is a fresh object every render, and depending on it
      // would rebuild every callback on every render.
      onFocus: onFocusProp,
      onBlur: onBlurProp,
      onKeyDown: onKeyDownProp,
      ...rest
    },
    forwardedRef,
  ) => {
    const inputRef = useRef<HTMLInputElement>(null);
    // A ref, not state: focus decides which text to show, but a focus change
    // must not invalidate the controlled-sync effect and clobber a live edit.
    const focusedRef = useRef(false);

    const field = useFormField({
      id,
      "aria-describedby": ariaDescribedBy,
      "aria-invalid": ariaInvalid,
      disabled,
    });

    const parseOpts = useMemo<AmountParseOptions>(
      () => ({
        suffixes,
        replaceSuffixes,
        caseSensitive,
        decimalSeparator,
        groupSeparators,
        allowNegative,
        allowAccountingNegative,
        currencyCodes,
        // `min`/`max` are deliberately not passed: the parser collapses both to
        // one `out-of-range`, and the field needs to say which bound was missed.
      }),
      [
        suffixes,
        replaceSuffixes,
        caseSensitive,
        decimalSeparator,
        groupSeparators,
        allowNegative,
        allowAccountingNegative,
        currencyCodes,
      ],
    );

    const formatOpts = useMemo<AmountFormatOptions>(
      () => ({ format, currency, locale, decimals, suffixes, replaceSuffixes }),
      [format, currency, locale, decimals, suffixes, replaceSuffixes],
    );

    /**
     * The editable form: ungrouped digits, no currency symbol, and no forced
     * trailing zeros - what a person would actually type to produce this value.
     */
    const toEditText = useCallback(
      (v: number | null): string => {
        if (v === null) return "";
        const plain = formatAmount(v, { format: "plain" });
        // `plain` always emits a `.`; a comma-decimal locale must see its own
        // mark, or the parser will strip it as a group separator on the way back.
        return decimalSeparator === "." ? plain : plain.split(".").join(decimalSeparator);
      },
      [decimalSeparator],
    );

    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = useState<number | null>(defaultValue ?? null);
    const currentValue = isControlled ? value : internalValue;

    const [inputText, setInputText] = useState(() => formatter(defaultValue ?? null, formatOpts));

    // Sync a controlled value to the resting display. Skipped while focused, so
    // a parent re-render cannot overwrite half-typed text.
    useEffect(() => {
      if (!isControlled || focusedRef.current) return;
      setInputText(formatter(value ?? null, formatOpts));
    }, [isControlled, value, formatter, formatOpts]);

    // Increments round to the finer of the currency's precision and the step's,
    // so a 0.25 step never rounds itself away in a 0-decimal currency.
    const incrementDecimals = useMemo(() => {
      const fromCurrency = currency ? (currencyDecimals(currency, locale) ?? 0) : 0;
      return Math.max(decimals ?? fromCurrency, decimalPlaces(step));
    }, [currency, locale, decimals, step]);

    const effectiveKeymap = useMemo(
      () => keymap ?? createAmountKeymap(step, largeStep),
      [keymap, step, largeStep],
    );

    // Mirrors the committed value so `getValue()` is right the instant after an
    // imperative call. Reading it out of the handle's closure would report the
    // last *rendered* value, which is stale until React re-renders - a caller
    // doing `ref.step(1); ref.getValue()` would see the value before the step.
    const valueRef = useRef<number | null>(currentValue ?? null);
    useEffect(() => {
      // Authoritative for the controlled case: a parent that rejects the change
      // pulls the mirror back to whatever it actually set.
      valueRef.current = currentValue ?? null;
    }, [currentValue]);

    const setCommitted = useCallback(
      (next: number | null) => {
        valueRef.current = next;
        if (!isControlled) setInternalValue(next);
        if (next !== currentValue) onChange?.(next);
      },
      [isControlled, currentValue, onChange],
    );

    /** A value as text, in whichever mode the field is currently in. */
    const renderValue = useCallback(
      (v: number | null) => (focusedRef.current ? toEditText(v) : formatter(v, formatOpts)),
      [toEditText, formatter, formatOpts],
    );

    const revert = useCallback(() => {
      setInputText(renderValue(currentValue));
    }, [renderValue, currentValue]);

    const validateValue = useCallback(
      (v: number): AmountValidationResult => {
        if (min != null && v < min) return { valid: false, value: v, error: "min" };
        if (max != null && v > max) return { valid: false, value: v, error: "max" };
        const custom = validate?.(v);
        if (custom === false || typeof custom === "string") {
          return { valid: false, value: v, error: "custom" };
        }
        return { valid: true, value: v };
      },
      [min, max, validate],
    );

    const commit = useCallback(() => {
      const result = parser(inputText, parseOpts);
      onParse?.(result);

      if (!result.valid || result.value === null) {
        if (result.error === "empty") {
          setInputText("");
          setCommitted(null);
          onCommit?.(null);
          return;
        }
        revert();
        return;
      }

      const validation = validateValue(result.value);
      onValidate?.(validation);
      if (!validation.valid) {
        revert();
        return;
      }

      if (result.currency && result.currency !== currency) onCurrencyChange?.(result.currency);

      const next = result.value;
      setInputText(renderValue(next));
      setCommitted(next);
      onCommit?.(next);
    }, [
      parser,
      inputText,
      parseOpts,
      onParse,
      revert,
      validateValue,
      onValidate,
      currency,
      onCurrencyChange,
      renderValue,
      setCommitted,
      onCommit,
    ]);

    const applyIncrement = useCallback(
      (direction: 1 | -1, action: IncrementAction) => {
        if (disabled || readOnly) return;
        // Step from what is currently typed, not from the last commit, so
        // arrowing after an edit continues from the edit.
        const parsed = parser(inputText, parseOpts);
        const base = parsed.valid && parsed.value !== null ? parsed.value : (currentValue ?? 0);

        let next = resolveIncrement(base, direction, action, {
          precision: { primaryPrecision: incrementDecimals },
        });
        if (min != null && next < min) next = min;
        if (max != null && next > max) next = max;

        setInputText(renderValue(next));
        setCommitted(next);
        onTick?.(next, direction);
      },
      [
        disabled,
        readOnly,
        parser,
        inputText,
        parseOpts,
        currentValue,
        incrementDecimals,
        min,
        max,
        renderValue,
        setCommitted,
        onTick,
      ],
    );

    const handleChange = useCallback(
      (event: ChangeEvent<HTMLInputElement>) => {
        if (disabled || readOnly) return;
        setInputText(event.target.value);
        // Reported live so the styled layer can flag bad notation before blur.
        onParse?.(parser(event.target.value, parseOpts));
      },
      [disabled, readOnly, onParse, parser, parseOpts],
    );

    const handleKeyDown = useCallback(
      (event: KeyboardEvent<HTMLInputElement>) => {
        if (disabled) return;
        const bound = resolveKey(event, effectiveKeymap);
        if (!bound || bound.kind === "nav") return;

        event.preventDefault();
        if (bound.kind === "commit") commit();
        else if (bound.kind === "revert") revert();
        else applyIncrement(bound.direction, bound.action);

        onKeyDownProp?.(event);
      },
      [disabled, effectiveKeymap, commit, revert, applyIncrement, onKeyDownProp],
    );

    const handleFocus = useCallback(
      (event: FocusEvent<HTMLInputElement>) => {
        focusedRef.current = true;
        setInputText(toEditText(currentValue));
        if (selectOnFocus) {
          // Deferred so it wins over the browser's own focus selection, and so
          // it selects the plain text rather than the formatted text it replaced.
          requestAnimationFrame(() => inputRef.current?.select());
        }
        onFocusProp?.(event);
      },
      [toEditText, currentValue, selectOnFocus, onFocusProp],
    );

    const handleBlur = useCallback(
      (event: FocusEvent<HTMLInputElement>) => {
        focusedRef.current = false;
        commit();
        onBlurProp?.(event);
      },
      [commit, onBlurProp],
    );

    useImperativeHandle(
      forwardedRef,
      () => ({
        focus: () => inputRef.current?.focus(),
        select: () => inputRef.current?.select(),
        commit,
        revert,
        step: (steps: number) =>
          applyIncrement(steps >= 0 ? 1 : -1, {
            type: "amount",
            amount: step * (Math.abs(steps) || 1),
          }),
        increment: (action, direction) => applyIncrement(direction, action),
        getValue: () => valueRef.current,
      }),
      [commit, revert, applyIncrement, step],
    );

    return (
      <span className={cn?.root} {...dataAttributes}>
        <input
          ref={inputRef}
          className={cn?.input}
          type="text"
          inputMode="decimal"
          role="spinbutton"
          id={field.id}
          value={inputText}
          disabled={disabled}
          readOnly={readOnly}
          autoComplete="off"
          aria-valuenow={currentValue ?? undefined}
          aria-valuemin={min}
          aria-valuemax={max}
          // The formatted text, so a screen reader announces "1.2 million
          // dollars" rather than the raw digit string being edited.
          aria-valuetext={currentValue != null ? formatter(currentValue, formatOpts) : undefined}
          aria-describedby={field["aria-describedby"]}
          aria-invalid={field["aria-invalid"]}
          aria-required={field["aria-required"]}
          aria-label={ariaLabel}
          {...rest}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </span>
    );
  },
);

AmountInputBase.displayName = "AmountInputBase";
