/**
 * Framework-agnostic toast queue. The pure reducer describes state transitions;
 * `createToastStore` wraps it with id generation and auto-dismiss timers (a
 * stateful controller, not a pure reducer - so both the React `Toaster` and a
 * future Lit `<finra-toaster>` inherit auto-dismiss without re-implementing it).
 */
import { createStore, type Store } from "./store";

/**
 * What a toast *means*, not how loud it is.
 *
 * Sentiment is orthogonal to emphasis throughout this library: it selects the
 * colour and icon that carry meaning, and nothing else. Note that the
 * convenience method for `"danger"` is {@link ToastApi.error}, not `danger()`.
 */
export type ToastSentiment = "info" | "success" | "warning" | "danger";

/**
 * A single button rendered inside a toast - "Undo", "Retry", "View".
 *
 * @remarks
 * At most one action per toast. A toast is a transient, non-focus-stealing
 * announcement; anything needing more than one choice belongs in a Dialog,
 * where focus management and a proper accessible name exist.
 */
export interface ToastAction {
  /** Visible button text. Also its accessible name, so make it a verb. */
  label: string;
  /**
   * Invoked on click. Dismissing the toast afterwards is the caller's job -
   * `toast.dismiss(id)` - because "Undo" often wants to stay put and swap its
   * own label instead.
   */
  onClick: () => void;
}

/**
 * A toast as it exists in the store: every optional field on {@link ToastInput}
 * resolved to a concrete value.
 *
 * @remarks
 * You receive this when rendering the queue; you never construct it. Pass a
 * {@link ToastInput} to {@link ToastApi} instead and let the controller mint
 * the id and apply defaults.
 */
export interface ToastData {
  /** Unique, controller-generated. The handle for `dismiss`, `pause`, `resume`. */
  id: string;
  /** Bold first line. Optional - a description-only toast is a valid, quieter form. */
  title?: string;
  /** Body text. A bare string passed to {@link ToastApi} becomes this field. */
  description?: string;
  /** Resolved sentiment; defaults to `"info"` when the input omitted it. */
  sentiment: ToastSentiment;
  /** Auto-dismiss delay in ms; 0 keeps it until dismissed. */
  duration: number;
  /** Optional single action button. */
  action?: ToastAction;
}

/**
 * What a caller supplies to raise a toast. Everything is optional; the
 * controller fills the gaps.
 *
 * @example
 * ```ts
 * toast("Order sent");                                  // shorthand: description only
 * toast.success({ title: "Filled", description: "2M EURUSD" });
 * toast({ description: "Connection lost", duration: 0 }); // sticky until dismissed
 * ```
 */
export interface ToastInput {
  /** Bold first line. */
  title?: string;
  /** Body text. */
  description?: string;
  /**
   * Meaning of the toast.
   *
   * @defaultValue `"info"` - unless raised through a sentiment-specific helper
   * such as {@link ToastApi.success}, which overrides this field.
   */
  sentiment?: ToastSentiment;
  /**
   * Auto-dismiss delay in ms. Pass `0` for a toast that stays until dismissed -
   * appropriate for anything carrying an {@link ToastAction} the user must be
   * able to reach.
   *
   * @defaultValue `5000`
   */
  duration?: number;
  /** Optional single action button. */
  action?: ToastAction;
}

/** The whole queue. Render order is insertion order - newest last. */
export interface ToastState {
  /** Live toasts, oldest first. Dismissed toasts are removed, not flagged. */
  toasts: ToastData[];
}

/**
 * Every transition the queue understands.
 *
 * @remarks
 * `add` expects a fully-formed {@link ToastData}: the reducer is pure, so id
 * generation and default-filling happen in {@link createToastStore} before the
 * action is sent.
 */
export type ToastStoreAction =
  /** Append a fully-resolved toast to the end of the queue. */
  | { type: "add"; toast: ToastData }
  /** Remove one toast by id. A miss is a no-op that preserves state identity. */
  | { type: "dismiss"; id: string }
  /** Empty the queue. Does not clear auto-dismiss timers - {@link ToastApi.clear} does. */
  | { type: "clear" }
  /** Patch a live toast in place, e.g. turning "Sending…" into "Sent". `id` is not patchable. */
  | { type: "update"; id: string; patch: Partial<Omit<ToastData, "id">> };

/** An empty queue. The starting state for {@link toastReducer}. */
export const initialToastState: ToastState = { toasts: [] };

/**
 * Pure queue transitions. No timers, no ids, no side effects - see
 * {@link createToastStore} for the stateful wrapper that adds those.
 *
 * @remarks
 * Returns the **same state object** when an action changes nothing (dismissing
 * an unknown id, clearing an empty queue, patching a missing toast), so a
 * subscriber comparing by reference does not re-render for nothing.
 *
 * @param state - Current queue.
 * @param action - Transition to apply.
 * @returns The next queue, or `state` itself if nothing changed.
 */
