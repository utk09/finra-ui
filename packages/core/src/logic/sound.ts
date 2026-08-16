/**
 * Synthesized audio cues. Framework-agnostic: the engine owns a Web Audio graph
 * and a settings store, and renders nothing at all.
 *
 * Synthesis rather than audio assets: no network request, no CORS, no base64
 * payload in the bundle, and one cue vocabulary rather than one per asset pack.
 *
 * The audio context is injected rather than constructed here, for two reasons
 * that both bite. A host that already owns an `AudioContext` must not be handed
 * a second one, and no test environment in this repo has an `AudioContext` to
 * construct at all. Nothing touches the platform until the first `play` on an
 * unmuted engine, so importing this module is safe in Node and during SSR.
 */
import { createStore, type Store } from "./store";

/**
 * The subset of an audio context this engine touches.
 *
 * @remarks
 * Derived from the DOM type with `Pick` rather than hand-mirrored, so it cannot
 * drift from the platform and a real `AudioContext` stays assignable with no
 * cast. Narrow on purpose: it documents exactly what a seam must provide, and a
 * test stub has six required members to implement rather than the whole
 * interface. jsdom ships no `AudioContext` at all, so every test supplies one.
 *
 * `close` is optional so that an `OfflineAudioContext`, which has no `close`,
 * satisfies the type. That is what lets a story test render a cue and assert the
 * synthesis table against real sample values instead of a mock call log.
 *
 * `onstatechange` is optional for the same reason and one more: it is how the
 * engine learns that the browser suspended or resumed the context behind its
 * back, which is the only thing that keeps `SoundState.contextState` honest
 * without polling. A stub that never fires it still works; it just reports one
 * context state, taken at construction.
 */
export type AudioContextLike = Pick<
  AudioContext,
  "createOscillator" | "createGain" | "destination" | "currentTime" | "state" | "resume"
> &
  Partial<Pick<AudioContext, "close" | "onstatechange">>;

/**
 * A synthesized audio cue, named for the sound it makes.
 *
 * @remarks
 * Names describe the waveform, never the meaning. A cue named for meaning would
 * shadow `Sentiment` at every call site that sets both, and would put one
 * industry's vocabulary into a package that carries no domain. Mapping a
 * meaning onto a cue is the consumer's job: `chime` is a rising two-note tone,
 * and whether that means a fill, a save or a delivery is theirs to decide.
 *
 * Closed on purpose. The engine synthesizes each cue, so an unrecognised name
 * has no waveform and would be silence at runtime that the type could have
 * caught.
 */
export type SoundCue =
  /** Two rising sine tones. Affirmative, the loudest of the four. */
  | "chime"
  /** Harsh sawtooth, pulse-pause-pulse. Negative, deliberately unpleasant. */
  | "buzz"
  /** One short sine tone. Attention without alarm. */
  | "beep"
  /** A 15ms rising sweep. Feedback for a discrete action, not an announcement. */
  | "click";

/** Why the next `play` would produce no sound. `null` means it would be heard. */
export type SoundSilentReason =
  /** No audio context could be built in this realm. Nothing fixes it. */
  | "unsupported"
  /**
   * The audio context is closed. Also reported when the host closed a context it
   * injected, rather than {@link SoundEngine.dispose} closing it: from the
   * outside a closed context is a closed context, and either way the page has to
   * be reloaded before sound returns.
   */
  | "disposed"
  /** Playback is suppressed. One toggle fixes it. */
  | "muted"
  /** Output gain is zero. Not the same thing as mute, and reported separately. */
  | "volume"
  /**
   * The context is stalled but recoverable. Covers Safari's `"interrupted"`,
   * reached when the operating system takes audio focus for a call, as well as
   * `"suspended"`: both clear through `resume()`, and the person is told the same
   * thing either way.
   */
  | "suspended";

