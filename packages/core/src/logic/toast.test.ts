import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createSoundEngine, type SoundEngine, soundEngine } from "./sound";
import {
  createToastStore,
  initialToastState,
  type ToastData,
  type ToastStoreAction,
  toastReducer,
} from "./toast";

const make = (id: string): ToastData => ({ id, sentiment: "info", duration: 0 });

/**
 * A real, fully-typed `SoundEngine` with `play` replaced. Built on
 * `createSoundEngine` rather than a hand-rolled object literal so the fake
 * needs no cast: every other member (`store`, `getState`, `setMuted`,
 * `setVolume`, `dispose`) is the genuine implementation, just unused by these
 * tests.
 */
function fakeSoundEngine(play: SoundEngine["play"] = vi.fn()): SoundEngine {
  return { ...createSoundEngine(), play };
}

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

describe("createToastStore, sound", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("a toast raised without `sound` never plays", () => {
    const play = vi.fn();
    const c = createToastStore({ soundEngine: fakeSoundEngine(play) });
    c.toast({ description: "x" });
    expect(play).not.toHaveBeenCalled();
  });

  it("a toast carrying `sound` plays exactly once, with the cue named", () => {
    const play = vi.fn();
    const c = createToastStore({ soundEngine: fakeSoundEngine(play) });
    c.toast({ description: "Filled", sound: "chime" });

    expect(play).toHaveBeenCalledTimes(1);
    expect(play).toHaveBeenCalledWith("chime");
  });

  it("the play count stays 1 through a pause/resume, another toast, and an update patch", () => {
    // The region-re-render clause is a React concern and is proven in
    // `unstyled/Toast/Toast.test.tsx` (StrictMode double-render); reading and
    // subscribing to the store here is not a stand-in for that, only a check
    // that neither touches the one call site `play` has.
    const play = vi.fn();
    const c = createToastStore({ soundEngine: fakeSoundEngine(play) });
    const id = c.toast({ description: "Filled", sound: "chime" });
    expect(play).toHaveBeenCalledTimes(1);

    c.store.getState();
    const unsubscribe = c.store.subscribe(() => undefined);
    unsubscribe();

    c.pause(id);
    c.resume(id, 1000);
    expect(play).toHaveBeenCalledTimes(1);

    // A second, sound-less toast does not touch the first toast's count.
    c.toast({ description: "unrelated" });
    expect(play).toHaveBeenCalledTimes(1);

    // An `update` patch, including one touching unrelated fields, does not
    // replay it either - `add` is the only call site for `play`.
    c.store.send({ type: "update", id, patch: { title: "Filled!" } });
    expect(play).toHaveBeenCalledTimes(1);
  });

  it("the toast renders even when the engine drops the cue (context suspended)", () => {
    // A real sound engine, not a stub: `add` calls `engine.play`
    // unconditionally and never inspects engine state, so a context that drops
    // every cue (the way the engine's `play` handles `"suspended"`) must still
    // leave the toast in the store untouched.
    const createOscillator = vi.fn();
    const suspendedEngine = createSoundEngine({
      createAudioContext: () => ({
        state: "suspended",
        currentTime: 0,
        destination: {} as AudioDestinationNode,
        createOscillator,
        createGain: vi.fn(),
        resume: () => Promise.resolve(),
      }),
    });
    suspendedEngine.setMuted(false);

    const c = createToastStore({ soundEngine: suspendedEngine });
    c.toast({ description: "x", sound: "chime" });

    expect(c.store.getState().toasts).toHaveLength(1);
    expect(createOscillator).not.toHaveBeenCalled();
  });

  it("a throwing engine does not stop the toast reaching the store or escape the caller", () => {
    const c = createToastStore({
      soundEngine: fakeSoundEngine(() => {
        throw new Error("audio context unavailable");
      }),
    });

    let id = "";
    expect(() => {
      id = c.toast({ description: "x", sound: "chime" });
    }).not.toThrow();

    expect(id).toMatch(/^toast-/);
    expect(c.store.getState().toasts).toHaveLength(1);
    expect(c.store.getState().toasts[0].description).toBe("x");
  });

  it("play is ordered after the toast already holds a place in the store", () => {
    let toastCountAtPlayTime = -1;
    const c = createToastStore({
      soundEngine: fakeSoundEngine(() => {
        toastCountAtPlayTime = c.store.getState().toasts.length;
      }),
    });
    c.toast({ description: "x", sound: "chime" });
    expect(toastCountAtPlayTime).toBe(1);
  });

  it("two toasts with the same cue in one tick both play, with no de-duplication", () => {
    const play = vi.fn();
    const c = createToastStore({ soundEngine: fakeSoundEngine(play) });
    c.toast({ description: "a", sound: "chime" });
    c.toast({ description: "b", sound: "chime" });
    expect(play).toHaveBeenCalledTimes(2);
  });

  it("dismissing or timing out a toast plays nothing (the action button also routes through dismiss)", () => {
    const play = vi.fn();
    const c = createToastStore({ soundEngine: fakeSoundEngine(play) });
    const id = c.toast({ description: "x", sound: "chime", duration: 1000 });
    play.mockClear(); // only the raise-time play counts here

    c.toast.dismiss(id);
    vi.advanceTimersByTime(1000);
    expect(play).not.toHaveBeenCalled();

    const timedOut = c.toast({ description: "y", sound: "chime", duration: 500 });
    play.mockClear();
    vi.advanceTimersByTime(500);
    expect(c.store.getState().toasts.find((t) => t.id === timedOut)).toBeUndefined();
    expect(play).not.toHaveBeenCalled();
  });

  it("`sound` omitted never plays, across the whole lifecycle", () => {
    const play = vi.fn();
    const c = createToastStore({ soundEngine: fakeSoundEngine(play) });
    const id = c.toast({ description: "x", duration: 1000 });
    c.pause(id);
    c.resume(id, 1000);
    vi.advanceTimersByTime(1000);
    expect(play).not.toHaveBeenCalled();
  });

  it("an isolated queue routes cues to its own engine, never the shared one", () => {
    const isolatedPlay = vi.fn();
    const sharedPlay = vi.spyOn(soundEngine, "play");

    const c = createToastStore({ soundEngine: fakeSoundEngine(isolatedPlay) });
    c.toast({ description: "x", sound: "chime" });

    expect(isolatedPlay).toHaveBeenCalledTimes(1);
    expect(sharedPlay).not.toHaveBeenCalled();
  });

  it("createToastStore() with no argument still compiles and uses the shared engine", () => {
    const sharedPlay = vi.spyOn(soundEngine, "play");
    const c = createToastStore();
    c.toast({ description: "x", sound: "chime" });
    expect(sharedPlay).toHaveBeenCalledTimes(1);
  });

  it("update's patch type does not widen to accept `sound`", () => {
    // The type test only: `sound` is not a key of `Partial<Omit<ToastData, "id">>`,
    // so this line fails to compile without the suppression, which is the
    // assertion. It is not run for its runtime effect - `toastReducer`'s
    // `update` case spreads the patch blindly (see `toastReducer` above), so a
    // toast dispatched this way *would* carry a `sound` field at runtime; that
    // it never gets there through `add` is proven separately below.
    const c = createToastStore();
    const id = c.toast({ description: "x" });
    expect(() => {
      // @ts-expect-error - `sound` is not part of ToastData, so it is not a valid update patch key.
      c.store.send({ type: "update", id, patch: { sound: "chime" } });
    }).not.toThrow();
  });

  it("`sound` never reaches ToastData, so nothing a renderer reads can differ", () => {
    // `sound` is consumed inside `add` and never assigned onto the `ToastData`
    // object (see the `add` implementation). This is what makes the DOM-level
    // comparison in unstyled/Toast/Toast.test.tsx sufficient without also
    // driving the shared Toaster through every engine state: engine state has
    // no bearing on ToastData construction, so the rendered role, aria-live,
    // sentiment, text and ids cannot differ because a cue was requested.
    const c = createToastStore({ soundEngine: fakeSoundEngine() });
    c.toast({ title: "Filled", description: "2M EURUSD", sentiment: "success" });
    c.toast({
      title: "Filled",
      description: "2M EURUSD",
      sentiment: "success",
      sound: "chime",
    });

    const [withoutSound, withSound] = c.store.getState().toasts;
    expect(withSound).not.toHaveProperty("sound");
    expect({ ...withSound, id: withoutSound.id }).toEqual(withoutSound);

    // Adding `sound` does not touch the shipped duration default.
    expect(withoutSound.duration).toBe(5000);
    expect(withSound.duration).toBe(5000);
  });
});
