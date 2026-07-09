/**
 * Framework-agnostic state store — zero framework imports.
 *
 * A "machine" is a pure `(state, action) => state` reducer plus an initial
 * state. `createStore` turns that into an observable store with
 * `getState` / `send` / `subscribe`. React consumes it through `useStore`
 * (a `useSyncExternalStore` adapter); a future Lit element consumes the same
 * store from a ReactiveController that calls `subscribe` → `host.requestUpdate()`.
 * The behaviour (reducer) is written once and never re-implemented per framework.
 */
export interface Store<S, A> {
  /** Current snapshot. Referentially stable until an action changes it. */
  getState(): S;
  /** Dispatch an action through the reducer. No-op if state is unchanged. */
  send(action: A): void;
  /** Subscribe to state changes. Returns an unsubscribe function. */
  subscribe(listener: (state: S) => void): () => void;
}

/**
 * Create an observable store from an initial state and a pure reducer.
 * Listeners fire only when the reducer returns a new (referentially different)
 * state, so `Object.is`-equal transitions are free.
 */
export function createStore<S, A>(
  initialState: S,
  reducer: (state: S, action: A) => S,
): Store<S, A> {
  let state = initialState;
  const listeners = new Set<(state: S) => void>();

  return {
    getState() {
      return state;
    },
    send(action) {
      const next = reducer(state, action);
      if (Object.is(next, state)) return;
      state = next;
      for (const listener of listeners) listener(state);
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