/**
 * Engine state a settings surface reflects.
 *
 * @remarks
 * `contextState` is here rather than on a bare snapshot because it changes
 * asynchronously, with no dispatch behind it: a tab is hidden, audio focus is
 * lost, or a cue elsewhere resumes the context. A settings screen holding only a
 * snapshot would have to poll to notice.
 *
 * `supported` is here for the same reason: it turns false when the audio context
 * factory throws or is absent, which happens inside `play` and would otherwise
 * never reach a subscriber.
 */
export interface SoundState {
  /** Whether playback is suppressed. Starts `true`. */
  muted: boolean;
  /** Output gain, 0 to 1 inclusive. Starts `0.3`. */
  volume: number;
  /** `"uncreated"` until the first `play` after unmuting constructs a context. */
  contextState: AudioContextState | "uncreated";
  /** `false` once the engine has proved it cannot produce sound in this realm. */
  supported: boolean;
  /** `true` once {@link SoundEngine.dispose} has run. Never returns to `false`. */
  disposed: boolean;
}

/**
 * Every transition the settings store understands.
 *
 * @remarks
 * The volume clamp lives in the reducer rather than in
 * {@link SoundEngine.setVolume}, so it holds for a caller dispatching through
 * the store directly, and so it is testable as a pure function with no audio, no
 * stub and no DOM.
 *
 * `setContextState`, `setUnsupported` and `setDisposed` are dispatched by the
 * engine itself, the same way `createToastStore` dispatches timer-driven
 * dismissals. The reducer stays pure.
 */
export type SoundStoreAction =
  | { type: "setMuted"; muted: boolean }
  | { type: "setVolume"; volume: number }
  | { type: "setContextState"; contextState: AudioContextState | "uncreated" }
  | { type: "setUnsupported" }
  | { type: "setDisposed" };

/**
 * An engine that has not been touched. The starting state for {@link soundReducer}.
 *
 * Frozen: at its default construction options, `createSoundEngine`'s seeding
 * reducer calls are both no-ops, so the shared {@link soundEngine}'s store holds
 * this exact object until its first real transition. A mutable export would let
 * a caller corrupt that shared state without going through the store at all.
 */
export const initialSoundState: SoundState = Object.freeze({
  muted: true,
  volume: 0.3,
  contextState: "uncreated",
  supported: true,
  disposed: false,
});

/**
 * Pure settings transitions. No audio, no context, no side effects.
 *
 * @remarks
 * Returns the **same state object** when an action changes nothing, so a
 * subscriber comparing by reference does not re-render for a no-op. Volume is
 * clamped to 0..1 here; `NaN` is rejected and leaves the state untouched rather
 * than poisoning it, while an infinity clamps, because its direction is
 * unambiguous.
 *
 * @param state - Current settings.
 * @param action - Transition to apply.
 * @returns The next settings, or `state` itself if nothing changed.
 */
export function soundReducer(state: SoundState, action: SoundStoreAction): SoundState {
  switch (action.type) {
    case "setMuted":
      return action.muted === state.muted ? state : { ...state, muted: action.muted };
    case "setVolume": {
      if (Number.isNaN(action.volume)) return state;
      const volume = Math.min(Math.max(action.volume, 0), 1);
      return volume === state.volume ? state : { ...state, volume };
    }
    case "setContextState":
      return action.contextState === state.contextState
        ? state
        : { ...state, contextState: action.contextState };
    case "setUnsupported":
      return state.supported ? { ...state, supported: false } : state;
    case "setDisposed":
      return state.disposed ? state : { ...state, disposed: true };
    default:
      return state;
  }
}

/**
 * Context states a `resume()` recovers from.
 *
 * `"interrupted"` is Safari's audio-focus-loss state, reached when the operating
 * system takes audio away for a call. It clears exactly the way `"suspended"`
 * does, so the engine treats the two as one condition rather than leaving iOS
 * permanently silent after a phone call.
 */
function resumeRecovers(contextState: AudioContextState | "uncreated"): boolean {
  return contextState === "suspended" || contextState === "interrupted";
}

