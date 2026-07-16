/**
 * Disclosure state machine - open/close/toggle. Zero framework imports.
 * Backs `useDisclosure` (React) and, later, overlay Web Components (Lit).
 */
import { createStore, type Store } from "./store";

export interface DisclosureState {
  open: boolean;
}

/** `reason` lets consumers distinguish why a layer closed (Escape vs outside click). */
export type DisclosureReason = "trigger" | "escape" | "outside" | "programmatic";

export type DisclosureAction =
  | { type: "open"; reason?: DisclosureReason }
  | { type: "close"; reason?: DisclosureReason }
  | { type: "toggle"; reason?: DisclosureReason }
  | { type: "set"; open: boolean; reason?: DisclosureReason };

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

export type DisclosureStore = Store<DisclosureState, DisclosureAction>;

export function createDisclosureStore(initialOpen = false): DisclosureStore {
  return createStore<DisclosureState, DisclosureAction>({ open: initialOpen }, disclosureReducer);
}
