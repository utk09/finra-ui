import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  type AudioContextLike,
  createSoundEngine,
  initialSoundState,
  type SoundEngineOptions,
  type SoundState,
  type SoundStoreAction,
  soundEngine,
  soundReducer,
  soundSilentReason,
} from "./sound";
import { createStore } from "./store";

//  A stub audio context. jsdom ships no `AudioContext` at all, so every test
//  supplies one through the engine's seam.

interface AutomationLog {
  /** Every automation call in order. */
  calls: { mode: "set" | "ramp"; value: number; at: number }[];
  setValueAtTime(value: number, at: number): void;
  exponentialRampToValueAtTime(value: number, at: number): void;
}

function automationLog(): AutomationLog {
  const calls: AutomationLog["calls"] = [];
  return {
    calls,
    setValueAtTime(value, at) {
      calls.push({ mode: "set", value, at });
    },
    exponentialRampToValueAtTime(value, at) {
      calls.push({ mode: "ramp", value, at });
    },
  };
}

interface StubOscillator {
  type: OscillatorType;
  frequency: AutomationLog;
  onended: (() => void) | null;
  starts: number[];
  stops: number[];
  disconnects: number;
  connect(target: unknown): void;
  disconnect(): void;
  start(at: number): void;
  stop(at: number): void;
}

interface StubGain {
  gain: AutomationLog;
  connectedTo: unknown[];
  disconnects: number;
  connect(target: unknown): void;
  disconnect(): void;
}

interface StubLog {
  /** Every oscillator handed out, in construction order. */
  oscillators: StubOscillator[];
  /** Every gain node handed out, in construction order. */
  gains: StubGain[];
  /** Total `connect` calls across every node. */
  connects: number;
  /** Total `disconnect` calls across every node. */
  disconnects: number;
  resumes: number;
  closes: number;
}

interface StubInit {
  /** @defaultValue `"running"` */
  state?: AudioContextState;
  /** @defaultValue `0` */
  currentTime?: number;
  /** Replace the resolved `resume()`. Throw from here to model Safari. */
  resume?: () => Promise<void>;
  /** Replace the resolved `close()`. */
  close?: () => Promise<void>;
  /** Model an `OfflineAudioContext`, which has no `close`. */
  omitClose?: boolean;
}

interface StubContext {
  /** What the engine receives. The cast is the point: it sees only the seam. */
  seam: AudioContextLike;
  log: StubLog;
  /** Move to a new state and fire `statechange`, the way a browser would. */
  transition(next: AudioContextState): void;
  /** Fire `ended` on every oscillator handed out so far. */
  endAll(): void;
  /** Fire `ended` on one oscillator by construction index. */
  end(index: number): void;
}

function stubContext(init: StubInit = {}): StubContext {
  const log: StubLog = {
    oscillators: [],
    gains: [],
    connects: 0,
    disconnects: 0,
    resumes: 0,
    closes: 0,
  };
  const destination = { role: "destination" };

  const context = {
    state: init.state ?? ("running" as AudioContextState),
    currentTime: init.currentTime ?? 0,
    destination,
    onstatechange: null as (() => void) | null,
    close: undefined as (() => Promise<void>) | undefined,
    createOscillator(): StubOscillator {
      const oscillator: StubOscillator = {
        type: "sine",
        frequency: automationLog(),
        onended: null,
        starts: [],
        stops: [],
        disconnects: 0,
        connect() {
          log.connects += 1;
        },
        disconnect() {
          oscillator.disconnects += 1;
          log.disconnects += 1;
        },
        start(at) {
          oscillator.starts.push(at);
        },
        stop(at) {
          oscillator.stops.push(at);
        },
      };
      log.oscillators.push(oscillator);
      return oscillator;
    },
    createGain(): StubGain {
      const gain: StubGain = {
        gain: automationLog(),
        connectedTo: [],
        disconnects: 0,
        connect(target: unknown) {
          gain.connectedTo.push(target);
          log.connects += 1;
        },
        disconnect() {
          gain.disconnects += 1;
          log.disconnects += 1;
        },
      };
      log.gains.push(gain);
      return gain;
    },
    resume(): Promise<void> {
      log.resumes += 1;
      return init.resume ? init.resume() : Promise.resolve();
    },
  };

  if (!init.omitClose) {
    context.close = () => {
      log.closes += 1;
      return init.close ? init.close() : Promise.resolve();
    };
  }

  return {
    seam: context as unknown as AudioContextLike,
    log,
    transition(next) {
      context.state = next;
      context.onstatechange?.();
    },
    endAll() {
      for (const oscillator of [...log.oscillators]) oscillator.onended?.();
    },
    end(index) {
      log.oscillators[index].onended?.();
    },
  };
}

