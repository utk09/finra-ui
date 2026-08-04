import { describe, expect, it } from "vitest";

import {
  addDays,
  addMonths,
  addYears,
  type CalendarKeyContext,
  endOfWeek,
  firstOfMonth,
  formatDayLabel,
  formatMonthYear,
  getDayRangeState,
  getEffectiveRange,
  getISOWeek,
  getMonthNames,
  getWeekdayNames,
  getYearRange,
  isDateDisabled,
  isDateHighlighted,
  isMonthDisabled,
  nextRange,
  resolveCalendarKey,
  startOfWeek,
} from "./calendar";

/** Thursday 15 Jan 2026 - mid-month, mid-week, so every direction is unclamped. */
const FOCUSED = new Date(2026, 0, 15);

function ctx(overrides: Partial<CalendarKeyContext> = {}): CalendarKeyContext {
  return { focusedDate: FOCUSED, weekStartsOn: 1, ...overrides };
}

/** The single date a key resolves to, or null when it produced no focus move. */
function focusedBy(key: string, overrides: Partial<CalendarKeyContext> = {}): Date | null {
  const { effects } = resolveCalendarKey(key, ctx(overrides));
  const effect = effects.find((e) => e.kind === "focusDate");
  return effect?.kind === "focusDate" ? effect.date : null;
}

describe("resolveCalendarKey", () => {
  it("ignores unmapped keys (no preventDefault, no effects)", () => {
    expect(resolveCalendarKey("a", ctx())).toEqual({ preventDefault: false, effects: [] });
  });

  it("leaves Tab alone so focus can escape the grid", () => {
    expect(resolveCalendarKey("Tab", ctx())).toEqual({ preventDefault: false, effects: [] });
  });

  //  Horizontal movement

  it("ArrowRight moves focus one day forward", () => {
    expect(focusedBy("ArrowRight")).toEqual(new Date(2026, 0, 16));
  });

  it("ArrowLeft moves focus one day back", () => {
    expect(focusedBy("ArrowLeft")).toEqual(new Date(2026, 0, 14));
  });

  it("ArrowRight off the end of a month lands on the 1st of the next month", () => {
    expect(focusedBy("ArrowRight", { focusedDate: new Date(2026, 0, 31) })).toEqual(
      new Date(2026, 1, 1),
    );
  });

  it("ArrowLeft off the start of a month lands on the last day of the previous month", () => {
    expect(focusedBy("ArrowLeft", { focusedDate: new Date(2026, 1, 1) })).toEqual(
      new Date(2026, 0, 31),
    );
  });

  it("swaps the horizontal arrows under RTL", () => {
    expect(focusedBy("ArrowRight", { rtl: true })).toEqual(new Date(2026, 0, 14));
    expect(focusedBy("ArrowLeft", { rtl: true })).toEqual(new Date(2026, 0, 16));
  });

  //  Vertical movement

  it("ArrowDown moves focus a week forward", () => {
    expect(focusedBy("ArrowDown")).toEqual(new Date(2026, 0, 22));
  });

  it("ArrowUp moves focus a week back", () => {
    expect(focusedBy("ArrowUp")).toEqual(new Date(2026, 0, 8));
  });

  it("ArrowDown across a month boundary preserves the weekday (APG)", () => {
    const from = new Date(2026, 0, 29); // Thursday
    const to = focusedBy("ArrowDown", { focusedDate: from });
    expect(to).toEqual(new Date(2026, 1, 5));
    expect(to?.getDay()).toBe(from.getDay());
  });

  it("ArrowUp across a month boundary preserves the weekday (APG)", () => {
    const from = new Date(2026, 1, 3); // Tuesday
    const to = focusedBy("ArrowUp", { focusedDate: from });
    expect(to).toEqual(new Date(2026, 0, 27));
    expect(to?.getDay()).toBe(from.getDay());
  });

  //  Week edges

  it("Home moves to the start of the week (Monday start)", () => {
    expect(focusedBy("Home")).toEqual(new Date(2026, 0, 12));
  });

  it("End moves to the end of the week (Monday start)", () => {
    expect(focusedBy("End")).toEqual(new Date(2026, 0, 18));
  });

  it("Home/End respect a Sunday week start", () => {
    expect(focusedBy("Home", { weekStartsOn: 0 })).toEqual(new Date(2026, 0, 11));
    expect(focusedBy("End", { weekStartsOn: 0 })).toEqual(new Date(2026, 0, 17));
  });

  //  Paging

  it("PageDown pages a month forward", () => {
    expect(focusedBy("PageDown")).toEqual(new Date(2026, 1, 15));
  });

  it("PageUp pages a month back", () => {
    expect(focusedBy("PageUp")).toEqual(new Date(2025, 11, 15));
  });

  it("Shift+PageDown pages a year forward", () => {
    expect(focusedBy("PageDown", { shiftKey: true })).toEqual(new Date(2027, 0, 15));
  });

  it("Shift+PageUp pages a year back", () => {
    expect(focusedBy("PageUp", { shiftKey: true })).toEqual(new Date(2025, 0, 15));
  });

  it("paging clamps the day to the target month's length", () => {
    // 31 Jan + 1 month must be 28 Feb, not 3 Mar.
    expect(focusedBy("PageDown", { focusedDate: new Date(2026, 0, 31) })).toEqual(
      new Date(2026, 1, 28),
    );
  });

  //  Selection

  it("Enter selects the focused day", () => {
    expect(resolveCalendarKey("Enter", ctx())).toEqual({
      preventDefault: true,
      effects: [{ kind: "selectFocused" }],
    });
  });

  it("Space behaves exactly like Enter", () => {
    expect(resolveCalendarKey(" ", ctx())).toEqual(resolveCalendarKey("Enter", ctx()));
  });
});

