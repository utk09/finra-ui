import { describe, expect, it } from "vitest";

import {
  type DateFormat,
  formatDate,
  getFormatPlaceholder,
  getFormatSegmentLengths,
  getFormatSeparator,
  parseDate,
  validateDate,
} from "./dateFormat";

describe("getFormatSeparator", () => {
  it("returns / for slash formats", () => {
    expect(getFormatSeparator("MM/DD/YYYY")).toBe("/");
    expect(getFormatSeparator("DD/MM/YYYY")).toBe("/");
    expect(getFormatSeparator("YYYY/MM/DD")).toBe("/");
  });

  it("returns - for dash formats", () => {
    expect(getFormatSeparator("YYYY-MM-DD")).toBe("-");
    expect(getFormatSeparator("DD-MM-YYYY")).toBe("-");
    expect(getFormatSeparator("MM-DD-YYYY")).toBe("-");
  });
});

describe("getFormatPlaceholder", () => {
  it("returns the format string itself", () => {
    expect(getFormatPlaceholder("YYYY-MM-DD")).toBe("YYYY-MM-DD");
    expect(getFormatPlaceholder("MM/DD/YYYY")).toBe("MM/DD/YYYY");
  });
});

describe("getFormatSegmentLengths", () => {
  it("returns correct lengths for YYYY-MM-DD", () => {
    expect(getFormatSegmentLengths("YYYY-MM-DD")).toEqual([4, 2, 2]);
  });

  it("returns correct lengths for MM/DD/YYYY", () => {
    expect(getFormatSegmentLengths("MM/DD/YYYY")).toEqual([2, 2, 4]);
  });
});

describe("formatDate", () => {
  const date = new Date(2026, 2, 11); // March 11, 2026

  it("formats YYYY-MM-DD", () => {
    expect(formatDate(date, "YYYY-MM-DD")).toBe("2026-03-11");
  });

  it("formats MM/DD/YYYY", () => {
    expect(formatDate(date, "MM/DD/YYYY")).toBe("03/11/2026");
  });

  it("formats DD/MM/YYYY", () => {
    expect(formatDate(date, "DD/MM/YYYY")).toBe("11/03/2026");
  });

  it("formats DD-MM-YYYY", () => {
    expect(formatDate(date, "DD-MM-YYYY")).toBe("11-03-2026");
  });

  it("formats MM-DD-YYYY", () => {
    expect(formatDate(date, "MM-DD-YYYY")).toBe("03-11-2026");
  });

  it("formats YYYY/MM/DD", () => {
    expect(formatDate(date, "YYYY/MM/DD")).toBe("2026/03/11");
  });

  it("pads single-digit months and days", () => {
    const d = new Date(2026, 0, 5); // Jan 5
    expect(formatDate(d, "YYYY-MM-DD")).toBe("2026-01-05");
  });
});

