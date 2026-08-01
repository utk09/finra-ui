import { useAnchoredPosition, useFormField, useStore } from "@utk09/finra-ui";
import { DismissableLayer, Portal } from "@utk09/finra-ui/unstyled";
import {
  type ChangeEvent,
  type CSSProperties,
  type FocusEvent,
  forwardRef,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  buildPairSections,
  type CurrencyPairLike,
  flattenPairSections,
  isPairSelectable,
  movePairHighlight,
  type PairPickerKeyEffect,
  type PairSectionId,
  type PairSectionModel,
  type RankedPair,
  rankPairs as defaultRankPairs,
  type RankPairsContext,
  resolvePairPickerKey,
} from "../../logic/currencyPairPicker";
import {
  createInstrumentSearch,
  type InstrumentProvider,
  isSearchStale,
} from "../../logic/instrumentSearch";
import {
  collectCurrencyCodes,
  currencyDisplayName,
  type CurrencyPairParseError,
  type CurrencyPairValue,
  formatCurrencyPair,
  pairId,
  parseCurrencyPair,
} from "../../utils/currencyPair";
import type { PriceInstrument } from "../../utils/priceFormat";

// Module-scoped ambient so the dev-only NODE_ENV guard type-checks wherever
// this is consumed from source. Bundlers replace `process.env.NODE_ENV`.
declare const process: { env: { NODE_ENV?: string } };

//  The pair model

/** Where a non-deliverable pair's rate is fixed. Informational; never interpreted. */
export interface CurrencyPairFixing {
  /** Fixing source, e.g. `"WMR"`, `"BFIX"`, `"EMTA"`. */
  source?: string;
  /** Fixing time, e.g. `"16:00 London"`. */
  time?: string;
  /** Calendar governing the fixing date. */
  calendar?: string;
}

/** One leg of a synthetic pair. Informational; never interpreted. */
export interface CurrencyPairLeg {
  /** Canonical id of the leg's pair, e.g. `"EURUSD"`. */
  pairId: string;
  /** Multiplier applied when combining legs. */
  ratio?: number;
  /** `true` when the leg is quoted the other way round. */
  inverted?: boolean;
}

/**
 * A currency pair as the picker consumes it.
 *
 * Splits in two, and the split is the contract:
 *
 * - **Read** - everything inherited from {@link CurrencyPairLike} (identity,
 *   names, aliases, tags, asset class, settlement style, tradability). Search,
 *   ranking, badges and disabled state are computed from these.
 * - **Carried** - `pricing`, `fixing`, `settlementCurrency`, `requiresTenor`,
 *   `legs`, `quotationUnit`. Never interpreted; handed straight back on
 *   `onChange` so the surrounding ticket can seed a `PriceInput`, decide whether
 *   a tenor is required, and so on.
 *
 * Enforcing the carried fields would encode desk workflow - "an NDF must have a
 * tenor", "a synthetic prices off its legs" - which belongs to the consumer.
 * The picker will happily emit an NDF with no tenor; refusing to police that is
 * deliberate, and the composition example is how that obligation is discharged.
 *
 * Providers carrying more can extend this interface: the component is generic
 * over it, so extra fields survive the round trip to `onChange`.
 */
export interface CurrencyPair extends CurrencyPairLike {
  /**
   * Quoting precision and tick size. Typed as {@link PriceInstrument} because
   * that is exactly what `PriceInput` accepts - the composition typechecks end
   * to end instead of relying on a hand-copied shape.
   */
  pricing?: PriceInstrument;
  /** Where a non-deliverable pair's rate is fixed. Informational; never interpreted here. */
  fixing?: CurrencyPairFixing;
  /** Currency the trade settles in - differs from `quoteCurrency` for NDFs. */
  settlementCurrency?: string;
  /** Whether the desk requires a tenor alongside this pair. Not enforced here. */
  requiresTenor?: boolean;
  /** Constituent legs of a synthetic pair. */
  legs?: readonly CurrencyPairLeg[];
  /** Unit the price is quoted in, e.g. `"per troy ounce"`. */
  quotationUnit?: string;
}

//  Component types

/** Why a typed commit was rejected. */
export type CurrencyPairInvalidReason = CurrencyPairParseError | "not-tradable";

/**
 * Imperative handle for driving the picker from outside React state.
 *
 * @remarks
 * For the cases props cannot express - focusing the field after a blotter row
 * is chosen, or clearing it when a ticket resets. Every method routes through
 * the same paths the user's own gestures do, so a controlled consumer still
 * hears `onChange` and can still refuse.
 */
export interface CurrencyPairPickerHandle {
  /** Move DOM focus to the text field. */
  focus: () => void;
  /** Commit `null`. Fires `onChange`, exactly as clearing by hand would. */
  clear: () => void;
  /** Open the listbox. A no-op while disabled or read-only. */
  open: () => void;
  /** Close the listbox and drop any pending search. */
  close: () => void;
  /** The committed pair id, or null. */
  getValue: () => string | null;
}

/**
 * Marks the star affordance so the option's single pointer handler can tell a
 * "toggle favourite" click from a "select this pair" click, without the star
 * needing interactivity of its own - a `role="option"` may not contain
 * interactive descendants.
 */
const FAVOURITE_ATTR = "data-pair-favourite";

const SR_ONLY: CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  margin: -1,
  padding: 0,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
  border: 0,
};