/**
 * Why the next `play` would be silent, or `null` if it would be heard.
 *
 * @remarks
 * Pure and exported so a settings surface asks one question and gets one
 * answer, instead of learning the Web Audio state machine to decide what to
 * render. Precedence runs hardest blocker first: fixing a softer reason
 * underneath a harder one changes nothing, so reporting the softer one would
 * send a user to a control that does not help.
 *
 * Two context states fold into an existing reason rather than earning one of
 * their own. A closed context reports `"disposed"` whether the engine closed it
 * or the host closed one it injected, because the consequence and the remedy are
 * the same. An interrupted context reports `"suspended"`, because both clear
 * through `resume()`.
 *
 * Takes the whole state and nothing else, so a React component can select it
 * straight out of the store.
 *
 * @param state - The settings to judge, straight from {@link SoundEngine.store}.
 */
export function soundSilentReason(state: SoundState): SoundSilentReason | null {
  if (!state.supported) return "unsupported";
  if (state.disposed || state.contextState === "closed") return "disposed";
  if (state.muted) return "muted";
  if (state.volume <= 0) return "volume";
  if (resumeRecovers(state.contextState)) return "suspended";
  return null;
}

/**
 * Near-silence, as a multiplier of the engine's volume.
 *
 * Web Audio cannot ramp exponentially to zero, and a decay that ends at an
 * audible level clicks. This is the floor every decaying tone ends on.
 */
const DECAY_FLOOR = 0.001;

/** One gain-automation point on a tone, relative to that tone's own start. */
interface ToneEnvelopePoint {
  /** Seconds after the tone starts. */
  at: number;
  /** Multiplier of the engine's volume, 0 to 1. */
  gain: number;
  /**
   * Reach the value by exponential ramp rather than instantly.
   *
   * A ramp whose computed level is zero is applied as a step instead, because
   * Web Audio cannot ramp to zero. That is what keeps a volume of 0 a running
   * graph at silence rather than a thrown range error.
   */
  ramp: boolean;
}

/** One oscillator within a cue. A cue is one or more of these. */
interface CueTone {
  /** Oscillator waveform. */
  wave: OscillatorType;
  /** Hz at the tone's start. */
  frequency: number;
  /** Hz at the tone's end. Equal to {@link CueTone.frequency} for a steady tone. */
  endFrequency: number;
  /** Seconds after the cue starts. */
  offset: number;
  /** Seconds the oscillator runs for. */
  duration: number;
  /** Gain automation for this tone's own gain stage. */
  envelope: readonly ToneEnvelopePoint[];
}

/** A tone that starts at full level and decays to near-silence over its length. */
function decayEnvelope(duration: number): readonly ToneEnvelopePoint[] {
  return [
    { at: 0, gain: 1, ramp: false },
    { at: duration, gain: DECAY_FLOOR, ramp: true },
  ];
}

/**
 * The synthesis table. No cue exceeds 300ms and no cue repeats: a cue long
 * enough to overlap a spoken phrase masks it, and the two sentiments a host
 * would most want to cue are exactly the two that announce assertively.
 *
 * Every peak sits at the engine's volume unscaled, which is what makes the
 * concurrency cap the thing that keeps the summed output below clipping.
 */
const cueTones: Record<SoundCue, readonly CueTone[]> = {
  chime: [
    {
      wave: "sine",
      frequency: 880,
      endFrequency: 880,
      offset: 0,
      duration: 0.06,
      envelope: decayEnvelope(0.06),
    },
    {
      wave: "sine",
      frequency: 1760,
      endFrequency: 1760,
      offset: 0.06,
      duration: 0.12,
      envelope: decayEnvelope(0.12),
    },
  ],
  buzz: [
    {
      wave: "sawtooth",
      frequency: 150,
      endFrequency: 150,
      offset: 0,
      duration: 0.25,
      envelope: [
        { at: 0, gain: 1, ramp: false },
        { at: 0.1, gain: 0, ramp: false },
        { at: 0.15, gain: 1, ramp: false },
        { at: 0.25, gain: 0, ramp: false },
      ],
    },
  ],
  beep: [
    {
      wave: "sine",
      frequency: 660,
      endFrequency: 660,
      offset: 0,
      duration: 0.15,
      envelope: decayEnvelope(0.15),
    },
  ],
  click: [
    {
      wave: "sine",
      frequency: 400,
      endFrequency: 800,
      offset: 0,
      duration: 0.015,
      envelope: decayEnvelope(0.015),
    },
  ],
};

