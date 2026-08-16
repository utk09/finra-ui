import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  type AudioContextLike,
  Button,
  componentIds,
  createSoundEngine,
  type SoundCue,
  type SoundEngine,
  SoundSettings,
} from "@utk09/finra-ui";
import { SoundSettingsBase } from "@utk09/finra-ui/unstyled";
import { useEffect, useState } from "react";
import { expect, userEvent, within } from "storybook/test";

import { forwardsTo, inDark, LabelledRow, part, Row, Stack, TokenScope } from "./_shared";

const meta: Meta<typeof SoundSettings> = {
  title: "Components/SoundSettings",
  component: SoundSettings,
  parameters: {
    layout: "padded",
    docs: {
      inheritsFrom: SoundSettingsBase,
      inheritedOmit: ["classNames", "renderMute", "renderVolume"],
      forwardsTo: forwardsTo("div"),
    },
  },
  tags: ["autodocs", "a11y-test"],
  argTypes: {
    engine: { control: { disable: true } },
    label: { control: "text", table: { defaultValue: { summary: "Sound settings" } } },
    soundLabel: { control: "text", table: { defaultValue: { summary: "Sound" } } },
    volumeLabel: { control: "text", table: { defaultValue: { summary: "Volume" } } },
    previewCue: {
      control: "select",
      options: ["chime", "buzz", "beep", "click"],
      description:
        "Cue played on commit. Flip the switch on, or drag the slider and release, to hear it.",
      table: { defaultValue: { summary: "beep" } },
    },
    disabled: { control: "boolean", table: { defaultValue: { summary: "false" } } },
    formatVolume: { control: { disable: true } },
    statusMessages: { control: { disable: true } },
    onMutedChange: { control: { disable: true } },
    onVolumeChange: { control: { disable: true } },
    renderIcon: { control: { disable: true } },
    className: { control: { disable: true } },
  },
  args: {
    label: "Sound settings",
    soundLabel: "Sound",
    volumeLabel: "Volume",
    previewCue: "beep",
    disabled: false,
  },
  render: function Render(args) {
    const engine = useRealEngine();
    return <SoundSettings {...args} engine={engine} />;
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

//  Deterministic stub, reused across the state-demonstration stories so axe
//  audits a reproducible DOM rather than depending on the browser's autoplay
//  heuristics.

function stubAudioContext(state: AudioContextState = "running"): AudioContextLike {
  const context = {
    state,
    currentTime: 0,
    destination: {},
    createOscillator: () => ({
      frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} },
      connect() {},
      disconnect() {},
      start() {},
      stop() {},
      onended: null,
    }),
    createGain: () => ({
      gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} },
      connect() {},
      disconnect() {},
    }),
    resume: () => Promise.resolve(),
    close: () => Promise.resolve(),
  };
  return context as unknown as AudioContextLike;
}

/**
 * One engine per mount, released on unmount.
 *
 * Releasing matters for the real-context stories: browsers cap how many audio
 * contexts a page may hold at once, and a story visited repeatedly would
 * accumulate one per visit until `createAudioContext` throws and the control
 * reports "This browser cannot play sounds." - a defect in the story
 * environment that reads as a defect in the component.
 */
function useEngine(build: () => SoundEngine): SoundEngine {
  const [engine] = useState(build);
  useEffect(() => () => engine.dispose(), [engine]);
  return engine;
}

function useStubEngine(
  state: AudioContextState,
  options: { volume?: number; unmute?: boolean; probe?: boolean } = {},
): SoundEngine {
  return useEngine(() => {
    const engine = createSoundEngine({
      volume: options.volume ?? 0.3,
      createAudioContext: () => stubAudioContext(state),
    });
    if (options.unmute) engine.setMuted(false);
    // Constructs the context so `contextState` reflects `state` above -
    // without a play, the engine never learns anything about the seam.
    if (options.probe) engine.play("beep");
    return engine;
  });
}

/** A fresh, real engine per mount - the interactive demo you can actually hear. */
function useRealEngine(options: { unmute?: boolean; volume?: number } = {}): SoundEngine {
  return useEngine(() => {
    const engine = createSoundEngine({ volume: options.volume });
    if (options.unmute) engine.setMuted(false);
    return engine;
  });
}

