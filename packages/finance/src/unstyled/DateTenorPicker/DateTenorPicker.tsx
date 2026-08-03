import { FINRA_UI_ATTR, useClickOutside, useFormField } from "@utk09/finra-ui";
import { cx } from "@utk09/finra-ui/utils";
import {
  type ChangeEvent,
  type FocusEvent,
  forwardRef,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";

import { componentIds } from "../../componentIds";
import type { DateFormat } from "../../utils/dateFormat";
import { formatDate, validateDate } from "../../utils/dateFormat";
import type {
  DateTenorMode,
  DateTenorParseContext,
  DateTenorParseError,
  DateTenorParseResult,
} from "../../utils/dateTenorParse";
import { parseDateTenor } from "../../utils/dateTenorParse";
import { dateToTenor } from "../../utils/tenor";
import type { CalendarClassNames } from "../Calendar/Calendar";
import { CalendarBase } from "../Calendar/Calendar";

//  Types

/** Default market tenor suggestions. */
const DEFAULT_TENOR_OPTIONS = [
  "ON",
  "TN",
  "SN",
  "1W",
  "2W",
  "3W",
  "1M",
  "2M",
  "3M",
  "6M",
  "9M",
  "1Y",
  "18M",
  "2Y",
  "5Y",
] as const;

/** A committed selection. `date` is the settlement date (post `settlementEngine`). */
export interface DateTenorValue {
  /** Raw text the user committed (e.g. `"spot+3m"`). */
  input: string;
  /** Canonical display text (e.g. `"Spot + 3M"`). */
  display: string;
  /** How the input was interpreted. */
  mode: DateTenorMode;
  /** Canonical tenor string, when applicable. */
  tenor: string | null;
  /** Resolved settlement/value date. */
  date: Date | null;
  /**
   * The standard tenor this date lands on (e.g. `"3M"`), or `null` when it is a
   * broken date. Computed against `referenceDate` on commit.
   */
  standardTenor?: string | null;
}

/** Why a commit was rejected. */
export type DateTenorInvalidReason =
  | DateTenorParseError
  | "disabled-tenor"
  | "disabled-date"
  | "no-settlement";

/** Business-day roll convention passed to the calendar adapter's `adjust`. */
export type AdjustmentConvention =
  | "none"
  | "following"
  | "modified-following"
  | "preceding"
  | "modified-preceding";

/** Adjusts the parser's raw preview date to a settlement date. Default: identity. */
export type SettlementEngine = (previewDate: Date, result: DateTenorParseResult) => Date | null;

/**
 * Injected business calendar. Omitted → every day is a business day. `adjust`
 * (holiday/business-day roll) is delegated to the consumer per market rules.
 */
export interface BusinessCalendar {
  /**
   * Whether the date is a business day. Non-business days render disabled and
   * are refused on commit.
   *
   * @remarks
   * Holiday calendars are desk- and currency-specific, so this is injected
   * rather than assumed. Omit it and every calendar day is selectable.
   */
  isBusinessDay?: (date: Date) => boolean;
  /**
   * Roll a date onto a business day under the given convention.
   *
   * @remarks
   * Applied *after* settlement, and only when `adjustmentConvention` is set to
   * something other than `"none"`.
   */
  adjust?: (date: Date, convention: AdjustmentConvention) => Date;
}

/** Replacement parser (same signature as {@link parseDateTenor}). */
export type DateTenorParserFn = (
  input: string,
  ctx?: DateTenorParseContext,
) => DateTenorParseResult;

/** Imperative handle exposed via `ref`. */
export interface DateTenorPickerHandle {
  /** Move DOM focus to the text field. */
  focus: () => void;
  /** Commit `null`. Fires `onChange`, exactly as clearing by hand would. */
  clear: () => void;
  /** Open the popup. A no-op while disabled or read-only. */
  open: () => void;
  /** Close the popup and drop any highlight. */
  close: () => void;
  /** The committed value, or null. Carries date, tenor, mode and standard tenor. */
  getValue: () => DateTenorValue | null;
}

/**
 * CSS class overrides the styled layer injects into the unstyled base.
 *
 * @remarks
 * Every key is optional - when absent, no className is applied at all (not an
 * empty `class` attribute).
 */
export interface DateTenorPickerClassNames {
  /** Outermost element. */
  root?: string;
  /** Applied to the root *in addition to* `root` while the popup is open. */
  rootOpen?: string;
  /** The text field. */
  input?: string;
  /** The calendar-icon toggle button beside the field. */
  adornment?: string;
  /** The open/close affordance. */
  indicator?: string;
  /** Applied to the indicator *in addition to* `indicator` while open. */
  indicatorOpen?: string;
  /** The popup panel holding both the calendar and the tenor list. */
  popup?: string;
  /** The calendar half of the popup. */
  calendarSection?: string;
  /** The tenor-list half of the popup. */
  tenorSection?: string;
  /** The tenor list's heading. */
  tenorTitle?: string;
  /** The tenor list container. */
  tenorGrid?: string;
  /** One tenor option. */
  tenor?: string;
  /** The roving keyboard highlight - transient, follows the arrow keys. */
  tenorHighlighted?: string;
  /** The committed tenor - persists between openings. Orthogonal to the highlight. */
  tenorSelected?: string;
  /** Added to a tenor whose resolved date is unavailable. */
  tenorDisabled?: string;
  /** The resolved-date badge in the field row, shown when `showResolvedDate` is on. */
  resolvedDate?: string;
  /** The mode badge (Date / Tenor / Spot) in the field row. */
  modeIndicator?: string;
  /** The broken-date badge in the field row. */
  brokenIndicator?: string;
  /** Passed through to the embedded Calendar. */
  calendar?: CalendarClassNames;
}

/**
 * Props for the unstyled DateTenorPicker.
 *
 * @remarks
 * Ships no CSS - supply {@link DateTenorPickerClassNames}, or style via the
 * `data-*` hooks.
 *
 * Everything market-specific is injected rather than assumed: `parser` for the
 * expression grammar, `settlementEngine` for spot lag, `calendar` for
 * business-day rules. The component owns the interaction, the desk owns the
 * conventions.
 */
export interface DateTenorPickerBaseProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue" | "onInvalid"> {
  /** Controlled value. */
  value?: DateTenorValue | null;
  /** Initial value (uncontrolled). */
  defaultValue?: DateTenorValue | null;
  /** Fired when the committed value changes (null when cleared). */
  onChange?: (value: DateTenorValue | null) => void;
  /** Replaceable parser. Defaults to {@link parseDateTenor}. */
  parser?: DateTenorParserFn;
  /** "Today" reference for keywords / plain tenors. */
  referenceDate?: Date;
  /** Base date for spot-relative expressions (defaults to `referenceDate`). */
  spotDate?: Date;
  /** Primary date format (display + first parse candidate). Default "YYYY-MM-DD". */
  dateFormat?: DateFormat;
  /** Business calendar used to disable non-business days. */
  calendar?: BusinessCalendar;
  /** Adjust the preview date to a settlement date (business-day/holiday). */
  settlementEngine?: SettlementEngine;
  /**
   * Roll convention applied via `calendar.adjust` after settlement. Requires
   * `calendar.adjust`. Default "none" (no adjustment).
   */
  adjustmentConvention?: AdjustmentConvention;
  /** Tenor suggestions shown in the popup. */
  tenorOptions?: readonly string[];
  /** Heading above the tenor grid. */
  tenorSectionTitle?: string;
  /** Minimum selectable date. */
  minDate?: Date;
  /** Maximum selectable date. */
  maxDate?: Date;
  /** Dates that cannot be selected. */
  disabledDates?: Date[] | ((date: Date) => boolean);
  /** Tenors that cannot be committed/selected. */
  disabledTenors?: string[];
  /** Disable the whole control. */
  disabled?: boolean;
  /** Make the control read-only. */
  readOnly?: boolean;
  /** Input placeholder. */
  placeholder?: string;
  /** 0 = Sunday, 1 = Monday. Default 1. */
  weekStartsOn?: 0 | 1;
  /**
   * BCP 47 locale for the calendar popup's month/weekday names and day
   * labels. Defaults to the runtime locale. Display only - date parsing is
   * unaffected by this.
   */
  locale?: string;
  /** CSS class names injected by the styled layer. */
  classNames?: DateTenorPickerClassNames;
  /** data-* attributes injected by the styled layer. */
  dataAttributes?: Record<string, string>;
  /** Render the calendar toggle icon. */
  renderCalendarIcon?: () => ReactNode;
  /** Render the dropdown indicator (receives open state). */
  renderIndicator?: (isOpen: boolean) => ReactNode;
  /** Render the calendar prev-month nav icon. */
  renderCalendarNavPrev?: () => ReactNode;
  /** Render the calendar next-month nav icon. */
  renderCalendarNavNext?: () => ReactNode;
  /** Show the resolved settlement date alongside the field (coexists with the display). */
  showResolvedDate?: boolean;
  /** Format for the resolved date: a `DateFormat` or a custom formatter. */
  resolvedDateFormat?: DateFormat | ((date: Date) => string);
  /** Render a mode indicator (date / tenor / spot-relative). Receives the committed mode. */
  renderModeIndicator?: (mode: DateTenorMode | null) => ReactNode;
  /** Render a broken-date indicator. Receives whether the committed date is broken. */
  renderBrokenIndicator?: (broken: boolean) => ReactNode;
  /** Fired on every parse attempt (typed commit, tenor pick). */
  onParse?: (result: DateTenorParseResult) => void;
  /** Fired when a commit is rejected. */
  onInvalid?: (reason: DateTenorInvalidReason) => void;
  /** Fired when the committed mode changes. */
  onModeChange?: (mode: DateTenorMode | null) => void;
  /** Fired when the popup opens. */
  onOpen?: () => void;
  /** Fired when the popup closes. */
  onClose?: () => void;
  /** id for the input element. */
  id?: string;
  /** Ids of describing elements. Merged with any an enclosing FormField supplies. */
  "aria-describedby"?: string;
  /** Marks the control invalid. An enclosing FormField sets this from its own validation status. */
  "aria-invalid"?: boolean;
  /** Accessible name. Required unless an enclosing FormField or a visible label supplies one. */
  "aria-label"?: string;
}

