/**
 * Debounced, provider-backed instrument search - zero framework imports, zero DOM.
 *
 * Splits into two halves so the hard part stays testable without timers:
 *
 * - {@link instrumentSearchReducer} - pure `(state, action) => state`, and the
 *   sole owner of the **stale-response guard**. Every request carries a
 *   sequence number; a settled response whose number is no longer current is
 *   dropped by the reducer, not by the caller.
 * - {@link createInstrumentSearch} - the imperative driver: debounce timer,
 *   provider calls, abort. It allocates sequence numbers and does nothing else
 *   the reducer could do.
 *
 * React consumes the store through `useStore`; a Lit reactive controller would
 * consume the same store through `subscribe`. The behaviour is written once.
 *
 * ## Why a sequence number rather than comparing queries
 *
 * A slow response for `"GB"` must never overwrite a fast one for `"GBPUSD"`.
 * Comparing query strings almost works but fails on retries - the same query
 * legitimately runs twice, and the first (stale) answer would be accepted.
 * Aborting is an optimisation, not the fix: an aborted `fetch` may still have
 * resolved before the abort landed. Correctness lives in the guard.
 *
 * ## State invariant
 *
 * `results` always belong to `resultsQuery`. Therefore `query !== resultsQuery`
 * means exactly "what is displayed does not answer what was last typed" - that
 * is what lets a consumer keep showing the previous rows, dimmed, instead of
 * flashing empty.
 *
 * Note that this covers the **debounce window as well as the request**:
 * `search()` records the query immediately and only starts the request when the
 * timer fires. Without that, the state would claim to be up to date for the
 * whole quiet period, and a spinner could not appear until the timer expired -
 * the documented complaint against bolting an external debounce onto a search
 * box. Consumers choose their own threshold: `isSearchStale` reacts to the
 * keystroke, `status === "loading"` reacts to the request.
 */

import { createStore, type Store } from "@utk09/finra-ui/utils";

import type { CurrencyPairLike } from "./currencyPairPicker";

/**
 * Data source for instruments. Everything the picker cannot compute locally.
 *
 * Deviations from the epic's sketch, both deliberate:
 * - `getById` resolves to `null` for an unknown id instead of rejecting, so a
 *   controlled `value` naming a pair the provider has never heard of renders as
 *   "nothing selected" rather than an error.
 * - `getRecent` / `getFavourites` are optional. Favourites and recents can be
 *   component-managed instead; a provider with no server-side personalisation
 *   should not have to write two stubs to satisfy the type.
 */
export interface InstrumentProvider<T extends CurrencyPairLike = CurrencyPairLike> {
  /**
   * Search for `query`. An empty query is a legitimate call - providers
   * commonly answer it with a default or most-traded list.
   *
   * `signal` aborts a superseded request. Honouring it is optional: the
   * sequence guard already makes a late response harmless, so the signal only
   * saves work.
   */
  search(query: string, signal?: AbortSignal): Promise<readonly T[]>;
  /** Resolve a pair by its stable id, or `null` if the provider has no such pair. */
  getById(id: string): Promise<T | null>;
  /** Provider-side recents. Omit to let the component manage them. */
  getRecent?(): Promise<readonly T[]>;
  /** Provider-side favourites. Omit to let the component manage them. */
  getFavourites?(): Promise<readonly T[]>;
}

export type InstrumentSearchStatus = "idle" | "loading" | "success" | "error";

export interface InstrumentSearchState<T extends CurrencyPairLike = CurrencyPairLike> {
  status: InstrumentSearchStatus;
  /** The query last asked for. */
  query: string;
  /** The query `results` actually belong to. Differs from `query` only while loading. */
  resultsQuery: string;
  results: readonly T[];
  /** Set only in the `error` status; cleared by any later transition. */
  error: Error | null;
  /**
   * Sequence number of the current request. A settled response carrying any
   * other number is stale and is discarded.
   */
  requestId: number;
}