describe("date arithmetic", () => {
  it("addDays crosses month and year boundaries", () => {
    expect(addDays(new Date(2026, 0, 31), 1)).toEqual(new Date(2026, 1, 1));
    expect(addDays(new Date(2026, 11, 31), 1)).toEqual(new Date(2027, 0, 1));
    expect(addDays(new Date(2026, 0, 1), -1)).toEqual(new Date(2025, 11, 31));
  });

  it("addMonths clamps to the target month's last day", () => {
    expect(addMonths(new Date(2026, 0, 31), 1)).toEqual(new Date(2026, 1, 28));
    expect(addMonths(new Date(2024, 0, 31), 1)).toEqual(new Date(2024, 1, 29)); // leap year
    expect(addMonths(new Date(2026, 2, 31), -1)).toEqual(new Date(2026, 1, 28));
  });

  it("addMonths keeps the day when it fits", () => {
    expect(addMonths(new Date(2026, 0, 15), 2)).toEqual(new Date(2026, 2, 15));
  });

  it("addYears clamps 29 February onto a non-leap year", () => {
    expect(addYears(new Date(2024, 1, 29), 1)).toEqual(new Date(2025, 1, 28));
    expect(addYears(new Date(2024, 1, 29), 4)).toEqual(new Date(2028, 1, 29));
    expect(addYears(new Date(2024, 1, 29), -1)).toEqual(new Date(2023, 1, 28));
  });

  it("addYears keeps the day when it fits", () => {
    expect(addYears(new Date(2026, 5, 15), 3)).toEqual(new Date(2029, 5, 15));
  });

  it("startOfWeek/endOfWeek bracket the week per weekStartsOn", () => {
    const thu = new Date(2026, 0, 15);
    expect(startOfWeek(thu, 1)).toEqual(new Date(2026, 0, 12));
    expect(endOfWeek(thu, 1)).toEqual(new Date(2026, 0, 18));
    expect(startOfWeek(thu, 0)).toEqual(new Date(2026, 0, 11));
    expect(endOfWeek(thu, 0)).toEqual(new Date(2026, 0, 17));
  });
});

