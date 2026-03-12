import {
  type ChangeEvent,
  forwardRef,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import type { DateFormat, DateParseResult } from "../../utils/dateFormat";
import {
  formatDate,
  getFormatPlaceholder,
  getFormatSegmentLengths,
  getFormatSeparator,
  parseDate,
  validateDate,
} from "../../utils/dateFormat";
import { mergeRefs } from "../../utils/mergeRefs";
import type { CalendarClassNames } from "../Calendar/Calendar";
import { CalendarBase } from "../Calendar/Calendar";

//  Types

export interface DateInputClassNames {
  root?: string;
  calendarOpen?: string;
  input?: string;
  adornment?: string;
  popup?: string;
  calendar?: CalendarClassNames;
}

export interface DateInputBaseProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "onChange" | "defaultValue"
> {
  /** Date format pattern. Determines separator and segment order. */
  format?: DateFormat;
  /** Controlled date value. */
  value?: Date | null;
  /** Initial date value for uncontrolled mode. */
  defaultValue?: Date | null;
  /** Called with parsed Date on valid input, or null when cleared. */
  onChange?: (date: Date | null) => void;
  /** Called with raw text on every keystroke. */
  onInputChange?: (text: string) => void;
  /** Minimum allowed date. */
  min?: Date;
  /** Maximum allowed date. */
  max?: Date;
  /** Dates that cannot be selected. Array or predicate function. */
  disabledDates?: Date[] | ((date: Date) => boolean);
  /** Input placeholder. Defaults to the format pattern (e.g. "YYYY-MM-DD"). */
  placeholder?: string;
  /** Disable the input. */
  disabled?: boolean;
  /** Make the input read-only. */
  readOnly?: boolean;
  /** Called after blur with validation result. */
  onValidation?: (result: DateParseResult) => void;
  /** CSS class names injected by the styled layer. */
  classNames?: DateInputClassNames;
  /** data-* attributes injected by the styled layer. */
  dataAttributes?: Record<string, string>;
  /** Render the calendar toggle icon (e.g. CalendarIcon). */
  renderCalendarIcon?: () => ReactNode;
  /** Render previous month nav icon for the calendar. */
  renderCalendarNavPrev?: () => ReactNode;
  /** Render next month nav icon for the calendar. */
  renderCalendarNavNext?: () => ReactNode;
  /** 0 = Sunday, 1 = Monday. Default: 1. */
  weekStartsOn?: 0 | 1;
  /** id for the input element. */
  id?: string;
  /** aria-describedby for the input element. */
  "aria-describedby"?: string;
  /** aria-invalid for the input element. */
  "aria-invalid"?: boolean;
  /** aria-label for the input element. */
  "aria-label"?: string;
}

//  Helpers

function autoInsertSeparators(raw: string, segmentLengths: readonly number[], sep: string): string {
  const digitsOnly = raw.replace(/\D/g, "");
  let result = "";
  let digitIndex = 0;
  for (let i = 0; i < segmentLengths.length && digitIndex < digitsOnly.length; i++) {
    if (i > 0) result += sep;
    const segLen = segmentLengths[i];
    result += digitsOnly.slice(digitIndex, digitIndex + segLen);
    digitIndex += segLen;
  }
  return result;
}

function getMaxLength(segmentLengths: readonly number[], sep: string): number {
  const digitCount = segmentLengths.reduce((sum, len) => sum + len, 0);
  const separatorCount = segmentLengths.length - 1;
  return digitCount + separatorCount * sep.length;
}

//  Component

export const DateInputBase = forwardRef<HTMLInputElement, DateInputBaseProps>(
  (
    {
      format = "YYYY-MM-DD",
      value,
      defaultValue,
      onChange,
      onInputChange,
      min,
      max,
      disabledDates,
      placeholder,
      disabled,
      readOnly,
      onValidation,
      classNames,
      dataAttributes,
      renderCalendarIcon,
      renderCalendarNavPrev,
      renderCalendarNavNext,
      weekStartsOn,
      id,
      "aria-describedby": ariaDescribedBy,
      "aria-invalid": ariaInvalid,
      "aria-label": ariaLabel,
      ...props
    },
    forwardedRef,
  ) => {
    const internalRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const separator = getFormatSeparator(format);
    const segmentLengths = getFormatSegmentLengths(format);
    const maxLen = getMaxLength(segmentLengths, separator);

    // Calendar open state
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    // Input text
    const getInitialText = useCallback(() => {
      if (value !== undefined && value !== null) return formatDate(value, format);
      if (defaultValue !== undefined && defaultValue !== null)
        return formatDate(defaultValue, format);
      return "";
    }, [value, defaultValue, format]);

    const [inputText, setInputText] = useState(getInitialText);
    const isControlled = value !== undefined;

    // Sync controlled value → text
    useEffect(() => {
      if (isControlled) {
        setInputText(value === null ? "" : value ? formatDate(value, format) : "");
      }
    }, [value, format, isControlled]);

    // Close calendar on outside click
    useEffect(() => {
      if (!isCalendarOpen) return;
      const handler = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setIsCalendarOpen(false);
        }
      };
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }, [isCalendarOpen]);

    const toggleCalendar = useCallback(() => {
      if (disabled || readOnly) return;
      setIsCalendarOpen((prev) => !prev);
    }, [disabled, readOnly]);

    const handleChange = useCallback(
      (e: ChangeEvent<HTMLInputElement>) => {
        if (disabled || readOnly) return;
        const raw = e.target.value;
        const filtered = raw
          .split("")
          .filter((ch) => /\d/.test(ch) || ch === separator)
          .join("");
        const formatted = autoInsertSeparators(filtered, segmentLengths, separator);
        const clamped = formatted.slice(0, maxLen);
        setInputText(clamped);
        onInputChange?.(clamped);
      },
      [disabled, readOnly, separator, segmentLengths, maxLen, onInputChange],
    );

    const handleBlur = useCallback(() => {
      if (inputText.trim() === "") {
        onChange?.(null);
        onValidation?.({ valid: true, date: null });
        return;
      }
      const parseResult = parseDate(inputText, format);
      if (!parseResult.valid || !parseResult.date) {
        onValidation?.(parseResult);
        return;
      }
      const validationResult = validateDate(parseResult.date, { min, max, disabledDates });
      onValidation?.(validationResult);
      if (validationResult.valid) {
        onChange?.(validationResult.date);
      }
    }, [inputText, format, onChange, onValidation, min, max, disabledDates]);

    const handleKeyDown = useCallback(
      (e: KeyboardEvent<HTMLInputElement>) => {
        const allowedKeys = [
          "Backspace",
          "Delete",
          "Tab",
          "ArrowLeft",
          "ArrowRight",
          "ArrowUp",
          "ArrowDown",
          "Home",
          "End",
          "Escape",
        ];
        if (allowedKeys.includes(e.key)) {
          if (e.key === "Escape" && isCalendarOpen) {
            setIsCalendarOpen(false);
          }
          return;
        }
        if (e.ctrlKey || e.metaKey) return;
        if (/^\d$/.test(e.key)) return;
        if (e.key === separator) return;
        e.preventDefault();
      },
      [separator, isCalendarOpen],
    );

    // Calendar selection
    const handleCalendarSelect = useCallback(
      (date: Date) => {
        const formatted = formatDate(date, format);
        setInputText(formatted);
        onInputChange?.(formatted);
        onChange?.(date);
        onValidation?.({ valid: true, date });
        setIsCalendarOpen(false);
        internalRef.current?.focus();
      },
      [format, onChange, onInputChange, onValidation],
    );

    // Derive the displayed date for the calendar from current value or inputText
    const calendarValue = isControlled
      ? value
      : (() => {
          if (!inputText) return null;
          const result = parseDate(inputText, format);
          return result.valid ? result.date : null;
        })();

    return (
      <div
        ref={containerRef}
        {...dataAttributes}
        className={
          [classNames?.root, isCalendarOpen && classNames?.calendarOpen]
            .filter(Boolean)
            .join(" ") || undefined
        }
        {...props}>
        <input
          ref={mergeRefs(forwardedRef, internalRef)}
          className={classNames?.input}
          type="text"
          inputMode="numeric"
          id={id}
          value={inputText}
          placeholder={placeholder ?? getFormatPlaceholder(format)}
          disabled={disabled}
          readOnly={readOnly}
          maxLength={maxLen}
          aria-describedby={ariaDescribedBy}
          aria-invalid={ariaInvalid}
          aria-label={ariaLabel}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
        />

        {renderCalendarIcon ? (
          <button
            type="button"
            className={classNames?.adornment}
            onClick={toggleCalendar}
            tabIndex={-1}
            aria-label="Toggle calendar"
            disabled={disabled}>
            {renderCalendarIcon()}
          </button>
        ) : null}

        {isCalendarOpen ? (
          <div className={classNames?.popup}>
            <CalendarBase
              value={calendarValue}
              onSelect={handleCalendarSelect}
              min={min}
              max={max}
              disabledDates={disabledDates}
              weekStartsOn={weekStartsOn}
              classNames={classNames?.calendar}
              renderNavPrev={renderCalendarNavPrev}
              renderNavNext={renderCalendarNavNext}
            />
          </div>
        ) : null}
      </div>
    );
  },
);

DateInputBase.displayName = "DateInputBase";
