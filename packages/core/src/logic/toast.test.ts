import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createToastStore,
  initialToastState,
  type ToastData,
  toastReducer,
  type ToastStoreAction,
} from "./toast";

const make = (id: string): ToastData => ({ id, sentiment: "info", duration: 0 });

describe("toastReducer", () => {
  it("adds a toast", () => {
    expect(toastReducer(initialToastState, { type: "add", toast: make("a") }).toasts).toHaveLength(
      1,
    );
  });

  it("dismiss removes by id, and is a no-op (same ref) for a missing id", () => {
    const state = { toasts: [make("a")] };
    expect(toastReducer(state, { type: "dismiss", id: "a" }).toasts).toHaveLength(0);
    expect(toastReducer(state, { type: "dismiss", id: "x" })).toBe(state);
  });

  it("clear empties, and is a no-op when already empty", () => {
    expect(toastReducer({ toasts: [make("a")] }, { type: "clear" }).toasts).toHaveLength(0);
    expect(toastReducer(initialToastState, { type: "clear" })).toBe(initialToastState);
  });

  it("update patches a toast, and is a no-op for a missing id", () => {
    const state = { toasts: [make("a")] };
    expect(
      toastReducer(state, { type: "update", id: "a", patch: { title: "Hi" } }).toasts[0].title,
    ).toBe("Hi");
    expect(toastReducer(state, { type: "update", id: "x", patch: { title: "Hi" } })).toBe(state);
  });

  it("ignores unknown actions", () => {
    expect(toastReducer(initialToastState, { type: "nope" } as unknown as ToastStoreAction)).toBe(
      initialToastState,
    );
  });
});

describe("createToastStore", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("adds a toast and returns an id (string shorthand -> description)", () => {
    const c = createToastStore();
    const id = c.toast("Saved");
    expect(id).toMatch(/^toast-/);
    const [t] = c.store.getState().toasts;
    expect(t.description).toBe("Saved");
    expect(t.sentiment).toBe("info");
  });

  it("sentiment helpers set the sentiment", () => {
    const c = createToastStore();
    c.toast.success({ description: "ok" });
    c.toast.error({ description: "bad" });
    c.toast.warning("warn");
    c.toast.info("fyi");
    expect(c.store.getState().toasts.map((t) => t.sentiment)).toEqual([
      "success",
      "danger",
      "warning",
      "info",
    ]);
  });

  it("auto-dismisses after the duration", () => {
    const c = createToastStore();
    c.toast({ description: "bye", duration: 1000 });
    expect(c.store.getState().toasts).toHaveLength(1);
    vi.advanceTimersByTime(1000);
    expect(c.store.getState().toasts).toHaveLength(0);
  });

  it("stays when duration is 0, and dismisses a timer-less toast cleanly", () => {
    const c = createToastStore();
    const id = c.toast({ description: "stay", duration: 0 });
    vi.advanceTimersByTime(100_000);
    expect(c.store.getState().toasts).toHaveLength(1);
    c.toast.dismiss(id); // no timer to clear -> exercises the empty branch
    expect(c.store.getState().toasts).toHaveLength(0);
  });

  it("dismiss removes and cancels the timer", () => {
    const c = createToastStore();
    const id = c.toast({ description: "x", duration: 1000 });
    c.toast.dismiss(id);
    expect(c.store.getState().toasts).toHaveLength(0);
    vi.advanceTimersByTime(1000); // no double dismiss / throw
  });

  it("clear removes all toasts and their timers", () => {
    const c = createToastStore();
    c.toast({ description: "a", duration: 1000 });
    c.toast({ description: "b", duration: 1000 });
    c.toast.clear();
    expect(c.store.getState().toasts).toHaveLength(0);
  });

  it("pause stops and resume restarts auto-dismiss", () => {
    const c = createToastStore();
    const id = c.toast({ description: "p", duration: 1000 });
    c.pause(id);
    vi.advanceTimersByTime(1000);
    expect(c.store.getState().toasts).toHaveLength(1);
    c.resume(id, 1000);
    vi.advanceTimersByTime(1000);
    expect(c.store.getState().toasts).toHaveLength(0);
  });
});
