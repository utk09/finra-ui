import { describe, expect, it } from "vitest";

import { parseDateTenor } from "./dateTenorParse";

// Fixed reference so every resolution is deterministic: Thu 15 Jan 2026.
const REF = new Date(2026, 0, 15);

/** Local Y-M-D of a resolved date, for terse assertions. */
function ymd(date: Date | null): string | null {
  if (!date) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

describe("parseDateTenor", () => {
  describe("empty / unrecognized", () => {
    it("flags empty input", () => {
      expect(parseDateTenor("")).toMatchObject({ valid: false, error: "empty" });
      expect(parseDateTenor("   ")).toMatchObject({ valid: false, error: "empty" });
    });

    it("flags gibberish", () => {
      expect(parseDateTenor("hello", { referenceDate: REF })).toMatchObject({
        valid: false,
        error: "unrecognized",
      });
      // Looks tenor-ish but has no unit / zero value (single and compound).
      expect(parseDateTenor("15", { referenceDate: REF })).toMatchObject({ error: "unrecognized" });
      expect(parseDateTenor("0M", { referenceDate: REF })).toMatchObject({ error: "unrecognized" });
      expect(parseDateTenor("0M0M", { referenceDate: REF })).toMatchObject({
        error: "unrecognized",
      });
    });
  });

  describe("keywords", () => {
    it("resolves Today from the reference date", () => {
      const r = parseDateTenor("Today", { referenceDate: REF });
      expect(r).toMatchObject({ valid: true, mode: "keyword", tenor: null, display: "Today" });
      expect(ymd(r.date)).toBe("2026-01-15");
    });

    it("resolves Tomorrow as reference + 1 day", () => {
      const r = parseDateTenor("tomorrow", { referenceDate: REF });
      expect(r).toMatchObject({ valid: true, mode: "keyword", display: "Tomorrow" });
      expect(ymd(r.date)).toBe("2026-01-16");
    });
  });

  describe("plain tenors", () => {
    it("resolves single-unit tenors from the reference date", () => {
      expect(ymd(parseDateTenor("3M", { referenceDate: REF }).date)).toBe("2026-04-15");
      expect(ymd(parseDateTenor("2Y", { referenceDate: REF }).date)).toBe("2028-01-15");
      expect(ymd(parseDateTenor("1W", { referenceDate: REF }).date)).toBe("2026-01-22");
    });

    it("is case-insensitive and reports mode + canonical tenor", () => {
      expect(parseDateTenor("3m", { referenceDate: REF })).toMatchObject({
        valid: true,
        mode: "tenor",
        tenor: "3M",
        display: "3M",
      });
    });

    it("resolves special tenors (ON/TN/SN/SW)", () => {
      expect(ymd(parseDateTenor("ON", { referenceDate: REF }).date)).toBe("2026-01-16");
      expect(ymd(parseDateTenor("TN", { referenceDate: REF }).date)).toBe("2026-01-17");
      expect(ymd(parseDateTenor("SN", { referenceDate: REF }).date)).toBe("2026-01-17");
      expect(ymd(parseDateTenor("SW", { referenceDate: REF }).date)).toBe("2026-01-22");
    });

    it("parses verbose units (3 months)", () => {
      const r = parseDateTenor("3 months", { referenceDate: REF });
      expect(r).toMatchObject({ valid: true, mode: "tenor", tenor: "3M" });
      expect(ymd(r.date)).toBe("2026-04-15");
    });

    it("parses compound tenors (1Y6M == 18M)", () => {
      const compound = parseDateTenor("1Y6M", { referenceDate: REF });
      expect(compound).toMatchObject({ valid: true, tenor: "1Y6M" });
      expect(ymd(compound.date)).toBe("2027-07-15");
      // 18M lands on the same date.
      expect(ymd(parseDateTenor("18M", { referenceDate: REF }).date)).toBe("2027-07-15");
    });
  });

  describe("spot-relative", () => {
    it("resolves bare Spot to the spot date", () => {
      const r = parseDateTenor("Spot", { referenceDate: REF });
      expect(r).toMatchObject({ valid: true, mode: "spot-relative", display: "Spot" });
      expect(ymd(r.date)).toBe("2026-01-15"); // spot defaults to reference
    });

    it("resolves Spot + tenor from the spot date", () => {
      const r = parseDateTenor("Spot + 3M", { referenceDate: REF });
      expect(r).toMatchObject({
        valid: true,
        mode: "spot-relative",
        tenor: "3M",
        display: "Spot + 3M",
      });
      expect(ymd(r.date)).toBe("2026-04-15");
    });

    it("uses an explicit spotDate when provided", () => {
      const r = parseDateTenor("spot+3m", { referenceDate: REF, spotDate: new Date(2026, 0, 19) });
      expect(ymd(r.date)).toBe("2026-04-19");
    });

    it("resolves Spot - tenor backwards", () => {
      const r = parseDateTenor("Spot - 1W", { referenceDate: REF });
      expect(r).toMatchObject({ mode: "spot-relative", display: "Spot - 1W" });
      expect(ymd(r.date)).toBe("2026-01-08");
    });

    it("flags a spot expression with an invalid tenor", () => {
      expect(parseDateTenor("Spot + 0M", { referenceDate: REF })).toMatchObject({
        valid: false,
        error: "invalid-tenor",
      });
    });
  });

  describe("calendar dates", () => {
    it("parses ISO dates", () => {
      const r = parseDateTenor("2028-04-15", { referenceDate: REF });
      expect(r).toMatchObject({ valid: true, mode: "date", tenor: null, display: "2028-04-15" });
      expect(ymd(r.date)).toBe("2028-04-15");
    });

    it("parses DD/MM/YYYY by default", () => {
      const r = parseDateTenor("15/04/2028", { referenceDate: REF });
      expect(r).toMatchObject({ valid: true, mode: "date" });
      expect(ymd(r.date)).toBe("2028-04-15");
    });

    it("honours a custom dateFormats list", () => {
      const r = parseDateTenor("04/15/2028", {
        referenceDate: REF,
        dateFormats: ["MM/DD/YYYY"],
      });
      expect(r).toMatchObject({ valid: true, mode: "date" });
      expect(ymd(r.date)).toBe("2028-04-15");
    });

    it("parses month-name dates in either order (incl. full names / comma)", () => {
      for (const input of ["15 Jan 2027", "Jan 15 2027", "15 January 2027", "Jan 15, 2027"]) {
        const r = parseDateTenor(input, { referenceDate: REF });
        expect(r).toMatchObject({ valid: true, mode: "date" });
        expect(ymd(r.date)).toBe("2027-01-15");
      }
    });

    it("echoes a canonical month-name display", () => {
      expect(parseDateTenor("Jan 15 2027", { referenceDate: REF }).display).toBe("15 Jan 2027");
    });

    it("rejects a bad month name or an impossible date", () => {
      expect(parseDateTenor("15 Foo 2027", { referenceDate: REF })).toMatchObject({
        error: "unrecognized",
      });
      expect(parseDateTenor("31 Feb 2027", { referenceDate: REF })).toMatchObject({
        error: "unrecognized",
      });
    });
  });
});
