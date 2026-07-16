import { describe, expect, it } from "vitest";

import { CALENDAR_CELL_COUNT, type CalendarKeyContext, resolveCalendarKey } from "./calendar";

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