export type InstrumentSearchAction<T extends CurrencyPairLike = CurrencyPairLike> =
  /**
   * The query was typed but not yet sent - the debounce window. Carries no
   * sequence number because it invalidates nothing; it only makes the state
   * admit that what is on screen no longer answers what was typed.
   */
  | { type: "query-changed"; query: string }
  | { type: "search-start"; query: string; requestId: number }
  | { type: "search-success"; requestId: number; results: readonly T[] }
  | { type: "search-error"; requestId: number; error: Error }
  /** Invalidate the in-flight request but keep the results already shown. */
  | { type: "cancel"; requestId: number }
  /** Invalidate and clear - back to the initial state. */
  | { type: "reset"; requestId: number };

/** Initial state: nothing asked for, nothing shown. */
export function createInstrumentSearchState<
  T extends CurrencyPairLike = CurrencyPairLike,
>(): InstrumentSearchState<T> {
  return {
    status: "idle",
    query: "",
    resultsQuery: "",
    results: [],
    error: null,
    requestId: 0,
  };
}

/**
 * Pure reducer. Sequence numbers are supplied by the caller and never generated
 * here, so the guard is deterministic and testable without a driver.
 */
export function instrumentSearchReducer<T extends CurrencyPairLike>(
  state: InstrumentSearchState<T>,
  action: InstrumentSearchAction<T>,
): InstrumentSearchState<T> {
  switch (action.type) {
    case "query-changed":
      // Status is untouched: nothing has been asked for yet. Only the gap
      // between `query` and `resultsQuery` opens.
      return state.query === action.query ? state : { ...state, query: action.query };

    case "search-start":
      return {
        ...state,
        status: "loading",
        query: action.query,
        // results/resultsQuery deliberately untouched: the previous rows stay
        // available so a consumer can render them stale rather than empty.
        error: null,
        requestId: action.requestId,
      };

    case "search-success":
      // The guard. A response for a superseded request changes nothing.
      if (action.requestId !== state.requestId) return state;
      return {
        ...state,
        status: "success",
        resultsQuery: state.query,
        results: action.results,
        error: null,
      };

    case "search-error":
      if (action.requestId !== state.requestId) return state;
      // Results are cleared rather than kept: rows that do not answer the query
      // the user can see typed, with no loading affordance left to explain them,
      // read as a wrong answer. A consumer that wants them keeps its own copy.
      return {
        ...state,
        status: "error",
        resultsQuery: state.query,
        results: [],
        error: action.error,
      };

    case "cancel": {
      const loading = state.status === "loading";
      // Cancelling mid-debounce is as real as cancelling mid-flight: the query
      // was recorded but never sent, so it must not be left looking stale
      // forever.
      if (!loading && state.query === state.resultsQuery) return state;
      // Restore the invariant: query describes what the visible results are,
      // because nothing further will now be asked for.
      return {
        ...state,
        status: loading ? (state.results.length > 0 ? "success" : "idle") : state.status,
        query: state.resultsQuery,
        requestId: action.requestId,
      };
    }

    case "reset":
      return { ...createInstrumentSearchState<T>(), requestId: action.requestId };

    default:
      return state;
  }
}

/** No results came back for a completed search - the "empty" state. */
export function isSearchEmpty(state: InstrumentSearchState): boolean {
  return state.status === "success" && state.results.length === 0;
}

/**
 * The visible results do not answer the query as last typed - true through the
 * debounce window and the request alike. The earliest honest moment to show a
 * busy affordance.
 */
export function isSearchStale(state: InstrumentSearchState): boolean {
  return state.query !== state.resultsQuery;
}

/** Milliseconds of quiet before a keystroke reaches the provider. */
export const DEFAULT_INSTRUMENT_SEARCH_DEBOUNCE_MS = 250;

export interface InstrumentSearchOptions<T extends CurrencyPairLike> {
  provider: InstrumentProvider<T>;
  /**
   * Quiet period after the last {@link InstrumentSearch.search} call.
   * `0` dispatches synchronously - genuinely no debounce, not a zero timeout.
   */
  debounceMs?: number;
  /**
   * Queries shorter than this (after trimming) never reach the provider and
   * clear the results instead, so deleting back to nothing empties the list.
   */
  minQueryLength?: number;
}

