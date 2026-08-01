import { useControlledValue } from "@utk09/finra-ui";
import { cx } from "@utk09/finra-ui/utils";
import {
  type CSSProperties,
  forwardRef,
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  type CalendarDay,
  type DateRange,
  firstOfMonth,
  formatDayLabel,
  formatMonthYear,
  getCalendarDays,
  getDayRangeState,
  getEffectiveRange,
  getInitialFocusDate,
  getISOWeek,
  getMonthNames,
  getWeekdayNames,
  getYearRange,
  isDateDisabled,
  isDateHighlighted,
  isMonthDisabled,
  isSameDay,
  nextRange,
  resolveCalendarKey,
  type WeekdayWidth,
} from "../../logic/calendar";

//  Constants

/**
 * Screen-reader-only text. The week-number column header must expose text to
 * assistive tech (axe `empty-table-header`), but stays visually blank so the
 * corner cell reads as empty. Inlined so unstyled consumers keep the behaviour
 * without depending on a utility class.
 */
const SR_ONLY: CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  margin: -1,
  padding: 0,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
  border: 0,
};

/**
 * Stable `YYYY-M-D` key used to find a day's button in the DOM. Local-time
 * components (not ISO) so it matches how the grid builds its dates.
 */
function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

//  Types

/**
 * Handle passed to a function `footer`, giving footer content the ability to
 * navigate and select without reaching into calendar internals. Plain data +
 * callbacks (no React/DOM types) so a future Lit `finra-calendar` can expose the
 * same seam.
 */
export interface CalendarFooterApi {
  /** Resolved "today" (respects the `today` override prop). */
  today: Date;
  /** First day of the currently displayed month. */
  month: Date;
  /** Current selection, or null. */
  value: Date | null;
  /** Navigate the view to today's month (no selection). */
  goToToday: () => void;
  /** Select today and navigate to it (no-op if today is out of range). */
  selectToday: () => void;
  /** Select any date and navigate to its month (no-op if disabled/out of range). */
  select: (date: Date) => void;
  /** Navigate the view to `month`'s month (no selection). */
  goToMonth: (month: Date) => void;
  /** Whether `date` is unselectable per min/max/disabledDates. */
  isDateDisabled: (date: Date) => boolean;
}

/**
 * Handle passed to a function `renderTitle`, for building month/year quick-nav
 * (dropdowns) in the header. Plain data + callbacks (Lit-portable).
 */
export interface CalendarTitleApi {
  /** Displayed year. */
  year: number;
  /** Displayed month index (0-11). */
  monthIndex: number;
  /** Navigate to `year`, keeping the month. */
  setYear: (year: number) => void;
  /** Navigate to `monthIndex`, keeping the year. */
  setMonthIndex: (monthIndex: number) => void;
  /** Selectable years (min/max-bounded, always includes the displayed year). */
  years: number[];
  /** Whether a month is fully out of range in the displayed year. */
  isMonthDisabled: (monthIndex: number) => boolean;
  /**
   * Localised month names, January-first, resolved against the calendar's
   * `locale`. Supplied here so header content never has to reach back into the
   * i18n layer itself.
   */
  monthNames: string[];
}

/**
 * CSS class overrides the styled layer injects into the unstyled base.
 *
 * @remarks
 * Every key is optional - when absent, no className is applied at all (not an
 * empty `class` attribute).
 */
export interface CalendarClassNames {
  /** Outermost element. */
  root?: string;
  /** The month/year title row with its nav buttons. */
  header?: string;
  /** Previous/next month buttons. */
  navButton?: string;
  /** The month + year title. A live region, so paging is announced. */
  title?: string;
  /** The weekday-abbreviation header row. */
  weekdayRow?: string;
  /** One weekday abbreviation. Carries the full name as its accessible label. */
  weekday?: string;
  /** The `role="grid"` container. */
  grid?: string;
  /** One `role="row"`, a single week. */
  row?: string;
  /**
   * The `role="gridcell"` wrapper around each day button. Layout-neutral by
   * default in the styled layer (`display: contents`) so the button stays the
   * grid item; unstyled consumers styling `.row` as a grid must do the same.
   */
  dayCell?: string;
  /** One day button. */
  day?: string;
  /** Added to today's cell. Visual only - it is not a selection. */
  dayToday?: string;
  /** Added to the selected day, or to a range endpoint. */
  daySelected?: string;
  /** Added to a day failing min/max, the disabled list, or the business-day test. */
  dayDisabled?: string;
  /** Added to the padding days belonging to the neighbouring months. */
  dayOutside?: string;
  /** Added to the day holding the roving keyboard focus. Orthogonal to `daySelected`. */
  dayHighlighted?: string;
  /** The ISO week-number cell, shown when `showWeekNumbers` is on. */
  weekNumber?: string;
  /** The footer slot, when a `footer` render prop is supplied. */
  footer?: string;
}