/**
 * Stand-in data source for static mode, so the search store can be created and
 * subscribed to unconditionally.
 *
 * @remarks
 * Never driven when `provider` is absent: every call into the search controller
 * is gated on a provider existing, so these two methods are unreachable by
 * design rather than merely untested. They exist only to satisfy
 * {@link InstrumentProvider}, because `useStore` is a hook and cannot be called
 * conditionally.
 */
/* istanbul ignore next -- unreachable: static mode never drives the search */
const EMPTY_PROVIDER: InstrumentProvider<never> = {
  search: () => Promise.resolve([]),
  getById: () => Promise.resolve(null),
};

/**
 * CSS class overrides the styled layer injects into the unstyled base.
 *
 * @remarks
 * Every key is optional - when absent, no className is applied at all (not an
 * empty `class` attribute).
 */
export interface CurrencyPairPickerClassNames {
  /** Outermost element. */
  root?: string;
  /** Applied to the root *in addition to* `root` while the listbox is open. */
  rootOpen?: string;
  /** The control shell holding the input and indicator. */
  control?: string;
  /** The text input carrying `role="combobox"`. */
  input?: string;
  /** The open/close affordance. */
  indicator?: string;
  /** Applied to the indicator *in addition to* `indicator` while open. */
  indicatorOpen?: string;
  /** The portalled panel - border, shadow, elevation. */
  listbox?: string;
  /** The scroll container inside it, so the panel's chrome does not scroll away. */
  options?: string;
  /** A section wrapper (Favourites / Recent / results). */
  section?: string;
  /** A section's heading. */
  sectionLabel?: string;
  /** One option row. */
  option?: string;
  /** Added to the row holding the roving keyboard highlight. */
  optionHighlighted?: string;
  /** Added to the committed row. Orthogonal to `optionHighlighted` - a row may carry both. */
  optionSelected?: string;
  /** Added to an untradable row. */
  optionDisabled?: string;
  /** Added to a favourited row. */
  optionFavourite?: string;
  /** The formatted pair symbol inside a row, e.g. `EUR/USD`. */
  optionSymbol?: string;
  /** The pair's display name inside a row. */
  optionName?: string;
  /** The badge container inside a row. Hidden from assistive tech. */
  badges?: string;
  /** One badge. */
  badge?: string;
  /** The star affordance. A decorative span - a `role="option"` may own no interactive descendant. */
  favouriteToggle?: string;
  /** Added to the star *in addition to* `favouriteToggle` when the pair is favourited. */
  favouriteActive?: string;
  /** The row shown when nothing matches - carries `noOptionsMessage`. */
  empty?: string;
  /** The row shown while a provider search is in flight. */
  loading?: string;
  /** The row shown when a provider search failed. */
  error?: string;
}

/**
 * The per-option state handed to a `renderOption` callback.
 *
 * @remarks
 * `isSelected` and `isHighlighted` are independent and often differ: the
 * highlight is the transient keyboard cursor, the selection is the committed
 * value. A row can be both, either, or neither.
 */
export interface CurrencyPairRenderOptionState {
  /** This pair is the committed value. */
  isSelected: boolean;
  /** This row currently holds the roving keyboard highlight. */
  isHighlighted: boolean;
  /** False for untradable pairs - style them as unavailable, not merely dim. */
  isSelectable: boolean;
  /** Whether the pair is currently favourited. */
  isFavourite: boolean;
  /** Resolved badge text, e.g. `["NDF", "Restricted"]`. Already derived from the model. */
  badges: readonly string[];
}

/**
 * Props for the unstyled CurrencyPairPicker.
 *
 * @remarks
 * Ships no CSS - supply {@link CurrencyPairPickerClassNames}, or style via the
 * `data-*` hooks. The listbox is portalled, so it escapes ancestor
 * `overflow: hidden` and stacking contexts.
 *
 * The value is a scalar **id**, not the pair object, so it survives a form
 * library, a URL and a page reload. `onChange` still hands back the whole pair,
 * because the carried metadata is the point.
 *
 * @typeParam T - Your own pair type, if it extends {@link CurrencyPair}. Extra
 * fields survive the round trip untouched.
 */
