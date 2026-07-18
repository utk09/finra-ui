import { describe, expect, it } from "vitest";

import {
  CALENDAR_CELL_COUNT,
  type CalendarKeyContext,
  firstOfMonth,
  getDayRangeState,
  getEffectiveRange,
  getISOWeek,
  getYearRange,
  isDateDisabled,
  isDateHighlighted,
  isMonthDisabled,
  nextRange,
  resolveCalendarKey,
} from "./calendar";

/** Full-grid default (42 rendered day cells); override per test. */
function ctx(overrides: Partial<CalendarKeyContext> = {}): CalendarKeyContext {
  return { focusedIndex: 10, dayCount: CALENDAR_CELL_COUNT, ...overrides };
}

describe("resolveCalendarKey", () => {
  it("ignores unmapped keys (no preventDefault, no effects)", () => {
    expect(resolveCalendarKey("a", ctx())).toEqual({ preventDefault: false, effects: [] });
    expect(resolveCalendarKey("Tab", ctx())).toEqual({ preventDefault: false, effects: [] });
  });

  //  Horizontal movement

  it("ArrowRight moves focus one cell forward", () => {
    expect(resolveCalendarKey("ArrowRight", ctx({ focusedIndex: 10 }))).toEqual({
      preventDefault: true,
      effects: [{ kind: "setFocus", index: 11 }],
    });
  });

  it("ArrowRight past the last cell rolls to the next month", () => {
    expect(
      resolveCalendarKey("ArrowRight", ctx({ focusedIndex: CALENDAR_CELL_COUNT - 1 })),
    ).toEqual({ preventDefault: true, effects: [{ kind: "goToNextMonth" }] });
  });

  it("ArrowLeft moves focus one cell back", () => {
    expect(resolveCalendarKey("ArrowLeft", ctx({ focusedIndex: 10 }))).toEqual({
      preventDefault: true,
      effects: [{ kind: "setFocus", index: 9 }],
    });
  });

  it("ArrowLeft before the first cell rolls to the previous month", () => {
    expect(resolveCalendarKey("ArrowLeft", ctx({ focusedIndex: 0 }))).toEqual({
      preventDefault: true,
      effects: [{ kind: "goToPrevMonth" }],
    });
  });

  //  Vertical movement (7-cell step)

  it("ArrowDown moves focus down a week", () => {
    expect(resolveCalendarKey("ArrowDown", ctx({ focusedIndex: 10 }))).toEqual({
      preventDefault: true,
      effects: [{ kind: "setFocus", index: 17 }],
    });
  });

  it("ArrowDown past the last row rolls to the next month", () => {
    // 36 + 7 = 43 >= 42
    expect(resolveCalendarKey("ArrowDown", ctx({ focusedIndex: 36 }))).toEqual({
      preventDefault: true,
      effects: [{ kind: "goToNextMonth" }],
    });
  });

  it("ArrowUp moves focus up a week", () => {
    expect(resolveCalendarKey("ArrowUp", ctx({ focusedIndex: 20 }))).toEqual({
      preventDefault: true,
      effects: [{ kind: "setFocus", index: 13 }],
    });
  });

  it("ArrowUp before the first row rolls to the previous month", () => {
    // 6 - 7 = -1 < 0
    expect(resolveCalendarKey("ArrowUp", ctx({ focusedIndex: 6 }))).toEqual({
      preventDefault: true,
      effects: [{ kind: "goToPrevMonth" }],
    });
  });

  //  Selection

  it("Enter selects the focused day when in bounds", () => {
    expect(resolveCalendarKey("Enter", ctx({ focusedIndex: 10, dayCount: 42 }))).toEqual({
      preventDefault: true,
      effects: [{ kind: "selectFocused" }],
    });
  });

  it("Space behaves exactly like Enter", () => {
    expect(resolveCalendarKey(" ", ctx({ focusedIndex: 10 }))).toEqual(
      resolveCalendarKey("Enter", ctx({ focusedIndex: 10 })),
    );
  });

  it("Enter with nothing focused is a no-op (but still preventDefault)", () => {
    expect(resolveCalendarKey("Enter", ctx({ focusedIndex: -1 }))).toEqual({
      preventDefault: true,
      effects: [],
    });
  });

  it("Enter past the rendered day count is a no-op (but still preventDefault)", () => {
    expect(resolveCalendarKey("Enter", ctx({ focusedIndex: 42, dayCount: 42 }))).toEqual({
      preventDefault: true,
      effects: [],
    });
  });

  //  Paging

  it("PageDown pages to the next month", () => {
    expect(resolveCalendarKey("PageDown", ctx())).toEqual({
      preventDefault: true,
      effects: [{ kind: "goToNextMonth" }],
    });
  });

  it("PageUp pages to the previous month", () => {
    expect(resolveCalendarKey("PageUp", ctx())).toEqual({
      preventDefault: true,
      effects: [{ kind: "goToPrevMonth" }],
    });
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