/**
 * Props for the unstyled Calendar.
 *
 * @remarks
 * Ships no CSS - supply {@link CalendarClassNames}, or style via the `data-*`
 * hooks.
 *
 * Single-date or range selection, chosen with `mode`. The grid is a proper
 * `role="grid"` with roving focus: arrows move by day, PageUp/PageDown by month,
 * Home/End to the week's ends.
 *
 * Month and weekday names come from `Intl`, so they follow `locale` - but note
 * that this is display only. Month-name *parsing* elsewhere in this package
 * stays English on purpose, because a trader typing `15 Jan 2027` means January
 * whatever their UI locale says.
 */
export interface CalendarBaseProps {
  /** Selection mode. Default "single". */
  mode?: "single" | "range";
  /** Currently selected date (single mode). */
  value?: Date | null;
  /** Called when a day is selected (single mode). */
  onSelect?: (date: Date) => void;
  /** Currently selected range (range mode). */
  rangeValue?: DateRange | null;
  /** Called when the range changes (range mode); `end` is null mid-selection. */
  onRangeSelect?: (range: DateRange) => void;
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
  /** Dates to visually highlight (does not affect selectability). */
  highlightedDates?: Date[] | ((date: Date) => boolean);
  /** Show an ISO week-number column. Default false. */
  showWeekNumbers?: boolean;
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
  /**
   * Render the header title. Receives a {@link CalendarTitleApi} for building
   * month/year dropdown quick-nav. Defaults to a static "Month Year" label.
   */
  renderTitle?: (api: CalendarTitleApi) => ReactNode;
  /**
   * Content rendered below the grid. Either static nodes, or a render function
   * receiving a {@link CalendarFooterApi} to build navigation/shortcut controls
   * (e.g. "go to today", or 1W / 1M / 6M tenor shortcuts).
   */
  footer?: ReactNode | ((api: CalendarFooterApi) => ReactNode);
  /** Override "today" for testing. */
  today?: Date;
  /**
   * BCP 47 locale for month/weekday names and day labels. Defaults to the
   * runtime locale. Display only - date *parsing* is unaffected.
   */
  locale?: string;
  /**
   * Width of the weekday column headers. Default "short" (e.g. "Mon"); use
   * "narrow" for single letters. The `aria-label` always uses the long form.
   */
  weekdayFormat?: WeekdayWidth;
}

//  Component

/**
 * Unstyled Calendar. Ships no CSS; supply `classNames`.
 *
 * @see {@link CalendarBaseProps}
 */
