import { useFormField } from "@utk09/finra-ui";
import {
  type ChangeEvent,
  forwardRef,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  displayDecimals,
  type IncrementAction,
  type IncrementContext,
  type NumericPrecision,
  resolveIncrement,
  type RoundingMode,
  type TickValidationMode,
  validateTick,
} from "../../utils/increment";
import { DEFAULT_PRICE_KEYMAP, type KeyMap, resolveKey } from "../../utils/keymap";
import {
  formatPrice,
  parsePrice,
  type PriceFormat,
  type PriceFormatOptions,
  type PriceFormatter,
  type PriceParser,
  type PriceParseResult,
  type PriceSegment,
  type PriceSegmentKind,
  segmentPrice,
} from "../../utils/priceFormat";

//  Types

/** Bundled instrument metadata; explicit props override these. */
export interface PriceInstrument {
  format?: PriceFormat;
  /** Primary decimals (e.g. 4 for FX `1.0834`). Alias: `precision`. */
  primaryPrecision?: number;
  /** Extra fractional-precision digits (e.g. 1 for the trailing pip fraction). */
  precisionDigits?: number;
  /** Total decimals shown (default primary + precisionDigits). */
  displayPrecision?: number;
  /** Legacy single-precision alias for `primaryPrecision`. */
  precision?: number;
  tickSize?: number;
  bondSeparator?: string;
  min?: number;
  max?: number;
}

/** Result of value-level validation (after a successful parse). */
export interface PriceValidationResult {
  valid: boolean;
  value: number;
  error?: "min" | "max" | "custom" | "tick";
}

/** Custom validator: return `false` or an error string to reject. */
export type PriceValidator = (value: number) => boolean | string;

/** Imperative handle exposed via `ref`. */
export interface PriceInputHandle {
  focus: () => void;
  select: () => void;
  commit: () => void;
  revert: () => void;
  /** Step by `steps` ticks (sign = direction). */
  step: (steps: number) => void;
  /** Apply any increment action programmatically. */
  increment: (action: IncrementAction, direction: 1 | -1) => void;
  /** Select the first segment of the given kind (e.g. "precision"). */
  selectGroup: (kind: PriceSegmentKind) => void;
  getValue: () => number | null;
}

export interface PriceInputClassNames {
  root?: string;
  input?: string;
  display?: string;
}

export interface PriceInputBaseProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "value" | "defaultValue" | "onChange" | "min" | "max" | "type" | "className"
> {
  /** Controlled numeric value. */
  value?: number | null;
  /** Initial value (uncontrolled). */
  defaultValue?: number | null;
  /** Fired when the committed value changes (null when cleared). */
  onChange?: (value: number | null) => void;
  /** Instrument metadata; explicit props win. Update freely (no remount). */
  instrument?: PriceInstrument;
  /** Quotation format. */
  format?: PriceFormat;
  /** Primary decimals. Alias for `primaryPrecision`. */
  precision?: number;
  /** Primary decimals (e.g. 4 for FX). */
  primaryPrecision?: number;
  /** Extra fractional-precision digits. */
  precisionDigits?: number;
  /** Total decimals shown. */
  displayPrecision?: number;
  /** Rounding strategy for increments/display. */
  rounding?: RoundingMode;
  /** Tick size for tick actions and tick validation. */
  tickSize?: number;
  /** How off-tick committed values are handled. */
  tickValidation?: TickValidationMode;
  /** Separator emitted for bond formatting. */
  bondSeparator?: string;
  /** Minimum value. */
  min?: number;
  /** Maximum value. */
  max?: number;
  /** Custom validator run after parsing. */
  validate?: PriceValidator;
  /** Consumer keyboard map (key+modifier → action). Defaults to the price map. */
  keymap?: KeyMap;
  /** Replaceable parser. Defaults to {@link parsePrice}. */
  parser?: PriceParser;
  /** Replaceable formatter. Defaults to {@link formatPrice}. */
  formatter?: PriceFormatter;
  /**
   * Render an aria-hidden overlay of digit segments over the (transparent)
   * input, for primary/precision visual hierarchy. The styled layer supplies a
   * token-styled default; omit for a plain input.
   */
  renderDisplay?: (segments: PriceSegment[], text: string) => ReactNode;
  /**
   * FX 3-zone display: number of pip digits. When set, segmentation switches to
   * big-figure / pips / fractional-pip (the trader view) instead of 2-tier.
   */
  pipDigits?: number;
  /** FX 3-zone: fractional digits before the pips (the big figure). Default 0. */
  bigFigureDigits?: number;
  /** On focus, select this digit group (e.g. "pips") so it's ready to edit. */
  selectOnFocus?: PriceSegmentKind;
  /** Disable the input. */
  disabled?: boolean;
  /** Make the input read-only (increment keys are inert). */
  readOnly?: boolean;
  /** Fired on an explicit commit (Enter / blur). */
  onCommit?: (value: number | null) => void;
  /** Fired on an increment, with the new value and direction. */
  onTick?: (value: number, direction: 1 | -1) => void;
  /** Fired on every parse attempt. */
  onParse?: (result: PriceParseResult) => void;
  /** Fired on value-level validation. */
  onValidate?: (result: PriceValidationResult) => void;
  /** CSS class names injected by the styled layer. */
  classNames?: PriceInputClassNames;
  /** data-* attributes injected by the styled layer. */
  dataAttributes?: Record<string, string>;
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
  "aria-label"?: string;
}