//  Component

/**
 * Unstyled DateTenorPicker. Ships no CSS; supply `classNames`.
 *
 * @see {@link DateTenorPickerBaseProps}
 */
export const DateTenorPickerBase = forwardRef<DateTenorPickerHandle, DateTenorPickerBaseProps>(
  (
    {
      value,
      defaultValue,
      onChange,
      parser = parseDateTenor,
      referenceDate,
      spotDate,
      dateFormat = "YYYY-MM-DD",
      calendar,
      settlementEngine,
      adjustmentConvention,
      tenorOptions = DEFAULT_TENOR_OPTIONS,
      tenorSectionTitle = "Tenors",
      minDate,
      maxDate,
      disabledDates,
      disabledTenors,
      disabled,
      readOnly,
      placeholder = "e.g. 3M, Spot + 3M, Today, 2028-04-15",
      weekStartsOn,
      locale,
      classNames: cn,
      dataAttributes,
      renderCalendarIcon,
      renderIndicator,
      renderCalendarNavPrev,
      renderCalendarNavNext,
      showResolvedDate,
      resolvedDateFormat,
      renderModeIndicator,
      renderBrokenIndicator,
      onParse,
      onInvalid,
      onModeChange,
      onOpen,
      onClose,
      id,
      "aria-describedby": ariaDescribedBy,
      "aria-invalid": ariaInvalid,
      "aria-label": ariaLabel,
      ...props
    },
    forwardedRef,
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const baseId = useId();
    const popupId = `${baseId}-popup`;
    const listboxId = `${baseId}-tenors`;
    const optionId = (index: number): string => `${baseId}-tenor-${index}`;

    // FormField wiring (id, aria-describedby/invalid/required); no-op standalone.
    const field = useFormField({
      id,
      "aria-describedby": ariaDescribedBy,
      "aria-invalid": ariaInvalid,
      disabled,
    });

    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = useState<DateTenorValue | null>(defaultValue ?? null);
    const currentValue = isControlled ? value : internalValue;

    const [inputText, setInputText] = useState(() => (defaultValue ? defaultValue.display : ""));
    const [isOpen, setIsOpen] = useState(false);
    const [highlight, setHighlight] = useState(-1);

    const prevModeRef = useRef<DateTenorMode | null>(defaultValue?.mode ?? null);

    // Bumped on every commit attempt, so the sync effect below keys off it as
    // well as off the value.
    const [commitNonce, setCommitNonce] = useState(0);

    // Keep the visible text in step with the value the field actually holds.
    useEffect(() => {
      // `commitNonce` is read, not just depended on, so the intent is plain: a
      // commit that settles on the value already held - which is what a
      // controlled parent declining the change looks like from in here - still
      // re-derives the text instead of leaving the rejected entry on screen.
      void commitNonce;
      setInputText(currentValue ? currentValue.display : "");
    }, [currentValue, commitNonce]);

    //  Parse context + validation

    const dateFormats = useMemo<DateFormat[]>(
      () => [...new Set<DateFormat>([dateFormat, "YYYY-MM-DD", "DD/MM/YYYY", "MM/DD/YYYY"])],
      [dateFormat],
    );

    const parseCtx = useMemo<DateTenorParseContext>(
      () => ({ referenceDate, spotDate, dateFormats }),
      [referenceDate, spotDate, dateFormats],
    );

    const isDateDisabled = useCallback(
      (date: Date): boolean => {
        if (!validateDate(date, { min: minDate, max: maxDate, disabledDates }).valid) return true;
        if (calendar?.isBusinessDay && !calendar.isBusinessDay(date)) return true;
        return false;
      },
      [minDate, maxDate, disabledDates, calendar],
    );

    const settle = useCallback(
      (date: Date, result: DateTenorParseResult): Date | null => {
        const settled = settlementEngine ? settlementEngine(date, result) : date;
        if (
          settled &&
          adjustmentConvention &&
          adjustmentConvention !== "none" &&
          calendar?.adjust
        ) {
          return calendar.adjust(settled, adjustmentConvention);
        }
        return settled;
      },
      [settlementEngine, adjustmentConvention, calendar],
    );

    // The standard tenor a resolved date lands on (else null = broken date).
    const standardTenorFor = useCallback(
      (date: Date): string | null => dateToTenor(date, referenceDate ?? new Date()),
      [referenceDate],
    );

    //  Open / close

    const openPopup = useCallback(() => {
      if (disabled || readOnly) return;
      setIsOpen((prev) => {
        if (!prev) onOpen?.();
        return true;
      });
    }, [disabled, readOnly, onOpen]);

    const closePopup = useCallback(() => {
      setHighlight(-1);
      setIsOpen((prev) => {
        if (prev) onClose?.();
        return false;
      });
    }, [onClose]);

    useClickOutside(containerRef, closePopup, isOpen);

    //  Commit

    const commitValue = useCallback(
      (next: DateTenorValue | null) => {
        setCommitNonce((n) => n + 1);
        if (!isControlled) setInternalValue(next);
        onChange?.(next);
        const nextMode = next?.mode ?? null;
        if (nextMode !== prevModeRef.current) {
          prevModeRef.current = nextMode;
          onModeChange?.(nextMode);
        }
      },
      [isControlled, onChange, onModeChange],
    );

    /** Parse + validate + settle `raw`, committing on success. Returns success. */
    const commitText = useCallback(
      (raw: string): boolean => {
        const trimmed = raw.trim();
        if (!trimmed) {
          setInputText("");
          commitValue(null);
          return true;
        }

        const result = parser(trimmed, parseCtx);
        onParse?.(result);

        if (!result.valid || !result.date) {
          onInvalid?.(result.error ?? "unrecognized");
          return false;
        }
        if (result.tenor && disabledTenors?.includes(result.tenor)) {
          onInvalid?.("disabled-tenor");
          return false;
        }
        const settled = settle(result.date, result);
        if (!settled) {
          onInvalid?.("no-settlement");
          return false;
        }
        if (isDateDisabled(settled)) {
          onInvalid?.("disabled-date");
          return false;
        }

        const next: DateTenorValue = {
          input: trimmed,
          display: result.display ?? trimmed,
          mode: result.mode as DateTenorMode,
          tenor: result.tenor,
          date: settled,
          standardTenor: standardTenorFor(settled),
        };
        setInputText(next.display);
        commitValue(next);
        return true;
      },
      [
        parser,
        parseCtx,
        onParse,
        onInvalid,
        disabledTenors,
        settle,
        isDateDisabled,
        standardTenorFor,
        commitValue,
      ],
    );

    //  Tenor suggestion metadata (resolved date + disabled state)

    const tenorMeta = useMemo(
      () =>
        tenorOptions.map((tenor) => {
          const result = parser(tenor, parseCtx);
          const date = result.valid ? result.date : null;
          const isDisabled = !date || !!disabledTenors?.includes(tenor) || isDateDisabled(date);
          return { tenor, disabled: isDisabled };
        }),
      [tenorOptions, parser, parseCtx, disabledTenors, isDateDisabled],
    );

    const selectTenor = useCallback(
      (index: number) => {
        const meta = tenorMeta[index];
        if (!meta || meta.disabled) return;
        commitText(meta.tenor);
        closePopup();
        inputRef.current?.focus();
      },
      [tenorMeta, commitText, closePopup],
    );

    //  Live preview date (post-settlement) for the calendar highlight

    const previewDate = useMemo<Date | null>(() => {
      const trimmed = inputText.trim();
      if (!trimmed) return null;
      const result = parser(trimmed, parseCtx);
      if (!result.valid || !result.date) return null;
      return settle(result.date, result);
    }, [inputText, parser, parseCtx, settle]);

    const calendarValue = currentValue?.date ?? previewDate;

    //  Handlers

    const handleInputChange = useCallback(
      (event: ChangeEvent<HTMLInputElement>) => {
        if (disabled || readOnly) return;
        setInputText(event.target.value);
        setHighlight(-1);
      },
      [disabled, readOnly],
    );

    const handleInputBlur = useCallback(
      (event: FocusEvent<HTMLInputElement>) => {
        // Focus moving into the popup (calendar / tenor list) is not a real
        // blur-commit; the popup's own click handler commits instead.
        if (containerRef.current?.contains(event.relatedTarget as Node | null)) return;
        commitText(inputText);
      },
      [commitText, inputText],
    );

    const moveHighlight = useCallback(
      (direction: 1 | -1) => {
        setHighlight((current) => {
          const count = tenorMeta.length;
          if (count === 0) return -1;
          const base = current < 0 ? 0 : current + direction;
          return Math.max(0, Math.min(count - 1, base));
        });
      },
      [tenorMeta.length],
    );

    const handleInputKeyDown = useCallback(
      (event: KeyboardEvent<HTMLInputElement>) => {
        if (disabled || readOnly) return;

        if (event.key === "ArrowDown") {
          event.preventDefault();
          if (!isOpen) openPopup();
          else moveHighlight(1);
        } else if (event.key === "ArrowUp") {
          event.preventDefault();
          if (isOpen) moveHighlight(-1);
        } else if (event.key === "Enter") {
          event.preventDefault();
          if (isOpen && highlight >= 0) selectTenor(highlight);
          else if (commitText(inputText)) closePopup();
        } else if (event.key === "Escape") {
          if (isOpen) {
            event.preventDefault();
            closePopup();
          }
        } else if (event.key === " " && event.ctrlKey) {
          event.preventDefault();
          openPopup();
          setHighlight(0);
        }
        // Tab falls through: blur commits, native focus move proceeds.
      },
      [
        disabled,
        readOnly,
        isOpen,
        highlight,
        inputText,
        openPopup,
        moveHighlight,
        selectTenor,
        commitText,
        closePopup,
      ],
    );

    const togglePopup = useCallback(() => {
      if (disabled || readOnly) return;
      if (isOpen) closePopup();
      else openPopup();
    }, [disabled, readOnly, isOpen, closePopup, openPopup]);

    const handleCalendarSelect = useCallback(
      (date: Date) => {
        const result: DateTenorParseResult = {
          valid: true,
          mode: "date",
          date,
          tenor: null,
          display: formatDate(date, dateFormat),
        };
        onParse?.(result);
        const settled = settle(date, result);
        if (!settled || isDateDisabled(settled)) {
          onInvalid?.("disabled-date");
          return;
        }
        const next: DateTenorValue = {
          input: result.display as string,
          display: result.display as string,
          mode: "date",
          tenor: null,
          date: settled,
          standardTenor: standardTenorFor(settled),
        };
        setInputText(next.display);
        commitValue(next);
        closePopup();
        inputRef.current?.focus();
      },
      [
        dateFormat,
        onParse,
        settle,
        isDateDisabled,
        onInvalid,
        standardTenorFor,
        commitValue,
        closePopup,
      ],
    );

    //  Imperative handle

    useImperativeHandle(
      forwardedRef,
      () => ({
        focus: () => inputRef.current?.focus(),
        clear: () => {
          setInputText("");
          commitValue(null);
        },
        open: openPopup,
        close: closePopup,
        getValue: () => currentValue ?? null,
      }),
      [openPopup, closePopup, commitValue, currentValue],
    );

    const activeDescendant = isOpen && highlight >= 0 ? optionId(highlight) : undefined;

    const formatResolved = (date: Date): string =>
      typeof resolvedDateFormat === "function"
        ? resolvedDateFormat(date)
        : formatDate(date, resolvedDateFormat ?? dateFormat);

    return (
      <div
        ref={containerRef}
        className={cx(cn?.root, isOpen && cn?.rootOpen)}
        {...{ [FINRA_UI_ATTR]: componentIds.dateTenorPicker }}
        {...dataAttributes}
        {...props}>
        <input
          ref={inputRef}
          className={cn?.input}
          {...{ [FINRA_UI_ATTR]: componentIds.dateTenorPickerField }}
          type="text"
          role="combobox"
          id={field.id}
          value={inputText}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          autoComplete="off"
          aria-expanded={isOpen}
          aria-controls={isOpen ? popupId : undefined}
          aria-haspopup="dialog"
          aria-activedescendant={activeDescendant}
          aria-describedby={field["aria-describedby"]}
          aria-invalid={field["aria-invalid"]}
          aria-required={field["aria-required"]}
          aria-label={ariaLabel}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          onClick={() => {
            if (!disabled && !readOnly && !isOpen) openPopup();
          }}
        />

        {renderCalendarIcon ? (
          <button
            type="button"
            className={cn?.adornment}
            {...{ [FINRA_UI_ATTR]: componentIds.dateTenorPickerAdornment }}
            onClick={togglePopup}
            tabIndex={-1}
            aria-label="Toggle date and tenor picker"
            disabled={disabled}>
            {renderCalendarIcon()}
          </button>
        ) : null}

        {renderModeIndicator && currentValue ? (
          <span
            className={cn?.modeIndicator}
            {...{ [FINRA_UI_ATTR]: componentIds.dateTenorPickerModeIndicator }}>
            {renderModeIndicator(currentValue.mode)}
          </span>
        ) : null}

        {renderBrokenIndicator && currentValue?.mode === "date" ? (
          <span
            className={cn?.brokenIndicator}
            {...{ [FINRA_UI_ATTR]: componentIds.dateTenorPickerBrokenIndicator }}>
            {renderBrokenIndicator(currentValue.standardTenor == null)}
          </span>
        ) : null}

        {showResolvedDate && currentValue?.date ? (
          <span
            className={cn?.resolvedDate}
            {...{ [FINRA_UI_ATTR]: componentIds.dateTenorPickerResolvedDate }}>
            {formatResolved(currentValue.date)}
          </span>
        ) : null}

        {renderIndicator ? (
          <span
            className={cx(cn?.indicator, isOpen && cn?.indicatorOpen)}
            aria-hidden="true"
            {...{ [FINRA_UI_ATTR]: componentIds.dateTenorPickerIndicator }}>
            {renderIndicator(isOpen)}
          </span>
        ) : null}

        {isOpen ? (
          <div
            className={cn?.popup}
            {...{ [FINRA_UI_ATTR]: componentIds.dateTenorPickerPopup }}
            id={popupId}>
            <div
              className={cn?.calendarSection}
              {...{ [FINRA_UI_ATTR]: componentIds.dateTenorPickerCalendarSection }}>
              <CalendarBase
                value={calendarValue}
                onSelect={handleCalendarSelect}
                min={minDate}
                max={maxDate}
                disabledDates={isDateDisabled}
                highlightedDates={previewDate ? [previewDate] : undefined}
                today={referenceDate}
                weekStartsOn={weekStartsOn}
                locale={locale}
                classNames={cn?.calendar}
                renderNavPrev={renderCalendarNavPrev}
                renderNavNext={renderCalendarNavNext}
              />
            </div>
            <div
              className={cn?.tenorSection}
              role="listbox"
              id={listboxId}
              aria-label={tenorSectionTitle}
              {...{ [FINRA_UI_ATTR]: componentIds.dateTenorPickerTenorSection }}>
              {tenorSectionTitle ? (
                <div
                  className={cn?.tenorTitle}
                  aria-hidden="true"
                  {...{ [FINRA_UI_ATTR]: componentIds.dateTenorPickerTenorTitle }}>
                  {tenorSectionTitle}
                </div>
              ) : null}
              <div
                className={cn?.tenorGrid}
                {...{ [FINRA_UI_ATTR]: componentIds.dateTenorPickerTenorGrid }}>
                {tenorMeta.map((meta, index) => {
                  const isSelected = meta.tenor === currentValue?.tenor;
                  return (
                    <button
                      key={meta.tenor}
                      type="button"
                      role="option"
                      id={optionId(index)}
                      {...{ [FINRA_UI_ATTR]: componentIds.dateTenorPickerTenor }}
                      // The roving highlight is carried by aria-activedescendant
                      // on the input; aria-selected is reserved for the committed
                      // value, as in every other picker here. Reusing it for the
                      // highlight announces an option as chosen before Enter, and
                      // leaves the real value unannounced when the list reopens.
                      aria-selected={isSelected}
                      aria-disabled={meta.disabled || undefined}
                      disabled={meta.disabled}
                      className={cx(
                        cn?.tenor,
                        index === highlight && cn?.tenorHighlighted,
                        isSelected && cn?.tenorSelected,
                        meta.disabled && cn?.tenorDisabled,
                      )}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        selectTenor(index);
                      }}>
                      {meta.tenor}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );
  },
);

DateTenorPickerBase.displayName = "DateTenorPickerBase";
