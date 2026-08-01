import { describe, expect, it } from "vitest";

import { autoInsertSeparators, getMaxLength } from "./dateInput";

// The two layouts the date components actually use: YYYY-MM-DD and DD/MM/YYYY.
const ISO = [4, 2, 2] as const;
const DMY = [2, 2, 4] as const;

describe("autoInsertSeparators", () => {
  it("inserts a separator as each segment fills", () => {
    // Typing forward, one digit at a time. The separator has to appear *with*
    // the first digit of the next segment, never before it - a trailing "2026-"
    // would leave the caret past a separator the user has not earned yet.
    expect(autoInsertSeparators("2", ISO, "-")).toBe("2");
    expect(autoInsertSeparators("2026", ISO, "-")).toBe("2026");
    expect(autoInsertSeparators("20260", ISO, "-")).toBe("2026-0");
    expect(autoInsertSeparators("202604", ISO, "-")).toBe("2026-04");
    expect(autoInsertSeparators("2026041", ISO, "-")).toBe("2026-04-1");
    expect(autoInsertSeparators("20260415", ISO, "-")).toBe("2026-04-15");
  });

  it("re-derives separators from digits alone, whatever the user typed", () => {
    // This is what makes the mask idempotent: the already-formatted string and
    // the raw digits both normalise to the same result, so re-running it on its
    // own output cannot corrupt the value.
    expect(autoInsertSeparators("2026-04-15", ISO, "-")).toBe("2026-04-15");
    expect(autoInsertSeparators("2026/04/15", ISO, "-")).toBe("2026-04-15");
    expect(autoInsertSeparators("2026 04 15", ISO, "-")).toBe("2026-04-15");
  });

  it("honours the separator it is given", () => {
    expect(autoInsertSeparators("15042026", DMY, "/")).toBe("15/04/2026");
  });

  it("follows the segment order it is given, not a fixed one", () => {
    // The same eight digits mean different dates under different layouts - the
    // helper must not assume ISO.
    expect(autoInsertSeparators("15042026", DMY, "-")).toBe("15-04-2026");
    expect(autoInsertSeparators("15042026", ISO, "-")).toBe("1504-20-26");
  });

  it("returns empty for input with no digits", () => {
    expect(autoInsertSeparators("", ISO, "-")).toBe("");
    expect(autoInsertSeparators("abc", ISO, "-")).toBe("");
    expect(autoInsertSeparators("--", ISO, "-")).toBe("");
  });

  it("stops at the last segment and drops the overflow", () => {
    // A paste longer than the format cannot be allowed to grow the string past
    // maxLength, or the field would accept a value it can never parse.
    expect(autoInsertSeparators("2026041599", ISO, "-")).toBe("2026-04-15");
  });

  it("supports a multi-character separator", () => {
    expect(autoInsertSeparators("20260415", ISO, " - ")).toBe("2026 - 04 - 15");
  });

  it("emits a single segment with no separator when the format has one", () => {
    expect(autoInsertSeparators("20260415", [8], "-")).toBe("20260415");
  });
});

describe("getMaxLength", () => {
  it("counts digits plus separators", () => {
    expect(getMaxLength(ISO, "-")).toBe(10); // 8 digits + 2 separators
    expect(getMaxLength(DMY, "/")).toBe(10);
  });

  it("scales with a multi-character separator", () => {
    // Guards the `maxlength` attribute against a separator wider than one char,
    // which would otherwise truncate the last segment as the user typed it.
    expect(getMaxLength(ISO, " - ")).toBe(14); // 8 digits + 2 × 3
  });

  it("adds nothing for a single segment", () => {
    expect(getMaxLength([8], "-")).toBe(8);
  });

  it("agrees with the longest string autoInsertSeparators can produce", () => {
    // The two are used together - `maxlength` on the input, the mask on change -
    // so a disagreement would either clip a valid date or let one through.
    for (const [segments, sep] of [
      [ISO, "-"],
      [DMY, "/"],
      [ISO, " - "],
      [[8], "-"],
    ] as const) {
      const full = autoInsertSeparators("9".repeat(20), segments, sep);
      expect(full).toHaveLength(getMaxLength(segments, sep));
    }
  });
});