/**
 * The shared engine ships muted, so this story starts silent. Flip the
 * switch to unmute and hear the preview cue - this is the one story bound to
 * a real `AudioContext` rather than a stub. Pick a different `previewCue`
 * from the Controls panel below to hear the other three.
 */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const sound = canvas.getByRole("switch");
    await expect(sound).not.toBeChecked();
    // The native input is visually hidden with `pointer-events: none` (house
    // pattern - see Switch's own stories, which click visible label text
    // instead). This switch has no visible text, only `aria-label`, so the
    // interaction goes through the keyboard rather than a pointer click -
    // Space toggles a native checkbox-backed switch, and needs no id lookup
    // at all, so it behaves identically under `pnpm dev` and `test:stories`.
    sound.focus();
    await userEvent.keyboard(" ");
    await expect(sound).toBeChecked();
  },
};

/**
 * The four cues, each on its own button, playing through one real engine that
 * is already unmuted. This is the story to open to hear what the vocabulary
 * sounds like; `Default`'s Controls panel is where you pick which one the
 * control itself previews.
 *
 * Names describe the waveform and never the meaning, so mapping a cue onto a
 * fill, a save or a delivery is yours to decide.
 */
export const Cues: Story = {
  render: function Render() {
    const engine = useRealEngine({ unmute: true, volume: 0.3 });
    const cues: { cue: SoundCue; what: string }[] = [
      { cue: "chime", what: "Two rising sine tones. Affirmative, the loudest of the four." },
      { cue: "buzz", what: "Harsh sawtooth, pulse-pause-pulse. Deliberately unpleasant." },
      { cue: "beep", what: "One short sine tone. Attention without alarm." },
      { cue: "click", what: "A 15ms rising sweep. Feedback for a discrete action." },
    ];
    return (
      <Stack gap="1.5rem">
        <SoundSettings engine={engine} />
        <Stack gap="0.75rem">
          {cues.map(({ cue, what }) => (
            <Row key={cue} gap="0.75rem">
              <Button variant="secondary" onClick={() => engine.play(cue)}>
                Play {cue}
              </Button>
              <span style={{ color: "var(--finra-container-foreground)" }}>{what}</span>
            </Row>
          ))}
        </Stack>
      </Stack>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // The engine starts unmuted here, unlike every other story.
    await expect(canvas.getByRole("switch")).toBeChecked();
    for (const cue of ["chime", "buzz", "beep", "click"]) {
      await expect(canvas.getByRole("button", { name: `Play ${cue}` })).toBeEnabled();
    }
  },
};

/**
 * The engine's own default: muted, so nothing plays until a person opts in.
 * Flip the switch to unmute, and the preview cue sounds on the same gesture -
 * this engine is real, so that gesture is also what starts its audio context.
 */
export const Muted: Story = {
  render: function Render() {
    const engine = useRealEngine();
    return <SoundSettings engine={engine} />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("switch")).not.toBeChecked();
    await expect(canvas.getByRole("status")).toHaveTextContent("");
  },
};

/**
 * Zero volume is not mute, and reports as itself: the switch stays on. Drag
 * the slider up and release to hear the level you set.
 */
export const ZeroVolume: Story = {
  render: function Render() {
    const engine = useRealEngine({ unmute: true, volume: 0 });
    return <SoundSettings engine={engine} />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("switch")).toBeChecked();
    await expect(canvas.getByRole("slider")).toHaveValue("0");
  },
};

/**
 * Blocked until the next user gesture, which in a real application is the one
 * case a single click fixes.
 *
 * **This story cannot make a sound, by design.** Its engine is pinned to a
 * suspended stub context so the state is reproducible for the accessibility
 * check; interacting with it changes the settings but never reaches an audio
 * device. `Cues` and `Default` are the audible ones.
 */
export const Suspended: Story = {
  render: function Render() {
    const engine = useStubEngine("suspended", { unmute: true, probe: true });
    return <SoundSettings engine={engine} />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("status")).toHaveTextContent(
      "Sound is blocked until you interact with the page.",
    );
  },
};

/**
 * No audio context could be built in this realm. Nothing fixes it, and this
 * story cannot make a sound: its engine is given a factory that throws.
 */
export const Unsupported: Story = {
  render: function Render() {
    const engine = useEngine(() => {
      const built = createSoundEngine({
        createAudioContext: () => {
          throw new Error("no AudioContext in this realm");
        },
      });
      built.setMuted(false);
      built.play("beep");
      return built;
    });
    return <SoundSettings engine={engine} />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("status")).toHaveTextContent("This browser cannot play sounds.");
  },
};

/**
 * Permanent for this engine's lifetime. Both controls stay reachable
 * regardless, and this story cannot make a sound: its engine is disposed
 * before it renders, which is a one-way door by design.
 */
