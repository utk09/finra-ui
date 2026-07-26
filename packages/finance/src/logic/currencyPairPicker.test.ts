import { describe, expect, it } from "vitest";

import { currencyDisplayName } from "../utils/currencyPair";
import {
  buildPairSections,
  type CurrencyPairLike,
  flattenPairSections,
  isPairSelectable,
  matchPairTier,
  movePairHighlight,
  normalizePairQuery,
  type PairPickerKeyContext,
  rankPairs,
  resolvePairPickerKey,
} from "./currencyPairPicker";

function pair(
  base: string,
  quote: string,
  extra: Partial<CurrencyPairLike> = {},
): CurrencyPairLike {
  return { id: `${base}${quote}`, baseCurrency: base, quoteCurrency: quote, ...extra };
}

const GBPUSD = pair("GBP", "USD");
const USDJPY = pair("USD", "JPY");
const AUDUSD = pair("AUD", "USD");
const EURGBP = pair("EUR", "GBP");
const USDKRW = pair("USD", "KRW", { settlementStyle: "non-deliverable", aliases: ["KRW NDF"] });
const XAUUSD = pair("XAU", "USD", { assetClass: "metal", tags: ["Metal"] });
const RUBUSD = pair("RUB", "USD", { tradable: false, restrictionReason: "Sanctioned" });

const ALL = [GBPUSD, USDJPY, AUDUSD, EURGBP, USDKRW, XAUUSD];

const ids = (ranked: { pair: CurrencyPairLike }[]): string[] => ranked.map((r) => r.pair.id);

describe("normalizePairQuery", () => {
  it("strips punctuation and upper-cases", () => {
    expect(normalizePairQuery("gbp/usd")).toBe("GBPUSD");
    expect(normalizePairQuery(" gbp usd ")).toBe("GBPUSD");
    expect(normalizePairQuery("g-b_p")).toBe("GBP");
  });
});

describe("matchPairTier — the fixed tier order", () => {
  it("exact canonical beats everything", () => {
    expect(matchPairTier(GBPUSD, "GBPUSD")).toBe("exact-canonical");
  });

  it("punctuated input is exact-normalized, one tier below verbatim", () => {
    expect(matchPairTier(GBPUSD, "GBP/USD")).toBe("exact-normalized");
    expect(matchPairTier(GBPUSD, "gbp usd")).toBe("exact-normalized");
  });

  it("aliases match at their own tier", () => {
    expect(matchPairTier(USDKRW, "KRW NDF")).toBe("exact-alias");
  });

  it("a single code prefixes its own pairs", () => {
    expect(matchPairTier(GBPUSD, "GBP")).toBe("prefix");
    expect(matchPairTier(USDJPY, "USD")).toBe("prefix");
  });

  it("a code in the quote leg only contains, ranking below prefix", () => {
    expect(matchPairTier(EURGBP, "GBP")).toBe("prefix"); // quote leg prefix
    expect(matchPairTier(AUDUSD, "UD")).toBe("contains"); // mid-symbol
  });

  it("falls through to metadata for tags, asset class and settlement style", () => {
    expect(matchPairTier(XAUUSD, "metal")).toBe("metadata");
    expect(matchPairTier(USDKRW, "non-deliverable")).toBe("metadata");
  });

  it("matches injected currency names", () => {
    const nameOf = (code: string) => currencyDisplayName(code, "en-US");
    expect(matchPairTier(GBPUSD, "British Pound", nameOf)).toBe("metadata");
    // ...and does not without the injection, keeping the module dependency-free.
    expect(matchPairTier(GBPUSD, "British Pound")).toBeNull();
  });

  it("returns null for no match and for an empty query", () => {
    expect(matchPairTier(GBPUSD, "ZZZ")).toBeNull();
    expect(matchPairTier(GBPUSD, "   ")).toBeNull();
    expect(matchPairTier(GBPUSD, "///")).toBeNull();
  });
});

