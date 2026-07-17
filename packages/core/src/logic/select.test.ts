import { describe, expect, it } from "vitest";

import {
  findSelectedIndex,
  firstEnabledIndex,
  lastEnabledIndex,
  nextEnabledIndex,
  resolveSelectKey,
  type SelectKeyContext,
  type SelectOptionData,
  typeaheadIndex,
} from "./select";

const options: readonly SelectOptionData[] = [
  { value: "a", label: "Apple" },
  { value: "b", label: "Banana", disabled: true },
  { value: "c", label: "Cherry" },
  { value: "d", label: "Date" },
];

const allDisabled: readonly SelectOptionData[] = [{ value: "x", label: "X", disabled: true }];

describe("findSelectedIndex", () => {
  it("returns the index of a matching value", () => {
    expect(findSelectedIndex(options, "c")).toBe(2);
  });
  it("returns -1 when nothing matches", () => {
    expect(findSelectedIndex(options, "z")).toBe(-1);
    expect(findSelectedIndex(options, undefined)).toBe(-1);
  });
});

describe("firstEnabledIndex / lastEnabledIndex", () => {
  it("skips disabled options", () => {
    expect(firstEnabledIndex(options)).toBe(0);
    expect(lastEnabledIndex(options)).toBe(3);
  });
  it("returns -1 when all disabled or empty", () => {
    expect(firstEnabledIndex(allDisabled)).toBe(-1);
    expect(lastEnabledIndex(allDisabled)).toBe(-1);
    expect(firstEnabledIndex([])).toBe(-1);
    expect(lastEnabledIndex([])).toBe(-1);
  });
});

describe("nextEnabledIndex", () => {
  it("returns -1 for empty options", () => {
    expect(nextEnabledIndex([], -1, 1, true)).toBe(-1);
  });

  it("moves forward skipping disabled options", () => {
    expect(nextEnabledIndex(options, 0, 1, true)).toBe(2); // 1 is disabled
  });

  it("moves backward skipping disabled options", () => {
    expect(nextEnabledIndex(options, 2, -1, true)).toBe(0); // 1 is disabled
  });

  it("wraps to the start when looping forward past the end", () => {
    expect(nextEnabledIndex(options, 3, 1, true)).toBe(0);
  });

  it("wraps to the end when looping backward past the start", () => {
    expect(nextEnabledIndex(options, 0, -1, true)).toBe(3);
  });

  it("clamps (stays put) when not looping past the end", () => {
    expect(nextEnabledIndex(options, 3, 1, false)).toBe(3);
  });

  it("clamps (stays put) when not looping past the start", () => {
    expect(nextEnabledIndex(options, 0, -1, false)).toBe(0);
  });

  it("starts from -1 forward to the first enabled", () => {
    expect(nextEnabledIndex(options, -1, 1, true)).toBe(0);
  });

  it("falls back to the first enabled when `from` is disabled and range is exhausted", () => {
    // Non-loop, from a disabled index at the boundary with nothing enabled ahead.
    const opts: readonly SelectOptionData[] = [
      { value: "a", label: "A" },
      { value: "b", label: "B", disabled: true },
    ];
    expect(nextEnabledIndex(opts, 1, 1, false)).toBe(0);
  });

  it("returns -1 when every option is disabled", () => {
    expect(nextEnabledIndex(allDisabled, -1, 1, true)).toBe(-1);
  });
});

describe("typeaheadIndex", () => {
  it("finds the first enabled match after `from`, wrapping", () => {
    expect(typeaheadIndex(options, "c", -1)).toBe(2);
    expect(typeaheadIndex(options, "d", 2)).toBe(3);
  });
  it("is case-insensitive", () => {
    expect(typeaheadIndex(options, "APP", -1)).toBe(0);
  });
  it("skips disabled matches", () => {
    expect(typeaheadIndex(options, "ban", -1)).toBe(-1);
  });
  it("returns -1 for an empty query or no match", () => {
    expect(typeaheadIndex(options, "", -1)).toBe(-1);
    expect(typeaheadIndex(options, "zzz", -1)).toBe(-1);
  });
});

describe("resolveSelectKey (closed)", () => {
  const base: SelectKeyContext = { open: false, activeIndex: -1, selectedIndex: -1, options };

  it("opens on ArrowDown at the first enabled option", () => {
    const r = resolveSelectKey("ArrowDown", base);
    expect(r.preventDefault).toBe(true);
    expect(r.effects).toEqual([{ type: "open", activeIndex: 0 }]);
  });

  it("opens on ArrowUp at the last enabled option", () => {
    expect(resolveSelectKey("ArrowUp", base).effects).toEqual([{ type: "open", activeIndex: 3 }]);
  });

  it("opens at the selected option when one is selected", () => {
    const r = resolveSelectKey("Enter", { ...base, selectedIndex: 2 });
    expect(r.effects).toEqual([{ type: "open", activeIndex: 2 }]);
  });

  it("opens on Space", () => {
    expect(resolveSelectKey(" ", base).effects).toEqual([{ type: "open", activeIndex: 0 }]);
  });

  it("ignores other keys", () => {
    const r = resolveSelectKey("a", base);
    expect(r.preventDefault).toBe(false);
    expect(r.effects).toEqual([]);
  });
});

describe("resolveSelectKey (open)", () => {
  const base: SelectKeyContext = { open: true, activeIndex: 0, selectedIndex: -1, options };

  it("moves active down / up / home / end", () => {
    expect(resolveSelectKey("ArrowDown", base).effects).toEqual([{ type: "setActive", index: 2 }]);
    expect(resolveSelectKey("ArrowUp", base).effects).toEqual([{ type: "setActive", index: 3 }]);
    expect(resolveSelectKey("Home", base).effects).toEqual([{ type: "setActive", index: 0 }]);
    expect(resolveSelectKey("End", base).effects).toEqual([{ type: "setActive", index: 3 }]);
  });

  it("selects the active option on Enter / Space", () => {
    expect(resolveSelectKey("Enter", base).effects).toEqual([{ type: "select", index: 0 }]);
    expect(resolveSelectKey(" ", base).effects).toEqual([{ type: "select", index: 0 }]);
  });

  it("closes on Enter when nothing is active", () => {
    expect(resolveSelectKey("Enter", { ...base, activeIndex: -1 }).effects).toEqual([
      { type: "close" },
    ]);
  });

  it("closes on Escape", () => {
    expect(resolveSelectKey("Escape", base).effects).toEqual([{ type: "close" }]);
  });

  it("closes on Tab without preventing default", () => {
    const r = resolveSelectKey("Tab", base);
    expect(r.preventDefault).toBe(false);
    expect(r.effects).toEqual([{ type: "close" }]);
  });

  it("ignores other keys", () => {
    expect(resolveSelectKey("x", base).effects).toEqual([]);
  });
});