/** An engine wired to a fresh stub and already unmuted. */
function unmuted(init: StubInit = {}, options: SoundEngineOptions = {}) {
  const stub = stubContext(init);
  const engine = createSoundEngine({ createAudioContext: () => stub.seam, ...options });
  engine.setMuted(false);
  return { engine, stub };
}

const state = (patch: Partial<SoundState> = {}): SoundState => ({ ...initialSoundState, ...patch });

/**
 * `sound.ts` with its comments removed. Every source assertion runs against
 * this rather than the raw text: a comment explaining that the module ships no
 * audio payload is not itself an audio payload, and comments do not reach the
 * bundle the criterion is about.
 */
function soundModuleCode(): string {
  const source = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "sound.ts"), "utf8");
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("soundReducer", () => {
  it("setMuted false unmutes", () => {
    expect(soundReducer(state(), { type: "setMuted", muted: false }).muted).toBe(false);
  });

  it("setMuted true on an already muted engine returns the same object", () => {
    const before = state();
    expect(soundReducer(before, { type: "setMuted", muted: true })).toBe(before);
  });

  it("setVolume 0.5 replaces 0.3", () => {
    expect(soundReducer(state(), { type: "setVolume", volume: 0.5 }).volume).toBe(0.5);
  });

  it("setVolume to the value already held returns the same object", () => {
    const before = state();
    expect(soundReducer(before, { type: "setVolume", volume: 0.3 })).toBe(before);
  });

  it("setVolume 5 clamps to the maximum", () => {
    expect(soundReducer(state(), { type: "setVolume", volume: 5 }).volume).toBe(1);
  });

  it("setVolume -1 clamps to the minimum", () => {
    expect(soundReducer(state(), { type: "setVolume", volume: -1 }).volume).toBe(0);
  });

  it("setVolume 0 is a valid volume, not mute", () => {
    const next = soundReducer(state(), { type: "setVolume", volume: 0 });
    expect(next.volume).toBe(0);
    expect(next.muted).toBe(true);
  });

  it("setVolume 1 is the unclamped boundary", () => {
    expect(soundReducer(state(), { type: "setVolume", volume: 1 }).volume).toBe(1);
  });

  it("setVolume NaN is rejected, not clamped, and returns the same object", () => {
    const before = state();
    expect(soundReducer(before, { type: "setVolume", volume: Number.NaN })).toBe(before);
  });

  it("setVolume Infinity clamps, because the direction is unambiguous", () => {
    const up = soundReducer(state(), { type: "setVolume", volume: Number.POSITIVE_INFINITY });
    const down = soundReducer(state(), { type: "setVolume", volume: Number.NEGATIVE_INFINITY });
    expect(up.volume).toBe(1);
    expect(down.volume).toBe(0);
  });

  it("setVolume that clamps to the value already held returns the same object", () => {
    const before = state({ volume: 1 });
    expect(soundReducer(before, { type: "setVolume", volume: 5 })).toBe(before);
  });

  it("setContextState records a new context state", () => {
    expect(
      soundReducer(state(), { type: "setContextState", contextState: "running" }).contextState,
    ).toBe("running");
  });

  it("setContextState to the state already held returns the same object", () => {
    const before = state({ contextState: "running" });
    expect(soundReducer(before, { type: "setContextState", contextState: "running" })).toBe(before);
  });

  it("setUnsupported clears supported", () => {
    expect(soundReducer(state(), { type: "setUnsupported" }).supported).toBe(false);
  });

  it("setUnsupported on an unsupported engine returns the same object", () => {
    const before = state({ supported: false });
    expect(soundReducer(before, { type: "setUnsupported" })).toBe(before);
  });

  it("setDisposed marks the engine disposed", () => {
    expect(soundReducer(state(), { type: "setDisposed" }).disposed).toBe(true);
  });

  it("setDisposed is idempotent and returns the same object", () => {
    const before = state({ disposed: true });
    expect(soundReducer(before, { type: "setDisposed" })).toBe(before);
  });

  it("ignores an unknown action", () => {
    const before = state();
    expect(soundReducer(before, { type: "nope" } as unknown as SoundStoreAction)).toBe(before);
  });

  it("leaves every other field untouched when one changes", () => {
    const before = state({ volume: 0.8, contextState: "running", supported: true });
    const after = soundReducer(before, { type: "setMuted", muted: false });
    expect(after).toEqual({ ...before, muted: false });
  });

  it("a store subscriber is not called for any same-reference transition", () => {
    const store = createStore(state({ volume: 1, contextState: "running" }), soundReducer);
    const listener = vi.fn();
    store.subscribe(listener);

    const noOps: SoundStoreAction[] = [
      { type: "setMuted", muted: true },
      { type: "setVolume", volume: 1 },
      { type: "setVolume", volume: 5 },
      { type: "setVolume", volume: Number.NaN },
      { type: "setContextState", contextState: "running" },
      { type: "nope" } as unknown as SoundStoreAction,
    ];
    for (const action of noOps) store.send(action);

    expect(listener).not.toHaveBeenCalled();

    // The denominator: the same store does notify when something really changes.
    store.send({ type: "setDisposed" });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("setUnsupported on an already-unsupported store does not notify", () => {
    const store = createStore(state({ supported: false }), soundReducer);
    const listener = vi.fn();
    store.subscribe(listener);

    store.send({ type: "setUnsupported" });

    expect(listener).not.toHaveBeenCalled();
  });
});

describe("soundSilentReason", () => {
  it("is null when nothing blocks playback", () => {
    expect(soundSilentReason(state({ muted: false, contextState: "running" }))).toBeNull();
  });

  it("is null before a context exists, because nothing has failed yet", () => {
    expect(soundSilentReason(state({ muted: false, contextState: "uncreated" }))).toBeNull();
  });

  it("reports muted", () => {
    expect(soundSilentReason(state({ muted: true, contextState: "running" }))).toBe("muted");
  });

  it("reports volume, because zero volume is not mute", () => {
    expect(soundSilentReason(state({ muted: false, volume: 0, contextState: "running" }))).toBe(
      "volume",
    );
  });

  it("reports suspended", () => {
    expect(soundSilentReason(state({ muted: false, contextState: "suspended" }))).toBe("suspended");
  });

  it("reports disposed", () => {
    expect(
      soundSilentReason(state({ muted: false, contextState: "running", disposed: true })),
    ).toBe("disposed");
  });

  it("reports unsupported", () => {
    expect(
      soundSilentReason(state({ muted: false, contextState: "running", supported: false })),
    ).toBe("unsupported");
  });

  it("reports suspended for an interrupted context, which resume also clears", () => {
    expect(soundSilentReason(state({ muted: false, contextState: "interrupted" }))).toBe(
      "suspended",
    );
  });

  it("reports disposed for a context the host closed, with the flag still false", () => {
    const closedByHost = state({ muted: false, contextState: "closed", disposed: false });
    expect(closedByHost.disposed).toBe(false);
    expect(soundSilentReason(closedByHost)).toBe("disposed");
  });

  it("a closed context outranks mute, the same way the disposed flag does", () => {
    expect(
      soundSilentReason(state({ muted: true, volume: 0, contextState: "closed", disposed: false })),
    ).toBe("disposed");
  });

  it("unsupported still outranks a closed context", () => {
    expect(
      soundSilentReason(state({ contextState: "closed", disposed: false, supported: false })),
    ).toBe("unsupported");
  });

  it("mute outranks volume and suspension", () => {
    expect(soundSilentReason(state({ muted: true, volume: 0, contextState: "suspended" }))).toBe(
      "muted",
    );
  });

  it("disposal outranks mute", () => {
    expect(
      soundSilentReason(
        state({ muted: true, volume: 0, contextState: "suspended", disposed: true }),
      ),
    ).toBe("disposed");
  });

  it("unsupported is the hardest blocker of all", () => {
    expect(
      soundSilentReason(
        state({
          muted: true,
          volume: 0,
          contextState: "suspended",
          disposed: true,
          supported: false,
        }),
      ),
    ).toBe("unsupported");
  });

  it("takes exactly one argument", () => {
    // A second argument does not compile. This line is the type test: remove the
    // suppression and `pnpm typecheck` fails, which is the assertion.
    // @ts-expect-error - soundSilentReason takes the whole state and nothing else.
    expect(soundSilentReason(state(), { disposed: true })).toBe("muted");
  });
});

describe("createSoundEngine, construction", () => {
  it("starts muted, at volume 0.3, with no context", () => {
    expect(createSoundEngine().getState()).toEqual({
      muted: true,
      volume: 0.3,
      contextState: "uncreated",
      supported: true,
      disposed: false,
      silentReason: "muted",
      activeVoices: 0,
    });
  });

  it("puts construction options through the same clamp as the reducer", () => {
    expect(createSoundEngine({ volume: 5 }).getState().volume).toBe(1);
    expect(createSoundEngine({ volume: -1 }).getState().volume).toBe(0);
    expect(createSoundEngine({ volume: Number.NaN }).getState().volume).toBe(0.3);
    expect(createSoundEngine({ muted: false }).getState().muted).toBe(false);
  });

  it("setVolume and setMuted dispatch through the store", () => {
    const engine = createSoundEngine();
    engine.setVolume(9);
    engine.setMuted(false);
    expect(engine.getState()).toMatchObject({ volume: 1, muted: false });
    expect(engine.store.getState()).toMatchObject({ volume: 1, muted: false });
  });

  it("the shared engine imports without touching the platform", () => {
    // The denominator: this realm genuinely has no AudioContext, so an
    // import-time construction would have thrown before this file ran.
    expect((globalThis as { AudioContext?: unknown }).AudioContext).toBeUndefined();
    expect(soundEngine.getState()).toMatchObject({
      muted: true,
      contextState: "uncreated",
      supported: true,
      disposed: false,
    });
  });

  it("the context factory is untouched until the first play after unmuting", () => {
    const create = vi.fn(() => stubContext().seam);
    const engine = createSoundEngine({ createAudioContext: create });
    expect(create).not.toHaveBeenCalled();

    for (let i = 0; i < 100; i += 1) engine.play("chime");
    expect(create).not.toHaveBeenCalled();

    engine.setMuted(false);
    engine.play("chime");
    expect(create).toHaveBeenCalledTimes(1);
  });

  it("playing every cue issues no fetch and no XMLHttpRequest", () => {
    const fetched = vi.fn();
    const opened = vi.fn();
    vi.stubGlobal("fetch", fetched);
    vi.stubGlobal(
      "XMLHttpRequest",
      class {
        constructor() {
          opened();
        }
      },
    );

    const { engine } = unmuted({}, { maxConcurrent: 100 });
    for (const cue of ["chime", "buzz", "beep", "click"] as const) engine.play(cue);

    expect(fetched).not.toHaveBeenCalled();
    expect(opened).not.toHaveBeenCalled();
  });
});

describe("play, while muted or disposed", () => {
  it("a muted engine constructs nothing and never asks for a context", () => {
    const create = vi.fn(() => stubContext().seam);
    const engine = createSoundEngine({ createAudioContext: create });
    engine.play("chime");
    expect(create).not.toHaveBeenCalled();
    expect(engine.getState().activeVoices).toBe(0);
  });

  it("100 muted plays across all four cues construct nothing", () => {
    const stub = stubContext();
    const create = vi.fn(() => stub.seam);
    const engine = createSoundEngine({ createAudioContext: create });

    const cues = ["chime", "buzz", "beep", "click"] as const;
    for (let i = 0; i < 100; i += 1) engine.play(cues[i % cues.length]);

    expect(create).not.toHaveBeenCalled();
    expect(stub.log.oscillators).toHaveLength(0);
    expect(stub.log.gains).toHaveLength(0);
  });

  it("setMuted(true) silences the very next play, synchronously", () => {
    const { engine, stub } = unmuted();
    engine.play("beep");
    expect(stub.log.oscillators).toHaveLength(1);

    engine.setMuted(true);
    engine.play("beep");
    expect(stub.log.oscillators).toHaveLength(1);
  });

  it("100 post-dispose plays construct zero nodes", () => {
    const { engine, stub } = unmuted();
    engine.play("beep");
    const constructedBeforeDispose = stub.log.oscillators.length;
    expect(constructedBeforeDispose).toBe(1);

    engine.dispose();
    const oscillatorsAtDispose = stub.log.oscillators.length;
    const gainsAtDispose = stub.log.gains.length;

    for (let i = 0; i < 100; i += 1) engine.play("chime");

    // A dead context still hands out nodes that never fire `ended`, so "does not
    // throw" is not the bar. Zero construction is.
    expect(stub.log.oscillators).toHaveLength(oscillatorsAtDispose);
    expect(stub.log.gains).toHaveLength(gainsAtDispose);
    expect(engine.getState().activeVoices).toBe(0);
    expect(engine.getState().contextState).toBe("closed");
  });
});

describe("play, synthesis", () => {
  it("chime is two sine tones, 880Hz then 1760Hz, each decaying", () => {
    const { engine, stub } = unmuted({ currentTime: 10 });
    engine.play("chime");

    expect(stub.log.oscillators).toHaveLength(2);
    expect(stub.log.gains).toHaveLength(2);
    expect(engine.getState().activeVoices).toBe(1);

    const [first, second] = stub.log.oscillators;
    expect(first.type).toBe("sine");
    expect(second.type).toBe("sine");
    expect(first.frequency.calls).toEqual([{ mode: "set", value: 880, at: 10 }]);
    expect(second.frequency.calls[0].value).toBe(1760);

    expect(first.starts).toEqual([10]);
    expect(first.stops[0]).toBeCloseTo(10.06, 10);
    expect(second.starts[0]).toBeCloseTo(10.06, 10);
    expect(second.stops[0]).toBeCloseTo(10.18, 10);

    const [firstGain] = stub.log.gains;
    expect(firstGain.gain.calls.map((call) => call.mode)).toEqual(["set", "ramp"]);
    expect(firstGain.gain.calls[0].value).toBe(0.3);
    expect(firstGain.gain.calls[1].value).toBeCloseTo(0.0003, 10);
  });

  it("beep is one sine tone at 660Hz", () => {
    const { engine, stub } = unmuted();
    engine.play("beep");

    expect(stub.log.oscillators).toHaveLength(1);
    expect(stub.log.gains).toHaveLength(1);
    expect(stub.log.oscillators[0].type).toBe("sine");
    expect(stub.log.oscillators[0].frequency.calls).toEqual([{ mode: "set", value: 660, at: 0 }]);
    expect(stub.log.oscillators[0].stops).toEqual([0.15]);
  });

  it("buzz is a gated sawtooth: on, off, on, off", () => {
    const { engine, stub } = unmuted();
    engine.play("buzz");

    expect(stub.log.oscillators[0].type).toBe("sawtooth");
    expect(stub.log.oscillators[0].frequency.calls).toEqual([{ mode: "set", value: 150, at: 0 }]);
    expect(stub.log.gains[0].gain.calls).toEqual([
      { mode: "set", value: 0.3, at: 0 },
      { mode: "set", value: 0, at: 0.1 },
      { mode: "set", value: 0.3, at: 0.15 },
      { mode: "set", value: 0, at: 0.25 },
    ]);
  });

  it("click sweeps 400Hz to 800Hz over 15ms", () => {
    const { engine, stub } = unmuted();
    engine.play("click");

    expect(stub.log.oscillators[0].frequency.calls).toEqual([
      { mode: "set", value: 400, at: 0 },
      { mode: "ramp", value: 800, at: 0.015 },
    ]);
  });

  it("every cue connects oscillator to gain to destination", () => {
    const { engine, stub } = unmuted({}, { maxConcurrent: 100 });
    for (const cue of ["chime", "buzz", "beep", "click"] as const) engine.play(cue);

    // 5 tones across the four cues, each with its own oscillator and gain, each
    // node connected exactly once.
    expect(stub.log.oscillators).toHaveLength(5);
    expect(stub.log.gains).toHaveLength(5);
    expect(stub.log.connects).toBe(10);
    for (const gain of stub.log.gains) {
      expect(gain.connectedTo).toEqual([{ role: "destination" }]);
    }
  });

  it("no cue runs longer than 300ms", () => {
    for (const cue of ["chime", "buzz", "beep", "click"] as const) {
      const { engine, stub } = unmuted();
      engine.play(cue);
      const starts = stub.log.oscillators.flatMap((o) => o.starts);
      const stops = stub.log.oscillators.flatMap((o) => o.stops);
      expect(Math.max(...stops) - Math.min(...starts)).toBeLessThanOrEqual(0.3);
    }
  });

  it("volume 0 still runs the graph, at gain 0, and reports itself", () => {
    const { engine, stub } = unmuted({}, { volume: 0 });
    engine.play("beep");

    expect(stub.log.oscillators).toHaveLength(1);
    // A ramp cannot target zero, so the decay point is applied as a step.
    expect(stub.log.gains[0].gain.calls).toEqual([
      { mode: "set", value: 0, at: 0 },
      { mode: "set", value: 0, at: 0.15 },
    ]);
    expect(engine.getState().silentReason).toBe("volume");
  });
});

describe("play, concurrency", () => {
  it("a fourth simultaneous cue is dropped", () => {
    const { engine, stub } = unmuted();
    for (let i = 0; i < 4; i += 1) engine.play("chime");

    expect(engine.getState().activeVoices).toBe(3);
    // 3 chimes, 2 tones each. The fourth built nothing at all.
    expect(stub.log.oscillators).toHaveLength(6);
  });

  it("the cap frees when a voice ends", () => {
    const { engine, stub } = unmuted();
    for (let i = 0; i < 4; i += 1) engine.play("beep");
    expect(stub.log.oscillators).toHaveLength(3);

    stub.end(0);
    expect(engine.getState().activeVoices).toBe(2);

    engine.play("beep");
    expect(stub.log.oscillators).toHaveLength(4);
    expect(engine.getState().activeVoices).toBe(3);
  });

  it("a chime voice frees only when both of its tones have ended", () => {
    const { engine, stub } = unmuted();
    engine.play("chime");
    expect(engine.getState().activeVoices).toBe(1);

    stub.end(0);
    expect(engine.getState().activeVoices).toBe(1);

    stub.end(1);
    expect(engine.getState().activeVoices).toBe(0);
  });

  it("at most maxConcurrent cue graphs exist at any instant", () => {
    const { engine, stub } = unmuted({}, { maxConcurrent: 2 });
    for (let i = 0; i < 10; i += 1) {
      engine.play("beep");
      expect(engine.getState().activeVoices).toBeLessThanOrEqual(2);
    }
    expect(stub.log.oscillators).toHaveLength(2);
  });

  it("100 played-and-ended cues leave nothing behind", () => {
    const { engine, stub } = unmuted();
    for (let i = 0; i < 100; i += 1) {
      engine.play("chime");
      stub.endAll();
    }

    // 100 chimes, two tones each: 200 oscillators and 200 gains, every one of
    // them connected exactly once.
    expect(stub.log.oscillators).toHaveLength(200);
    expect(stub.log.gains).toHaveLength(200);
    expect(engine.getState().activeVoices).toBe(0);
    expect(stub.log.connects).toBe(400);
    expect(stub.log.disconnects).toBe(stub.log.connects);
    for (const oscillator of stub.log.oscillators) expect(oscillator.disconnects).toBe(1);
    for (const gain of stub.log.gains) expect(gain.disconnects).toBe(1);
  });
});

describe("play, context state", () => {
  it("records the context state when the context is created", () => {
    const { engine } = unmuted();
    expect(engine.getState().contextState).toBe("uncreated");
    engine.play("beep");
    expect(engine.getState().contextState).toBe("running");
  });

  it("a statechange behind the engine's back reaches the store", () => {
    const { engine, stub } = unmuted();
    engine.play("beep");

    const listener = vi.fn();
    engine.store.subscribe(listener);
    stub.transition("suspended");

    expect(engine.getState().contextState).toBe("suspended");
    expect(engine.getState().silentReason).toBe("suspended");
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("a suspended context drops the cue and resumes once", async () => {
    const { engine, stub } = unmuted({ state: "suspended" });
    for (let i = 0; i < 5; i += 1) engine.play("chime");

    // Asserted before any await: the drop is synchronous, so `play` cannot have
    // waited on `resume()`.
    expect(stub.log.oscillators).toHaveLength(0);
    expect(stub.log.resumes).toBe(1);
    expect(engine.getState().activeVoices).toBe(0);

    await Promise.resolve();
    await Promise.resolve();

    // Nothing was queued behind the resume, and the engine did not ask again.
    expect(stub.log.oscillators).toHaveLength(0);
    expect(stub.log.resumes).toBe(1);
  });

  it("nothing replays when the context reaches running", () => {
    const { engine, stub } = unmuted({ state: "suspended" });
    for (let i = 0; i < 5; i += 1) engine.play("chime");
    expect(stub.log.oscillators).toHaveLength(0);

    stub.transition("running");

    // The denominator: no backlog fired on the transition, and the engine is
    // demonstrably able to build a graph now.
    expect(stub.log.oscillators).toHaveLength(0);
    engine.play("chime");
    expect(stub.log.oscillators).toHaveLength(2);
  });

  it("asks to resume again only once the previous request has settled", async () => {
    const pending = { release: (): void => undefined };
    const { engine, stub } = unmuted({
      state: "suspended",
      resume: () =>
        new Promise<void>((resolve) => {
          pending.release = resolve;
        }),
    });

    engine.play("beep");
    engine.play("beep");
    expect(stub.log.resumes).toBe(1);

    pending.release();
    await Promise.resolve();
    await Promise.resolve();

    engine.play("beep");
    expect(stub.log.resumes).toBe(2);
  });

  it("a rejected resume is absorbed and the next cue may try again", async () => {
    const { engine, stub } = unmuted({
      state: "suspended",
      resume: () => Promise.reject(new Error("audio focus denied")),
    });

    engine.play("beep");
    expect(stub.log.resumes).toBe(1);
    await Promise.resolve();
    await Promise.resolve();

    engine.play("beep");
    expect(stub.log.resumes).toBe(2);
    expect(stub.log.oscillators).toHaveLength(0);
  });

  it("a resume that throws synchronously does not escape play", () => {
    const { engine, stub } = unmuted({
      state: "suspended",
      resume: () => {
        throw new Error("InvalidStateError");
      },
    });

    expect(() => {
      engine.play("beep");
    }).not.toThrow();
    expect(stub.log.resumes).toBe(1);

    // The request settled synchronously, so the next cue is free to try again.
    engine.play("beep");
    expect(stub.log.resumes).toBe(2);
  });

  it("an interrupted context drops the cue and asks to resume, as suspended does", () => {
    const { engine, stub } = unmuted({ state: "interrupted" });
    for (let i = 0; i < 5; i += 1) engine.play("chime");

    // Safari reaches this state when the operating system takes audio focus for
    // a call. Without the resume request, sound never comes back afterwards.
    expect(stub.log.oscillators).toHaveLength(0);
    expect(stub.log.resumes).toBe(1);
    expect(engine.getState().contextState).toBe("interrupted");
    expect(engine.getState().silentReason).toBe("suspended");
  });

  it("an interrupted context that reaches running plays again, replaying nothing", () => {
    const { engine, stub } = unmuted({ state: "interrupted" });
    engine.play("chime");
    expect(stub.log.oscillators).toHaveLength(0);

    stub.transition("running");
    expect(stub.log.oscillators).toHaveLength(0);

    engine.play("chime");
    expect(stub.log.oscillators).toHaveLength(2);
  });

  it("a context the host closed underneath the engine drops the cue without resuming", () => {
    const { engine, stub } = unmuted({ state: "closed" });
    engine.play("chime");

    expect(stub.log.oscillators).toHaveLength(0);
    expect(stub.log.resumes).toBe(0);
    expect(engine.getState().contextState).toBe("closed");
    // The engine did not dispose it, so the flag is false, and the reason still
    // has to say the sound is gone until reload.
    expect(engine.getState().disposed).toBe(false);
    expect(engine.getState().silentReason).toBe("disposed");
  });
});

describe("play, unsupported realms", () => {
  it("a throwing factory is permanent, dispatched, and notified once", () => {
    const create = vi.fn((): AudioContextLike => {
      throw new Error("AudioContext unavailable");
    });
    const engine = createSoundEngine({ createAudioContext: create });
    engine.setMuted(false);

    const listener = vi.fn();
    engine.store.subscribe(listener);

    for (let i = 0; i < 50; i += 1) {
      expect(() => {
        engine.play("chime");
      }).not.toThrow();
    }

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ supported: false }));
    expect(create).toHaveBeenCalledTimes(1);
    expect(engine.getState().silentReason).toBe("unsupported");
    expect(engine.getState().activeVoices).toBe(0);
  });

  it("the default seam in a realm with no AudioContext is permanent, and notified once", () => {
    // The denominator, again: jsdom really has no constructor to find.
    expect((globalThis as { AudioContext?: unknown }).AudioContext).toBeUndefined();

    const engine = createSoundEngine();
    engine.setMuted(false);

    const listener = vi.fn();
    engine.store.subscribe(listener);

    for (let i = 0; i < 50; i += 1) {
      expect(() => {
        engine.play("chime");
      }).not.toThrow();
    }

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ supported: false }));
    expect(engine.getState().supported).toBe(false);
    expect(engine.getState().silentReason).toBe("unsupported");
    expect(engine.getState().activeVoices).toBe(0);
  });
});

