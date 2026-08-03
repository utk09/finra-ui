import { describe, expect, it } from "vitest";

import { charCountStatus } from "./charCount";

describe("charCountStatus", () => {
  it("has no status without a limit", () => {
    expect(charCountStatus(0)).toBeUndefined();
    expect(charCountStatus(9999)).toBeUndefined();
  });

  it("ignores a threshold when there is no limit to be near", () => {
    expect(charCountStatus(50, undefined, 10)).toBeUndefined();
  });

  it("has no status while comfortably inside the limit", () => {
    expect(charCountStatus(5, 100)).toBeUndefined();
    expect(charCountStatus(5, 100, 90)).toBeUndefined();
  });

  it("warns from the threshold onwards", () => {
    expect(charCountStatus(39, 50, 40)).toBeUndefined();
    expect(charCountStatus(40, 50, 40)).toBe("warning");
    expect(charCountStatus(49, 50, 40)).toBe("warning");
  });

  it("errors at and beyond the limit", () => {
    expect(charCountStatus(50, 50)).toBe("error");
    expect(charCountStatus(51, 50)).toBe("error");
  });

  it("lets the limit outrank the threshold", () => {
    expect(charCountStatus(50, 50, 40)).toBe("error");
  });

  it("treats the threshold as a character count, not a fraction of the limit", () => {
    // 0.9 is a fraction-shaped value. One character clears it, which is the
    // visible consequence of reading the threshold as a proportion.
    expect(charCountStatus(1, 200, 0.9)).toBe("warning");
    // The count that actually means "90% of 200" is 180.
    expect(charCountStatus(179, 200, 180)).toBeUndefined();
    expect(charCountStatus(180, 200, 180)).toBe("warning");
  });

  it("warns immediately when the threshold is at or below zero", () => {
    expect(charCountStatus(0, 10, 0)).toBe("warning");
  });
});