export interface CurrencyPairPickerBaseProps<T extends CurrencyPair = CurrencyPair> extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "onChange" | "defaultValue" | "onSelect" | "onInvalid"
> {
  //  Value - a scalar in, the whole pair out
  /**
   * Controlled value: the pair's **id**, not the object.
   *
   * A scalar because it must survive a form library, a URL and a page reload,
   * and because with an async provider the consumer may hold nothing but an id.
   * Resolving it back to a pair is the component's job - from the pairs it has
   * already seen, then `provider.getById` - not the consumer's.
   */
  value?: string | null;
  /** Initial pair id (uncontrolled). */
  defaultValue?: string | null;
  /**
   * Fired on commit with the **whole pair**, so the carried metadata reaches
   * the consumer. Emitting only the id would throw away exactly the fields this
   * component exists to deliver.
   */
  onChange?: (pair: T | null) => void;
  /**
   * Fired when the user commits a well-formed pair the data source does not
   * know, e.g. `GBP/JPY` against a provider that has never returned it. Kept
   * separate from `onChange` so a consumer who does not opt in is never handed a
   * metadata-less pair it would have to defend against. Without a handler, such
   * a commit is rejected through `onInvalid`.
   */
  onCommitUnknown?: (parsed: CurrencyPairValue) => void;

  //  Data source
  /** Static pair list. Searched locally when no `provider` is given. */
  pairs?: readonly T[];
  /**
   * Async data source. When present, searching goes through it, and `pairs` (if
   * also given) only seeds the local cache used to resolve ids.
   */
  provider?: InstrumentProvider<T>;
  /** Quiet period before a keystroke reaches the provider. */
  debounceMs?: number;
  /** Queries shorter than this never reach the provider. */
  minQueryLength?: number;

  //  Parsing / display
  /** Separators accepted on input. Defaults to {@link parseCurrencyPair}'s. */
  separators?: readonly string[];
  /** Separator used to render a committed pair. Default `"/"`. */
  displaySeparator?: string;
  /** BCP-47 locale for currency names. */
  locale?: string;

  //  Favourites
  /** Controlled favourite ids. */
  favourites?: readonly string[];
  /** Initial favourite ids (uncontrolled). */
  defaultFavourites?: readonly string[];
  /**
   * Fired when a favourite is toggled, with the id, its new state, and the whole
   * proposed list.
   *
   * @remarks
   * The picker proposes; storage is yours. A controlled `favourites` list will
   * not move unless you move it.
   */
  onFavouriteChange?: (id: string, favourite: boolean, favourites: string[]) => void;
  /** Show the pinned Favourites section. Turning it off also disables the Ctrl+D chord. */
  showFavourites?: boolean;
  /** Appended to a favourited option's accessible name. */
  favouriteHint?: string;

  //  Recents
  /** Controlled recent ids, most recent first. */
  recents?: readonly string[];
  /** Initial recent ids (uncontrolled). */
  defaultRecents?: readonly string[];
  /** Cap on the Recent section. */
  maxRecents?: number;
  /**
   * Fired with the proposed recents after a selection. The component proposes,
   * the consumer disposes: whether a selection counts as "recent" is desk
   * workflow the picker cannot know.
   */
  onRecentsChange?: (recents: string[]) => void;
  /** Show the pinned Recent section. */
  showRecents?: boolean;

  //  Ranking
  /**
   * Replaceable ranking. Defaults to {@link rankPairs} - fixed tier order,
   * ties broken favourite → recent → the caller's original order.
   *
   * The same seam `DateTenorPicker` and `PriceInput` give their parsers: desks
   * rank on liquidity, franchise flow or a quant score, and none of that is
   * knowable here. A replacement must stay deterministic and must not mutate
   * the pairs it is given.
   */
  rankPairs?: (
    /** Normalised query text. Empty when the list was opened without typing. */
    query: string,
    /** Candidates to rank - the search response unioned with pinned pairs. */
    pairs: readonly T[],
    /** Favourites, recents and the currency-name lookup, for tie-breaking. */
    context: RankPairsContext,
  ) => readonly RankedPair<T>[];

  //  Presentation
  /** Section heading overrides. Defaults to Favourites / Recent / All pairs. */
  sectionLabels?: Partial<Record<PairSectionId, string>>;
  /**
   * Badges for a pair. Defaults to deriving them from the model
   * (`settlementStyle`, `assetClass`, `tradable === false`) rather than reading
   * a parallel free-text list - that is what lets "NDF" and "Restricted" appear
   * on one row without pretending they are the same kind of thing.
   */
  getBadges?: (pair: T) => readonly string[];
  /**
   * Render a row's inner content.
   *
   * @remarks
   * Replaces the contents, not the row: it stays a `role="option"` and stays
   * selectable.
   */
  renderOption?: (pair: T, state: CurrencyPairRenderOptionState) => ReactNode;
  /** Render the open/close affordance. Receives the current open state. */
  renderIndicator?: (isOpen: boolean) => ReactNode;
  /**
   * Render the favourite star. Omit it and no star is rendered at all, which
   * also disables the pointer route to favouriting.
   */
  renderFavourite?: (active: boolean) => ReactNode;
  /** Render one badge. The badge text is already derived from the pair. */
  renderBadge?: (badge: string, pair: T) => ReactNode;

  //  State
  /** Disable the whole control - no opening, no typing, no favouriting. */
  disabled?: boolean;
  /** Show the committed value but refuse edits. The listbox stays shut. */
  readOnly?: boolean;
  /** Placeholder for the text field. */
  placeholder?: string;
  /** Shown when nothing matches the current query. */
  noOptionsMessage?: string;
  /** Shown while a provider search is in flight. */
  loadingMessage?: string;
  /** Formats a provider error for display. */
  formatError?: (error: Error) => ReactNode;
  /** Screen-reader result count. */
  formatResultCount?: (count: number) => string;

  //  Style injection
  /** CSS class names injected by the styled layer. */
  classNames?: CurrencyPairPickerClassNames;
  /** data-* attributes injected by the styled layer, applied to the root. */
  dataAttributes?: Record<string, string>;
  /** Applied to the control shell, so a styled layer can address it separately. */
  controlDataAttributes?: Record<string, string>;
  /**
   * Applied to each badge. Separate from `renderBadge` so the styled layer can
   * label badges without having to supply a renderer - and so a consumer's own
   * renderer does not have to remember to carry the attribute.
   */
  badgeDataAttributes?: Record<string, string>;

  //  Events
  /** Fired when a typed commit is rejected, with which rule refused it. */
  onInvalid?: (reason: CurrencyPairInvalidReason) => void;
  /** Fired when the listbox opens. Not fired again while it is already open. */
  onOpen?: () => void;
  /** Fired when the listbox closes. Not fired again while it is already closed. */
  onClose?: () => void;

  //  a11y / FormField
  /** Explicit control id. Auto-generated, or taken from an enclosing FormField, if omitted. */
  id?: string;
  /** Ids of describing elements. Merged with any an enclosing FormField supplies. */
  "aria-describedby"?: string;
  /** Marks the control invalid. An enclosing FormField sets this from its own validation status. */
  "aria-invalid"?: boolean;
  /** Accessible name. Required unless an enclosing FormField or a visible label supplies one. */
  "aria-label"?: string;
}

