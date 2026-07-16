import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { createStore } from "../logic/store";
import { useStore } from "./useStore";

interface CountState {
  count: number;
}
interface CountAction {
  type: "inc";
}

function makeStore() {
  return createStore<CountState, CountAction>({ count: 0 }, (state, action) =>
    action.type === "inc" ? { count: state.count + 1 } : state,
  );
}

const selectCount = (state: CountState) => state.count;

describe("useStore", () => {
  it("returns the full state without a selector and re-renders on change", () => {
    const store = makeStore();
    const { result } = renderHook(() => useStore(store));

    expect(result.current).toEqual({ count: 0 });
    act(() => store.send({ type: "inc" }));
    expect(result.current).toEqual({ count: 1 });
  });

  it("applies a selector and re-renders when the selected slice changes", () => {
    const store = makeStore();
    const { result } = renderHook(() => useStore(store, selectCount));

    expect(result.current).toBe(0);
    act(() => store.send({ type: "inc" }));
    expect(result.current).toBe(1);
  });
});
