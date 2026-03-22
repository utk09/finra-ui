import { describe, expect, it } from "vitest";

import { cx } from "./cx";

describe("cx", () => {
  it("joins multiple class names", () => {
    expect(cx("a", "b", "c")).toBe("a b c");
  });

  it("filters out false values", () => {
    expect(cx("a", false, "b")).toBe("a b");
  });

  it("filters out undefined values", () => {
    expect(cx("a", undefined, "b")).toBe("a b");
  });

  it("filters out null values", () => {
    expect(cx("a", null, "b")).toBe("a b");
  });

  it("returns undefined when all values are falsy", () => {
    expect(cx(false, undefined, null)).toBeUndefined();
  });

  it("returns undefined when called with no arguments", () => {
    expect(cx()).toBeUndefined();
  });

  it("returns a single class name unchanged", () => {
    expect(cx("only")).toBe("only");
  });

  it("handles mixed truthy and falsy values", () => {
    expect(cx(false, "a", null, undefined, "b", false)).toBe("a b");
  });
});