export function toastReducer(state: ToastState, action: ToastStoreAction): ToastState {
  switch (action.type) {
    case "add":
      return { toasts: [...state.toasts, action.toast] };
    case "dismiss": {
      const toasts = state.toasts.filter((t) => t.id !== action.id);
      return toasts.length === state.toasts.length ? state : { toasts };
    }
    case "clear":
      return state.toasts.length === 0 ? state : { toasts: [] };
    case "update": {
      let changed = false;
      const toasts = state.toasts.map((t) => {
        if (t.id !== action.id) return t;
        changed = true;
        return { ...t, ...action.patch };
      });
      return changed ? { toasts } : state;
    }
    default:
      return state;
  }
}

const DEFAULT_DURATION = 5000;

function normalizeInput(input: ToastInput | string): ToastInput {
  return typeof input === "string" ? { description: input } : input;
}

/**
 * Imperative toast API. Calling it enqueues a toast and returns its id.
 *
 * @remarks
 * Callable *and* namespaced: `toast(...)` raises an info toast, and the named
 * methods pin the sentiment, overriding {@link ToastInput.sentiment} if it was
 * also set. Every raise returns the new toast's id - keep it if you intend to
 * `dismiss` the toast yourself.
 *
 * @example
 * ```ts
 * const id = toast.warning({ title: "Stale price", duration: 0 });
 * // …once a fresh tick arrives:
 * toast.dismiss(id);
 * ```
 */
export interface ToastApi {
  /** Raise a toast with the default `"info"` sentiment. @returns The new toast's id. */
  (input: ToastInput | string): string;
  /** Raise a `"success"` toast. @returns The new toast's id. */
  success(input: ToastInput | string): string;
  /**
   * Raise a `"danger"` toast.
   *
   * @remarks Named `error` for familiarity; the sentiment it sets is `"danger"`.
   * @returns The new toast's id.
   */
  error(input: ToastInput | string): string;
  /** Raise a `"warning"` toast. @returns The new toast's id. */
  warning(input: ToastInput | string): string;
  /** Raise an `"info"` toast, explicitly. @returns The new toast's id. */
  info(input: ToastInput | string): string;
  /** Dismiss one toast and cancel its auto-dismiss timer. Unknown ids are ignored. */
  dismiss(id: string): void;
  /** Dismiss everything and cancel every pending timer. */
  clear(): void;
}

/**
 * A toast queue plus the stateful machinery a pure reducer cannot own: id
 * generation and auto-dismiss timers.
 *
 * @remarks
 * The reason this exists as a separate layer is portability - the React
 * `Toaster` and a future Lit `<finra-toaster>` both consume this controller, so
 * auto-dismiss is implemented exactly once. Use {@link toastController} unless
 * you need an isolated queue (tests, or a second independent region).
 */
export interface ToastController {
  /** Subscribe here to render the queue. */
  store: Store<ToastState, ToastStoreAction>;
  /** The imperative API bound to this controller's store. */
  toast: ToastApi;
  /** Pause a toast's auto-dismiss timer (e.g. on hover). */
  pause(id: string): void;
  /** Resume a toast's auto-dismiss timer with its remaining duration. */
  resume(id: string, duration: number): void;
}

/**
 * Build an independent toast queue with its own timers and id counter.
 *
 * @remarks
 * Most applications want the shared {@link toastController} instead - one
 * visible region means one queue. Reach for this when you need isolation, most
 * often in tests, so a leftover toast cannot bleed between cases.
 *
 * Ids are unique per controller, not globally: two controllers both start at
 * `toast-1`.
 *
 * @returns A controller whose `store` is safe to subscribe to immediately.
 */
export function createToastStore(): ToastController {
  const store = createStore(initialToastState, toastReducer);
  const timers = new Map<string, ReturnType<typeof setTimeout>>();
  let counter = 0;

  function clearTimer(id: string): void {
    const timer = timers.get(id);
    if (timer !== undefined) {
      clearTimeout(timer);
      timers.delete(id);
    }
  }

  function schedule(id: string, duration: number): void {
    if (duration <= 0) return;
    timers.set(
      id,
      setTimeout(() => {
        dismiss(id);
      }, duration),
    );
  }

  function dismiss(id: string): void {
    clearTimer(id);
    store.send({ type: "dismiss", id });
  }

  function add(input: ToastInput | string, sentiment?: ToastSentiment): string {
    const norm = normalizeInput(input);
    const data: ToastData = {
      id: `toast-${++counter}`,
      title: norm.title,
      description: norm.description,
      sentiment: sentiment ?? norm.sentiment ?? "info",
      duration: norm.duration ?? DEFAULT_DURATION,
      action: norm.action,
    };
    store.send({ type: "add", toast: data });
    schedule(data.id, data.duration);
    return data.id;
  }

  const toast = ((input: ToastInput | string) => add(input)) as ToastApi;
  toast.success = (input) => add(input, "success");
  toast.error = (input) => add(input, "danger");
  toast.warning = (input) => add(input, "warning");
  toast.info = (input) => add(input, "info");
  toast.dismiss = dismiss;
  toast.clear = () => {
    for (const id of [...timers.keys()]) clearTimer(id);
    store.send({ type: "clear" });
  };

  return {
    store,
    toast,
    pause: clearTimer,
    resume: schedule,
  };
}

/** Shared singleton used by the exported `toast()` and `<Toaster>`. */
export const toastController = createToastStore();

/** Imperative toast API bound to the shared store. */
export const toast: ToastApi = toastController.toast;