describe("play, a seam that throws while building the graph", () => {
  it("never throws to the caller and frees the concurrency slot instead of leaking it", () => {
    // A context that builds fine, unlike the throwing-factory case above: the
    // failure happens inside node construction itself, partway through
    // `chime`'s second tone, which is the scenario `startVoice`'s own
    // try/catch exists for.
    let oscillatorCalls = 0;
    const disconnected: string[] = [];
    const context: AudioContextLike = {
      state: "running",
      currentTime: 0,
      destination: {} as AudioDestinationNode,
      resume: () => Promise.resolve(),
      createOscillator: () => {
        oscillatorCalls += 1;
        if (oscillatorCalls > 1) throw new Error("createOscillator unavailable");
        return {
          type: "sine",
          frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} },
          onended: null,
          connect() {},
          disconnect() {
            disconnected.push("oscillator");
          },
          start() {},
          stop() {},
        } as unknown as OscillatorNode;
      },
      createGain: () =>
        ({
          gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} },
          connect() {},
          disconnect() {
            disconnected.push("gain");
          },
        }) as unknown as GainNode,
    };

    const engine = createSoundEngine({ createAudioContext: () => context });
    engine.setMuted(false);

    expect(() => {
      engine.play("chime");
    }).not.toThrow();

    // The slot the failed voice took is freed, and the one node built before the
    // throw is disconnected rather than left dangling.
    expect(engine.getState().activeVoices).toBe(0);
    expect(disconnected).toContain("oscillator");
    expect(disconnected).toContain("gain");

    // The same broken seam, tried again: still no throw, still no leaked slot.
    // A cap that only froze once per instance would saturate after enough of
    // these; it does not.
    expect(() => {
      engine.play("beep");
    }).not.toThrow();
    expect(engine.getState().activeVoices).toBe(0);
  });
});

