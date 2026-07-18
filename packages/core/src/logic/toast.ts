/**
 * Framework-agnostic toast queue. The pure reducer describes state transitions;
 * `createToastStore` wraps it with id generation and auto-dismiss timers (a
 * stateful controller, not a pure reducer - so both the React `Toaster` and a
 * future Lit `<finra-toaster>` inherit auto-dismiss without re-implementing it).
 */
import { createStore, type Store } from "./store";

export type ToastSentiment = "info" | "success" | "warning" | "danger";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastData {
  id: string;
  title?: string;
  description?: string;
  sentiment: ToastSentiment;
  /** Auto-dismiss delay in ms; 0 keeps it until dismissed. */
  duration: number;
  action?: ToastAction;
}

export interface ToastInput {
  title?: string;
  description?: string;
  sentiment?: ToastSentiment;
  duration?: number;
  action?: ToastAction;
}

export interface ToastState {
  toasts: ToastData[];
}

export type ToastStoreAction =
  | { type: "add"; toast: ToastData }
  | { type: "dismiss"; id: string }
  | { type: "clear" }
  | { type: "update"; id: string; patch: Partial<Omit<ToastData, "id">> };

export const initialToastState: ToastState = { toasts: [] };

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

/** Imperative toast API. Calling it enqueues a toast and returns its id. */
export interface ToastApi {
  (input: ToastInput | string): string;
  success(input: ToastInput | string): string;
  error(input: ToastInput | string): string;
  warning(input: ToastInput | string): string;
  info(input: ToastInput | string): string;
  dismiss(id: string): void;
  clear(): void;
}

export interface ToastController {
  store: Store<ToastState, ToastStoreAction>;
  toast: ToastApi;
  /** Pause a toast's auto-dismiss timer (e.g. on hover). */
  pause(id: string): void;
  /** Resume a toast's auto-dismiss timer with its remaining duration. */
  resume(id: string, duration: number): void;
}

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