describe("Intl-backed names", () => {
  it("getMonthNames returns 12 localised names, January-first", () => {
    expect(getMonthNames("en-US")).toHaveLength(12);
    expect(getMonthNames("en-US")[0]).toBe("January");
    expect(getMonthNames("fr-FR")[0]).toBe("janvier");
  });

  it("getMonthNames supports a short width", () => {
    expect(getMonthNames("en-US", "short")[0]).toBe("Jan");
  });

  it("getWeekdayNames rotates to the configured week start", () => {
    expect(getWeekdayNames("en-US", 1, "long")[0]).toBe("Monday");
    expect(getWeekdayNames("en-US", 0, "long")[0]).toBe("Sunday");
    expect(getWeekdayNames("en-US", 1, "long")).toHaveLength(7);
  });

  it("getWeekdayNames honours the requested width", () => {
    expect(getWeekdayNames("en-US", 1, "short")[0]).toBe("Mon");
    expect(getWeekdayNames("en-US", 1, "narrow")[0]).toBe("M");
  });

  it("getWeekdayNames localises", () => {
    expect(getWeekdayNames("fr-FR", 1, "long")[0]).toBe("lundi");
  });

  it("formatMonthYear and formatDayLabel follow the locale", () => {
    expect(formatMonthYear(2026, 0, "en-US")).toBe("January 2026");
    expect(formatDayLabel(new Date(2026, 0, 15), "en-US")).toBe("January 15, 2026");
    expect(formatMonthYear(2026, 0, "fr-FR")).toBe("janvier 2026");
  });
});

describe("firstOfMonth", () => {
  it("returns midnight on the 1st of the date's month", () => {
    const result = firstOfMonth(new Date(2026, 5, 17, 13, 30));
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(5);
    expect(result.getDate()).toBe(1);
    expect(result.getHours()).toBe(0);
  });
});

describe("isDateDisabled", () => {
  const d = (y: number, m: number, day: number) => new Date(y, m, day);

  it("is false with no constraints", () => {
    expect(isDateDisabled(d(2026, 2, 15))).toBe(false);
  });

  it("respects min (inclusive)", () => {
    const min = d(2026, 2, 10);
    expect(isDateDisabled(d(2026, 2, 9), min)).toBe(true);
    expect(isDateDisabled(d(2026, 2, 10), min)).toBe(false);
  });

  it("respects max (inclusive)", () => {
    const max = d(2026, 2, 20);
    expect(isDateDisabled(d(2026, 2, 21), undefined, max)).toBe(true);
    expect(isDateDisabled(d(2026, 2, 20), undefined, max)).toBe(false);
  });

  it("ignores the time component (compares by day)", () => {
    const min = d(2026, 2, 10);
    expect(isDateDisabled(new Date(2026, 2, 10, 23, 59), min)).toBe(false);
  });

  it("supports a disabledDates array", () => {
    const disabled = [d(2026, 2, 14)];
    expect(isDateDisabled(d(2026, 2, 14), undefined, undefined, disabled)).toBe(true);
    expect(isDateDisabled(d(2026, 2, 15), undefined, undefined, disabled)).toBe(false);
  });

  it("supports a disabledDates predicate", () => {
    const isWeekend = (date: Date) => date.getDay() === 0 || date.getDay() === 6;
    expect(isDateDisabled(d(2026, 2, 15), undefined, undefined, isWeekend)).toBe(true); // Sunday
    expect(isDateDisabled(d(2026, 2, 16), undefined, undefined, isWeekend)).toBe(false); // Monday
  });
});

describe("getYearRange", () => {
  it("defaults to currentYear +/- span (inclusive)", () => {
    const years = getYearRange(2026, undefined, undefined, 2);
    expect(years).toEqual([2024, 2025, 2026, 2027, 2028]);
  });

  it("is bounded by min/max years", () => {
    expect(getYearRange(2026, new Date(2020, 0, 1), new Date(2028, 0, 1))).toEqual([
      2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028,
    ]);
  });

  it("always includes the current year even if it sits outside min/max", () => {
    // min year is after the current year - range still stretches to include current.
    const years = getYearRange(2026, new Date(2030, 0, 1), undefined, 1);
    expect(years[0]).toBe(2026);
    expect(years).toContain(2026);
  });
});

describe("isMonthDisabled", () => {
  it("is false with no constraints", () => {
    expect(isMonthDisabled(2026, 5, undefined, undefined)).toBe(false);
  });

  it("disables months entirely before min", () => {
    const min = new Date(2026, 2, 10); // March 10
    expect(isMonthDisabled(2026, 1, min)).toBe(true); // February (all before)
    expect(isMonthDisabled(2026, 2, min)).toBe(false); // March (has selectable days)
  });

  it("disables months entirely after max", () => {
    const max = new Date(2026, 2, 15); // March 15
    expect(isMonthDisabled(2026, 3, undefined, max)).toBe(true); // April (all after)
    expect(isMonthDisabled(2026, 2, undefined, max)).toBe(false); // March
  });
});