/** Default primary decimals by format. */
function defaultPrimary(format: PriceFormat): number {
  switch (format) {
    case "percent":
      return 3;
    case "basis-points":
      return 2;
    case "bond32":
      return 6;
    default:
      return 5;
  }
}

//  Component

export const PriceInputBase = forwardRef<PriceInputHandle, PriceInputBaseProps>(
  (
    {
      value,
      defaultValue,
      onChange,
      instrument,
      format,
      precision,
      primaryPrecision,
      precisionDigits,
      displayPrecision,
      rounding,
      tickSize,
      tickValidation,
      bondSeparator,
      min,
      max,
      validate,
      keymap = DEFAULT_PRICE_KEYMAP,
      parser = parsePrice,
      formatter = formatPrice,
      renderDisplay,
      pipDigits,
      bigFigureDigits,
      selectOnFocus,
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
      ...rest
    },
    forwardedRef,
  ) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const field = useFormField({
      id,
      "aria-describedby": ariaDescribedBy,
      "aria-invalid": ariaInvalid,
      disabled,
    });

    const fmt = format ?? instrument?.format ?? "decimal";

    // Precision model (explicit props → instrument → format default).
    const precisionModel = useMemo<NumericPrecision>(
      () => ({
        primaryPrecision:
          primaryPrecision ??
          instrument?.primaryPrecision ??
          precision ??
          instrument?.precision ??
          defaultPrimary(fmt),
        precisionDigits: precisionDigits ?? instrument?.precisionDigits ?? 0,
        displayPrecision: displayPrecision ?? instrument?.displayPrecision,
        rounding,
      }),
      [primaryPrecision, precision, precisionDigits, displayPrecision, rounding, fmt, instrument],
    );
    const displayDec = displayDecimals(precisionModel);

    // Effective tick size (bonds default to 1/32).
    const effTick = tickSize ?? instrument?.tickSize ?? (fmt === "bond32" ? 1 / 32 : undefined);

    const fmtOpts = useMemo<PriceFormatOptions>(
      () => ({
        format: fmt,
        precision: displayDec,
        tickSize: effTick,
        bondSeparator: bondSeparator ?? instrument?.bondSeparator,
      }),
      [fmt, displayDec, effTick, bondSeparator, instrument],
    );
    const incCtx = useMemo<IncrementContext>(
      () => ({ precision: precisionModel, tickSize: effTick }),
      [precisionModel, effTick],
    );

    const minEff = min ?? instrument?.min;
    const maxEff = max ?? instrument?.max;

    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = useState<number | null>(defaultValue ?? null);
    const currentValue = isControlled ? value : internalValue;

    const [inputText, setInputText] = useState(() =>
      defaultValue != null ? formatter(defaultValue, fmtOpts) : "",
    );

    // Sync a controlled value → formatted text (only on committed-value change).
    useEffect(() => {
      if (isControlled) setInputText(value != null ? formatter(value, fmtOpts) : "");
    }, [isControlled, value, formatter, fmtOpts]);

    const setCommitted = useCallback(
      (next: number | null) => {
        if (!isControlled) setInternalValue(next);
        if (next !== currentValue) onChange?.(next);
      },
      [isControlled, currentValue, onChange],
    );

    const revert = useCallback(() => {
      setInputText(currentValue != null ? formatter(currentValue, fmtOpts) : "");
    }, [currentValue, formatter, fmtOpts]);

    const validateValue = useCallback(
      (v: number): PriceValidationResult => {
        if (minEff != null && v < minEff) return { valid: false, value: v, error: "min" };
        if (maxEff != null && v > maxEff) return { valid: false, value: v, error: "max" };
        const custom = validate?.(v);
        if (custom === false || typeof custom === "string") {
          return { valid: false, value: v, error: "custom" };
        }
        return { valid: true, value: v };
      },
      [minEff, maxEff, validate],
    );

    const commit = useCallback(() => {
      const result = parser(inputText, fmtOpts);
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

      let v = result.value;
      // Tick validation (reject / warn / round / snap).
      if (tickValidation && effTick != null) {
        const tv = validateTick(v, effTick, tickValidation, displayDec);
        if (!tv.valid) {
          onValidate?.({ valid: false, value: v, error: "tick" });
          revert();
          return;
        }
        v = tv.value;
      }

      setInputText(formatter(v, fmtOpts));
      setCommitted(v);
      onCommit?.(v);
    }, [
      parser,
      inputText,
      fmtOpts,
      onParse,
      revert,
      validateValue,
      onValidate,
      tickValidation,
      effTick,
      displayDec,
      formatter,
      setCommitted,
      onCommit,
    ]);

    const applyIncrement = useCallback(
      (direction: 1 | -1, action: IncrementAction) => {
        if (disabled || readOnly) return;
        const parsed = parser(inputText, fmtOpts);
        const base = parsed.valid && parsed.value !== null ? parsed.value : (currentValue ?? 0);
        let next = resolveIncrement(base, direction, action, incCtx);
        if (minEff != null && next < minEff) next = minEff;
        if (maxEff != null && next > maxEff) next = maxEff;
        setInputText(formatter(next, fmtOpts));
        setCommitted(next);
        onTick?.(next, direction);
      },
      [
        disabled,
        readOnly,
        parser,
        inputText,
        fmtOpts,
        currentValue,
        incCtx,
        minEff,
        maxEff,
        formatter,
        setCommitted,
        onTick,
      ],
    );

    const handleChange = useCallback(
      (event: ChangeEvent<HTMLInputElement>) => {
        if (disabled || readOnly) return;
        setInputText(event.target.value);
      },
      [disabled, readOnly],
    );

    const handleKeyDown = useCallback(
      (event: KeyboardEvent<HTMLInputElement>) => {
        if (disabled) return;
        const bound = resolveKey(event, keymap);
        if (!bound) return;
        // Left/Right navigation is handled by the native caret for now
        // (digit-aware navigation is a display-layer concern).
        if (bound.kind === "nav") return;

        event.preventDefault();
        if (bound.kind === "commit") commit();
        else if (bound.kind === "revert") revert();
        else applyIncrement(bound.direction, bound.action);
      },
      [disabled, keymap, commit, revert, applyIncrement],
    );

    // Digit segments for the visual-hierarchy overlay + group selection.
    // FX 3-zone when pipDigits is set, otherwise 2-tier by primaryPrecision.
    const segments = useMemo(
      () =>
        segmentPrice(
          inputText,
          pipDigits != null
            ? { bigFigureDigits, pipDigits }
            : { primaryPrecision: precisionModel.primaryPrecision },
        ),
      [inputText, pipDigits, bigFigureDigits, precisionModel],
    );

    const selectGroup = useCallback(
      (kind: PriceSegmentKind) => {
        const input = inputRef.current;
        if (!input) return;
        let offset = 0;
        for (const seg of segments) {
          if (seg.kind === kind) {
            input.focus();
            input.setSelectionRange(offset, offset + seg.text.length);
            return;
          }
          offset += seg.text.length;
        }
      },
      [segments],
    );

    const handleFocus = useCallback(() => {
      // Defer so it wins over the browser's own focus selection.
      if (selectOnFocus) requestAnimationFrame(() => selectGroup(selectOnFocus));
    }, [selectOnFocus, selectGroup]);

    useImperativeHandle(
      forwardedRef,
      () => ({
        focus: () => inputRef.current?.focus(),
        select: () => inputRef.current?.select(),
        commit,
        revert,
        step: (steps: number) =>
          applyIncrement(steps >= 0 ? 1 : -1, { type: "tick", ticks: Math.abs(steps) || 1 }),
        increment: (action, direction) => applyIncrement(direction, action),
        selectGroup,
        getValue: () => currentValue ?? null,
      }),
      [commit, revert, applyIncrement, selectGroup, currentValue],
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
          aria-valuemin={minEff}
          aria-valuemax={maxEff}
          aria-valuetext={currentValue != null ? formatter(currentValue, fmtOpts) : undefined}
          aria-describedby={field["aria-describedby"]}
          aria-invalid={field["aria-invalid"]}
          aria-required={field["aria-required"]}
          aria-label={ariaLabel}
          onChange={handleChange}
          onBlur={commit}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          {...rest}
        />
        {renderDisplay ? (
          <span className={cn?.display} aria-hidden="true">
            {renderDisplay(segments, inputText)}
          </span>
        ) : null}
      </span>
    );
  },
);

PriceInputBase.displayName = "PriceInputBase";
