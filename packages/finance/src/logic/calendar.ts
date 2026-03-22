/**
 * Pure calendar computation logic - zero framework imports.
 * Used by React CalendarBase and future Lit finra-calendar.
 */

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isDisabled: boolean;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export const WEEKDAY_SHORT_MON = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"] as const;
export const WEEKDAY_SHORT_SUN = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;
export const WEEKDAY_LONG_MON = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;
export const WEEKDAY_LONG_SUN = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export function dayOfWeekIndex(date: Date, weekStartsOn: 0 | 1): number {
  return (date.getDay() - weekStartsOn + 7) % 7;
}

export function formatMonthYear(year: number, month: number): string {
  return `${MONTH_NAMES[month]} ${year}`;
}

export function formatDayLabel(date: Date): string {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

/**
 * Compute the 42 day cells (6 rows x 7 cols) for a calendar grid.
 */
export function getCalendarDays(
  year: number,
  month: number,
  weekStartsOn: 0 | 1,
  value: Date | null | undefined,
  today: Date,
  min?: Date,
  max?: Date,
  disabledDates?: Date[] | ((date: Date) => boolean),
): CalendarDay[] {
  const firstDayOfMonth = new Date(year, month, 1);
  const startOffset = dayOfWeekIndex(firstDayOfMonth, weekStartsOn);
  const startDate = new Date(year, month, 1 - startOffset);

  const days: CalendarDay[] = [];
  const minDay = min ? startOfDay(min) : null;
  const maxDay = max ? startOfDay(max) : null;
  const todayDay = startOfDay(today);

  for (let i = 0; i < 42; i++) {
    const d = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i);
    const dayStart = startOfDay(d);
    const isCurrentMonth = d.getMonth() === month && d.getFullYear() === year;

    let isDisabled = !isCurrentMonth;
    if (isCurrentMonth) {
      if (minDay && dayStart < minDay) isDisabled = true;
      if (maxDay && dayStart > maxDay) isDisabled = true;
      if (!isDisabled && disabledDates) {
        if (typeof disabledDates === "function") {
          isDisabled = disabledDates(d);
        } else {
          isDisabled = disabledDates.some((dd) => isSameDay(dd, d));
        }
      }
    }

    days.push({
      date: d,
      isCurrentMonth,
      isToday: isSameDay(d, todayDay),
      isSelected: value != null && isSameDay(d, value),
      isDisabled,
    });
  }

  return days;
}

/** Resolve which day index should be focused initially. */
export function getInitialFocusIndex(days: CalendarDay[]): number {
  const sel = days.findIndex((d) => d.isSelected && d.isCurrentMonth);
  if (sel >= 0) return sel;
  const tod = days.findIndex((d) => d.isToday && d.isCurrentMonth);
  if (tod >= 0) return tod;
  return days.findIndex((d) => d.isCurrentMonth);
}
