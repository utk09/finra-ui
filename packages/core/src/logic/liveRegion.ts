import type { Sentiment } from "../types/variants";

/**
 * The `role` and `aria-live` pair a status surface announces through.
 *
 * @remarks
 * Both are set together. `role="alert"` carries an implicit assertive
 * politeness, but stating it keeps the two from drifting apart when a caller
 * spreads one of them over the other.
 */
export interface LiveRegionAttributes {
  role: "alert" | "status";
  "aria-live": "assertive" | "polite";
}

/**
 * Whether a sentiment interrupts whatever a screen reader is currently saying.
 *
 * @remarks
 * Danger and warning interrupt, because acting on stale information is the harm
 * they exist to prevent. Success and info wait their turn. An absent sentiment
 * is not urgent, so it groups with the polite ones.
 */
export function isAssertiveSentiment(sentiment: Sentiment | undefined): boolean {
  return sentiment === "danger" || sentiment === "warning";
}

/**
 * Live-region attributes for a sentiment-bearing status surface.
 *
 * @remarks
 * Whether a surface announces at all is the caller's decision: a transient
 * surface always announces, and one that is part of the page announces only
 * when it carries a sentiment.
 *
 * @see {@link isAssertiveSentiment}
 */
export function liveRegionAttributes(sentiment: Sentiment | undefined): LiveRegionAttributes {
  return isAssertiveSentiment(sentiment)
    ? { role: "alert", "aria-live": "assertive" }
    : { role: "status", "aria-live": "polite" };
}
