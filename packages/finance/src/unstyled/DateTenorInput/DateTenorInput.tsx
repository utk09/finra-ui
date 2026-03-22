import { useClickOutside } from "@utk09/finra-ui";
import { cx } from "@utk09/finra-ui/utils";
import { mergeRefs } from "@utk09/finra-ui/utils";
import {
  type ChangeEvent,
  forwardRef,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { autoInsertSeparators, getMaxLength } from "../../logic/dateInput";
import type { DateFormat } from "../../utils/dateFormat";
import {
  formatDate,
  getFormatPlaceholder,
  getFormatSegmentLengths,
  getFormatSeparator,
  parseDate,
  validateDate,
} from "../../utils/dateFormat";
import type { TenorResolver } from "../../utils/tenor";
import { dateToTenor, resolveTenor, STANDARD_TENORS } from "../../utils/tenor";
import type { CalendarClassNames } from "../Calendar/Calendar";
import { CalendarBase } from "../Calendar/Calendar";

//  Types

export interface DateTenorInputClassNames {
  root?: string;
  trigger?: string;
  triggerOpen?: string;
  dateInput?: string;
  tenorBadge?: string;
  calendarButton?: string;
  indicator?: string;
  indicatorOpen?: string;
  popup?: string;
  calendarSection?: string;
  tenorSection?: string;
  tenorTitle?: string;
  tenorGrid?: string;
  tenor?: string;
  tenorSelected?: string;
  calendar?: CalendarClassNames;
}

export interface DateTenorInputBaseProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "onChange" | "defaultValue"
> {
  /** Current date value. */
  dateValue?: Date | null;
  /** Current tenor value. */
  tenorValue?: string | null;
  /** Called when either field changes. */
  onChange?: (values: { date: Date | null; tenor: string | null }) => void;
  /** Reference date for tenor resolution (defaults to today). */
  referenceDate?: Date;
  /** Custom tenor-to-date resolver (for business day logic, holidays). */
  tenorResolver?: TenorResolver;
  /** Date format pattern. */
  dateFormat?: DateFormat;
  /** Minimum allowed date. */
  minDate?: Date;
  /** Maximum allowed date. */
  maxDate?: Date;
  /** Dates that cannot be selected. */
  disabledDates?: Date[] | ((date: Date) => boolean);
  /** Additional tenors beyond the standard set. */
  extraTenors?: string[];
  /** Restrict to only these tenors. */
  allowedTenors?: string[];
  /** Disable both fields. */
  disabled?: boolean;
  /** Make both fields read-only. */
  readOnly?: boolean;
  /** Placeholder for the date input. */
  datePlaceholder?: string;
  /** Placeholder for the tenor section title. */
  tenorSectionTitle?: string;
  /** 0 = Sunday, 1 = Monday. Default: 1. */
  weekStartsOn?: 0 | 1;
  /** CSS class names injected by the styled layer. */
  classNames?: DateTenorInputClassNames;
  /** data-* attributes injected by the styled layer. */
  dataAttributes?: Record<string, string>;
  /** Render the calendar icon for the trigger. */
  renderCalendarIcon?: () => ReactNode;
  /** Render the dropdown indicator. */
  renderIndicator?: (isOpen: boolean) => ReactNode;
  /** Render the calendar prev month nav icon. */
  renderCalendarNavPrev?: () => ReactNode;
  /** Render the calendar next month nav icon. */
  renderCalendarNavNext?: () => ReactNode;
  /** id for the date input element. */
  dateId?: string;
  /** aria-label for the date input. */
  dateAriaLabel?: string;
  /** aria-label for the tenor section. */
  tenorAriaLabel?: string;
}

//  Component

export const DateTenorInputBase = forwardRef<HTMLDivElement, DateTenorInputBaseProps>(
  (
    {
      dateValue,
      tenorValue,
      onChange,
      referenceDate,
      tenorResolver,
      dateFormat = "YYYY-MM-DD",
      minDate,
      maxDate,
      disabledDates,
      extraTenors,
      allowedTenors,
      disabled,
      readOnly,
      datePlaceholder,
      tenorSectionTitle = "Tenor",
      weekStartsOn,
      classNames: cn,
      dataAttributes,
      renderCalendarIcon,
      renderIndicator,
      renderCalendarNavPrev,
      renderCalendarNavNext,
      dateId,
      dateAriaLabel,
      tenorAriaLabel,
      ...props
    },
    ref,
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Format helpers
    const separator = getFormatSeparator(dateFormat);
    const segmentLengths = getFormatSegmentLengths(dateFormat);
    const maxLen = getMaxLength(segmentLengths, separator);

    // Open state
    const [isOpen, setIsOpen] = useState(false);

    // Input text
    const [inputText, setInputText] = useState(() => {
      if (dateValue) return formatDate(dateValue, dateFormat);
      return "";
    });

    // Sync controlled dateValue → input text
    useEffect(() => {
      if (dateValue === undefined) return;
      setInputText(dateValue === null ? "" : formatDate(dateValue, dateFormat));
    }, [dateValue, dateFormat]);

    // Build tenor list
    const tenors = useMemo(() => {
      if (allowedTenors) return allowedTenors;
      const list = [...STANDARD_TENORS] as string[];
      if (extraTenors) {
        for (const t of extraTenors) {
          if (!list.includes(t)) list.push(t);
        }
      }
      return list;
    }, [allowedTenors, extraTenors]);

    // Resolve helpers
    const getRefDate = useCallback(() => referenceDate ?? new Date(), [referenceDate]);

    const resolve = useCallback(
      (tenor: string, refDate: Date): Date | null => {
        return tenorResolver ? tenorResolver(tenor, refDate) : resolveTenor(tenor, refDate);
      },
      [tenorResolver],
    );

    // Close on outside click
    const closePopup = useCallback(() => setIsOpen(false), []);
    useClickOutside(containerRef, closePopup, isOpen);

    const togglePopup = useCallback(() => {
      if (disabled || readOnly) return;
      setIsOpen((prev) => !prev);
    }, [disabled, readOnly]);

    //  Date input handlers (same auto-separator logic)

    const handleInputChange = useCallback(
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
      },
      [disabled, readOnly, separator, segmentLengths, maxLen],
    );

    const handleInputBlur = useCallback(() => {
      // Don't validate/fire on blur if popup is open (user is clicking calendar/tenor)
      // The mousedown on calendar/tenor buttons prevents default, so blur doesn't fire
      // But if they click outside, the outside-click handler closes the popup

      if (inputText.trim() === "") {
        onChange?.({ date: null, tenor: null });
        return;
      }
      const parseResult = parseDate(inputText, dateFormat);
      if (!parseResult.valid || !parseResult.date) return;

      const validationResult = validateDate(parseResult.date, {
        min: minDate,
        max: maxDate,
        disabledDates,
      });
      if (!validationResult.valid || !validationResult.date) return;

      const refDate = getRefDate();
      const matchedTenor = dateToTenor(validationResult.date, refDate);
      onChange?.({ date: validationResult.date, tenor: matchedTenor });
    }, [inputText, dateFormat, onChange, minDate, maxDate, disabledDates, getRefDate]);

    const handleInputKeyDown = useCallback(
      (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Escape" && isOpen) {
          setIsOpen(false);
          return;
        }
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
        if (allowedKeys.includes(e.key)) return;
        if (e.ctrlKey || e.metaKey) return;
        if (/^\d$/.test(e.key)) return;
        if (e.key === separator) return;
        e.preventDefault();
      },
      [separator, isOpen],
    );

    //  Calendar selection

    const handleCalendarSelect = useCallback(
      (date: Date) => {
        const formatted = formatDate(date, dateFormat);
        setInputText(formatted);
        const refDate = getRefDate();
        const matchedTenor = dateToTenor(date, refDate);
        onChange?.({ date, tenor: matchedTenor });
        setIsOpen(false);
        inputRef.current?.focus();
      },
      [dateFormat, onChange, getRefDate],
    );

    //  Tenor selection

    const handleTenorSelect = useCallback(
      (tenor: string) => {
        const refDate = getRefDate();
        const resolvedDate = resolve(tenor, refDate);
        if (resolvedDate) {
          const formatted = formatDate(resolvedDate, dateFormat);
          setInputText(formatted);
        }
        // If the clicked tenor is the same as the current, deselect
        if (tenor === tenorValue) {
          onChange?.({ date: null, tenor: null });
        } else {
          onChange?.({ date: resolvedDate, tenor });
        }
        setIsOpen(false);
        inputRef.current?.focus();
      },
      [getRefDate, resolve, dateFormat, onChange, tenorValue],
    );

    // Calendar display value
    const calendarDisplayValue: Date | null | undefined =
      dateValue !== undefined
        ? dateValue
        : (() => {
            if (!inputText) return null;
            const result = parseDate(inputText, dateFormat);
            return result.valid ? result.date : null;
          })();

    return (
      <div ref={mergeRefs(ref, containerRef)} className={cn?.root} {...dataAttributes} {...props}>
        {/* Trigger */}
        <div className={cx(cn?.trigger, isOpen && cn?.triggerOpen)}>
          <input
            ref={inputRef}
            className={cn?.dateInput}
            type="text"
            inputMode="numeric"
            id={dateId}
            value={inputText}
            placeholder={datePlaceholder ?? getFormatPlaceholder(dateFormat)}
            disabled={disabled}
            readOnly={readOnly}
            maxLength={maxLen}
            aria-label={dateAriaLabel}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            onClick={() => {
              if (!disabled && !readOnly && !isOpen) setIsOpen(true);
            }}
          />

          {tenorValue ? <span className={cn?.tenorBadge}>{tenorValue}</span> : null}

          {renderCalendarIcon ? (
            <button
              type="button"
              className={cn?.calendarButton}
              onClick={togglePopup}
              tabIndex={-1}
              aria-label="Toggle date and tenor picker"
              disabled={disabled}>
              {renderCalendarIcon()}
            </button>
          ) : null}

          {renderIndicator ? (
            <span
              className={cx(cn?.indicator, isOpen && cn?.indicatorOpen)}
              aria-hidden="true"
              onMouseDown={(e) => {
                e.preventDefault();
                togglePopup();
              }}>
              {renderIndicator(isOpen)}
            </span>
          ) : null}
        </div>

        {/* Popup: calendar + tenor list */}
        {isOpen ? (
          <div className={cn?.popup}>
            <div className={cn?.calendarSection}>
              <CalendarBase
                value={calendarDisplayValue}
                onSelect={handleCalendarSelect}
                min={minDate}
                max={maxDate}
                disabledDates={disabledDates}
                weekStartsOn={weekStartsOn}
                classNames={cn?.calendar}
                renderNavPrev={renderCalendarNavPrev}
                renderNavNext={renderCalendarNavNext}
              />
            </div>
            <div className={cn?.tenorSection} role="listbox" aria-label={tenorAriaLabel ?? "Tenor"}>
              {tenorSectionTitle ? (
                <div className={cn?.tenorTitle} aria-hidden="true">
                  {tenorSectionTitle}
                </div>
              ) : null}
              <div className={cn?.tenorGrid}>
                {tenors.map((t) => (
                  <button
                    key={t}
                    type="button"
                    role="option"
                    aria-selected={t === tenorValue || undefined}
                    className={cx(cn?.tenor, t === tenorValue && cn?.tenorSelected)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleTenorSelect(t);
                    }}>
                    {t}
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

DateTenorInputBase.displayName = "DateTenorInputBase";