export const Disposed: Story = {
  render: function Render() {
    const engine = useEngine(() => {
      const built = createSoundEngine({ createAudioContext: () => stubAudioContext() });
      built.dispose();
      return built;
    });
    return <SoundSettings engine={engine} />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("status")).toHaveTextContent(
      "Sound is off for the rest of this session.",
    );
    await expect(canvas.getByRole("switch")).toBeEnabled();
    await expect(canvas.getByRole("slider")).toBeEnabled();
  },
};

/**
 * `label={null}` drops the group heading only. The switch and the slider keep
 * their own visible text, which is `soundLabel` and `volumeLabel` and not this
 * prop, so what disappears here is the "Sound settings" line above them.
 *
 * Pass `aria-label` alongside it so the group still has an accessible name.
 */
export const NoGroupLabel: Story = {
  render: function Render() {
    const engine = useRealEngine({ unmute: true });
    return <SoundSettings engine={engine} label={null} aria-label="Sound settings" />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(part(canvasElement, componentIds.soundSettingsLabel)).toBeNull();
    await expect(canvas.getByRole("group", { name: "Sound settings" })).toBeInTheDocument();
    // The per-control names are a different prop and are unaffected.
    await expect(canvas.getByRole("switch", { name: "Sound" })).toBeInTheDocument();
    await expect(canvas.getByRole("slider", { name: "Volume" })).toBeInTheDocument();
  },
};

/**
 * The speaker glyph sits on the switch's line, so it reads as the state of the
 * control beside it rather than as a heading of its own.
 *
 * The layout is a two-column grid on the root: the icon owns column one, the
 * mute switch owns column two, and the label, the slider and the status region
 * each span both. Nothing is placed by row number, because the label and the
 * icon are independently optional, so all four combinations below fall out of
 * auto-placement with no special case. The column gap is zero and the icon
 * carries its own trailing margin, which is what keeps the switch flush with
 * everything else when no icon renders.
 *
 * To restyle it, redeclare the grid against `[data-finra-ui="sound-settings"]`
 * and place the part ids yourself; consumer CSS wins over the library's layer.
 */