describe("rankPairs", () => {
  // One pair per tier for the query "USD", so tier ordering is actually observable.
  const aliasHit = pair("EUR", "CHF", { aliases: ["USD"] }); // exact-alias
  const prefixHit = USDJPY; // base leg starts with USD
  const containsHit = pair("AAA", "BUSDC"); // "USD" sits mid-symbol
  const metadataHit = pair("EUR", "JPY", { tags: ["USD-linked"] });

  it("orders strictly by tier, best first", () => {
    const ranked = rankPairs("USD", [metadataHit, containsHit, prefixHit, aliasHit]);
    expect(ranked.map((r) => r.tier)).toEqual(["exact-alias", "prefix", "contains", "metadata"]);
  });

  it("distinguishes verbatim canonical input from punctuated input", () => {
    expect(rankPairs("GBPUSD", [GBPUSD])[0].tier).toBe("exact-canonical");
    expect(rankPairs("GBP/USD", [GBPUSD])[0].tier).toBe("exact-normalized");
  });

  it("favourites break ties inside a tier but never cross tiers", () => {
    // prefixHit is favourited; aliasHit still outranks it because its tier is better.
    const ranked = rankPairs("USD", [prefixHit, aliasHit], { favourites: [prefixHit.id] });
    expect(ids(ranked)).toEqual([aliasHit.id, prefixHit.id]);
  });

  it("favourites do reorder within one tier", () => {
    const ranked = rankPairs("USD", [GBPUSD, AUDUSD], { favourites: ["AUDUSD"] });
    expect(ids(ranked)).toEqual(["AUDUSD", "GBPUSD"]);
  });

  it("recents break ties after favourites", () => {
    const ranked = rankPairs("USD", [GBPUSD, AUDUSD], { recents: ["AUDUSD"] });
    expect(ids(ranked)).toEqual(["AUDUSD", "GBPUSD"]);
  });

  it("is deterministic: equal inputs give equal output", () => {
    const once = ids(rankPairs("USD", ALL, { favourites: ["AUDUSD"], recents: ["EURGBP"] }));
    const twice = ids(rankPairs("USD", ALL, { favourites: ["AUDUSD"], recents: ["EURGBP"] }));
    expect(once).toEqual(twice);
  });

  it("falls back to the caller's order as the final tiebreak", () => {
    const forward = ids(rankPairs("", [GBPUSD, USDJPY]));
    const reversed = ids(rankPairs("", [USDJPY, GBPUSD]));
    expect(forward).toEqual(["GBPUSD", "USDJPY"]);
    expect(reversed).toEqual(["USDJPY", "GBPUSD"]);
  });

  it("an empty query returns everything with a null tier", () => {
    const ranked = rankPairs("  ", ALL);
    expect(ranked).toHaveLength(ALL.length);
    expect(ranked.every((r) => r.tier === null)).toBe(true);
  });

  it("drops non-matching pairs", () => {
    expect(rankPairs("ZZZZ", ALL)).toEqual([]);
  });

  it("never mutates the input array or its pairs", () => {
    const input = [...ALL];
    const snapshot = JSON.stringify(input);
    rankPairs("USD", input, { favourites: ["AUDUSD"] });
    expect(input).toEqual(ALL);
    expect(JSON.stringify(input)).toBe(snapshot);
  });
});