//  Defaults

function defaultFormatResultCount(count: number): string {
  if (count === 0) return "No pairs available";
  return `${count} ${count === 1 ? "pair" : "pairs"} available`;
}

/**
 * Badges from the model. `settlementStyle` and `assetClass` are free-form
 * strings, so they are surfaced verbatim rather than mapped through a fixed
 * union the provider never agreed to.
 */
function defaultGetBadges(pair: CurrencyPair): string[] {
  const badges: string[] = [];
  if (pair.settlementStyle) badges.push(pair.settlementStyle);
  if (pair.assetClass) badges.push(pair.assetClass);
  if (pair.tradable === false) badges.push("Restricted");
  return badges;
}

//  Component

function CurrencyPairPickerBaseRender<T extends CurrencyPair = CurrencyPair>(
  props: CurrencyPairPickerBaseProps<T>,
  forwardedRef: Ref<CurrencyPairPickerHandle>,
) {
  const {
    value,
    defaultValue,
    onChange,
    onCommitUnknown,
    pairs,
    provider,
    debounceMs,
    minQueryLength,
    separators,
    displaySeparator = "/",
    locale,
    favourites,
    defaultFavourites,
    onFavouriteChange,
    showFavourites = true,
    favouriteHint = "favourite",
    recents,
    defaultRecents,
    maxRecents = 5,
    onRecentsChange,
    showRecents = true,
    rankPairs = defaultRankPairs,
    sectionLabels,
    getBadges = defaultGetBadges,
    renderOption,
    renderIndicator,
    renderFavourite,
    renderBadge,
    disabled,
    readOnly,
    placeholder = "Search pairs…",
    noOptionsMessage = "No matching pairs",
    loadingMessage = "Searching…",
    formatError,
    formatResultCount = defaultFormatResultCount,
    classNames: cn,
    dataAttributes,
    controlDataAttributes,
    badgeDataAttributes,
    onInvalid,
    onOpen,
    onClose,
    id,
    "aria-describedby": ariaDescribedBy,
    "aria-invalid": ariaInvalid,
    "aria-label": ariaLabel,
    ...rest
  } = props;

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [controlEl, setControlEl] = useState<HTMLDivElement | null>(null);
  const baseId = useId();
  const listboxId = `${baseId}-listbox`;
  const optionId = (index: number): string => `${baseId}-opt-${index}`;

  const field = useFormField({
    id,
    "aria-describedby": ariaDescribedBy,
    "aria-invalid": ariaInvalid,
    disabled,
  });

  const [isOpen, setIsOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const [inputText, setInputText] = useState("");
  /** Whether the text is a live filter rather than the committed pair's label. */
  const [filtering, setFiltering] = useState(false);

  const isAsync = provider !== undefined;

  //  Search store
  //
  // Created unconditionally - hooks cannot be conditional - but only driven
  // when a provider exists. In static mode it stays idle and costs nothing.

  const search = useMemo(
    () =>
      createInstrumentSearch<T>({
        provider: provider ?? (EMPTY_PROVIDER as unknown as InstrumentProvider<T>),
        debounceMs,
        minQueryLength,
      }),
    [provider, debounceMs, minQueryLength],
  );
  useEffect(() => () => search.destroy(), [search]);
  const searchState = useStore(search.store);

  //  Value (controlled / uncontrolled)

  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState<string | null>(defaultValue ?? null);
  const currentValue = isControlled ? value : internalValue;

  //  Pair cache
  //
  // Every pair the component has ever seen, by id. This is what lets a
  // controlled `value` of "GBPUSD" render as a pair without the consumer
  // holding the object, and what keeps the selected label stable while the
  // result list churns underneath it.

  const [cache, setCache] = useState<ReadonlyMap<string, T>>(() => new Map());

  const remember = useCallback((incoming: readonly T[]) => {
    if (incoming.length === 0) return;
    setCache((prev) => {
      let next: Map<string, T> | null = null;
      for (const pair of incoming) {
        if (prev.get(pair.id) === pair) continue;
        next ??= new Map(prev);
        next.set(pair.id, pair);
      }
      return next ?? prev;
    });
  }, []);

  useEffect(() => {
    if (pairs) remember(pairs);
  }, [pairs, remember]);

  // `id` is the instrument key, not the pair key. Two instruments on the same
  // currency pair (USDINR onshore vs NDF) must carry different ids, or the
  // second silently replaces the first and vanishes from the list.
  useEffect(() => {
    if (process.env.NODE_ENV === "production" || !pairs) return;
    const seen = new Set<string>();
    const clashes = new Set<string>();
    for (const pair of pairs) {
      if (seen.has(pair.id)) clashes.add(pair.id);
      seen.add(pair.id);
    }
    if (clashes.size > 0) {
      // eslint-disable-next-line no-console -- intentional dev-only warning
      console.warn(
        `CurrencyPairPicker: duplicate pair id(s) ${[...clashes].join(", ")}. ` +
          "Only the last of each is shown. Give every tradable instrument its own id " +
          "(e.g. USDINR.ONSHORE and USDINR.NDF) - they may share base/quote.",
      );
    }
  }, [pairs]);
  useEffect(() => {
    remember(searchState.results);
  }, [searchState.results, remember]);

  //  Favourites / recents (controlled / uncontrolled / provider-seeded)
  //
  // `null` means "untouched", which is what keeps a provider-seeded list from
  // reappearing after the user has deliberately emptied their own.

  const [internalFavourites, setInternalFavourites] = useState<string[] | null>(() =>
    defaultFavourites ? [...defaultFavourites] : null,
  );
  const [internalRecents, setInternalRecents] = useState<string[] | null>(() =>
    defaultRecents ? [...defaultRecents] : null,
  );
  const [providerFavourites, setProviderFavourites] = useState<readonly string[]>([]);
  const [providerRecents, setProviderRecents] = useState<readonly string[]>([]);

  const currentFavourites = favourites ?? internalFavourites ?? providerFavourites;
  const currentRecents = recents ?? internalRecents ?? providerRecents;

  // Provider-side lists seed both the pool and the uncontrolled fallback. They
  // never override a prop or a user edit - the picker supplies the mechanism,
  // the consumer keeps the storage.
  useEffect(() => {
    // Both are optional on the interface, so a provider with no server-side
    // personalisation does no work at all here - not even an empty round trip
    // that would re-render for nothing.
    if (!provider?.getFavourites && !provider?.getRecent) return;
    let cancelled = false;
    void Promise.all([
      provider.getFavourites?.() ?? Promise.resolve<readonly T[]>([]),
      provider.getRecent?.() ?? Promise.resolve<readonly T[]>([]),
    ])
      .then(([fav, rec]) => {
        if (cancelled) return;
        remember([...fav, ...rec]);
        if (fav.length > 0) setProviderFavourites(fav.map((p) => p.id));
        if (rec.length > 0) setProviderRecents(rec.map((p) => p.id));
      })
      .catch(() => {
        // Personalisation is optional; a failure must not break the picker.
      });
    return () => {
      cancelled = true;
    };
  }, [provider, remember]);

  // Resolve a controlled id the component has never seen. `requestedIds` stops
  // the lookup re-firing every time the cache changes for an unrelated reason.
  const requestedIds = useRef(new Set<string>());
  useEffect(() => {
    if (!currentValue || !provider) return;
    if (cache.has(currentValue) || requestedIds.current.has(currentValue)) return;
    requestedIds.current.add(currentValue);
    let cancelled = false;
    void provider
      .getById(currentValue)
      .then((pair) => {
        if (!cancelled && pair) remember([pair]);
      })
      .catch(() => {
        // A failed lookup leaves the raw id rendered; it never throws at render.
      });
    return () => {
      cancelled = true;
    };
  }, [currentValue, provider, cache, remember]);

  const resolvedValue = currentValue ? (cache.get(currentValue) ?? null) : null;

  const toggleFavourite = useCallback(
    (targetId: string) => {
      const has = currentFavourites.includes(targetId);
      const next = has
        ? currentFavourites.filter((f) => f !== targetId)
        : [...currentFavourites, targetId];
      if (favourites === undefined) setInternalFavourites(next);
      onFavouriteChange?.(targetId, !has, next);
    },
    [currentFavourites, favourites, onFavouriteChange],
  );

  const pushRecent = useCallback(
    (targetId: string) => {
      const next = [targetId, ...currentRecents.filter((r) => r !== targetId)];
      if (recents === undefined) setInternalRecents(next);
      onRecentsChange?.(next);
    },
    [currentRecents, recents, onRecentsChange],
  );

  //  Candidate pool

  const query = filtering ? inputText.trim() : "";

  /**
   * What ranking sees.
   *
   * In provider mode this is deliberately **not** just the search response.
   * `buildPairSections` partitions what it is given; it does not inject. A
   * favourite or recent missing from the response would therefore vanish from
   * its own section - and with an empty query, a provider's default list has no
   * reason to contain the user's favourites at all, so the dropdown would open
   * with those sections missing. Unioning them in is what makes the pinned
   * sections mean what they say. They are still ranked and filtered like
   * everything else, so typing `gbp` correctly hides a recent EURJPY.
   */
  const candidates = useMemo(() => {
    const source = isAsync ? searchState.results : (pairs ?? []);
    const byId = new Map<string, T>();
    for (const pair of source) byId.set(pair.id, pair);

    if (isAsync) {
      const pinned = [
        ...(showFavourites ? currentFavourites : []),
        ...(showRecents ? currentRecents : []),
      ];
      for (const pinnedId of pinned) {
        if (byId.has(pinnedId)) continue;
        const cached = cache.get(pinnedId);
        if (cached) byId.set(pinnedId, cached);
      }
    }
    return [...byId.values()];
  }, [
    isAsync,
    searchState.results,
    pairs,
    showFavourites,
    showRecents,
    currentFavourites,
    currentRecents,
    cache,
  ]);

  const nameOf = useCallback(
    (code: string): string | null => currencyDisplayName(code, locale),
    [locale],
  );

  const ranked = useMemo(
    () =>
      rankPairs(query, candidates, {
        favourites: showFavourites ? currentFavourites : undefined,
        recents: showRecents ? currentRecents : undefined,
        nameOf,
      }),
    [
      rankPairs,
      query,
      candidates,
      showFavourites,
      showRecents,
      currentFavourites,
      currentRecents,
      nameOf,
    ],
  );

  const sections = useMemo(
    () =>
      buildPairSections({
        ranked,
        favourites: currentFavourites,
        recents: currentRecents,
        maxRecents,
        showFavourites,
        showRecents,
        sectionLabels,
      }),
    [
      ranked,
      currentFavourites,
      currentRecents,
      maxRecents,
      showFavourites,
      showRecents,
      sectionLabels,
    ],
  );

  const flat = useMemo(() => flattenPairSections(sections), [sections]);
  /** Render order is the roving-highlight index space; precomputed to stay O(n). */
  const indexById = useMemo(() => {
    const map = new Map<string, number>();
    flat.forEach((pair, index) => map.set(pair.id, index));
    return map;
  }, [flat]);

  /** Registry for splitting unseparated input, derived from what is in hand. */
  const codes = useMemo(() => collectCurrencyCodes(candidates), [candidates]);

  //  Display text

  const displayFor = useCallback(
    (pair: T | null, fallbackId: string | null): string =>
      pair ? formatCurrencyPair(pair, { separator: displaySeparator }) : (fallbackId ?? ""),
    [displaySeparator],
  );

  // Keep the visible text in step with the committed value, except while the
  // user is mid-filter. Also picks up a late `getById` resolution.
  useEffect(() => {
    if (!filtering) setInputText(displayFor(resolvedValue, currentValue ?? null));
  }, [filtering, displayFor, resolvedValue, currentValue]);

  //  Open / close

  const openListbox = useCallback(() => {
    if (disabled || readOnly) return;
    setIsOpen((prev) => {
      if (!prev) onOpen?.();
      return true;
    });
    // Opening with no query should still show the provider's default list.
    if (isAsync && searchState.status === "idle") search.searchNow("");
  }, [disabled, readOnly, onOpen, isAsync, search, searchState.status]);

  const closeListbox = useCallback(() => {
    setHighlight(-1);
    setFiltering(false);
    if (isAsync) search.cancel();
    setIsOpen((prev) => {
      if (prev) onClose?.();
      return false;
    });
  }, [onClose, isAsync, search]);

  //  Commit

  const commitPair = useCallback(
    (pair: T | null) => {
      if (pair) {
        remember([pair]);
        pushRecent(pair.id);
      }
      // The displayed text is only ours to set while uncontrolled. Under a
      // controlled `value` the consumer decides whether the selection sticks -
      // they may reject it - so the text follows `value` through the sync
      // effect below and never runs ahead of it.
      if (!isControlled) {
        setInternalValue(pair?.id ?? null);
        setInputText(displayFor(pair, pair?.id ?? null));
      }
      onChange?.(pair);
      setFiltering(false);
    },
    [isControlled, onChange, displayFor, pushRecent, remember],
  );

  const revertInput = useCallback(() => {
    setInputText(displayFor(resolvedValue, currentValue ?? null));
    setFiltering(false);
  }, [displayFor, resolvedValue, currentValue]);

  const selectPair = useCallback(
    (pair: T | undefined) => {
      if (!pair) return;
      if (!isPairSelectable(pair)) {
        onInvalid?.("not-tradable");
        return;
      }
      commitPair(pair);
      closeListbox();
      inputRef.current?.focus();
    },
    [commitPair, closeListbox, onInvalid],
  );

  /** Parse free-form text and commit whatever it resolves to. */
  const commitText = useCallback(
    (raw: string): boolean => {
      const trimmed = raw.trim();
      if (!trimmed) {
        commitPair(null);
        return true;
      }

      // `strictCodes: false` because the registry here is only what has been
      // seen so far - against a provider, that is whatever the last search
      // returned. A well-formed pair the local set has not met yet is reported
      // through `onCommitUnknown`, which is a better answer than rejecting it.
      const parsed = parseCurrencyPair(trimmed, { separators, codes, strictCodes: false });
      if (!parsed.valid || !parsed.id || !parsed.baseCurrency || !parsed.quoteCurrency) {
        onInvalid?.(parsed.error ?? "invalid-format");
        revertInput();
        return false;
      }

      // Resolve by canonical **symbol**, not by id. One currency pair can be
      // several tradable instruments - USDINR onshore and USDINR NDF price and
      // settle differently - so a provider legitimately offers both with the
      // same base/quote and distinct ids. Typing "USDINR" names the pair, which
      // is not enough to name the instrument.
      const matches: T[] = [];
      for (const candidate of cache.values()) {
        if (pairId(candidate) === parsed.id) matches.push(candidate);
      }

      if (matches.length > 1) {
        // Same rule the parser applies to `USDT|RY` vs `USD|TRY`: ambiguity is
        // reported, never guessed. Leave the text and the list alone so the
        // filtered rows are exactly the choices, and let the user pick one.
        onInvalid?.("ambiguous");
        return false;
      }

      const known = matches[0];
      if (known) {
        if (!isPairSelectable(known)) {
          onInvalid?.("not-tradable");
          revertInput();
          return false;
        }
        commitPair(known);
        return true;
      }

      // Well-formed but unknown to the data source. Reported through its own
      // callback rather than synthesised into a metadata-less pair on onChange.
      if (onCommitUnknown) {
        onCommitUnknown({
          baseCurrency: parsed.baseCurrency,
          quoteCurrency: parsed.quoteCurrency,
        });
        setFiltering(false);
        return true;
      }
      onInvalid?.("unknown-code");
      revertInput();
      return false;
    },
    [separators, codes, cache, commitPair, revertInput, onInvalid, onCommitUnknown],
  );

  //  Handlers

  const handleInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      if (disabled || readOnly) return;
      const next = event.target.value;
      setInputText(next);
      setFiltering(true);
      setHighlight(-1);
      if (!isOpen) openListbox();
      if (isAsync) search.search(next.trim());
    },
    [disabled, readOnly, isOpen, openListbox, isAsync, search],
  );

  const handleInputBlur = useCallback(
    (event: FocusEvent<HTMLInputElement>) => {
      // Focus moving into the control (e.g. the indicator) is not a blur-commit.
      const next = event.relatedTarget as Node | null;
      if (next && controlEl?.contains(next)) return;
      if (filtering) commitText(inputText);
    },
    [filtering, commitText, inputText, controlEl],
  );

  const runEffects = useCallback(
    (effects: readonly PairPickerKeyEffect[]) => {
      for (const effect of effects) {
        switch (effect.kind) {
          case "setOpen":
            if (effect.open) openListbox();
            else closeListbox();
            break;
          case "moveHighlight":
            setHighlight((current) => movePairHighlight(flat, current, effect.direction));
            break;
          case "highlightEdge":
            setHighlight(movePairHighlight(flat, -1, effect.edge === "first" ? 1 : -1));
            break;
          case "clearHighlight":
            setHighlight(-1);
            break;
          case "selectHighlighted":
            selectPair(flat[highlight]);
            break;
          case "commitInput":
            if (commitText(inputText)) closeListbox();
            break;
          case "toggleFavourite":
            if (flat[highlight]) toggleFavourite(flat[highlight].id);
            break;
          case "revertInput":
            revertInput();
            break;
        }
      }
    },
    [
      openListbox,
      closeListbox,
      flat,
      highlight,
      selectPair,
      commitText,
      inputText,
      toggleFavourite,
      revertInput,
    ],
  );

  const handleInputKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (readOnly) return;
      const { preventDefault, effects } = resolvePairPickerKey(event.key, {
        isOpen,
        disabled: disabled ?? false,
        highlightedIndex: highlight,
        count: flat.length,
        showFavourites,
        altKey: event.altKey,
        ctrlKey: event.ctrlKey || event.metaKey,
      });
      if (preventDefault) event.preventDefault();
      runEffects(effects);
    },
    [readOnly, isOpen, disabled, highlight, flat.length, showFavourites, runEffects],
  );

  //  Imperative handle

  useImperativeHandle(
    forwardedRef,
    () => ({
      focus: () => inputRef.current?.focus(),
      clear: () => commitPair(null),
      open: openListbox,
      close: closeListbox,
      getValue: () => currentValue ?? null,
    }),
    [commitPair, openListbox, closeListbox, currentValue],
  );

  //  Positioning

  const { setFloating, x, y } = useAnchoredPosition(controlEl, {
    placement: "bottom-start",
    offset: 4,
  });

  useEffect(() => {
    if (highlight < 0 || !listRef.current) return;
    listRef.current
      .querySelector(`[data-index="${highlight}"]`)
      ?.scrollIntoView?.({ block: "nearest" });
  }, [highlight]);

  //  Render

  const busy = isAsync && (searchState.status === "loading" || isSearchStale(searchState));
  const activeDescendant = isOpen && highlight >= 0 ? optionId(highlight) : undefined;

  const renderPairOption = (pair: T): ReactNode => {
    const index = indexById.get(pair.id) ?? -1;
    const selected = pair.id === currentValue;
    const selectable = isPairSelectable(pair);
    const favourite = currentFavourites.includes(pair.id);
    const badges = getBadges(pair);
    const symbol = formatCurrencyPair(pair, { separator: displaySeparator });

    const state: CurrencyPairRenderOptionState = {
      isSelected: selected,
      isHighlighted: index === highlight,
      isSelectable: selectable,
      isFavourite: favourite,
      badges,
    };

    // Favourite state, badges and any restriction reason ride on the option's
    // own accessible name: the star is decorative, and a disabled option cannot
    // carry a tooltip a keyboard user would ever reach.
    const nameParts = [symbol];
    if (pair.displayName) nameParts.push(pair.displayName);
    if (badges.length) nameParts.push(badges.join(", "));
    if (!selectable && pair.restrictionReason) nameParts.push(pair.restrictionReason);
    if (showFavourites && favourite) nameParts.push(favouriteHint);

    return (
      <div
        key={pair.id}
        id={optionId(index)}
        role="option"
        tabIndex={-1}
        data-index={index}
        aria-selected={selected}
        aria-disabled={!selectable || undefined}
        aria-label={nameParts.join(", ")}
        data-highlighted={index === highlight || undefined}
        className={
          [
            cn?.option,
            index === highlight && cn?.optionHighlighted,
            selected && cn?.optionSelected,
            !selectable && cn?.optionDisabled,
            favourite && cn?.optionFavourite,
          ]
            .filter(Boolean)
            .join(" ") || undefined
        }
        // One handler for the whole row. Hit-testing the star here keeps it a
        // plain element - a role="option" may not contain interactive
        // descendants, and a nested button would be unreachable anyway.
        onMouseDown={(event) => {
          event.preventDefault();
          if (showFavourites && (event.target as Element).closest?.(`[${FAVOURITE_ATTR}]`)) {
            toggleFavourite(pair.id);
            return;
          }
          selectPair(pair);
        }}>
        {renderOption ? (
          renderOption(pair, state)
        ) : (
          <>
            <span className={cn?.optionSymbol}>{symbol}</span>
            {pair.displayName ? <span className={cn?.optionName}>{pair.displayName}</span> : null}
            {badges.length ? (
              <span className={cn?.badges} aria-hidden="true">
                {badges.map((badge) => (
                  <span key={badge} className={cn?.badge} {...badgeDataAttributes}>
                    {renderBadge ? renderBadge(badge, pair) : badge}
                  </span>
                ))}
              </span>
            ) : null}
            {showFavourites && renderFavourite ? (
              <span
                {...{ [FAVOURITE_ATTR]: "" }}
                aria-hidden="true"
                className={
                  [cn?.favouriteToggle, favourite && cn?.favouriteActive]
                    .filter(Boolean)
                    .join(" ") || undefined
                }>
                {renderFavourite(favourite)}
              </span>
            ) : null}
          </>
        )}
      </div>
    );
  };

  const renderSection = (section: PairSectionModel<T>): ReactNode => (
    <div key={section.id} className={cn?.section} role="group" aria-label={section.label}>
      <div className={cn?.sectionLabel} aria-hidden="true">
        {section.label}
      </div>
      {section.pairs.map(renderPairOption)}
    </div>
  );

  const errorNode =
    searchState.status === "error" && searchState.error
      ? (formatError?.(searchState.error) ?? searchState.error.message)
      : null;

  return (
    <div
      className={[cn?.root, isOpen && cn?.rootOpen].filter(Boolean).join(" ") || undefined}
      {...dataAttributes}
      {...rest}>
      <div ref={setControlEl} className={cn?.control} {...controlDataAttributes}>
        <input
          ref={inputRef}
          className={cn?.input}
          type="text"
          // The role belongs on the input, not a wrapper: the combobox has to be
          // the element that takes focus and owns aria-activedescendant.
          role="combobox"
          id={field.id}
          value={inputText}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          autoComplete="off"
          aria-expanded={isOpen}
          aria-controls={isOpen ? listboxId : undefined}
          aria-haspopup="listbox"
          aria-activedescendant={activeDescendant}
          aria-busy={busy || undefined}
          aria-describedby={field["aria-describedby"]}
          aria-invalid={field["aria-invalid"]}
          aria-required={field["aria-required"]}
          aria-label={ariaLabel}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          onClick={() => {
            if (!disabled && !readOnly && !isOpen) openListbox();
          }}
        />
        {renderIndicator ? (
          <span
            className={
              [cn?.indicator, isOpen && cn?.indicatorOpen].filter(Boolean).join(" ") || undefined
            }
            aria-hidden="true">
            {renderIndicator(isOpen)}
          </span>
        ) : null}
      </div>

      {/*
        Portalled so the listbox escapes any ancestor overflow/z-index/transform
        context - a pair picker lives in dense blotters and side panels, where
        inline rendering is clipped.
      */}
      {isOpen ? (
        <Portal>
          <DismissableLayer
            ref={setFloating}
            className={cn?.listbox}
            style={{
              position: "absolute",
              top: y,
              left: x,
              minInlineSize: controlEl?.getBoundingClientRect().width,
            }}
            onDismiss={closeListbox}
            // Pointing at the input or indicator must not count as "outside",
            // or the click would close and immediately reopen.
            excludeElements={[controlEl]}>
            <div
              ref={listRef}
              id={listboxId}
              role="listbox"
              tabIndex={-1}
              className={cn?.options}
              aria-label={ariaLabel}>
              {errorNode ? (
                <div role="presentation" className={cn?.error} aria-live="polite">
                  {errorNode}
                </div>
              ) : flat.length > 0 ? (
                sections.map(renderSection)
              ) : busy ? (
                <div role="presentation" className={cn?.loading} aria-live="polite">
                  {loadingMessage}
                </div>
              ) : (
                <div role="presentation" className={cn?.empty} aria-live="polite">
                  {noOptionsMessage}
                </div>
              )}
            </div>
          </DismissableLayer>
        </Portal>
      ) : null}

      {/*
        Result count. The region stays mounted - a live region added to the DOM
        at the same time as its content is announced unreliably - and only its
        text changes. Silent while closed, busy or errored; those rows announce
        themselves.
      */}
      <div role="status" aria-live="polite" style={SR_ONLY}>
        {isOpen && !busy && !errorNode ? formatResultCount(flat.length) : ""}
      </div>
    </div>
  );
}

export const CurrencyPairPickerBase = forwardRef(CurrencyPairPickerBaseRender) as <
  T extends CurrencyPair = CurrencyPair,
>(
  props: CurrencyPairPickerBaseProps<T> & { ref?: Ref<CurrencyPairPickerHandle> },
) => ReactElement | null;

(CurrencyPairPickerBase as { displayName?: string }).displayName = "CurrencyPairPickerBase";