export interface InstrumentSearch<T extends CurrencyPairLike = CurrencyPairLike> {
  /** Observable state. Feed to `useStore`, or `subscribe` from a Lit controller. */
  store: Store<InstrumentSearchState<T>, InstrumentSearchAction<T>>;
  /**
   * Debounced search - the keystroke path. Records the query synchronously so
   * the state is stale from the keystroke, not from the request.
   */
  search(query: string): void;
  /** Immediate search - the Enter / retry path. */
  searchNow(query: string): void;
  /** Drop any pending or in-flight request, keeping the results already shown. */
  cancel(): void;
  /** Drop any pending or in-flight request and clear back to idle. */
  reset(): void;
  /** Permanent teardown. Every method becomes a no-op afterwards. */
  destroy(): void;
}

/** Anything a provider rejects with, presented as an `Error`. */
function toError(cause: unknown): Error {
  return cause instanceof Error ? cause : new Error(String(cause));
}

/**
 * Build a debounced search controller over an {@link InstrumentProvider}.
 *
 * ```ts
 * const search = createInstrumentSearch({ provider, debounceMs: 200 });
 * search.search("gbp");            // debounced
 * const state = useStore(search.store);
 * // state.status: "idle" | "loading" | "success" | "error"
 * ```
 */
export function createInstrumentSearch<T extends CurrencyPairLike>(
  options: InstrumentSearchOptions<T>,
): InstrumentSearch<T> {
  const {
    provider,
    debounceMs = DEFAULT_INSTRUMENT_SEARCH_DEBOUNCE_MS,
    minQueryLength = 0,
  } = options;

  const store = createStore<InstrumentSearchState<T>, InstrumentSearchAction<T>>(
    createInstrumentSearchState<T>(),
    instrumentSearchReducer,
  );

  let nextRequestId = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let inflight: AbortController | null = null;
  let destroyed = false;

  const clearTimer = (): void => {
    if (timer === null) return;
    clearTimeout(timer);
    timer = null;
  };

  const abortInflight = (): void => {
    inflight?.abort();
    inflight = null;
  };

  const run = (query: string): void => {
    clearTimer();
    abortInflight();

    if (query.trim().length < minQueryLength) {
      store.send({ type: "reset", requestId: ++nextRequestId });
      return;
    }

    const requestId = ++nextRequestId;
    const controller = new AbortController();
    inflight = controller;
    store.send({ type: "search-start", query, requestId });

    const settle = (results: readonly T[]): void => {
      if (destroyed) return;
      store.send({ type: "search-success", requestId, results });
    };
    const fail = (cause: unknown): void => {
      if (destroyed) return;
      // An abort rejects here too, but its requestId is already superseded, so
      // the reducer drops it. No special-casing of AbortError needed.
      store.send({ type: "search-error", requestId, error: toError(cause) });
    };

    // A provider that throws synchronously must not take the keystroke handler
    // down with it; it becomes an ordinary error state like any rejection.
    try {
      void Promise.resolve(provider.search(query, controller.signal)).then(settle, fail);
    } catch (cause) {
      fail(cause);
    }
  };

  return {
    store,

    search(query) {
      if (destroyed) return;
      clearTimer();
      if (debounceMs <= 0) {
        run(query);
        return;
      }
      // Before the timer, so a consumer can show a busy affordance on the
      // keystroke instead of waiting out the quiet period first.
      store.send({ type: "query-changed", query });
      timer = setTimeout(() => {
        timer = null;
        run(query);
      }, debounceMs);
    },

    searchNow(query) {
      if (destroyed) return;
      run(query);
    },

    cancel() {
      if (destroyed) return;
      clearTimer();
      abortInflight();
      store.send({ type: "cancel", requestId: ++nextRequestId });
    },

    reset() {
      if (destroyed) return;
      clearTimer();
      abortInflight();
      store.send({ type: "reset", requestId: ++nextRequestId });
    },

    destroy() {
      if (destroyed) return;
      destroyed = true;
      clearTimer();
      abortInflight();
    },
  };
}