describe("buildPairSections", () => {
  const ranked = rankPairs("", ALL);

  it("pins favourites, then recents, then the rest", () => {
    const sections = buildPairSections({
      ranked,
      favourites: ["EURGBP"],
      recents: ["USDJPY"],
    });
    expect(sections.map((s) => s.id)).toEqual(["favourites", "recents", "results"]);
    expect(sections[0].pairs.map((p) => p.id)).toEqual(["EURGBP"]);
    expect(sections[1].pairs.map((p) => p.id)).toEqual(["USDJPY"]);
  });

  it("places each pair in exactly one section", () => {
    const sections = buildPairSections({
      ranked,
      favourites: ["EURGBP"],
      recents: ["EURGBP", "USDJPY"],
    });
    const flat = flattenPairSections(sections).map((p) => p.id);
    expect(new Set(flat).size).toBe(flat.length);
    // Favourite wins over recent for the same pair.
    expect(sections[0].pairs.map((p) => p.id)).toEqual(["EURGBP"]);
    expect(sections[1].pairs.map((p) => p.id)).toEqual(["USDJPY"]);
  });

  it("orders recents by recency, not by match rank", () => {
    const sections = buildPairSections({ ranked, recents: ["XAUUSD", "GBPUSD"] });
    const recents = sections.find((s) => s.id === "recents");
    expect(recents?.pairs.map((p) => p.id)).toEqual(["XAUUSD", "GBPUSD"]);
  });

  it("caps recents and demotes the overflow into results rather than dropping it", () => {
    const sections = buildPairSections({
      ranked,
      recents: ["XAUUSD", "GBPUSD", "USDJPY"],
      maxRecents: 2,
    });
    const recents = sections.find((s) => s.id === "recents");
    expect(recents?.pairs.map((p) => p.id)).toEqual(["XAUUSD", "GBPUSD"]);
    expect(flattenPairSections(sections).map((p) => p.id)).toContain("USDJPY");
  });

  it("omits empty sections", () => {
    expect(buildPairSections({ ranked }).map((s) => s.id)).toEqual(["results"]);
  });

  it("honours showFavourites / showRecents", () => {
    const sections = buildPairSections({
      ranked,
      favourites: ["EURGBP"],
      recents: ["USDJPY"],
      showFavourites: false,
      showRecents: false,
    });
    expect(sections.map((s) => s.id)).toEqual(["results"]);
    expect(flattenPairSections(sections)).toHaveLength(ALL.length);
  });

  it("allows section labels to be overridden", () => {
    const sections = buildPairSections({
      ranked,
      favourites: ["EURGBP"],
      sectionLabels: { favourites: "Pinned" },
    });
    expect(sections[0].label).toBe("Pinned");
  });

  it("flat order mirrors render order exactly", () => {
    const sections = buildPairSections({ ranked, favourites: ["EURGBP"], recents: ["USDJPY"] });
    expect(flattenPairSections(sections).map((p) => p.id)).toEqual(
      sections.flatMap((s) => s.pairs.map((p) => p.id)),
    );
  });
});

describe("movePairHighlight", () => {
  const flat = [GBPUSD, RUBUSD, USDJPY]; // RUBUSD is untradable

  it("skips untradable rows", () => {
    expect(movePairHighlight(flat, 0, 1)).toBe(2);
    expect(movePairHighlight(flat, 2, -1)).toBe(0);
  });

  it("wraps at both ends", () => {
    expect(movePairHighlight(flat, 2, 1)).toBe(0);
    expect(movePairHighlight(flat, 0, -1)).toBe(2);
  });

  it("enters the list from -1", () => {
    expect(movePairHighlight(flat, -1, 1)).toBe(0);
    expect(movePairHighlight(flat, -1, -1)).toBe(2);
  });

  it("returns -1 for an empty list or when nothing is selectable", () => {
    expect(movePairHighlight([], 0, 1)).toBe(-1);
    expect(movePairHighlight([RUBUSD], -1, 1)).toBe(-1);
  });

  it("isPairSelectable only blocks on tradable === false", () => {
    expect(isPairSelectable(GBPUSD)).toBe(true);
    expect(isPairSelectable({ ...GBPUSD, tradable: true })).toBe(true);
    expect(isPairSelectable(RUBUSD)).toBe(false);
  });
});

