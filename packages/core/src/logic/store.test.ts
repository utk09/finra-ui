import { describe, expect, it, vi } from "vitest";

import { createStore } from "./store";

interface CounterState {
  count: number;
}
type CounterAction = { type: "inc" } | { type: "add"; by: number } | { type: "noop" };

function reducer(state: CounterState, action: CounterAction): CounterState {
  switch (action.type) {
    case "inc":
      return { count: state.count + 1 };
    case "add":
      return { count: state.count + action.by };
    case "noop":
      return state; // same reference — should not notify
    default:
      return state;
  }
}

describe("createStore", () => {
  it("exposes the initial state", () => {
    const store = createStore<CounterState, CounterAction>({ count: 0 }, reducer);
    expect(store.getState()).toEqual({ count: 0 });
  });

  it("applies actions through the reducer", () => {
    const store = createStore<CounterState, CounterAction>({ count: 0 }, reducer);
    store.send({ type: "inc" });
    store.send({ type: "add", by: 5 });
    expect(store.getState()).toEqual({ count: 6 });
  });

  it("notifies subscribers on change with the new state", () => {
    const store = createStore<CounterState, CounterAction>({ count: 0 }, reducer);
    const listener = vi.fn();
    store.subscribe(listener);
    store.send({ type: "inc" });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({ count: 1 });
  });

  it("does not notify when the reducer returns the same state reference", () => {
    const store = createStore<CounterState, CounterAction>({ count: 0 }, reducer);
    const listener = vi.fn();
    store.subscribe(listener);
    store.send({ type: "noop" });
    expect(listener).not.toHaveBeenCalled();
    expect(store.getState()).toEqual({ count: 0 });
  });

  it("stops notifying after unsubscribe", () => {
    const store = createStore<CounterState, CounterAction>({ count: 0 }, reducer);
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    unsubscribe();
    store.send({ type: "inc" });
    expect(listener).not.toHaveBeenCalled();
  });

  it("supports multiple independent subscribers", () => {
    const store = createStore<CounterState, CounterAction>({ count: 0 }, reducer);
    const a = vi.fn();
    const b = vi.fn();
    store.subscribe(a);
    store.subscribe(b);
    store.send({ type: "inc" });
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
  });
});