export const IconAlignment: Story = {
  parameters: { layout: "padded" },
  render: function Render() {
    // Stubs, not real engines: this story is about geometry, and it should
    // build no audio context at all.
    const withBoth = useStubEngine("running", { unmute: true });
    const noLabel = useStubEngine("running", { unmute: true });
    const noIcon = useStubEngine("running", { unmute: true });
    const neither = useStubEngine("running", { unmute: true });
    return (
      <Stack gap="2rem">
        <LabelledRow label="Label and icon">
          <SoundSettings engine={withBoth} />
        </LabelledRow>
        <LabelledRow label="No label">
          <SoundSettings engine={noLabel} label={null} aria-label="No label" />
        </LabelledRow>
        <LabelledRow label="No icon">
          <SoundSettings engine={noIcon} renderIcon={() => null} aria-label="No icon" />
        </LabelledRow>
        <LabelledRow label="Neither">
          <SoundSettings
            engine={neither}
            label={null}
            renderIcon={() => null}
            aria-label="Neither"
          />
        </LabelledRow>
      </Stack>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const [withBoth, noLabel, noIcon, neither] = canvas.getAllByRole("group");

    // The grid places the mute slot, so that is what gets measured, not the
    // switch's own track. The status region is always rendered and always spans
    // both columns, which makes it the reference for where a full-width row
    // starts.
    const edges = (group: HTMLElement) => {
      const mute = part(group, componentIds.soundSettingsMute);
      const row = part(group, componentIds.soundSettingsStatus);
      const icon = part(group, componentIds.soundSettingsIcon);
      if (!mute || !row) throw new Error("the mute slot and the status region always render");
      return {
        mute: mute.getBoundingClientRect(),
        rowLeft: row.getBoundingClientRect().left,
        icon: icon?.getBoundingClientRect(),
      };
    };

    for (const group of [withBoth, noLabel]) {
      const { mute, rowLeft, icon } = edges(group);
      if (!icon) throw new Error("expected an icon in this variant");

      // Same line: the two boxes overlap vertically.
      await expect(icon.top).toBeLessThan(mute.bottom);
      await expect(icon.bottom).toBeGreaterThan(mute.top);
      // Icon first, switch after it, and the switch is therefore indented past
      // where a full-width row begins.
      await expect(mute.left).toBeGreaterThanOrEqual(icon.right);
      await expect(mute.left).toBeGreaterThan(rowLeft);
      // The icon itself starts the row, so nothing is indented by a phantom column.
      await expect(Math.abs(icon.left - rowLeft)).toBeLessThan(1);
    }

    // The other state, without which the checks above pass on a layout that
    // always indents: with no icon the column collapses and the switch is flush.
    for (const group of [noIcon, neither]) {
      const { mute, rowLeft, icon } = edges(group);
      await expect(icon).toBeUndefined();
      await expect(Math.abs(mute.left - rowLeft)).toBeLessThan(1);
    }
  },
};

/**
 * The icon, the label and the status copy are all reachable by selector, and
 * the fill colour the switch and slider pick up is a token. All three are
 * real, unstubbed engines - restyling changes nothing about the sound.
 *
 * ```css
 * .sound-settings-override [data-finra-ui="sound-settings-label"] {
 *   font-weight: 700;
 * }
 * ```
 */
export const Overrides: Story = {
  parameters: { layout: "padded" },
  render: function Render() {
    const defaultEngine = useRealEngine({ unmute: true });
    const tokenEngine = useRealEngine({ unmute: true });
    const selectorEngine = useRealEngine({ unmute: true });
    return (
      <>
        <style>{`
          .sound-settings-override [data-finra-ui="sound-settings-label"] {
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: var(--finra-tracking-wide);
          }
          .sound-settings-override [data-finra-ui="sound-settings-icon"] {
            color: var(--finra-status-info-accent);
          }
        `}</style>
        <Stack gap="1.5rem">
          <LabelledRow label="Default">
            <SoundSettings engine={defaultEngine} />
          </LabelledRow>
          <TokenScope tokens={{ "--finra-actionable-accent": "#7c3aed" }}>
            <LabelledRow label="Recoloured token">
              <SoundSettings engine={tokenEngine} />
            </LabelledRow>
          </TokenScope>
          <div className="sound-settings-override">
            <LabelledRow label="Restyled by selector">
              <SoundSettings engine={selectorEngine} />
            </LabelledRow>
          </div>
        </Stack>
      </>
    );
  },
};

/** Dark-mode counterpart of `Default`, so the accessibility check audits dark contrast. */
export const DarkMode: Story = inDark(Default);

/**
 * The sound engine ships no story of its own, so this is the first
 * real-Chromium surface it reaches. Renders nothing visible; the assertion
 * is the point.
 *
 * Measures the summed peak sample of concurrent cues through a real
 * `OfflineAudioContext`, confirming the shipped cap (three) never clips for
 * any cue, and that removing it would: three of the four cues clip on a
 * fourth voice, and `click` - the shortest, fastest-decaying one - clips on
 * a fifth instead. Measured directly, not assumed: `click`'s short envelope
 * decays before its waveform reaches the same near-peak the other three do,
 * so it does not follow their four-voice threshold.
 */
export const ClippingCheck: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <p>
      This story carries no visible control. Its play function measures peak sample level for
      concurrent cues through a real <code>OfflineAudioContext</code>.
    </p>
  ),
  play: async () => {
    // Concurrency at which each cue's summed peak first exceeds 1.0, measured
    // against a real OfflineAudioContext.
    const clipsAt: Record<SoundCue, number> = { chime: 4, buzz: 4, beep: 4, click: 5 };

    // The graph has to be built before `startRendering` is called - that is
    // how an OfflineAudioContext is meant to be driven. So the seam reports
    // "running" immediately rather than waiting on the real context's own
    // state, which only flips once rendering has already started.
    function buildingSeam(real: OfflineAudioContext): AudioContextLike {
      return {
        get state(): AudioContextState {
          return "running";
        },
        get currentTime() {
          return real.currentTime;
        },
        destination: real.destination,
        createOscillator: () => real.createOscillator(),
        createGain: () => real.createGain(),
        resume: () => Promise.resolve(),
      } as unknown as AudioContextLike;
    }

    async function peakSample(concurrent: number, cue: SoundCue): Promise<number> {
      const real = new OfflineAudioContext(1, Math.ceil(44100 * 0.4), 44100);
      const engine = createSoundEngine({
        createAudioContext: () => buildingSeam(real),
        volume: 0.3,
        maxConcurrent: concurrent,
      });
      engine.setMuted(false);
      for (let i = 0; i < concurrent; i += 1) engine.play(cue);

      const buffer = await real.startRendering();
      const samples = buffer.getChannelData(0);
      let peak = 0;
      for (let i = 0; i < samples.length; i += 1) peak = Math.max(peak, Math.abs(samples[i]));
      return peak;
    }

    for (const cue of Object.keys(clipsAt) as SoundCue[]) {
      const shipped = await peakSample(3, cue);
      await expect(shipped).toBeLessThan(1.0);

      const overCap = await peakSample(clipsAt[cue], cue);
      await expect(overCap).toBeGreaterThan(1.0);
    }
  },
};
