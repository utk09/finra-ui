import {
  forwardRef,
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useControlledValue } from "../../hooks/useControlledValue";
import {
  type CalendarDay,
  formatDayLabel,
  formatMonthYear,
  getCalendarDays,
  getInitialFocusIndex,
  WEEKDAY_LONG_MON,
  WEEKDAY_LONG_SUN,
  WEEKDAY_SHORT_MON,
  WEEKDAY_SHORT_SUN,
} from "../../logic/calendar";
import { cx } from "../../logic/cx";

//  Types

export interface CalendarClassNames {
  root?: string;
  header?: string;
  navButton?: string;
  title?: string;
  weekdayRow?: string;
  weekday?: string;
  grid?: string;
  row?: string;
  day?: string;
  dayToday?: string;
  daySelected?: string;
  dayDisabled?: string;
  dayOutside?: string;
  footer?: string;
}

export interface CalendarBaseProps {
  /** Currently selected date. */
  value?: Date | null;
  /** Called when a day is selected. */
  onSelect?: (date: Date) => void;
  /** Controlled displayed month (uses year and month from this Date). */
  month?: Date;
  /** Called when the displayed month changes via navigation. */
  onMonthChange?: (month: Date) => void;
  /** Minimum selectable date. */
  min?: Date;
  /** Maximum selectable date. */
  max?: Date;
  /** Dates that cannot be selected. */
  disabledDates?: Date[] | ((date: Date) => boolean);
  /** 0 = Sunday, 1 = Monday. Default: 1 (Monday). */
  weekStartsOn?: 0 | 1;
  /** CSS class overrides. */
  classNames?: CalendarClassNames;
  /** data-* attributes injected by the styled layer. */
  dataAttributes?: Record<string, string>;
  /** Icon for previous month navigation. */
  renderNavPrev?: () => ReactNode;
  /** Icon for next month navigation. */
  renderNavNext?: () => ReactNode;
  /** Content rendered below the grid (e.g. "Today" button). */
  footer?: ReactNode;
  /** Override "today" for testing. */
  today?: Date;
}

//  Component

