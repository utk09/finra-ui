import { FINRA_UI_ATTR, useFormField } from "@utk09/finra-ui";
import {
  type ChangeEvent,
  type FocusEvent,
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

import { componentIds } from "../../componentIds";
import {
  displayDecimals,
  type IncrementAction,
  type IncrementContext,
  type NumericPrecision,
  type RoundingMode,
  resolveIncrement,
  type TickValidationMode,
  validateTick,
} from "../../utils/increment";
import { DEFAULT_PRICE_KEYMAP, type KeyMap, resolveKey } from "../../utils/keymap";
import {
  formatPrice,
  type PriceFormat,
  type PriceFormatOptions,
  type PriceFormatter,
  type PriceInstrument,
  type PriceParseResult,
  type PriceParser,
  type PriceSegment,
  type PriceSegmentKind,
  parsePrice,
  segmentPrice,
} from "../../utils/priceFormat";

//  Types

/** Result of value-level validation (after a successful parse). */
export interface PriceValidationResult {
  /** Whether the value may be committed. */
  valid: boolean;
  /** The parsed value that was tested, whether or not it passed. */
  value: number;
  /** Which rule rejected it. `"tick"` means it is off the tick grid. */
  error?: "min" | "max" | "custom" | "tick";
}

/** Custom validator: return `false` or an error string to reject. */
export type PriceValidator = (value: number) => boolean | string;

/** Imperative handle exposed via `ref`. */
export interface PriceInputHandle {
  /** Move DOM focus to the field. */
  focus: () => void;
  /** Focus and select the whole text - the "replace what is there" gesture. */
  select: () => void;
  /** Commit the current text as if the user had blurred or pressed Enter. */
  commit: () => void;
  /** Discard the current edit and redraw the committed value. */
  revert: () => void;
  /**
   * Step by `steps` ticks (sign = direction).
   *
   * @remarks
   * Snaps an off-tick value onto the grid first, so `0` is a meaningful call -
   * it rounds in place rather than doing nothing.
   */
  step: (steps: number) => void;
  /** Apply any increment action programmatically. */
  increment: (action: IncrementAction, direction: 1 | -1) => void;
  /** Select the first segment of the given kind (e.g. "precision"). */
  selectGroup: (kind: PriceSegmentKind) => void;
  /** The committed value, or null. Reads through immediately after `commit`. */
  getValue: () => number | null;
}

/**
 * CSS class overrides the styled layer injects into the unstyled base.
 *
 * @remarks
 * Every key is optional - when absent, no className is applied at all.
 */
export interface PriceInputClassNames {
  /** Outermost element. */
  root?: string;
  /** The text field. */
  input?: string;
  /** The resting segmented display shown over the field when unfocused. */
  display?: string;
}

/**
 * Props for the unstyled PriceInput.
 *
 * @remarks
 * Ships no CSS - supply {@link PriceInputClassNames}, or style via the `data-*`
 * hooks.
 *
 * Understands the notations desks use: decimal, FX big-figure/pips, bond 32nds
 * (`101-16`, `101-16+`), percent and basis points. Arrows step by tick rather
 * than by `1`, snapping an off-tick value onto the grid first.
 *
 * A no-op commit fires nothing: stepping into a bound you are already sitting
 * on reports no change, so `onChange` is never called with the current value.
 */
export interface PriceInputBaseProps
  extends Omit<
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
  /** Explicit control id. Auto-generated, or taken from an enclosing FormField, if omitted. */
  id?: string;
  /** Ids of describing elements. Merged with any an enclosing FormField supplies. */
  "aria-describedby"?: string;
  /** Marks the control invalid. An enclosing FormField sets this from its own validation status. */
  "aria-invalid"?: boolean;
  /** Accessible name. Required unless an enclosing FormField or a visible label supplies one. */
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

/**
 * Unstyled PriceInput. Ships no CSS; supply `classNames`.
 *
 * @see {@link PriceInputBaseProps}
 */
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
      // Pulled out of `rest` and forwarded explicitly. Left in `rest`, a
      // consumer passing any of the three would *replace* this field's own
      // handler rather than add to it - silently disabling commit-on-blur or
      // the entire increment keymap.
      onFocus: onFocusProp,
      onBlur: onBlurProp,
      onKeyDown: onKeyDownProp,
      ...rest
    },
    forwardedRef,
  ) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const focusedRef = useRef(false);

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

    // Bumped on every commit attempt. The display sync below keys off it as well
    // as off the value, so a commit re-derives the text even when the value it
    // settles on is the one already held - which is exactly what a controlled
    // parent declining the change looks like from in here.
    const [commitNonce, setCommitNonce] = useState(0);

    /** A value as display text. */
    const renderValue = useCallback(
      (v: number | null) => (v != null ? formatter(v, fmtOpts) : ""),
      [formatter, fmtOpts],
    );

    /**
     * The displayed text is derived from the value the field actually holds -
     * never left as whatever the last interaction proposed.
     *
     * Two cases this exists for, both of which showed the wrong price without
     * it:
     *
     * - **A controlled parent that declines the change.** `value` does not move,
     *   so a value-keyed effect never fires, and the field would go on showing
     *   the price the parent rejected. The commit counter is what makes the sync
     *   happen anyway. Display text is only the field's to choose while
     *   uncontrolled.
     * - **A formatting prop changing while uncontrolled** - `instrument`,
     *   `format`, `precision`, `tickSize`. `instrument` is documented as safe to
     *   update in place, so the resting text has to follow it without waiting
     *   for the next focus/blur cycle.
     *
     * Skipped while focused so a parent re-render cannot overwrite a live edit,
     * except straight after a commit, where re-deriving is the entire point.
     */
    const lastSyncedCommit = useRef(commitNonce);
    useEffect(() => {
      const afterCommit = lastSyncedCommit.current !== commitNonce;
      lastSyncedCommit.current = commitNonce;
      if (focusedRef.current && !afterCommit) return;
      setInputText(renderValue(currentValue ?? null));
    }, [currentValue, renderValue, commitNonce]);

    const setCommitted = useCallback(
      (next: number | null) => {
        if (!isControlled) setInternalValue(next);
        if (next !== currentValue) onChange?.(next);
      },
      [isControlled, currentValue, onChange],
    );

    const revert = useCallback(() => {
      setInputText(renderValue(currentValue));
    }, [renderValue, currentValue]);

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
      // Wakes the sync effect above even when the committed value turns out to
      // be the one already held - which is what a controlled parent declining
      // the change looks like from in here. The text is still set eagerly on
      // each path: leaving it to the effect alone would leave the raw typed
      // text on screen until passive effects flush, a visible flicker on blur.
      setCommitNonce((n) => n + 1);

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

      setInputText(renderValue(v));
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
      renderValue,
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

        // Same gate the commit path applies. `min`/`max` are clamped above, but
        // a custom `validate` can still reject the result, and a stepped price
        // that skips the check would be a value the field would refuse if the
        // identical number were typed.
        const validation = validateValue(next);
        onValidate?.(validation);
        setCommitNonce((n) => n + 1);
        if (!validation.valid) {
          revert();
          return;
        }

        setInputText(renderValue(next));
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
        validateValue,
        onValidate,
        revert,
        renderValue,
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
        // First, and for every key: a consumer's `onKeyDown` must fire for the
        // keys this field ignores, and calling `preventDefault` is how it takes
        // a binding back for itself.
        onKeyDownProp?.(event);
        if (disabled || event.defaultPrevented) return;
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
      [disabled, keymap, commit, revert, applyIncrement, onKeyDownProp],
    );

    const handleBlur = useCallback(
      (event: FocusEvent<HTMLInputElement>) => {
        focusedRef.current = false;
        commit();
        onBlurProp?.(event);
      },
      [commit, onBlurProp],
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

    const handleFocus = useCallback(
      (event: FocusEvent<HTMLInputElement>) => {
        focusedRef.current = true;
        // Defer so it wins over the browser's own focus selection.
        if (selectOnFocus) requestAnimationFrame(() => selectGroup(selectOnFocus));
        onFocusProp?.(event);
      },
      [selectOnFocus, selectGroup, onFocusProp],
    );

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
      <span
        className={cn?.root}
        {...{ [FINRA_UI_ATTR]: componentIds.priceInput }}
        {...dataAttributes}>
        <input
          ref={inputRef}
          className={cn?.input}
          {...{ [FINRA_UI_ATTR]: componentIds.priceInputField }}
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
          {...rest}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
        />
        {renderDisplay ? (
          <span
            className={cn?.display}
            aria-hidden="true"
            {...{ [FINRA_UI_ATTR]: componentIds.priceInputDisplay }}>
            {renderDisplay(segments, inputText)}
          </span>
        ) : null}
      </span>
    );
  },
);

PriceInputBase.displayName = "PriceInputBase";