export const CalendarBase = forwardRef<HTMLDivElement, CalendarBaseProps>(
  (
    {
      mode = "single",
      value,
      onSelect,
      rangeValue,
      onRangeSelect,
      month: controlledMonth,
      onMonthChange,
      min,
      max,
      disabledDates,
      highlightedDates,
      showWeekNumbers = false,
      weekStartsOn = 1,
      classNames: cn,
      dataAttributes,
      renderNavPrev,
      renderNavNext,
      renderTitle,
      footer,
      today: todayOverride,
      locale,
      weekdayFormat = "short",
    },
    ref,
  ) => {
    const isRange = mode === "range";
    const today = useMemo(() => todayOverride ?? new Date(), [todayOverride]);
    const gridRef = useRef<HTMLDivElement>(null);

    // Seed the day grid's "selected" marker and initial focus: the single value,
    // or a range endpoint in range mode.
    const focusSeed = isRange ? (rangeValue?.start ?? rangeValue?.end ?? null) : (value ?? null);

    const defaultMonthRef = useRef(
      focusSeed
        ? new Date(focusSeed.getFullYear(), focusSeed.getMonth(), 1)
        : new Date(today.getFullYear(), today.getMonth(), 1),
    );

    const [displayMonth, setMonth] = useControlledValue(
      controlledMonth,
      defaultMonthRef.current,
      onMonthChange,
    );
    const displayYear = displayMonth.getFullYear();
    const displayMonthIndex = displayMonth.getMonth();

    // Range preview: the day currently hovered while the range is half-open.
    const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
    const effectiveRange = useMemo(
      () => (isRange ? getEffectiveRange(rangeValue ?? null, hoveredDate) : null),
      [isRange, rangeValue, hoveredDate],
    );

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
          focusSeed,
          today,
          min,
          max,
          disabledDates,
        ),
      [displayYear, displayMonthIndex, weekStartsOn, focusSeed, today, min, max, disabledDates],
    );

    // The grid's single tab stop, tracked as a DATE so it survives month
    // navigation (APG: ArrowRight off the end of a month must land on the 1st of
    // the next month, ArrowDown must keep the weekday).
    const [focusedDate, setFocusedDate] = useState<Date | null>(() => getInitialFocusDate(days));

    // Re-seed focus only when the displayed month no longer contains it - i.e.
    // the month was changed by something other than keyboard navigation (nav
    // buttons, month/year dropdowns, a controlled `month` prop). Keyboard moves
    // set focus and month together, so this sees them already consistent and
    // leaves focus alone.
    useEffect(() => {
      if (
        focusedDate &&
        focusedDate.getFullYear() === displayYear &&
        focusedDate.getMonth() === displayMonthIndex
      ) {
        return;
      }
      setFocusedDate(getInitialFocusDate(days));
    }, [days, focusedDate, displayYear, displayMonthIndex]);

    // Move DOM focus to the newly focused day, but only when the grid already
    // owns focus - otherwise merely rendering the calendar would steal it.
    useEffect(() => {
      const grid = gridRef.current;
      if (!grid || !focusedDate) return;
      const btn = grid.querySelector(`[data-day="${dayKey(focusedDate)}"]`) as HTMLElement | null;
      if (btn && grid.contains(document.activeElement)) {
        btn.focus();
      }
    }, [focusedDate]);

    const handleDayClick = useCallback(
      (day: CalendarDay) => {
        if (day.isDisabled) return;
        if (isRange) {
          setHoveredDate(null);
          onRangeSelect?.(nextRange(rangeValue ?? null, day.date));
        } else {
          onSelect?.(day.date);
        }
      },
      [isRange, rangeValue, onRangeSelect, onSelect],
    );

    //  Title API - lets a custom header render month/year dropdown quick-nav.
    const titleApi = useMemo<CalendarTitleApi>(
      () => ({
        year: displayYear,
        monthIndex: displayMonthIndex,
        setYear: (y) => setMonth(new Date(y, displayMonthIndex, 1)),
        setMonthIndex: (m) => setMonth(new Date(displayYear, m, 1)),
        years: getYearRange(displayYear, min, max),
        isMonthDisabled: (m) => isMonthDisabled(displayYear, m, min, max),
        monthNames: getMonthNames(locale),
      }),
      [displayYear, displayMonthIndex, min, max, setMonth, locale],
    );

    //  Footer API - lets footer content navigate/select via stable callbacks.
    const footerApi = useMemo<CalendarFooterApi>(() => {
      const dateDisabled = (date: Date): boolean => isDateDisabled(date, min, max, disabledDates);
      const goToMonth = (month: Date): void => setMonth(firstOfMonth(month));
      const select = (date: Date): void => {
        if (dateDisabled(date)) return;
        onSelect?.(date);
        goToMonth(date);
      };
      return {
        today,
        month: new Date(displayYear, displayMonthIndex, 1),
        value: value ?? null,
        goToToday: () => goToMonth(today),
        selectToday: () => select(today),
        select,
        goToMonth,
        isDateDisabled: dateDisabled,
      };
    }, [today, displayYear, displayMonthIndex, value, min, max, disabledDates, onSelect, setMonth]);

    //  Keyboard - decision logic lives in the pure `resolveCalendarKey` machine;
    //  this adapter only executes the effects it returns against local setters.
    const handleKeyDown = useCallback(
      (e: KeyboardEvent<HTMLDivElement>) => {
        if (!focusedDate) return;

        // Read direction off the live grid rather than taking a prop: RTL is set
        // by an ancestor (`dir="rtl"` / a CSS `direction`), so the DOM is the
        // only honest source. Cheap - one read per keydown.
        const rtl = getComputedStyle(e.currentTarget).direction === "rtl";

        const { preventDefault, effects } = resolveCalendarKey(e.key, {
          focusedDate,
          weekStartsOn,
          rtl,
          shiftKey: e.shiftKey,
        });

        if (preventDefault) e.preventDefault();

        for (const effect of effects) {
          switch (effect.kind) {
            case "focusDate": {
              setFocusedDate(effect.date);
              // Follow focus across the month boundary. Set together with focus
              // so the re-seed effect above sees a consistent pair.
              if (
                effect.date.getFullYear() !== displayYear ||
                effect.date.getMonth() !== displayMonthIndex
              ) {
                setMonth(firstOfMonth(effect.date));
              }
              break;
            }
            case "selectFocused": {
              const day = days.find((d) => isSameDay(d.date, focusedDate));
              if (day) handleDayClick(day);
              break;
            }
          }
        }
      },
      [focusedDate, weekStartsOn, days, handleDayClick, displayYear, displayMonthIndex, setMonth],
    );

    const weekdayLabels = getWeekdayNames(locale, weekStartsOn, weekdayFormat);
    const weekdayLong = getWeekdayNames(locale, weekStartsOn, "long");

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
          <div className={cn?.title} aria-live={renderTitle ? undefined : "polite"}>
            {renderTitle
              ? renderTitle(titleApi)
              : formatMonthYear(displayYear, displayMonthIndex, locale)}
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
          aria-label={formatMonthYear(displayYear, displayMonthIndex, locale)}
          data-week-numbers={showWeekNumbers || undefined}
          onKeyDown={handleKeyDown}
          onMouseLeave={isRange ? () => setHoveredDate(null) : undefined}>
          {/* Weekday header row */}
          <div className={cx(cn?.weekdayRow, cn?.row)} role="row">
            {showWeekNumbers ? (
              <span className={cn?.weekNumber} role="columnheader">
                <span style={SR_ONLY}>Week</span>
              </span>
            ) : null}
            {weekdayLabels.map((label, i) => (
              // Keyed by position, not text: "narrow" weekday names are not
              // unique in most locales (en-US narrow is T, T, S, S...).
              <span
                key={weekdayLong[i]}
                className={cn?.weekday}
                role="columnheader"
                aria-label={weekdayLong[i]}>
                {label}
              </span>
            ))}
          </div>

          {/* Day rows - 6 rows of 7 days */}
          {Array.from({ length: 6 }, (_, rowIdx) => {
            const rowDays = days.slice(rowIdx * 7, rowIdx * 7 + 7);
            return (
              <div key={rowIdx} className={cn?.row} role="row">
                {showWeekNumbers ? (
                  <span className={cn?.weekNumber} role="rowheader">
                    {getISOWeek(rowDays[0].date)}
                  </span>
                ) : null}
                {rowDays.map((day) => {
                  const range = isRange ? getDayRangeState(day.date, effectiveRange) : null;
                  // Endpoints render as "selected" (filled); middle days are marked
                  // via data-range-middle for the styled layer.
                  const isSelected = range
                    ? range.isRangeStart || range.isRangeEnd
                    : day.isSelected;
                  const ariaSelected = range
                    ? range.isRangeStart || range.isRangeEnd || range.isInRange
                    : day.isSelected;
                  const highlighted = isDateHighlighted(day.date, highlightedDates);
                  const isFocused = focusedDate != null && isSameDay(day.date, focusedDate);
                  return (
                    // The gridcell is a wrapper, not the button: putting
                    // role="gridcell" on the <button> would override its button
                    // semantics, so AT never announced it as activatable. Grid
                    // membership (role, aria-selected) lives here; everything
                    // interactive stays on the button. Layout-neutral - the
                    // styled layer gives this `display: contents`.
                    <div
                      key={day.date.getTime()}
                      role="gridcell"
                      aria-selected={ariaSelected || undefined}
                      className={cn?.dayCell}>
                      <button
                        type="button"
                        data-day={dayKey(day.date)}
                        tabIndex={isFocused ? 0 : -1}
                        aria-label={formatDayLabel(day.date, locale)}
                        aria-disabled={day.isDisabled || undefined}
                        disabled={day.isDisabled}
                        data-range-start={range?.isRangeStart || undefined}
                        data-range-end={range?.isRangeEnd || undefined}
                        data-range-middle={range?.isInRange || undefined}
                        data-highlighted={highlighted || undefined}
                        className={cx(
                          cn?.day,
                          day.isToday && cn?.dayToday,
                          isSelected && cn?.daySelected,
                          day.isDisabled && cn?.dayDisabled,
                          !day.isCurrentMonth && cn?.dayOutside,
                          highlighted && cn?.dayHighlighted,
                        )}
                        // Keep the roving tab stop in sync when focus arrives
                        // from outside the keyboard handler. Guarded so the
                        // focus-moving effect below cannot feed itself.
                        onFocus={() => {
                          if (!isFocused) setFocusedDate(day.date);
                        }}
                        onMouseEnter={isRange ? () => setHoveredDate(day.date) : undefined}
                        onMouseDown={(e) => {
                          e.preventDefault(); // prevent blur on the parent input
                          handleDayClick(day);
                        }}>
                        {day.date.getDate()}
                      </button>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Footer - static node or a render function given the footer API */}
        {footer ? (
          <div className={cn?.footer}>
            {typeof footer === "function" ? footer(footerApi) : footer}
          </div>
        ) : null}
      </div>
    );
  },
);

CalendarBase.displayName = "CalendarBase";
