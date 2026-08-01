import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { CurrencyPairLike } from "./currencyPairPicker";
import {
  createInstrumentSearch,
  createInstrumentSearchState,
  type InstrumentProvider,
  instrumentSearchReducer,
  type InstrumentSearchState,
  isSearchEmpty,
  isSearchStale,
} from "./instrumentSearch";

const pair = (id: string, base: string, quote: string): CurrencyPairLike => ({
  id,
  baseCurrency: base,
  quoteCurrency: quote,
});

const GBPUSD = pair("GBPUSD", "GBP", "USD");
const EURUSD = pair("EURUSD", "EUR", "USD");

/** A promise whose settlement the test controls, so response order is explicit. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/** Let queued microtasks (promise callbacks) run. */
const flush = () => Promise.resolve();

describe("instrumentSearchReducer", () => {
  const initial = createInstrumentSearchState<CurrencyPairLike>();

  it("returns the same state object for an action it does not know", () => {
    const loaded: InstrumentSearchState<CurrencyPairLike> = {
      ...initial,
      status: "success",
      query: "gbp",
      resultsQuery: "gbp",
      results: [GBPUSD],
    };

    // The reducer is exported and the action union will grow. An unhandled
    // action must leave the results alone rather than dropping them, and must
    // return the same object so a subscriber does not re-render for nothing.
    const unknown = { type: "teleport" } as unknown as Parameters<
      typeof instrumentSearchReducer<CurrencyPairLike>
    >[1];
    expect(instrumentSearchReducer(loaded, unknown)).toBe(loaded);
  });

  it("keeps the previous results while loading, so the list does not flash empty", () => {
    const loaded: InstrumentSearchState<CurrencyPairLike> = {
      ...initial,
      status: "success",
      query: "gbp",
      resultsQuery: "gbp",
      results: [GBPUSD],
    };

    const next = instrumentSearchReducer(loaded, {
      type: "search-start",
      query: "gbpu",
      requestId: 1,
    });

    expect(next.status).toBe("loading");
    expect(next.query).toBe("gbpu");
    expect(next.results).toEqual([GBPUSD]);
    expect(next.resultsQuery).toBe("gbp");
    // The two disagreeing is precisely what "stale" means.
    expect(isSearchStale(next)).toBe(true);
  });

  it("goes stale on the keystroke, before any request exists", () => {
    const loaded: InstrumentSearchState<CurrencyPairLike> = {
      ...initial,
      status: "success",
      query: "gbp",
      resultsQuery: "gbp",
      results: [GBPUSD],
    };

    const next = instrumentSearchReducer(loaded, { type: "query-changed", query: "gbpu" });

    // Nothing has been asked for, so the status must not claim to be loading.
    expect(next.status).toBe("success");
    expect(next.results).toEqual([GBPUSD]);
    expect(isSearchStale(next)).toBe(true);
  });

  it("is a no-op when the query has not actually changed", () => {
    const loaded: InstrumentSearchState<CurrencyPairLike> = {
      ...initial,
      query: "gbp",
      resultsQuery: "gbp",
    };

    expect(instrumentSearchReducer(loaded, { type: "query-changed", query: "gbp" })).toBe(loaded);
  });

  it("applies a response whose sequence number is current", () => {
    const loading = instrumentSearchReducer(initial, {
      type: "search-start",
      query: "gbp",
      requestId: 1,
    });

    const next = instrumentSearchReducer(loading, {
      type: "search-success",
      requestId: 1,
      results: [GBPUSD],
    });

    expect(next.status).toBe("success");
    expect(next.results).toEqual([GBPUSD]);
    expect(next.resultsQuery).toBe("gbp");
    expect(isSearchStale(next)).toBe(false);
  });

  it("discards a response whose sequence number has been superseded", () => {
    const loading = instrumentSearchReducer(initial, {
      type: "search-start",
      query: "gbpusd",
      requestId: 2,
    });

    // The slow answer to request 1 arrives after request 2 started.
    const next = instrumentSearchReducer(loading, {
      type: "search-success",
      requestId: 1,
      results: [EURUSD],
    });

    // Same object back: createStore treats an unchanged state as a no-op, so
    // subscribers are never even notified.
    expect(next).toBe(loading);
  });

  it("discards a stale rejection too", () => {
    const loading = instrumentSearchReducer(initial, {
      type: "search-start",
      query: "gbpusd",
      requestId: 2,
    });

    const next = instrumentSearchReducer(loading, {
      type: "search-error",
      requestId: 1,
      error: new Error("network"),
    });

    expect(next).toBe(loading);
  });

  it("clears results on error rather than leaving rows that answer nothing", () => {
    const loaded: InstrumentSearchState<CurrencyPairLike> = {
      ...initial,
      status: "loading",
      query: "gbpu",
      resultsQuery: "gbp",
      results: [GBPUSD],
      requestId: 3,
    };

    const next = instrumentSearchReducer(loaded, {
      type: "search-error",
      requestId: 3,
      error: new Error("network"),
    });

    expect(next.status).toBe("error");
    expect(next.results).toEqual([]);
    expect(next.error?.message).toBe("network");
    expect(next.resultsQuery).toBe("gbpu");
    expect(isSearchStale(next)).toBe(false);
  });

  it("clears a stale error once a later search starts", () => {
    const errored: InstrumentSearchState<CurrencyPairLike> = {
      ...initial,
      status: "error",
      error: new Error("network"),
      requestId: 1,
    };

    const next = instrumentSearchReducer(errored, {
      type: "search-start",
      query: "gbp",
      requestId: 2,
    });

    expect(next.error).toBeNull();
  });

  it("restores the invariant when a load is cancelled", () => {
    const loading: InstrumentSearchState<CurrencyPairLike> = {
      ...initial,
      status: "loading",
      query: "gbpu",
      resultsQuery: "gbp",
      results: [GBPUSD],
      requestId: 4,
    };

    const next = instrumentSearchReducer(loading, { type: "cancel", requestId: 5 });

    expect(next.status).toBe("success");
    expect(next.results).toEqual([GBPUSD]);
    // Nothing further was asked for, so query describes what is on screen again.
    expect(next.query).toBe("gbp");
    expect(isSearchStale(next)).toBe(false);
    expect(next.requestId).toBe(5);
  });

  it("cancels an empty load back to idle", () => {
    const loading = instrumentSearchReducer(initial, {
      type: "search-start",
      query: "gbp",
      requestId: 1,
    });

    expect(instrumentSearchReducer(loading, { type: "cancel", requestId: 2 }).status).toBe("idle");
  });

  it("is a no-op to cancel when nothing is loading or pending", () => {
    const settled: InstrumentSearchState<CurrencyPairLike> = {
      ...initial,
      status: "success",
      query: "gbp",
      resultsQuery: "gbp",
      results: [GBPUSD],
      requestId: 1,
    };

    expect(instrumentSearchReducer(settled, { type: "cancel", requestId: 2 })).toBe(settled);
  });

  it("un-stales a cancel that lands during the debounce window", () => {
    // Typed but never sent: without this, the state would look stale forever.
    const pending: InstrumentSearchState<CurrencyPairLike> = {
      ...initial,
      status: "success",
      query: "gbpu",
      resultsQuery: "gbp",
      results: [GBPUSD],
      requestId: 1,
    };

    const next = instrumentSearchReducer(pending, { type: "cancel", requestId: 2 });

    expect(next.status).toBe("success");
    expect(next.query).toBe("gbp");
    expect(isSearchStale(next)).toBe(false);
  });

  it("resets to the initial state while advancing the sequence number", () => {
    const loaded: InstrumentSearchState<CurrencyPairLike> = {
      ...initial,
      status: "success",
      query: "gbp",
      resultsQuery: "gbp",
      results: [GBPUSD],
      requestId: 7,
    };

    const next = instrumentSearchReducer(loaded, { type: "reset", requestId: 8 });

    expect(next).toEqual({ ...createInstrumentSearchState(), requestId: 8 });
    // Advancing is what makes a reset invalidate an in-flight request.
    expect(next.requestId).toBe(8);
  });
});