/** Construction options. Every field is optional. */
export interface SoundEngineOptions {
  /**
   * Start muted.
   *
   * @remarks
   * `true` on purpose. A component library that makes noise before the host
   * application asks it to is a defect, and sound is the one output channel a
   * user cannot look away from, cannot mute per tab without muting the whole
   * tab, and that carries into a shared room. A trading floor is a shared room.
   *
   * @defaultValue `true`
   */
  muted?: boolean;
  /**
   * Output gain, clamped to 0..1 on the way in.
   *
   * @remarks
   * Web Audio does not clamp gain, so a value above 1 clips audibly.
   *
   * @defaultValue `0.3`
   */
  volume?: number;
  /**
   * Supply the audio context.
   *
   * @remarks
   * Called at most once, on the first `play` after the engine is unmuted, never
   * at construction and never at module load. Two reasons it exists: a host that
   * already owns an `AudioContext` should not get a second one, and jsdom ships
   * none at all, so tests must pass a stub.
   *
   * The engine takes ownership of `onstatechange` on whatever it receives here,
   * and clears it on {@link SoundEngine.dispose}. Supplying a context you are
   * still listening to yourself will silently replace your handler.
   *
   * In a realm with no constructor available, or when this throws, the engine
   * becomes permanently silent rather than throwing.
   *
   * @defaultValue `() => new AudioContext()`
   */
  createAudioContext?: () => AudioContextLike;
  /**
   * Most cues allowed to sound at once. Further cues are dropped, never queued.
   *
   * @remarks
   * This is signal integrity, not policy. At the default volume, three
   * concurrent voices of any cue peak under 0.89. A fourth pushes three of the
   * four cues past 1.0 and clips; `click`, the shortest and fastest-decaying
   * one, only clips once a fifth is added. The cap is sized to the tightest
   * margin, not the loosest, so nothing clips at the shipped default.
   * Deciding how often an application *should* make noise is the caller's,
   * and this engine does not throttle by meaning.
   *
   * @defaultValue `3`
   */
  maxConcurrent?: number;
}

/**
 * A synthesized cue player. Muted until the host application says otherwise.
 *
 * @remarks
 * Nothing here renders, so there is no styling surface and no `data-finra-ui`
 * id. The only visible consequence of this module is sound.
 */
