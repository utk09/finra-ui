import { describe, expect, it } from "vitest";

import { menuTypeahead, resolveMenuKey } from "./menu";

describe("resolveMenuKey", () => {
  it("closes on Escape (prevented) and Tab (not prevented)", () => {
    expect(resolveMenuKey("Escape", { currentIndex: 0, count: 3 })).toEqual({
      preventDefault: true,
      effects: [{ type: "close" }],
    });
    expect(resolveMenuKey("Tab", { currentIndex: 0, count: 3 })).toEqual({
      preventDefault: false,
      effects: [{ type: "close" }],
    });
  });

  it("is a no-op for movement keys with no items", () => {
    expect(resolveMenuKey("ArrowDown", { currentIndex: -1, count: 0 })).toEqual({
      preventDefault: false,
      effects: [],
    });
  });

  it("moves focus down, wrapping, and from nothing to first", () => {
    expect(resolveMenuKey("ArrowDown", { currentIndex: -1, count: 3 }).effects).toEqual([
      { type: "focus", index: 0 },
    ]);
    expect(resolveMenuKey("ArrowDown", { currentIndex: 0, count: 3 }).effects).toEqual([
      { type: "focus", index: 1 },
    ]);
    expect(resolveMenuKey("ArrowDown", { currentIndex: 2, count: 3 }).effects).toEqual([
      { type: "focus", index: 0 },
    ]);
  });

  it("moves focus up, wrapping, and from nothing to last", () => {
    expect(resolveMenuKey("ArrowUp", { currentIndex: -1, count: 3 }).effects).toEqual([
      { type: "focus", index: 2 },
    ]);
    expect(resolveMenuKey("ArrowUp", { currentIndex: 0, count: 3 }).effects).toEqual([
      { type: "focus", index: 2 },
    ]);
    expect(resolveMenuKey("ArrowUp", { currentIndex: 1, count: 3 }).effects).toEqual([
      { type: "focus", index: 0 },
    ]);
  });

  it("jumps to first (Home) and last (End)", () => {
    expect(resolveMenuKey("Home", { currentIndex: 2, count: 3 }).effects).toEqual([
      { type: "focus", index: 0 },
    ]);
    expect(resolveMenuKey("End", { currentIndex: 0, count: 3 }).effects).toEqual([
      { type: "focus", index: 2 },
    ]);
  });

  it("ignores other keys", () => {
    expect(resolveMenuKey("a", { currentIndex: 0, count: 3 })).toEqual({
      preventDefault: false,
      effects: [],
    });
  });
});

describe("menuTypeahead", () => {
  const labels = ["Edit", "Duplicate", "Delete"];

  it("finds the first match after `from`, wrapping", () => {
    expect(menuTypeahead(labels, "d", 0)).toBe(1); // Duplicate
    expect(menuTypeahead(labels, "d", 1)).toBe(2); // Delete (next "d" after Duplicate)
    expect(menuTypeahead(labels, "e", 2)).toBe(0); // Edit (wraps from Delete)
  });

  it("is case-insensitive", () => {
    expect(menuTypeahead(labels, "DEL", 0)).toBe(2);
  });

  it("returns -1 for empty query or no match", () => {
    expect(menuTypeahead(labels, "", 0)).toBe(-1);
    expect(menuTypeahead(labels, "z", 0)).toBe(-1);
  });
});