describe("isSearchEmpty", () => {
  const initial = createInstrumentSearchState<CurrencyPairLike>();

  it("is true only for a completed search that found nothing", () => {
    expect(isSearchEmpty({ ...initial, status: "success", results: [] })).toBe(true);
    expect(isSearchEmpty({ ...initial, status: "success", results: [GBPUSD] })).toBe(false);
    // Not yet answered, so "no results" is not a finding.
    expect(isSearchEmpty({ ...initial, status: "loading", results: [] })).toBe(false);
    expect(isSearchEmpty(initial)).toBe(false);
    expect(isSearchEmpty({ ...initial, status: "error", results: [] })).toBe(false);
  });
});

describe("createInstrumentSearch", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  const stubProvider = (
    search: InstrumentProvider<CurrencyPairLike>["search"],
  ): InstrumentProvider<CurrencyPairLike> => ({
    search,
    getById: () => Promise.resolve(null),
  });

  it("waits for the quiet period and sends only the last query", async () => {
    const search = vi.fn(() => Promise.resolve([GBPUSD]));
    const controller = createInstrumentSearch({
      provider: stubProvider(search),
      debounceMs: 250,
    });

    controller.search("g");
    controller.search("gb");
    controller.search("gbp");
    expect(search).not.toHaveBeenCalled();
    expect(controller.store.getState().status).toBe("idle");
    // Stale from the keystroke, so a busy affordance need not wait out the
    // quiet period first.
    expect(isSearchStale(controller.store.getState())).toBe(true);
    expect(controller.store.getState().query).toBe("gbp");

    vi.advanceTimersByTime(250);
    expect(search).toHaveBeenCalledTimes(1);
    expect(search).toHaveBeenCalledWith("gbp", expect.any(AbortSignal));

    await flush();
    expect(controller.store.getState()).toMatchObject({
      status: "success",
      query: "gbp",
      resultsQuery: "gbp",
      results: [GBPUSD],
    });
  });

  it("dispatches synchronously when debouncing is switched off", () => {
    const search = vi.fn(() => Promise.resolve([GBPUSD]));
    const controller = createInstrumentSearch({ provider: stubProvider(search), debounceMs: 0 });

    controller.search("gbp");

    // No timer to advance - zero means no debounce, not a zero-length timeout.
    expect(search).toHaveBeenCalledTimes(1);
    expect(controller.store.getState().status).toBe("loading");
  });

  it("searchNow skips a pending debounce", () => {
    const search = vi.fn(() => Promise.resolve([GBPUSD]));
    const controller = createInstrumentSearch({ provider: stubProvider(search), debounceMs: 250 });

    controller.search("gb");
    controller.searchNow("gbpusd");

    expect(search).toHaveBeenCalledTimes(1);
    expect(search).toHaveBeenCalledWith("gbpusd", expect.any(AbortSignal));

    // The superseded timer must not fire a second request later.
    vi.advanceTimersByTime(1000);
    expect(search).toHaveBeenCalledTimes(1);
  });

  it("keeps a slow answer to an old query from overwriting a newer one", async () => {
    const slow = deferred<readonly CurrencyPairLike[]>();
    const fast = deferred<readonly CurrencyPairLike[]>();
    const search = vi
      .fn<InstrumentProvider<CurrencyPairLike>["search"]>()
      .mockReturnValueOnce(slow.promise)
      .mockReturnValueOnce(fast.promise);

    const controller = createInstrumentSearch({ provider: stubProvider(search), debounceMs: 0 });

    controller.search("gb"); // request 1
    controller.search("gbpusd"); // request 2 supersedes it

    fast.resolve([GBPUSD]);
    await flush();
    expect(controller.store.getState().results).toEqual([GBPUSD]);

    // The stale answer lands last and must change nothing.
    slow.resolve([EURUSD]);
    await flush();
    expect(controller.store.getState()).toMatchObject({
      status: "success",
      query: "gbpusd",
      resultsQuery: "gbpusd",
      results: [GBPUSD],
    });
  });

  it("aborts the superseded request", () => {
    const signals: AbortSignal[] = [];
    const search = vi.fn((_query: string, signal?: AbortSignal) => {
      if (signal) signals.push(signal);
      return new Promise<readonly CurrencyPairLike[]>(() => {
        // never settles
      });
    });

    const controller = createInstrumentSearch({ provider: stubProvider(search), debounceMs: 0 });

    controller.search("gb");
    expect(signals[0].aborted).toBe(false);

    controller.search("gbpusd");
    expect(signals[0].aborted).toBe(true);
    expect(signals[1].aborted).toBe(false);
  });

  it("surfaces a rejection as the error status", async () => {
    const controller = createInstrumentSearch({
      provider: stubProvider(() => Promise.reject(new Error("offline"))),
      debounceMs: 0,
    });

    controller.search("gbp");
    await flush();

    expect(controller.store.getState()).toMatchObject({ status: "error", results: [] });
    expect(controller.store.getState().error?.message).toBe("offline");
  });

  it("wraps a non-Error rejection", async () => {
    const controller = createInstrumentSearch({
      provider: stubProvider(() => Promise.reject("boom")),
      debounceMs: 0,
    });

    controller.search("gbp");
    await flush();

    expect(controller.store.getState().error).toBeInstanceOf(Error);
    expect(controller.store.getState().error?.message).toBe("boom");
  });

  it("does not let a provider that throws synchronously escape into the caller", () => {
    const controller = createInstrumentSearch({
      provider: stubProvider(() => {
        throw new Error("bad provider");
      }),
      debounceMs: 0,
    });

    expect(() => {
      controller.search("gbp");
    }).not.toThrow();
    expect(controller.store.getState()).toMatchObject({ status: "error" });
    expect(controller.store.getState().error?.message).toBe("bad provider");
  });

  it("never calls the provider below minQueryLength, and clears what is shown", async () => {
    const search = vi.fn(() => Promise.resolve([GBPUSD]));
    const controller = createInstrumentSearch({
      provider: stubProvider(search),
      debounceMs: 0,
      minQueryLength: 2,
    });

    controller.search("g");
    expect(search).not.toHaveBeenCalled();

    controller.search("gb");
    await flush();
    expect(search).toHaveBeenCalledTimes(1);
    expect(controller.store.getState().results).toEqual([GBPUSD]);

    // Deleting back below the threshold empties the list rather than leaving it.
    controller.search(" g ");
    expect(search).toHaveBeenCalledTimes(1);
    expect(controller.store.getState()).toMatchObject({
      status: "idle",
      query: "",
      resultsQuery: "",
      results: [],
    });
  });

  it("cancel drops the in-flight request but keeps the results on screen", async () => {
    const first = deferred<readonly CurrencyPairLike[]>();
    const second = deferred<readonly CurrencyPairLike[]>();
    const search = vi
      .fn<InstrumentProvider<CurrencyPairLike>["search"]>()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);

    const controller = createInstrumentSearch({ provider: stubProvider(search), debounceMs: 0 });

    controller.search("gbp");
    first.resolve([GBPUSD]);
    await flush();

    controller.search("gbpu");
    expect(controller.store.getState().status).toBe("loading");

    controller.cancel();
    expect(controller.store.getState()).toMatchObject({
      status: "success",
      query: "gbp",
      results: [GBPUSD],
    });

    // The cancelled request settling afterwards must be ignored.
    second.resolve([EURUSD]);
    await flush();
    expect(controller.store.getState().results).toEqual([GBPUSD]);
  });

  it("reset clears everything and invalidates the in-flight request", async () => {
    const pending = deferred<readonly CurrencyPairLike[]>();
    const controller = createInstrumentSearch({
      provider: stubProvider(() => pending.promise),
      debounceMs: 0,
    });

    controller.search("gbp");
    controller.reset();
    expect(controller.store.getState()).toMatchObject({ status: "idle", results: [] });

    pending.resolve([GBPUSD]);
    await flush();
    expect(controller.store.getState().results).toEqual([]);
  });

  it("cancel also clears a debounce that has not fired yet", () => {
    const search = vi.fn(() => Promise.resolve([GBPUSD]));
    const controller = createInstrumentSearch({ provider: stubProvider(search), debounceMs: 250 });

    controller.search("gbp");
    controller.cancel();
    vi.advanceTimersByTime(1000);

    expect(search).not.toHaveBeenCalled();
    // And the recorded query is rolled back, so nothing is left looking stale.
    expect(isSearchStale(controller.store.getState())).toBe(false);
  });

  it("destroy stops the timer and ignores a response that arrives afterwards", async () => {
    const pending = deferred<readonly CurrencyPairLike[]>();
    const search = vi.fn(() => pending.promise);
    const controller = createInstrumentSearch({ provider: stubProvider(search), debounceMs: 0 });

    controller.search("gbp");
    controller.destroy();

    pending.resolve([GBPUSD]);
    await flush();
    expect(controller.store.getState().status).toBe("loading");

    // Every method is inert afterwards.
    controller.search("eur");
    controller.searchNow("eur");
    controller.cancel();
    controller.reset();
    vi.advanceTimersByTime(1000);
    expect(search).toHaveBeenCalledTimes(1);
  });

  it("destroy ignores a rejection that arrives afterwards", async () => {
    // The mirror of the resolve case: a provider that fails late must not
    // push an error state into a controller nobody is listening to.
    const pending = deferred<readonly CurrencyPairLike[]>();
    const search = vi.fn(() => pending.promise);
    const controller = createInstrumentSearch({ provider: stubProvider(search), debounceMs: 0 });

    controller.search("gbp");
    controller.destroy();

    pending.reject(new Error("network down"));
    await flush();

    const state = controller.store.getState();
    expect(state.status).toBe("loading");
    expect(state.error).toBeNull();
  });

  it("destroy is idempotent", async () => {
    const pending = deferred<readonly CurrencyPairLike[]>();
    const controller = createInstrumentSearch({
      provider: stubProvider(() => pending.promise),
      debounceMs: 0,
    });

    controller.search("gbp");
    controller.destroy();
    expect(() => {
      controller.destroy();
      controller.destroy();
    }).not.toThrow();

    pending.resolve([GBPUSD]);
    await flush();
    expect(controller.store.getState().status).toBe("loading");
  });

  it("notifies subscribers on each real transition", async () => {
    const controller = createInstrumentSearch({
      provider: stubProvider(() => Promise.resolve([GBPUSD])),
      debounceMs: 0,
    });

    const seen: string[] = [];
    const unsubscribe = controller.store.subscribe((state) => seen.push(state.status));

    controller.search("gbp");
    await flush();
    expect(seen).toEqual(["loading", "success"]);

    unsubscribe();
    controller.search("eur");
    await flush();
    expect(seen).toEqual(["loading", "success"]);
  });

  it("treats an empty query as a real search, since providers answer it with a default list", async () => {
    const search = vi.fn(() => Promise.resolve([GBPUSD, EURUSD]));
    const controller = createInstrumentSearch({ provider: stubProvider(search), debounceMs: 0 });

    controller.search("");
    await flush();

    expect(search).toHaveBeenCalledWith("", expect.any(AbortSignal));
    expect(controller.store.getState().results).toHaveLength(2);
  });
});