export interface SoundEngine {
  /**
   * Play a cue.
   *
   * @remarks
   * Never throws, under any state: muted, disposed, volume at zero, no audio
   * context available, or a context that will not resume. All of those are
   * silence, and callers may treat this as fire and forget.
   *
   * Cues issued while the context is suspended or interrupted are dropped, not
   * queued, and a single `resume()` is requested on the way past. A cue is a
   * timestamped signal carrying no timestamp: a fill cue arriving ninety seconds
   * late is not a delayed notification, it is a false one, and unlike a stale
   * toast you cannot look at a sound and see that it is old.
   *
   * @param cue - Which waveform to synthesize.
   */
  play(cue: SoundCue): void;
  /** Suppress or allow playback. Takes effect on the next `play`, synchronously. */
  setMuted(muted: boolean): void;
  /** Set output gain. Values outside 0..1 are clamped, not rejected. */
  setVolume(volume: number): void;
  /**
   * Subscribable settings.
   *
   * @remarks
   * Read it in React with the exported `useStore`, and in a future Lit reactive
   * controller through the same `Store` contract. Dispatching through `send`
   * directly is supported; the reducer clamps.
   *
   * @example
   * ```tsx
   * const muted = useStore(soundEngine.store, (s) => s.muted);
   * ```
   */
  store: Store<SoundState, SoundStoreAction>;
  /**
   * Diagnostic snapshot: the store's state, plus what a settings screen needs
   * and what a test asserts on.
   */
  getState(): SoundState & {
    /** Why the next `play` would be silent, or `null`. */
    silentReason: SoundSilentReason | null;
    /** Cues currently sounding. Bounded by `maxConcurrent`. */
    activeVoices: number;
  };
  /**
   * Release the audio context.
   *
   * @remarks
   * Permanent and idempotent. `muted` and `volume` survive it, so a host that
   * disposes and rebuilds does not silently lose the person's choice. Playback
   * never resumes; build a new engine with {@link createSoundEngine} if sound is
   * wanted again.
   *
   * Library code never calls this on the shared {@link soundEngine}. A cleanup
   * effect that did would silence every other consumer of the singleton for the
   * rest of the session.
   */
  dispose(): void;
}

/**
 * The only place the platform constructor is named, and it is named inside a
 * closure so that importing this module evaluates nothing. A realm without the
 * constructor throws a `ReferenceError` here, which the engine catches and turns
 * into permanent silence.
 */
function defaultAudioContext(): AudioContextLike {
  return new AudioContext();
}

/**
 * A context the host already closed rejects its own `close()`. Disposal has
 * still done everything it set out to do, so the rejection is absorbed rather
 * than surfaced as an unhandled one.
 */
const ignoreCloseRejection = (): void => undefined;

/** Releases a voice's nodes and frees its slot under the concurrency cap. */
type VoiceRelease = () => void;

/**
 * Build an independent sound engine.
 *
 * @remarks
 * Allocates only. No audio context is constructed, probed for, or referenced
 * until the first `play` after unmuting, so calling this at module scope is safe
 * in Node and during SSR.
 *
 * @param options - Starting settings and the audio context seam.
 * @returns An engine whose `store` is safe to subscribe to immediately.
 */
