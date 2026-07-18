import { describe, expect, it } from "vitest";

import { resolveTabsKey, type TabsOrientation } from "./tabs";

const ctx = (currentIndex: number, count: number, orientation: TabsOrientation = "horizontal") => ({
  currentIndex,
  count,
  orientation,
});

describe("resolveTabsKey", () => {
  it("does nothing when there are no tabs", () => {
    expect(resolveTabsKey("ArrowRight", ctx(-1, 0))).toEqual({
      preventDefault: false,
      effects: [],
    });
  });

  it("ignores unrelated keys", () => {
    expect(resolveTabsKey("a", ctx(0, 3))).toEqual({ preventDefault: false, effects: [] });
  });

  describe("horizontal", () => {
    it("ArrowRight moves to the next tab and wraps", () => {
      expect(resolveTabsKey("ArrowRight", ctx(0, 3)).effects).toEqual([
        { type: "focus", index: 1 },
      ]);
      expect(resolveTabsKey("ArrowRight", ctx(2, 3)).effects).toEqual([
        { type: "focus", index: 0 },
      ]);
    });

    it("ArrowLeft moves to the previous tab and wraps", () => {
      expect(resolveTabsKey("ArrowLeft", ctx(1, 3)).effects).toEqual([{ type: "focus", index: 0 }]);
      expect(resolveTabsKey("ArrowLeft", ctx(0, 3)).effects).toEqual([{ type: "focus", index: 2 }]);
    });

    it("ignores the vertical arrows", () => {
      expect(resolveTabsKey("ArrowDown", ctx(0, 3)).effects).toEqual([]);
      expect(resolveTabsKey("ArrowUp", ctx(0, 3)).effects).toEqual([]);
    });
  });

  describe("vertical", () => {
    it("ArrowDown moves to the next tab and wraps", () => {
      expect(resolveTabsKey("ArrowDown", ctx(2, 3, "vertical")).effects).toEqual([
        { type: "focus", index: 0 },
      ]);
    });

    it("ArrowUp moves to the previous tab and wraps", () => {
      expect(resolveTabsKey("ArrowUp", ctx(0, 3, "vertical")).effects).toEqual([
        { type: "focus", index: 2 },
      ]);
    });

    it("ignores the horizontal arrows", () => {
      expect(resolveTabsKey("ArrowRight", ctx(0, 3, "vertical")).effects).toEqual([]);
      expect(resolveTabsKey("ArrowLeft", ctx(0, 3, "vertical")).effects).toEqual([]);
    });
  });

  it("Home and End jump to the ends", () => {
    expect(resolveTabsKey("Home", ctx(2, 4)).effects).toEqual([{ type: "focus", index: 0 }]);
    expect(resolveTabsKey("End", ctx(0, 4)).effects).toEqual([{ type: "focus", index: 3 }]);
  });

  it("prevents default for handled keys only", () => {
    expect(resolveTabsKey("ArrowRight", ctx(0, 3)).preventDefault).toBe(true);
    expect(resolveTabsKey("Home", ctx(0, 3)).preventDefault).toBe(true);
    expect(resolveTabsKey("x", ctx(0, 3)).preventDefault).toBe(false);
  });
});