describe("parseDate", () => {
  it("parses YYYY-MM-DD", () => {
    const result = parseDate("2026-03-11", "YYYY-MM-DD");
    expect(result.valid).toBe(true);
    expect(result.date?.getFullYear()).toBe(2026);
    expect(result.date?.getMonth()).toBe(2);
    expect(result.date?.getDate()).toBe(11);
  });

  it("parses MM/DD/YYYY", () => {
    const result = parseDate("03/11/2026", "MM/DD/YYYY");
    expect(result.valid).toBe(true);
    expect(result.date?.getFullYear()).toBe(2026);
    expect(result.date?.getMonth()).toBe(2);
    expect(result.date?.getDate()).toBe(11);
  });

  it("parses DD/MM/YYYY", () => {
    const result = parseDate("11/03/2026", "DD/MM/YYYY");
    expect(result.valid).toBe(true);
    expect(result.date?.getMonth()).toBe(2);
    expect(result.date?.getDate()).toBe(11);
  });

  it("roundtrips for all formats", () => {
    const date = new Date(2026, 2, 11);
    const formats: DateFormat[] = [
      "YYYY-MM-DD",
      "MM/DD/YYYY",
      "DD/MM/YYYY",
      "DD-MM-YYYY",
      "MM-DD-YYYY",
      "YYYY/MM/DD",
    ];

    for (const format of formats) {
      const str = formatDate(date, format);
      const result = parseDate(str, format);
      expect(result.valid).toBe(true);
      expect(result.date?.getFullYear()).toBe(2026);
      expect(result.date?.getMonth()).toBe(2);
      expect(result.date?.getDate()).toBe(11);
    }
  });

  it("rejects wrong number of segments", () => {
    const result = parseDate("2026-03", "YYYY-MM-DD");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("invalid-format");
  });

  it("rejects non-numeric input", () => {
    const result = parseDate("abcd-ef-gh", "YYYY-MM-DD");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("invalid-format");
  });

  it("rejects wrong segment length", () => {
    const result = parseDate("26-03-11", "YYYY-MM-DD");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("invalid-format");
  });

  it("rejects invalid month", () => {
    const result = parseDate("2026-13-01", "YYYY-MM-DD");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("invalid-date");
  });

  it("rejects invalid day", () => {
    const result = parseDate("2026-02-30", "YYYY-MM-DD");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("invalid-date");
  });

  it("rejects Feb 29 on non-leap year", () => {
    const result = parseDate("2025-02-29", "YYYY-MM-DD");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("invalid-date");
  });

  it("accepts Feb 29 on leap year", () => {
    const result = parseDate("2024-02-29", "YYYY-MM-DD");
    expect(result.valid).toBe(true);
    expect(result.date?.getDate()).toBe(29);
  });

  it("rejects day 0", () => {
    const result = parseDate("2026-03-00", "YYYY-MM-DD");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("invalid-date");
  });

  it("rejects month 0", () => {
    const result = parseDate("2026-00-15", "YYYY-MM-DD");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("invalid-date");
  });

  it("rejects wrong separator", () => {
    const result = parseDate("2026/03/11", "YYYY-MM-DD");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("invalid-format");
  });
});

describe("validateDate", () => {
  const date = new Date(2026, 2, 11); // March 11, 2026

  it("returns valid when no constraints", () => {
    const result = validateDate(date, {});
    expect(result.valid).toBe(true);
    expect(result.date).toBe(date);
  });

  it("rejects date before min", () => {
    const result = validateDate(date, { min: new Date(2026, 5, 1) });
    expect(result.valid).toBe(false);
    expect(result.error).toBe("out-of-range");
  });

  it("accepts date equal to min", () => {
    const result = validateDate(date, { min: new Date(2026, 2, 11) });
    expect(result.valid).toBe(true);
  });

  it("rejects date after max", () => {
    const result = validateDate(date, { max: new Date(2026, 0, 1) });
    expect(result.valid).toBe(false);
    expect(result.error).toBe("out-of-range");
  });

  it("accepts date equal to max", () => {
    const result = validateDate(date, { max: new Date(2026, 2, 11) });
    expect(result.valid).toBe(true);
  });

  it("rejects disabled date from array", () => {
    const result = validateDate(date, {
      disabledDates: [new Date(2026, 2, 11), new Date(2026, 2, 12)],
    });
    expect(result.valid).toBe(false);
    expect(result.error).toBe("disabled-date");
  });

  it("accepts non-disabled date from array", () => {
    const result = validateDate(date, {
      disabledDates: [new Date(2026, 2, 12)],
    });
    expect(result.valid).toBe(true);
  });

  it("rejects disabled date from function", () => {
    const isWeekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6;
    // March 14, 2026 is a Saturday
    const saturday = new Date(2026, 2, 14);
    const result = validateDate(saturday, { disabledDates: isWeekend });
    expect(result.valid).toBe(false);
    expect(result.error).toBe("disabled-date");
  });

  it("accepts non-disabled date from function", () => {
    const isWeekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6;
    // March 11, 2026 is a Wednesday
    const result = validateDate(date, { disabledDates: isWeekend });
    expect(result.valid).toBe(true);
  });

  it("checks min and max together", () => {
    const result = validateDate(date, {
      min: new Date(2026, 2, 1),
      max: new Date(2026, 2, 31),
    });
    expect(result.valid).toBe(true);
  });
});
