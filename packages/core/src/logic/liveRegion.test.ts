import { describe, expect, it } from "vitest";

import type { Sentiment } from "../types/variants";
import { isAssertiveSentiment, liveRegionAttributes } from "./liveRegion";

const ALL_SENTIMENTS: Sentiment[] = ["danger", "success", "warning", "info"];

describe("isAssertiveSentiment", () => {
  it.each([
    ["danger", true],
    ["warning", true],
    ["success", false],
    ["info", false],
  ] as const)("treats %s as assertive: %s", (sentiment, expected) => {
    expect(isAssertiveSentiment(sentiment)).toBe(expected);
  });

  it("treats an absent sentiment as not urgent", () => {
    expect(isAssertiveSentiment(undefined)).toBe(false);
  });

  it("covers every member of the Sentiment union", () => {
    // Guards the mapping against a sentiment being added without a decision
    // being made about how loudly it announces.
    expect(ALL_SENTIMENTS.map(isAssertiveSentiment)).toEqual([true, false, true, false]);
  });
});

describe("liveRegionAttributes", () => {
  it.each(["danger", "warning"] as const)("makes %s an assertive alert", (sentiment) => {
    expect(liveRegionAttributes(sentiment)).toEqual({ role: "alert", "aria-live": "assertive" });
  });

  it.each(["success", "info"] as const)("makes %s a polite status", (sentiment) => {
    expect(liveRegionAttributes(sentiment)).toEqual({ role: "status", "aria-live": "polite" });
  });

  it("pairs role with a matching politeness for every sentiment", () => {
    // The two attributes contradict each other if they ever drift apart, and a
    // contradiction is resolved differently by different screen readers.
    for (const sentiment of [...ALL_SENTIMENTS, undefined]) {
      const { role, "aria-live": live } = liveRegionAttributes(sentiment);
      expect(live).toBe(role === "alert" ? "assertive" : "polite");
    }
  });
});