describe("nextRange", () => {
  const mar10 = new Date(2026, 2, 10);
  const mar20 = new Date(2026, 2, 20);

  it("starts a new range from null", () => {
    expect(nextRange(null, mar10)).toEqual({ start: mar10, end: null });
  });

  it("completes the range when a start exists (later click)", () => {
    expect(nextRange({ start: mar10, end: null }, mar20)).toEqual({ start: mar10, end: mar20 });
  });

  it("orders endpoints when the second click is earlier", () => {
    expect(nextRange({ start: mar20, end: null }, mar10)).toEqual({ start: mar10, end: mar20 });
  });

  it("restarts from a complete range", () => {
    expect(nextRange({ start: mar10, end: mar20 }, new Date(2026, 3, 1))).toEqual({
      start: new Date(2026, 3, 1),
      end: null,
    });
  });
});

describe("getEffectiveRange", () => {
  const mar10 = new Date(2026, 2, 10);
  const mar20 = new Date(2026, 2, 20);

  it("is null when nothing is set", () => {
    expect(getEffectiveRange(null, null)).toBeNull();
    expect(getEffectiveRange({ start: null, end: null }, null)).toBeNull();
  });

  it("returns the ordered completed range", () => {
    expect(getEffectiveRange({ start: mar20, end: mar10 }, null)).toEqual({
      start: mar10,
      end: mar20,
    });
  });

  it("previews to the hovered day while half-open", () => {
    expect(getEffectiveRange({ start: mar10, end: null }, mar20)).toEqual({
      start: mar10,
      end: mar20,
    });
  });

  it("collapses to the start when half-open with no hover", () => {
    expect(getEffectiveRange({ start: mar10, end: null }, null)).toEqual({
      start: mar10,
      end: mar10,
    });
  });
});

describe("isDateHighlighted", () => {
  it("is false without highlightedDates", () => {
    expect(isDateHighlighted(new Date(2026, 2, 20))).toBe(false);
  });
  it("matches an array of dates", () => {
    const list = [new Date(2026, 2, 20)];
    expect(isDateHighlighted(new Date(2026, 2, 20), list)).toBe(true);
    expect(isDateHighlighted(new Date(2026, 2, 21), list)).toBe(false);
  });
  it("supports a predicate", () => {
    const isTwentyFifth = (d: Date) => d.getDate() === 25;
    expect(isDateHighlighted(new Date(2026, 2, 25), isTwentyFifth)).toBe(true);
    expect(isDateHighlighted(new Date(2026, 2, 24), isTwentyFifth)).toBe(false);
  });
});

describe("getISOWeek", () => {
  it("returns week 1 for a year starting on Thursday", () => {
    expect(getISOWeek(new Date(2026, 0, 1))).toBe(1); // Jan 1 2026 = Thursday
  });
  it("advances to week 2 the following Monday", () => {
    expect(getISOWeek(new Date(2026, 0, 5))).toBe(2); // Jan 5 2026 = Monday
  });
  it("returns week 53 for a 53-week year", () => {
    expect(getISOWeek(new Date(2026, 11, 31))).toBe(53); // Dec 31 2026 = Thursday
  });
});

describe("getDayRangeState", () => {
  const eff = { start: new Date(2026, 2, 10), end: new Date(2026, 2, 20) };

  it("is all false with no effective range", () => {
    expect(getDayRangeState(new Date(2026, 2, 15), null)).toEqual({
      isRangeStart: false,
      isRangeEnd: false,
      isInRange: false,
    });
  });

  it("flags start, end, and middle days", () => {
    expect(getDayRangeState(new Date(2026, 2, 10), eff).isRangeStart).toBe(true);
    expect(getDayRangeState(new Date(2026, 2, 20), eff).isRangeEnd).toBe(true);
    expect(getDayRangeState(new Date(2026, 2, 15), eff).isInRange).toBe(true);
  });

  it("excludes days outside the range", () => {
    const state = getDayRangeState(new Date(2026, 2, 25), eff);
    expect(state).toEqual({ isRangeStart: false, isRangeEnd: false, isInRange: false });
  });
});