describe("dispose", () => {
  it("disposing mid-cue strands no bookkeeping", () => {
    const { engine, stub } = unmuted();
    engine.play("chime");
    expect(engine.getState().activeVoices).toBe(1);

    engine.dispose();

    // Closing a context fires no `ended`, so the release cannot wait for one.
    expect(engine.getState().activeVoices).toBe(0);
    expect(engine.getState().contextState).toBe("closed");
    expect(engine.getState().disposed).toBe(true);
    expect(stub.log.closes).toBe(1);
    expect(stub.log.disconnects).toBe(stub.log.connects);
  });

  it("a second dispose does not throw and does not notify", () => {
    const { engine, stub } = unmuted();
    engine.play("beep");
    engine.dispose();

    const listener = vi.fn();
    engine.store.subscribe(listener);

    expect(() => {
      engine.dispose();
    }).not.toThrow();
    expect(listener).not.toHaveBeenCalled();
    expect(stub.log.closes).toBe(1);
  });

  it("ignores an ended event that arrives after dispose already released the voice", () => {
    const { engine, stub } = unmuted();
    engine.play("chime");
    // Captured before dispose, which detaches the handlers a live browser would
    // never fire again anyway. This models the handler racing the close.
    const late = stub.log.oscillators.map((oscillator) => oscillator.onended);

    engine.dispose();
    const disconnectsAfterDispose = stub.log.disconnects;
    expect(disconnectsAfterDispose).toBe(stub.log.connects);

    for (const handler of late) handler?.();

    // No second release, so nothing is disconnected twice and the count stays
    // equal to the connect count.
    expect(stub.log.disconnects).toBe(disconnectsAfterDispose);
    expect(engine.getState().activeVoices).toBe(0);
  });

  it("keeps mute and volume, so a rebuild does not lose the person's choice", () => {
    const { engine } = unmuted({}, { volume: 0.7 });
    engine.dispose();
    expect(engine.getState()).toMatchObject({ muted: false, volume: 0.7, disposed: true });
  });

  it("stops listening for statechange once disposed", () => {
    const { engine, stub } = unmuted();
    engine.play("beep");
    engine.dispose();

    stub.transition("running");
    expect(engine.getState().contextState).toBe("closed");
  });

  it("absorbs a close that rejects", async () => {
    const { engine } = unmuted({ close: () => Promise.reject(new Error("already closed")) });
    engine.play("beep");

    expect(() => {
      engine.dispose();
    }).not.toThrow();
    await Promise.resolve();
    await Promise.resolve();
    expect(engine.getState().disposed).toBe(true);
  });

  it("disposes a context that has no close at all, as OfflineAudioContext has none", () => {
    const { engine, stub } = unmuted({ omitClose: true });
    engine.play("beep");

    expect(() => {
      engine.dispose();
    }).not.toThrow();
    expect(stub.log.closes).toBe(0);
    expect(engine.getState().contextState).toBe("closed");
  });

  it("disposes an engine that never built a context", () => {
    const create = vi.fn(() => stubContext().seam);
    const engine = createSoundEngine({ createAudioContext: create });

    engine.dispose();
    expect(create).not.toHaveBeenCalled();
    expect(engine.getState()).toMatchObject({ disposed: true, contextState: "closed" });
  });
});

