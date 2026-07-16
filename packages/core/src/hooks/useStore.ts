import { useCallback, useSyncExternalStore } from "react";

import type { Store } from "../logic/store";

/**
 * React adapter for a framework-agnostic {@link Store}.
 *
 * Subscribes via `useSyncExternalStore`, so it is concurrent-safe and
 * tearing-free. Pass a `selector` to subscribe to a slice - the component
 * re-renders only when the selected value changes by `Object.is`.
 */
export function useStore<S, A, Selected = S>(
  store: Store<S, A>,
  selector: (state: S) => Selected = (state) => state as unknown as Selected,
): Selected {
  const getSnapshot = useCallback(() => selector(store.getState()), [store, selector]);
  return useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot);
}
