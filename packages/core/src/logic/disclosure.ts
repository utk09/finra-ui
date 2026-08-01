/**
 * Disclosure state machine - open/close/toggle. Zero framework imports.
 * Backs `useDisclosure` (React) and, later, overlay Web Components (Lit).
 */
import { createStore, type Store } from "./store";

/** The entire state of a disclosure: one boolean. */
export interface DisclosureState {
  /** Whether the layer is currently open. */
  open: boolean;
}

/** `reason` lets consumers distinguish why a layer closed (Escape vs outside click). */
export type DisclosureReason = "trigger" | "escape" | "outside" | "programmatic";

/**
 * Every transition a disclosure understands.
 *
 * @remarks
 * `reason` is carried through but never acted on here - it exists so an adapter
 * can tell "the user pressed Escape" from "the app closed this itself", which
 * matters for focus restoration and analytics.
 */
export type DisclosureAction =
  /** Open. A no-op that preserves state identity if already open. */
  | { type: "open"; reason?: DisclosureReason }
  /** Close. A no-op that preserves state identity if already closed. */
  | { type: "close"; reason?: DisclosureReason }
  /** Flip the current state. Always produces a new object. */
  | { type: "toggle"; reason?: DisclosureReason }
  /** Set an explicit state. A no-op that preserves identity if it already matches. */
  | { type: "set"; open: boolean; reason?: DisclosureReason };

/**
 * Pure open/close transitions.
 *
 * @remarks
 * Returns the **same state object** when an action changes nothing, so a
 * subscriber comparing by reference does not re-render for nothing. `reason` is
 * carried on the action but never acted on here.
 *
 * @param state - Current state.
 * @param action - Transition to apply.
 * @returns The next state, or `state` itself if unchanged.
 */
export function disclosureReducer(
  state: DisclosureState,
  action: DisclosureAction,
): DisclosureState {
  switch (action.type) {
    case "open":
      return state.open ? state : { open: true };
    case "close":
      return state.open ? { open: false } : state;
    case "toggle":
      return { open: !state.open };
    case "set":
      return state.open === action.open ? state : { open: action.open };
    default:
      return state;
  }
}

/** A subscribable store wrapping {@link disclosureReducer}. */
export type DisclosureStore = Store<DisclosureState, DisclosureAction>;

/**
 * Build a subscribable disclosure store.
 *
 * @param initialOpen - Starting state.
 * @defaultValue `false`
 * @returns A store safe to subscribe to immediately.
 */
export function createDisclosureStore(initialOpen = false): DisclosureStore {
  return createStore<DisclosureState, DisclosureAction>({ open: initialOpen }, disclosureReducer);
}