describe("the injection proof", () => {
  it("two differently configured contexts behave differently in the same suite", () => {
    const running = stubContext({ state: "running" });
    const suspended = stubContext({ state: "suspended" });

    const audible = createSoundEngine({ createAudioContext: () => running.seam });
    const blocked = createSoundEngine({ createAudioContext: () => suspended.seam });
    audible.setMuted(false);
    blocked.setMuted(false);

    const cues = ["chime", "buzz", "beep", "click"] as const;
    for (const cue of cues) {
      expect(() => {
        audible.play(cue);
        blocked.play(cue);
      }).not.toThrow();
      running.endAll();
    }

    // Every play built a graph on the first, none did on the second, and the
    // only difference between the two engines is the injected context.
    expect(running.log.oscillators).toHaveLength(5);
    expect(suspended.log.oscillators).toHaveLength(0);
    expect(audible.getState().contextState).toBe("running");
    expect(blocked.getState().contextState).toBe("suspended");
    expect(blocked.getState().silentReason).toBe("suspended");
    expect(audible.getState().silentReason).toBeNull();
  });

  it("names the platform constructor exactly once, inside the default seam", () => {
    const code = soundModuleCode();

    expect(code.match(/new AudioContext/g)).toHaveLength(1);
    expect(code.slice(code.indexOf("export function createSoundEngine"))).not.toContain(
      "new AudioContext",
    );
  });

  it("ships no audio payload and no loader", () => {
    const code = soundModuleCode();

    expect(code).not.toContain("data:audio");
    expect(code).not.toContain("base64");
    expect(code).not.toContain("decodeAudioData");
    expect(code).not.toContain("fetch(");
  });
});
