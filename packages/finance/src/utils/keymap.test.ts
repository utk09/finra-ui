import { describe, expect, it } from "vitest";

import { DEFAULT_PRICE_KEYMAP, keyChord, resolveKey } from "./keymap";

describe("keyChord", () => {
  it("normalizes plain keys", () => {
    expect(keyChord({ key: "ArrowUp" })).toBe("ArrowUp");
  });

  it("prefixes modifiers in a fixed order", () => {
    expect(keyChord({ key: "ArrowUp", shiftKey: true })).toBe("shift+ArrowUp");
    expect(keyChord({ key: "ArrowUp", ctrlKey: true, shiftKey: true })).toBe("ctrl+shift+ArrowUp");
    expect(keyChord({ key: "a", metaKey: true })).toBe("meta+a");
  });
});

describe("resolveKey (default price keymap)", () => {
  it("maps arrows to tick increments", () => {
    expect(resolveKey({ key: "ArrowUp" }, DEFAULT_PRICE_KEYMAP)).toEqual({
      kind: "increment",
      direction: 1,
      action: { type: "tick" },
    });
    expect(resolveKey({ key: "ArrowDown" }, DEFAULT_PRICE_KEYMAP)).toMatchObject({
      direction: -1,
    });
  });

  it("maps Shift+arrow to ten ticks and Ctrl+arrow to a primary digit", () => {
    expect(resolveKey({ key: "ArrowUp", shiftKey: true }, DEFAULT_PRICE_KEYMAP)).toMatchObject({
      action: { type: "tick", ticks: 10 },
    });
    expect(resolveKey({ key: "ArrowUp", ctrlKey: true }, DEFAULT_PRICE_KEYMAP)).toMatchObject({
      action: { type: "primary" },
    });
  });

  it("maps Left/Right to nav and Enter/Escape to commit/revert", () => {
    expect(resolveKey({ key: "ArrowLeft" }, DEFAULT_PRICE_KEYMAP)).toMatchObject({
      kind: "nav",
      direction: -1,
    });
    expect(resolveKey({ key: "Enter" }, DEFAULT_PRICE_KEYMAP)).toEqual({ kind: "commit" });
    expect(resolveKey({ key: "Escape" }, DEFAULT_PRICE_KEYMAP)).toEqual({ kind: "revert" });
  });

  it("returns undefined for unmapped keys", () => {
    expect(resolveKey({ key: "x" }, DEFAULT_PRICE_KEYMAP)).toBeUndefined();
  });

  it("supports selective override via merge", () => {
    const custom = {
      ...DEFAULT_PRICE_KEYMAP,
      ArrowUp: {
        kind: "increment" as const,
        direction: 1 as const,
        action: { type: "primary" as const },
      },
    };
    expect(resolveKey({ key: "ArrowUp" }, custom)).toMatchObject({ action: { type: "primary" } });
  });
});