export const CalendarBase = forwardRef<HTMLDivElement, CalendarBaseProps>(
  (
    {
      value,
      onSelect,
      month: controlledMonth,
      onMonthChange,
      min,
      max,
      disabledDates,
      weekStartsOn = 1,
      classNames: cn,
      dataAttributes,
      renderNavPrev,
      renderNavNext,
      footer,
      today: todayOverride,
    },
    ref,
  ) => {
    const today = useMemo(() => todayOverride ?? new Date(), [todayOverride]);
    const gridRef = useRef<HTMLDivElement>(null);

    const defaultMonthRef = useRef(
      value
        ? new Date(value.getFullYear(), value.getMonth(), 1)
        : new Date(today.getFullYear(), today.getMonth(), 1),
    );

    const [displayMonth, setMonth] = useControlledValue(
      controlledMonth,
      defaultMonthRef.current,
      onMonthChange,
    );
    const displayYear = displayMonth.getFullYear();
    const displayMonthIndex = displayMonth.getMonth();

    const goToPrevMonth = useCallback(() => {
      setMonth(new Date(displayYear, displayMonthIndex - 1, 1));
    }, [displayYear, displayMonthIndex, setMonth]);

    const goToNextMonth = useCallback(() => {
      setMonth(new Date(displayYear, displayMonthIndex + 1, 1));
    }, [displayYear, displayMonthIndex, setMonth]);

    const days = useMemo(
      () =>
        getCalendarDays(
          displayYear,
          displayMonthIndex,
          weekStartsOn,
          value,
          today,
          min,
          max,
          disabledDates,
        ),
      [displayYear, displayMonthIndex, weekStartsOn, value, today, min, max, disabledDates],
    );

    // Focused day for keyboard navigation
    const [focusedIndex, setFocusedIndex] = useState<number>(() => getInitialFocusIndex(days));

    useEffect(() => {
      setFocusedIndex(getInitialFocusIndex(days));
    }, [days]);

    // Move focus to the button when focusedIndex changes (only if grid already has focus)
    useEffect(() => {
      const grid = gridRef.current;
      if (!grid) return;
      const btn = grid.querySelector(`[data-day-index="${focusedIndex}"]`) as HTMLElement | null;
      if (btn && grid.contains(document.activeElement)) {
        btn.focus();
      }
    }, [focusedIndex]);

    const handleDayClick = useCallback(
      (day: CalendarDay) => {
        if (day.isDisabled) return;
        onSelect?.(day.date);
      },
      [onSelect],
    );

    const handleKeyDown = useCallback(
      (e: KeyboardEvent<HTMLDivElement>) => {
        switch (e.key) {
          case "ArrowRight":
            e.preventDefault();
            {
              const nextIndex = focusedIndex + 1;
              if (nextIndex >= 42) {
                goToNextMonth();
              } else {
                setFocusedIndex(nextIndex);
              }
            }
            return;
          case "ArrowLeft":
            e.preventDefault();
            {
              const nextIndex = focusedIndex - 1;
              if (nextIndex < 0) {
                goToPrevMonth();
              } else {
                setFocusedIndex(nextIndex);
              }
            }
            return;
          case "ArrowDown":
            e.preventDefault();
            {
              const nextIndex = focusedIndex + 7;
              if (nextIndex >= 42) {
                goToNextMonth();
              } else {
                setFocusedIndex(nextIndex);
              }
            }
            return;
          case "ArrowUp":
            e.preventDefault();
            {
              const nextIndex = focusedIndex - 7;
              if (nextIndex < 0) {
                goToPrevMonth();
              } else {
                setFocusedIndex(nextIndex);
              }
            }
            return;
          case "Enter":
          case " ":
            e.preventDefault();
            if (focusedIndex >= 0 && focusedIndex < days.length) {
              handleDayClick(days[focusedIndex]);
            }
            return;
          case "PageDown":
            e.preventDefault();
            goToNextMonth();
            return;
          case "PageUp":
            e.preventDefault();
            goToPrevMonth();
            return;
        }
      },
      [focusedIndex, days, handleDayClick, goToNextMonth, goToPrevMonth],
    );

    const weekdayLabels = weekStartsOn === 1 ? WEEKDAY_SHORT_MON : WEEKDAY_SHORT_SUN;
    const weekdayLong = weekStartsOn === 1 ? WEEKDAY_LONG_MON : WEEKDAY_LONG_SUN;

    return (
      <div ref={ref} {...dataAttributes} className={cn?.root}>
        {/* Header: nav + month/year */}
        <div className={cn?.header}>
          <button
            type="button"
            className={cn?.navButton}
            onClick={goToPrevMonth}
            aria-label="Previous month">
            {renderNavPrev ? renderNavPrev() : "\u25C0"}
          </button>
          <div className={cn?.title} aria-live="polite">
            {formatMonthYear(displayYear, displayMonthIndex)}
          </div>
          <button
            type="button"
            className={cn?.navButton}
            onClick={goToNextMonth}
            aria-label="Next month">
            {renderNavNext ? renderNavNext() : "\u25B6"}
          </button>
        </div>

        {/* Day grid - focus is managed via roving tabindex on day buttons */}
        <div
          ref={gridRef}
          className={cn?.grid}
          role="grid"
          tabIndex={-1}
          aria-label={formatMonthYear(displayYear, displayMonthIndex)}
          onKeyDown={handleKeyDown}>
          {/* Weekday header row */}
          <div className={cx(cn?.weekdayRow, cn?.row)} role="row">
            {weekdayLabels.map((label, i) => (
              <span
                key={label}
                className={cn?.weekday}
                role="columnheader"
                aria-label={weekdayLong[i]}>
                {label}
              </span>
            ))}
          </div>

          {/* Day rows - 6 rows of 7 days */}
          {Array.from({ length: 6 }, (_, rowIdx) => (
            <div key={rowIdx} className={cn?.row} role="row">
              {days.slice(rowIdx * 7, rowIdx * 7 + 7).map((day, colIdx) => {
                const i = rowIdx * 7 + colIdx;
                return (
                  <button
                    key={day.date.getTime()}
                    type="button"
                    role="gridcell"
                    data-day-index={i}
                    tabIndex={i === focusedIndex ? 0 : -1}
                    aria-label={formatDayLabel(day.date)}
                    aria-selected={day.isSelected || undefined}
                    aria-disabled={day.isDisabled || undefined}
                    disabled={day.isDisabled}
                    className={cx(
                      cn?.day,
                      day.isToday && cn?.dayToday,
                      day.isSelected && cn?.daySelected,
                      day.isDisabled && cn?.dayDisabled,
                      !day.isCurrentMonth && cn?.dayOutside,
                    )}
                    onMouseDown={(e) => {
                      e.preventDefault(); // prevent blur on the parent input
                      handleDayClick(day);
                    }}>
                    {day.date.getDate()}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        {footer ? <div className={cn?.footer}>{footer}</div> : null}
      </div>
    );
  },
);

CalendarBase.displayName = "CalendarBase";
