/**
 * Pure CurrencyPairPicker computation - ranking, sectioning, roving highlight
 * and keyboard resolution. Zero framework imports, zero DOM.
 * Used by React CurrencyPairPickerBase and a future Lit equivalent.
 */

/**
 * The subset of a currency pair this layer reads, mirroring the
 * `ComboBoxOptionLike` / `ComboBoxOption` split.
 *
 * Fields the component merely carries through to consumers - quoting
 * convention, fixing source, synthetic legs - are deliberately absent: this
 * layer never interprets them, so depending on their types would be noise.
 */
export interface CurrencyPairLike {
  /** Provider's stable key. */
  id: string;
  baseCurrency: string;
  quoteCurrency: string;
  displayName?: string;
  aliases?: readonly string[];
  tags?: readonly string[];
  assetClass?: string;
  settlementStyle?: string;
  /** `false` renders the row disabled. Absent means tradable. */
  tradable?: boolean;
  restrictionReason?: string;
}

//  Query normalisation

/**
 * Strip everything that is not a code character so a query matches regardless
 * of how the user punctuated it: `"gbp/usd"`, `"GBP USD"` and `"gbpusd"` all
 * normalise to `"GBPUSD"`.
 */
export function normalizePairQuery(query: string): string {
  return query.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** Canonical symbol for a pair, independent of any display separator. */
function symbolOf(pair: CurrencyPairLike): string {
  return `${pair.baseCurrency}${pair.quoteCurrency}`.toUpperCase();
}

//  Ranking

/**
 * Match strength, best first. The order is the AC's and is fixed: relevance is
 * decided by *how* the query matched, never by favourite/recent status.
 * Favourites and recents only break ties **within** a tier.
 */
export const PAIR_MATCH_TIERS = [
  "exact-canonical",
  "exact-normalized",
  "exact-alias",
  "prefix",
  "contains",
  "metadata",
] as const;

export type PairMatchTier = (typeof PAIR_MATCH_TIERS)[number];

const TIER_RANK: Record<PairMatchTier, number> = {
  "exact-canonical": 0,
  "exact-normalized": 1,
  "exact-alias": 2,
  prefix: 3,
  contains: 4,
  metadata: 5,
};

export interface RankedPair<T extends CurrencyPairLike = CurrencyPairLike> {
  pair: T;
  /** How it matched. `null` when the query was empty (everything matches). */
  tier: PairMatchTier | null;
}

export interface RankPairsContext {
  /** Favourited pair ids. Breaks ties within a tier; never promotes across tiers. */
  favourites?: readonly string[];
  /** Recently used pair ids, most recent first. Breaks ties after favourites. */
  recents?: readonly string[];
  /**
   * Currency-name lookup for the metadata tier, e.g. `currencyDisplayName`.
   * Injected rather than imported so this module stays dependency-free and the
   * naming is overridable.
   */
  nameOf?: (code: string) => string | null;
}

/** Which tier `pair` matches `query` at, or `null` for no match. */
export function matchPairTier(
  pair: CurrencyPairLike,
  query: string,
  nameOf?: (code: string) => string | null,
): PairMatchTier | null {
  const raw = query.trim().toUpperCase();
  if (!raw) return null;

  const needle = normalizePairQuery(query);
  if (!needle) return null;

  const symbol = symbolOf(pair);
  const id = pair.id.toUpperCase();

  // Tier 1: the query is already the canonical symbol/id, verbatim.
  if (raw === symbol || raw === id) return "exact-canonical";

  // Tier 2: it becomes the canonical symbol once punctuation is dropped.
  if (needle === symbol || needle === id) return "exact-normalized";

  // Tier 3: an alias matches outright.
  if (pair.aliases?.some((alias) => normalizePairQuery(alias) === needle)) {
    return "exact-alias";
  }

  // Tier 4: leading match on the symbol or either leg - "GBP" finds GBPUSD.
  if (
    symbol.startsWith(needle) ||
    pair.baseCurrency.toUpperCase().startsWith(needle) ||
    pair.quoteCurrency.toUpperCase().startsWith(needle)
  ) {
    return "prefix";
  }

  // Tier 5: anywhere in the symbol - "GBP" also finds EURGBP, but lower.
  if (symbol.includes(needle)) return "contains";

  // Tier 6: descriptive metadata. Uses the raw query so multi-word names
  // ("BRITISH POUND") still match; `needle` has had its spaces stripped.
  const haystacks: string[] = [];
  if (pair.displayName) haystacks.push(pair.displayName);
  if (pair.aliases) haystacks.push(...pair.aliases);
  if (pair.tags) haystacks.push(...pair.tags);
  if (pair.assetClass) haystacks.push(pair.assetClass);
  if (pair.settlementStyle) haystacks.push(pair.settlementStyle);
  if (nameOf) {
    const baseName = nameOf(pair.baseCurrency);
    const quoteName = nameOf(pair.quoteCurrency);
    if (baseName) haystacks.push(baseName);
    if (quoteName) haystacks.push(quoteName);
  }

  if (haystacks.some((text) => text.toUpperCase().includes(raw))) return "metadata";

  return null;
}

/**
 * Rank pairs against a query.
 *
 * Deterministic by construction: sorted by tier, then favourite, then recency,
 * then the caller's original order - so equal inputs always produce equal
 * output. Never mutates the input array or any pair.
 *
 * An empty query matches everything with `tier: null`, still ordered by
 * favourite → recent → original.
 */
export function rankPairs<T extends CurrencyPairLike>(
  query: string,
  pairs: readonly T[],
  context: RankPairsContext = {},
): RankedPair<T>[] {
  const { favourites, recents, nameOf } = context;

  const favouriteSet = new Set(favourites ?? []);
  const recentRank = new Map<string, number>();
  (recents ?? []).forEach((id, index) => {
    if (!recentRank.has(id)) recentRank.set(id, index);
  });

  const hasQuery = normalizePairQuery(query).length > 0;

  const scored: { entry: RankedPair<T>; order: number }[] = [];

  pairs.forEach((pair, order) => {
    if (!hasQuery) {
      scored.push({ entry: { pair, tier: null }, order });
      return;
    }
    const tier = matchPairTier(pair, query, nameOf);
    if (tier !== null) scored.push({ entry: { pair, tier }, order });
  });

  scored.sort((a, b) => {
    const tierDelta =
      (a.entry.tier === null ? 0 : TIER_RANK[a.entry.tier]) -
      (b.entry.tier === null ? 0 : TIER_RANK[b.entry.tier]);
    if (tierDelta !== 0) return tierDelta;

    const favDelta =
      Number(favouriteSet.has(b.entry.pair.id)) - Number(favouriteSet.has(a.entry.pair.id));
    if (favDelta !== 0) return favDelta;

    const aRecent = recentRank.get(a.entry.pair.id) ?? Number.POSITIVE_INFINITY;
    const bRecent = recentRank.get(b.entry.pair.id) ?? Number.POSITIVE_INFINITY;
    if (aRecent !== bRecent) return aRecent - bRecent;

    return a.order - b.order;
  });

  return scored.map((item) => item.entry);
}

//  Favourites / recents sections

export type PairSectionId = "favourites" | "recents" | "results";

export const DEFAULT_PAIR_SECTION_LABELS: Record<PairSectionId, string> = {
  favourites: "Favourites",
  recents: "Recent",
  results: "All pairs",
};

export interface PairSectionModel<T extends CurrencyPairLike = CurrencyPairLike> {
  id: PairSectionId;
  label: string;
  pairs: T[];
}

export interface BuildPairSectionsParams<T extends CurrencyPairLike> {
  /** Already-ranked pairs, in render order. */
  ranked: readonly RankedPair<T>[];
  favourites?: readonly string[];
  /** Recently used ids, most recent first. */
  recents?: readonly string[];
  /** Cap on the Recent section. */
  maxRecents?: number;
  showFavourites?: boolean;
  showRecents?: boolean;
  sectionLabels?: Partial<Record<PairSectionId, string>>;
}

/**
 * Split ranked pairs into pinned Favourites / Recent sections plus the rest.
 *
 * A pair appears in exactly **one** section (favourites win, then recents),
 * mirroring how TenorPicker lifts favourites out of their home group. Showing
 * the same pair twice would make the flat roving order ambiguous - and the flat
 * order must mirror render order exactly, or `aria-activedescendant` points at
 * the wrong row (the ComboBox lesson).
 *
 * Empty sections are dropped.
 */
export function buildPairSections<T extends CurrencyPairLike>(
  params: BuildPairSectionsParams<T>,
): PairSectionModel<T>[] {
  const {
    ranked,
    favourites,
    recents,
    maxRecents,
    showFavourites = true,
    showRecents = true,
    sectionLabels,
  } = params;

  const favouriteSet = new Set(showFavourites ? (favourites ?? []) : []);
  const recentOrder = new Map<string, number>();
  if (showRecents) {
    (recents ?? []).forEach((id, index) => {
      if (!recentOrder.has(id)) recentOrder.set(id, index);
    });
  }

  const favouritePairs: T[] = [];
  const recentPairs: T[] = [];
  const resultPairs: T[] = [];

  for (const { pair } of ranked) {
    if (favouriteSet.has(pair.id)) {
      favouritePairs.push(pair);
    } else if (recentOrder.has(pair.id)) {
      recentPairs.push(pair);
    } else {
      resultPairs.push(pair);
    }
  }

  // Recents are ordered by recency, not by match rank - that is the point of
  // the section. Favourites keep rank order, since their order is user-defined.
  recentPairs.sort(
    (a, b) =>
      (recentOrder.get(a.id) ?? Number.POSITIVE_INFINITY) -
      (recentOrder.get(b.id) ?? Number.POSITIVE_INFINITY),
  );

  const cappedRecents =
    typeof maxRecents === "number" ? recentPairs.slice(0, Math.max(0, maxRecents)) : recentPairs;

  // Anything trimmed by maxRecents falls back into results rather than vanishing.
  if (cappedRecents.length < recentPairs.length) {
    const kept = new Set(cappedRecents.map((pair) => pair.id));
    for (const pair of recentPairs) {
      if (!kept.has(pair.id)) resultPairs.push(pair);
    }
  }

  const labelFor = (id: PairSectionId): string =>
    sectionLabels?.[id] ?? DEFAULT_PAIR_SECTION_LABELS[id];

  const sections: PairSectionModel<T>[] = [];
  if (favouritePairs.length > 0) {
    sections.push({ id: "favourites", label: labelFor("favourites"), pairs: favouritePairs });
  }
  if (cappedRecents.length > 0) {
    sections.push({ id: "recents", label: labelFor("recents"), pairs: cappedRecents });
  }
  if (resultPairs.length > 0) {
    sections.push({ id: "results", label: labelFor("results"), pairs: resultPairs });
  }
  return sections;
}

/** Flatten sections into render order - the index space for the roving highlight. */
export function flattenPairSections<T extends CurrencyPairLike>(
  sections: readonly PairSectionModel<T>[],
): T[] {
  return sections.flatMap((section) => section.pairs);
}

/** Whether a pair may be selected. `tradable: false` is the only blocker. */
export function isPairSelectable(pair: CurrencyPairLike): boolean {
  return pair.tradable !== false;
}

/**
 * Move the roving highlight over the flat list, skipping untradable pairs and
 * wrapping at both ends. Returns -1 when nothing is selectable.
 */
export function movePairHighlight<T extends CurrencyPairLike>(
  flat: readonly T[],
  current: number,
  direction: 1 | -1,
): number {
  const count = flat.length;
  if (count === 0) return -1;

  // With nothing highlighted, entering backwards has to start *past* the end so
  // the first step lands on the last row - ArrowUp on a closed listbox opens at
  // the bottom. Stepping back from -1 would arrive at index 1 instead.
  const start = current >= 0 ? current : direction === 1 ? -1 : count;

  let next = start;
  for (let step = 0; step < count; step++) {
    next = (next + direction + count) % count;
    if (isPairSelectable(flat[next])) return next;
  }
  return current >= 0 && current < count && isPairSelectable(flat[current]) ? current : -1;
}

//  Keyboard - map as data, mirroring ComboBox/Calendar

export type PairPickerKeyEffect =
  | { kind: "setOpen"; open: boolean }
  /**
   * Step the highlight, skipping untradable rows and wrapping - the adapter
   * runs it through {@link movePairHighlight}. Distinct from an absolute index
   * so "move by one" can never be mistaken for "highlight row 1".
   */
  | { kind: "moveHighlight"; direction: 1 | -1 }
  /** Jump to the first/last selectable row (Home/End). */
  | { kind: "highlightEdge"; edge: "first" | "last" }
  /** Clear the highlight outright. */
  | { kind: "clearHighlight" }
  /** Commit the highlighted row. */
  | { kind: "selectHighlighted" }
  /** Commit whatever is typed (free-form parse). */
  | { kind: "commitInput" }
  /** Toggle favourite on the highlighted row. */
  | { kind: "toggleFavourite" }
  /** Restore the input to the committed value. */
  | { kind: "revertInput" };

export interface PairPickerKeyContext {
  isOpen: boolean;
  disabled: boolean;
  highlightedIndex: number;
  /** Length of the flat, render-ordered list. */
  count: number;
  /** Favourites disabled ⇒ the toggle chord is inert. */
  showFavourites: boolean;
  /** APG: Alt+ArrowDown opens without moving the active row. */
  altKey?: boolean;
  /** Ctrl (or Meta) - carries the favourite chord. */
  ctrlKey?: boolean;
}

export interface PairPickerKeyResult {
  preventDefault: boolean;
  effects: PairPickerKeyEffect[];
}

const noneKey = (): PairPickerKeyResult => ({ preventDefault: false, effects: [] });

/**
 * Resolve a keydown on the combobox input.
 *
 * Deliberately matches the conventions ComboBox and TenorPicker use, so the
 * three components are learnable as one: Alt+ArrowDown
 * opens without activating, Tab closes without swallowing the focus move, and
 * Ctrl+D toggles the highlighted row's favourite (the star is decorative, so
 * this is the only keyboard route to it).
 */
export function resolvePairPickerKey(key: string, ctx: PairPickerKeyContext): PairPickerKeyResult {
  if (ctx.disabled) return noneKey();

  const lower = key.toLowerCase();

  if (ctx.ctrlKey && lower === "d") {
    if (!ctx.isOpen || !ctx.showFavourites || ctx.highlightedIndex < 0) return noneKey();
    return { preventDefault: true, effects: [{ kind: "toggleFavourite" }] };
  }

  switch (key) {
    case "ArrowDown": {
      // APG: Alt+ArrowDown reveals the list without activating a row.
      if (!ctx.isOpen && ctx.altKey) {
        return { preventDefault: true, effects: [{ kind: "setOpen", open: true }] };
      }
      if (!ctx.isOpen) {
        return {
          preventDefault: true,
          effects: [
            { kind: "setOpen", open: true },
            { kind: "moveHighlight", direction: 1 },
          ],
        };
      }
      return { preventDefault: true, effects: [{ kind: "moveHighlight", direction: 1 }] };
    }

    case "ArrowUp": {
      if (ctx.isOpen && ctx.altKey) {
        return {
          preventDefault: true,
          effects: [{ kind: "setOpen", open: false }, { kind: "clearHighlight" }],
        };
      }
      if (!ctx.isOpen) {
        return {
          preventDefault: true,
          effects: [
            { kind: "setOpen", open: true },
            { kind: "moveHighlight", direction: -1 },
          ],
        };
      }
      return { preventDefault: true, effects: [{ kind: "moveHighlight", direction: -1 }] };
    }

    case "Home":
      return ctx.isOpen
        ? { preventDefault: true, effects: [{ kind: "highlightEdge", edge: "first" }] }
        : noneKey();

    case "End":
      return ctx.isOpen
        ? { preventDefault: true, effects: [{ kind: "highlightEdge", edge: "last" }] }
        : noneKey();

    case "Enter": {
      if (ctx.isOpen && ctx.highlightedIndex >= 0) {
        return { preventDefault: true, effects: [{ kind: "selectHighlighted" }] };
      }
      return { preventDefault: true, effects: [{ kind: "commitInput" }] };
    }

    case "Escape":
      return ctx.isOpen
        ? {
            preventDefault: true,
            effects: [
              { kind: "revertInput" },
              { kind: "setOpen", open: false },
              { kind: "clearHighlight" },
            ],
          }
        : noneKey();

    // Never preventDefault: focus has to be able to leave.
    case "Tab":
      return ctx.isOpen
        ? {
            preventDefault: false,
            effects: [{ kind: "setOpen", open: false }, { kind: "clearHighlight" }],
          }
        : noneKey();

    default:
      return noneKey();
  }
}
