import { useClickOutside, useFormField } from "@utk09/finra-ui";
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

import type { DateFormat } from "../../utils/dateFormat";
import { formatDate, validateDate } from "../../utils/dateFormat";
import type {
  DateTenorMode,
  DateTenorParseContext,
  DateTenorParseError,
  DateTenorParseResult,
} from "../../utils/dateTenorParse";
import { parseDateTenor } from "../../utils/dateTenorParse";
import type { CalendarClassNames } from "../Calendar/Calendar";
import { CalendarBase } from "../Calendar/Calendar";

//  Types

/** Default tenor suggestions (JIRA-specified market set). */
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
}

/** Why a commit was rejected. */
export type DateTenorInvalidReason =
  DateTenorParseError | "disabled-tenor" | "disabled-date" | "no-settlement";

/** Adjusts the parser's raw preview date to a settlement date. Default: identity. */
export type SettlementEngine = (previewDate: Date, result: DateTenorParseResult) => Date | null;

/** Injected business calendar. Omitted → every day is a business day. */
export interface BusinessCalendar {
  isBusinessDay?: (date: Date) => boolean;
}

/** Replacement parser (same signature as {@link parseDateTenor}). */
export type DateTenorParserFn = (
  input: string,
  ctx?: DateTenorParseContext,
) => DateTenorParseResult;

/** Imperative handle exposed via `ref`. */
export interface DateTenorPickerHandle {
  focus: () => void;
  clear: () => void;
  open: () => void;
  close: () => void;
  getValue: () => DateTenorValue | null;
}

export interface DateTenorPickerClassNames {
  root?: string;
  rootOpen?: string;
  input?: string;
  adornment?: string;
  indicator?: string;
  indicatorOpen?: string;
  popup?: string;
  calendarSection?: string;
  tenorSection?: string;
  tenorTitle?: string;
  tenorGrid?: string;
  tenor?: string;
  tenorHighlighted?: string;
  tenorDisabled?: string;
  calendar?: CalendarClassNames;
}

export interface DateTenorPickerBaseProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "onChange" | "defaultValue" | "onInvalid"
> {
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
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
  "aria-label"?: string;
}

//  Component

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
      classNames: cn,
      dataAttributes,
      renderCalendarIcon,
      renderIndicator,
      renderCalendarNavPrev,
      renderCalendarNavNext,
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

    // Sync controlled value → displayed text.
    useEffect(() => {
      if (isControlled) setInputText(value ? value.display : "");
    }, [isControlled, value]);

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
      (date: Date, result: DateTenorParseResult): Date | null =>
        settlementEngine ? settlementEngine(date, result) : date,
      [settlementEngine],
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
        };
        setInputText(next.display);
        commitValue(next);
        return true;
      },
      [parser, parseCtx, onParse, onInvalid, disabledTenors, settle, isDateDisabled, commitValue],
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
        };
        setInputText(next.display);
        commitValue(next);
        closePopup();
        inputRef.current?.focus();
      },
      [dateFormat, onParse, settle, isDateDisabled, onInvalid, commitValue, closePopup],
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

    return (
      <div
        ref={containerRef}
        className={[cn?.root, isOpen && cn?.rootOpen].filter(Boolean).join(" ") || undefined}
        {...dataAttributes}
        {...props}>
        <input
          ref={inputRef}
          className={cn?.input}
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
            onClick={togglePopup}
            tabIndex={-1}
            aria-label="Toggle date and tenor picker"
            disabled={disabled}>
            {renderCalendarIcon()}
          </button>
        ) : null}

        {renderIndicator ? (
          <span
            className={
              [cn?.indicator, isOpen && cn?.indicatorOpen].filter(Boolean).join(" ") || undefined
            }
            aria-hidden="true">
            {renderIndicator(isOpen)}
          </span>
        ) : null}

        {isOpen ? (
          <div className={cn?.popup} id={popupId}>
            <div className={cn?.calendarSection}>
              <CalendarBase
                value={calendarValue}
                onSelect={handleCalendarSelect}
                min={minDate}
                max={maxDate}
                disabledDates={isDateDisabled}
                highlightedDates={previewDate ? [previewDate] : undefined}
                today={referenceDate}
                weekStartsOn={weekStartsOn}
                classNames={cn?.calendar}
                renderNavPrev={renderCalendarNavPrev}
                renderNavNext={renderCalendarNavNext}
              />
            </div>
            <div
              className={cn?.tenorSection}
              role="listbox"
              id={listboxId}
              aria-label={tenorSectionTitle}>
              {tenorSectionTitle ? (
                <div className={cn?.tenorTitle} aria-hidden="true">
                  {tenorSectionTitle}
                </div>
              ) : null}
              <div className={cn?.tenorGrid}>
                {tenorMeta.map((meta, index) => (
                  <button
                    key={meta.tenor}
                    type="button"
                    role="option"
                    id={optionId(index)}
                    aria-selected={index === highlight || undefined}
                    aria-disabled={meta.disabled || undefined}
                    disabled={meta.disabled}
                    className={
                      [
                        cn?.tenor,
                        index === highlight && cn?.tenorHighlighted,
                        meta.disabled && cn?.tenorDisabled,
                      ]
                        .filter(Boolean)
                        .join(" ") || undefined
                    }
                    onMouseDown={(event) => {
                      event.preventDefault();
                      selectTenor(index);
                    }}>
                    {meta.tenor}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );
  },
);

DateTenorPickerBase.displayName = "DateTenorPickerBase";