describe("resolvePairPickerKey", () => {
  function ctx(overrides: Partial<PairPickerKeyContext> = {}): PairPickerKeyContext {
    return {
      isOpen: true,
      disabled: false,
      highlightedIndex: 0,
      count: 3,
      showFavourites: true,
      ...overrides,
    };
  }

  it("swallows every key when disabled", () => {
    for (const key of ["ArrowDown", "ArrowUp", "Enter", "Escape", "Home", "End", "Tab"]) {
      expect(resolvePairPickerKey(key, ctx({ disabled: true }))).toEqual({
        preventDefault: false,
        effects: [],
      });
    }
  });

  it("ignores unmapped keys", () => {
    expect(resolvePairPickerKey("q", ctx())).toEqual({ preventDefault: false, effects: [] });
  });

  it("ArrowDown while closed opens and steps in", () => {
    expect(resolvePairPickerKey("ArrowDown", ctx({ isOpen: false }))).toEqual({
      preventDefault: true,
      effects: [
        { kind: "setOpen", open: true },
        { kind: "moveHighlight", direction: 1 },
      ],
    });
  });

  it("Alt+ArrowDown opens without activating a row", () => {
    expect(resolvePairPickerKey("ArrowDown", ctx({ isOpen: false, altKey: true }))).toEqual({
      preventDefault: true,
      effects: [{ kind: "setOpen", open: true }],
    });
  });

  it("Alt+ArrowUp closes", () => {
    expect(resolvePairPickerKey("ArrowUp", ctx({ altKey: true }))).toEqual({
      preventDefault: true,
      effects: [{ kind: "setOpen", open: false }, { kind: "clearHighlight" }],
    });
  });

  it("Home/End jump to the edges, and are inert while closed", () => {
    expect(resolvePairPickerKey("Home", ctx()).effects).toEqual([
      { kind: "highlightEdge", edge: "first" },
    ]);
    expect(resolvePairPickerKey("End", ctx()).effects).toEqual([
      { kind: "highlightEdge", edge: "last" },
    ]);
    expect(resolvePairPickerKey("Home", ctx({ isOpen: false }))).toEqual({
      preventDefault: false,
      effects: [],
    });
  });

  it("Enter selects the highlighted row, or commits typed input", () => {
    expect(resolvePairPickerKey("Enter", ctx()).effects).toEqual([{ kind: "selectHighlighted" }]);
    expect(resolvePairPickerKey("Enter", ctx({ highlightedIndex: -1 })).effects).toEqual([
      { kind: "commitInput" },
    ]);
    expect(resolvePairPickerKey("Enter", ctx({ isOpen: false })).effects).toEqual([
      { kind: "commitInput" },
    ]);
  });

  it("Escape reverts and closes", () => {
    expect(resolvePairPickerKey("Escape", ctx()).effects).toEqual([
      { kind: "revertInput" },
      { kind: "setOpen", open: false },
      { kind: "clearHighlight" },
    ]);
    expect(resolvePairPickerKey("Escape", ctx({ isOpen: false })).effects).toEqual([]);
  });

  it("Tab closes but never preventDefaults, so focus can leave", () => {
    const result = resolvePairPickerKey("Tab", ctx());
    expect(result.preventDefault).toBe(false);
    expect(result.effects).toEqual([{ kind: "setOpen", open: false }, { kind: "clearHighlight" }]);
  });

  it("Ctrl+D toggles the highlighted row's favourite", () => {
    expect(resolvePairPickerKey("d", { ...ctx(), ctrlKey: true }).effects).toEqual([
      { kind: "toggleFavourite" },
    ]);
    // Case-insensitive, so Ctrl+Shift+D still reads as the chord.
    expect(resolvePairPickerKey("D", { ...ctx(), ctrlKey: true }).effects).toEqual([
      { kind: "toggleFavourite" },
    ]);
  });

  it("Ctrl+D is inert when closed, unhighlighted, or favourites are off", () => {
    expect(resolvePairPickerKey("d", { ...ctx({ isOpen: false }), ctrlKey: true }).effects).toEqual(
      [],
    );
    expect(
      resolvePairPickerKey("d", { ...ctx({ highlightedIndex: -1 }), ctrlKey: true }).effects,
    ).toEqual([]);
    expect(
      resolvePairPickerKey("d", { ...ctx({ showFavourites: false }), ctrlKey: true }).effects,
    ).toEqual([]);
  });

  it("a bare d types normally", () => {
    expect(resolvePairPickerKey("d", ctx())).toEqual({ preventDefault: false, effects: [] });
  });
});