export function createSoundEngine(options: SoundEngineOptions = {}): SoundEngine {
  const { muted = true, volume = 0.3, createAudioContext = defaultAudioContext } = options;
  // Clamped the same way the reducer clamps volume: an out-of-range or non-finite
  // caller value gets a safe floor rather than disabling the cap (`NaN >= x` is
  // always `false`) or muting the engine (a slot count that can never be reached).
  const maxConcurrent = Number.isFinite(options.maxConcurrent)
    ? Math.max(0, Math.trunc(options.maxConcurrent as number))
    : 3;

  // The reducer owns the clamp, so construction options go through it rather
  // than repeating the range check with a second chance to disagree.
  const store = createStore(
    soundReducer(soundReducer(initialSoundState, { type: "setMuted", muted }), {
      type: "setVolume",
      volume,
    }),
    soundReducer,
  );

  const voices = new Set<VoiceRelease>();
  let context: AudioContextLike | null = null;
  let resumePending = false;

  function ensureContext(): AudioContextLike | null {
    if (context) return context;

    let created: AudioContextLike;
    try {
      created = createAudioContext();
    } catch {
      // A realm with no constructor, or a factory that refuses. Either way the
      // engine is silent for the rest of its life, and a subscriber is told so
      // now rather than whenever some unrelated action next fires.
      store.send({ type: "setUnsupported" });
      return null;
    }

    context = created;
    created.onstatechange = () => {
      store.send({ type: "setContextState", contextState: created.state });
    };
    store.send({ type: "setContextState", contextState: created.state });
    return created;
  }

  function requestResume(audio: AudioContextLike): void {
    if (resumePending) return;
    resumePending = true;

    const settle = (): void => {
      resumePending = false;
    };

    try {
      // Not awaited: the cue that triggered this is already dropped, and the
      // rejection handler is what keeps a refused resume off the console.
      audio.resume().then(settle, settle);
    } catch {
      // Safari throws synchronously from `resume()` on a context it considers
      // unusable. The next cue is then free to try again.
      settle();
    }
  }

  /**
   * Builds a cue's graph. Never throws: a seam whose node construction or
   * automation calls throw partway through releases whatever was built so far
   * and frees the concurrency slot, rather than leaking it for the rest of the
   * engine's life. `play`'s "never throws" promise depends on this.
   */
  function startVoice(audio: AudioContextLike, cue: SoundCue, level: number): void {
    const tones = cueTones[cue];
    const startedAt = audio.currentTime;
    const oscillators: OscillatorNode[] = [];
    const gains: GainNode[] = [];
    let sounding = tones.length;
    let released = false;

    const release: VoiceRelease = () => {
      if (released) return;
      released = true;
      voices.delete(release);
      for (const oscillator of oscillators) {
        oscillator.onended = null;
        oscillator.disconnect();
      }
      for (const gain of gains) gain.disconnect();
    };

    // Registered before construction so the slot is taken for the whole life of
    // the graph, including the instant an `ended` handler could fire.
    voices.add(release);

    try {
      for (const tone of tones) {
        const oscillator = audio.createOscillator();
        const gain = audio.createGain();
        oscillators.push(oscillator);
        gains.push(gain);

        const toneStart = startedAt + tone.offset;
        oscillator.type = tone.wave;
        oscillator.frequency.setValueAtTime(tone.frequency, toneStart);
        if (tone.endFrequency !== tone.frequency) {
          oscillator.frequency.exponentialRampToValueAtTime(
            tone.endFrequency,
            toneStart + tone.duration,
          );
        }

        for (const point of tone.envelope) {
          const value = level * point.gain;
          const at = toneStart + point.at;
          if (point.ramp && value > 0) {
            gain.gain.exponentialRampToValueAtTime(value, at);
          } else {
            gain.gain.setValueAtTime(value, at);
          }
        }

        oscillator.connect(gain);
        gain.connect(audio.destination);
        oscillator.onended = () => {
          sounding -= 1;
          if (sounding === 0) release();
        };
        oscillator.start(toneStart);
        oscillator.stop(toneStart + tone.duration);
      }
    } catch {
      release();
    }
  }

  function play(cue: SoundCue): void {
    const settings = store.getState();
    // Every one of these returns before a node exists. After `close()` a dead
    // context still hands out oscillators and gains that never fire `ended`, so
    // a guard that only skipped the audible part would leak a graph per call.
    if (settings.disposed || !settings.supported || settings.muted) return;
    if (voices.size >= maxConcurrent) return;

    const audio = ensureContext();
    if (!audio) return;

    if (audio.state !== "running") {
      if (resumeRecovers(audio.state)) requestResume(audio);
      return;
    }

    startVoice(audio, cue, settings.volume);
  }

  function dispose(): void {
    if (store.getState().disposed) return;

    // Closing the context fires no `ended`, so the bookkeeping is torn down here
    // rather than waiting for events that will never arrive.
    for (const release of [...voices]) release();

    const audio = context;
    context = null;
    if (audio) {
      audio.onstatechange = null;
      audio.close?.().catch(ignoreCloseRejection);
    }

    store.send({ type: "setDisposed" });
    store.send({ type: "setContextState", contextState: "closed" });
  }

  return {
    play,
    setMuted(next) {
      store.send({ type: "setMuted", muted: next });
    },
    setVolume(next) {
      store.send({ type: "setVolume", volume: next });
    },
    store,
    getState() {
      const settings = store.getState();
      return {
        ...settings,
        silentReason: soundSilentReason(settings),
        activeVoices: voices.size,
      };
    },
    dispose,
  };
}

/** Shared engine, muted until the host application unmutes it. */
export const soundEngine: SoundEngine = createSoundEngine();
