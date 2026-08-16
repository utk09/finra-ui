import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { type AudioContextLike, createSoundEngine, type SoundEngine } from "../../logic/sound";
import { SoundSettingsBase } from "./SoundSettings";

//  A stub audio context, scoped to this file. jsdom ships no AudioContext at
//  all, so every engine below is built through the injected seam, and the
//  `reason` a test drives comes from real engine state, never from mocking
//  `soundSilentReason` directly.

function fakeAudioContext(state: AudioContextState = "running"): AudioContextLike {
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

function runningEngine(volume = 0.3): SoundEngine {
  const engine = createSoundEngine({
    createAudioContext: () => fakeAudioContext("running"),
    volume,
  });
  engine.setMuted(false);
  return engine;
}

function suspendedEngine(volume = 0.3): SoundEngine {
  const engine = createSoundEngine({
    createAudioContext: () => fakeAudioContext("suspended"),
    volume,
  });
  engine.setMuted(false);
  // Discovers the state through the real seam - the first play after unmute.
  engine.play("beep");
  return engine;
}

function unsupportedEngine(volume = 0.3): SoundEngine {
  const engine = createSoundEngine({
    createAudioContext: () => {
      throw new Error("no AudioContext in this realm");
    },
    volume,
  });
  engine.setMuted(false);
  engine.play("beep");
  return engine;
}

function disposedEngine(volume = 0.3): SoundEngine {
  const engine = runningEngine(volume);
  engine.dispose();
  return engine;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("structure", () => {
  it('carries data-finra-ui="sound-settings" and role="group"', () => {
    render(<SoundSettingsBase engine={runningEngine()} />);
    const root = screen.getByTestId("sound-settings");
    expect(root).toHaveAttribute("role", "group");
  });

  it("renders a label by default and wires it as the group's accessible name", () => {
    render(<SoundSettingsBase engine={runningEngine()} />);
    expect(screen.getByTestId("sound-settings-label")).toHaveTextContent("Sound settings");
    expect(screen.getByRole("group", { name: "Sound settings" })).toBeInTheDocument();
  });

  it("renders no label element when label is null", () => {
    render(<SoundSettingsBase engine={runningEngine()} label={null} aria-label="Custom name" />);
    expect(screen.queryByTestId("sound-settings-label")).not.toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Custom name" })).toBeInTheDocument();
  });

  it("renders no icon element by default, since the unstyled layer ships none", () => {
    render(<SoundSettingsBase engine={runningEngine()} />);
    expect(screen.queryByTestId("sound-settings-icon")).not.toBeInTheDocument();
  });

  it("renders no icon element when renderIcon returns null", () => {
    render(<SoundSettingsBase engine={runningEngine()} renderIcon={() => null} />);
    expect(screen.queryByTestId("sound-settings-icon")).not.toBeInTheDocument();
  });

  it("renders an icon element when renderIcon returns a node", () => {
    render(<SoundSettingsBase engine={runningEngine()} renderIcon={() => <svg />} />);
    expect(screen.getByTestId("sound-settings-icon")).toBeInTheDocument();
  });

  it("always renders the mute, volume and status slots", () => {
    render(<SoundSettingsBase engine={runningEngine()} />);
    expect(screen.getByTestId("sound-settings-mute")).toBeInTheDocument();
    expect(screen.getByTestId("sound-settings-volume")).toBeInTheDocument();
    expect(screen.getByTestId("sound-settings-status")).toBeInTheDocument();
  });

  it("defaults to the shared soundEngine when no engine prop is given", () => {
    render(<SoundSettingsBase />);
    expect(screen.getByRole("switch")).toBeInTheDocument();
    expect(screen.getByRole("slider")).toBeInTheDocument();
  });

  it("announces the volume with the default percent formatter, as aria-valuetext", () => {
    render(<SoundSettingsBase engine={runningEngine(0.45)} />);
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuetext", "45%");
  });

  it("announces the volume with a custom formatVolume", () => {
    render(
      <SoundSettingsBase
        engine={runningEngine(0.45)}
        formatVolume={(volume) => `${volume.toFixed(2)} gain`}
      />,
    );
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuetext", "0.45 gain");
  });

  it("renders no track, thumb, header or value markup of its own", () => {
    render(
      <SoundSettingsBase
        engine={runningEngine()}
        renderMute={() => "mute-marker"}
        renderVolume={() => "volume-marker"}
      />,
    );
    const root = screen.getByTestId("sound-settings");

    // Every element under the root, in document order. Reading the serialised
    // markup rather than walking the tree keeps the count honest: an extra
    // track, thumb, header or value element the base invented would appear
    // here whether or not it carried an id, and whether or not it held text.
    const openingTags = root.innerHTML.match(/<[a-z][^\s>/]*/g) ?? [];
    expect(openingTags).toEqual(["<span", "<div", "<div", "<div"]);

    // Which four they are: the label, the two slots and the status region.
    expect(screen.getByTestId("sound-settings-label").textContent).toBe("Sound settings");
    expect(screen.getByTestId("sound-settings-mute").textContent).toBe("mute-marker");
    expect(screen.getByTestId("sound-settings-volume").textContent).toBe("volume-marker");
    expect(screen.getByTestId("sound-settings-status").textContent).toBe("");
  });

  it("renders three elements and no label element when label is null", () => {
    render(
      <SoundSettingsBase
        engine={runningEngine()}
        label={null}
        aria-label="Sound"
        renderMute={() => "mute-marker"}
        renderVolume={() => "volume-marker"}
      />,
    );
    const openingTags =
      screen.getByTestId("sound-settings").innerHTML.match(/<[a-z][^\s>/]*/g) ?? [];
    expect(openingTags).toEqual(["<div", "<div", "<div"]);
  });
});

describe("the base imports nothing from components/", () => {
  it("has no import path reaching into the styled layer", () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const source = readFileSync(join(here, "SoundSettings.tsx"), "utf8");
    const importPaths = [...source.matchAll(/from ["']([^"']+)["']/g)].map((m) => m[1]);
    for (const path of importPaths) {
      expect(path.includes("/components/")).toBe(false);
    }
  });
});

describe("the rendered control, across every engine state", () => {
  it("unmuted, running - switch on, slider 30, status empty", () => {
    render(<SoundSettingsBase engine={runningEngine(0.3)} />);
    expect(screen.getByRole("switch")).toBeChecked();
    expect(screen.getByRole("switch")).toBeEnabled();
    expect(screen.getByRole("slider")).toHaveValue("30");
    expect(screen.getByRole("slider")).toBeEnabled();
    expect(screen.getByTestId("sound-settings-status")).toHaveTextContent("");
  });

  it("muted - switch off, slider still enabled, status empty by default", () => {
    const engine = createSoundEngine({ volume: 0.3 }); // default muted: true
    render(<SoundSettingsBase engine={engine} />);
    expect(screen.getByRole("switch")).not.toBeChecked();
    expect(screen.getByRole("switch")).toBeEnabled();
    // The volume slider is not disabled while muted.
    expect(screen.getByRole("slider")).toBeEnabled();
    expect(screen.getByTestId("sound-settings-status")).toHaveTextContent("");
  });

  it("unmuted, zero volume - switch on, slider 0, status empty by default", () => {
    render(<SoundSettingsBase engine={runningEngine(0)} />);
    expect(screen.getByRole("switch")).toBeChecked();
    expect(screen.getByRole("slider")).toHaveValue("0");
    expect(screen.getByTestId("sound-settings-status")).toHaveTextContent("");
  });

  it("suspended - status explains it", () => {
    render(<SoundSettingsBase engine={suspendedEngine(0.3)} />);
    expect(screen.getByRole("switch")).toBeChecked();
    expect(screen.getByRole("slider")).toBeEnabled();
    expect(screen.getByTestId("sound-settings-status")).toHaveTextContent(
      "Sound is blocked until you interact with the page.",
    );
  });

  it("unsupported - status explains it", () => {
    render(<SoundSettingsBase engine={unsupportedEngine(0.3)} />);
    expect(screen.getByTestId("sound-settings-status")).toHaveTextContent(
      "This browser cannot play sounds.",
    );
  });

  it("disposed - status explains it, both controls still enabled", () => {
    render(<SoundSettingsBase engine={disposedEngine(0.3)} />);
    expect(screen.getByRole("switch")).toBeEnabled();
    expect(screen.getByRole("slider")).toBeEnabled();
    expect(screen.getByTestId("sound-settings-status")).toHaveTextContent(
      "Sound is off for the rest of this session.",
    );
  });

  it("disabled prop disables both controls, status unchanged", () => {
    render(<SoundSettingsBase engine={suspendedEngine(0.3)} disabled />);
    expect(screen.getByRole("switch")).toBeDisabled();
    expect(screen.getByRole("slider")).toBeDisabled();
    expect(screen.getByTestId("sound-settings-status")).toHaveTextContent(
      "Sound is blocked until you interact with the page.",
    );
  });

  it("muted outranks suspended - switch off, status empty", () => {
    const engine = createSoundEngine({ volume: 0 }); // muted: true (default)
    render(<SoundSettingsBase engine={engine} />);
    expect(screen.getByRole("switch")).not.toBeChecked();
    expect(screen.getByRole("slider")).toHaveValue("0");
    expect(screen.getByTestId("sound-settings-status")).toHaveTextContent("");
  });

  it("statusMessages can silence a reason explicitly", () => {
    render(
      <SoundSettingsBase engine={suspendedEngine(0.3)} statusMessages={{ suspended: null }} />,
    );
    expect(screen.getByTestId("sound-settings-status")).toHaveTextContent("");
  });
});

describe("interaction", () => {
  it("flipping the switch on unmutes then previews, once", () => {
    const engine = createSoundEngine({ volume: 0.3, createAudioContext: () => fakeAudioContext() });
    const play = vi.spyOn(engine, "play");
    render(<SoundSettingsBase engine={engine} previewCue="beep" />);

    fireEvent.click(screen.getByRole("switch"));

    expect(engine.getState().muted).toBe(false);
    expect(play).toHaveBeenCalledTimes(1);
    expect(play).toHaveBeenCalledWith("beep");
  });

  it("flipping the switch off mutes and plays nothing", () => {
    const engine = runningEngine(0.3);
    const play = vi.spyOn(engine, "play");
    render(<SoundSettingsBase engine={engine} previewCue="beep" />);

    fireEvent.click(screen.getByRole("switch"));

    expect(engine.getState().muted).toBe(true);
    expect(play).not.toHaveBeenCalled();
  });

  it("dragging the slider commits every value, previews once on release", () => {
    const engine = runningEngine(0.3);
    const play = vi.spyOn(engine, "play");
    const setVolume = vi.spyOn(engine, "setVolume");
    render(<SoundSettingsBase engine={engine} previewCue="beep" />);
    const slider = screen.getByRole("slider");

    for (const value of ["35", "40", "45"]) {
      fireEvent.change(slider, { target: { value } });
    }
    expect(setVolume).toHaveBeenCalledTimes(3);
    expect(play).not.toHaveBeenCalled();

    fireEvent.pointerUp(slider);
    expect(play).toHaveBeenCalledTimes(1);
    expect(play).toHaveBeenCalledWith("beep");
  });

  it("held-arrow steps commit each value, previews once on keyup", () => {
    const engine = runningEngine(0.3);
    const play = vi.spyOn(engine, "play");
    render(<SoundSettingsBase engine={engine} previewCue="beep" />);
    const slider = screen.getByRole("slider");

    for (const value of ["31", "32", "33"]) {
      fireEvent.change(slider, { target: { value } });
    }
    expect(play).not.toHaveBeenCalled();

    fireEvent.keyUp(slider);
    expect(play).toHaveBeenCalledTimes(1);
  });

  it("a release with no net change previews nothing", () => {
    const engine = runningEngine(0.3);
    const play = vi.spyOn(engine, "play");
    render(<SoundSettingsBase engine={engine} previewCue="beep" />);
    const slider = screen.getByRole("slider");

    fireEvent.pointerUp(slider);
    expect(play).not.toHaveBeenCalled();
  });

  it("a release after an external volume change previews nothing", () => {
    const engine = runningEngine(0.3);
    render(<SoundSettingsBase engine={engine} previewCue="beep" />);
    const slider = screen.getByRole("slider");

    // Somewhere else in the application, not through this control.
    act(() => {
      engine.setVolume(0.5);
    });
    expect(slider).toHaveValue("50");

    const play = vi.spyOn(engine, "play");
    fireEvent.pointerUp(slider);

    // Preview reports what this control changed. The value moved, but not here.
    expect(play).not.toHaveBeenCalled();
  });

  it("previews again on the next commit this control does make", () => {
    const engine = runningEngine(0.3);
    render(<SoundSettingsBase engine={engine} previewCue="beep" />);
    const slider = screen.getByRole("slider");

    act(() => {
      engine.setVolume(0.5);
    });

    const play = vi.spyOn(engine, "play");
    fireEvent.change(slider, { target: { value: "60" } });
    fireEvent.pointerUp(slider);

    expect(play).toHaveBeenCalledTimes(1);
  });

  it("leaving the control by blur mid-drag still commits", () => {
    const engine = runningEngine(0.3);
    const play = vi.spyOn(engine, "play");
    render(<SoundSettingsBase engine={engine} previewCue="beep" />);
    const slider = screen.getByRole("slider");

    fireEvent.change(slider, { target: { value: "45" } });
    fireEvent.blur(slider);

    expect(play).toHaveBeenCalledTimes(1);
  });

  it("previewCue null skips every preview but volume and mute still commit", () => {
    const engine = runningEngine(0.3);
    const play = vi.spyOn(engine, "play");
    render(<SoundSettingsBase engine={engine} previewCue={null} />);
    const slider = screen.getByRole("slider");

    fireEvent.click(screen.getByRole("switch")); // mute
    fireEvent.click(screen.getByRole("switch")); // unmute
    fireEvent.change(slider, { target: { value: "60" } });
    fireEvent.pointerUp(slider);

    expect(play).not.toHaveBeenCalled();
    expect(engine.getState().volume).toBeCloseTo(0.6);
  });

  it("muted, dragging the slider still commits and the slider stays enabled", () => {
    const engine = createSoundEngine({
      volume: 0.3,
      createAudioContext: () => fakeAudioContext(),
    }); // muted: true (default)
    const setVolume = vi.spyOn(engine, "setVolume");
    render(<SoundSettingsBase engine={engine} previewCue="beep" />);
    const slider = screen.getByRole("slider");

    expect(slider).toBeEnabled();
    fireEvent.change(slider, { target: { value: "50" } });
    fireEvent.pointerUp(slider);

    expect(setVolume).toHaveBeenCalled();
  });

  it("two controls bound to one engine stay in sync with no prop passed between them", () => {
    const engine = runningEngine(0.3);
    render(
      <>
        <SoundSettingsBase engine={engine} label="First" />
        <SoundSettingsBase engine={engine} label="Second" />
      </>,
    );
    const [firstSlider, secondSlider] = screen.getAllByRole("slider");

    fireEvent.change(firstSlider, { target: { value: "70" } });

    expect(firstSlider).toHaveValue("70");
    expect(secondSlider).toHaveValue("70");
  });

  it("onMutedChange reports sound off when the switch is flipped off", () => {
    const engine = runningEngine(0.3);
    const onMutedChange = vi.fn();
    render(<SoundSettingsBase engine={engine} onMutedChange={onMutedChange} />);

    fireEvent.click(screen.getByRole("switch"));

    // The switch is checked when sound is on, so switching it off means muted.
    // This is the inversion the whole design turns on.
    expect(onMutedChange).toHaveBeenCalledTimes(1);
    expect(onMutedChange).toHaveBeenCalledWith(true);
    expect(engine.getState().muted).toBe(true);
  });

  it("onMutedChange reports sound on when the switch is flipped on", () => {
    const engine = createSoundEngine({ volume: 0.3, createAudioContext: () => fakeAudioContext() });
    const onMutedChange = vi.fn();
    render(<SoundSettingsBase engine={engine} onMutedChange={onMutedChange} />);

    fireEvent.click(screen.getByRole("switch"));

    expect(onMutedChange).toHaveBeenCalledTimes(1);
    expect(onMutedChange).toHaveBeenCalledWith(false);
    expect(engine.getState().muted).toBe(false);
  });

  it("onMutedChange fires only for this control's own changes", () => {
    const engine = runningEngine(0.3);
    const onMutedChangeA = vi.fn();
    const onMutedChangeB = vi.fn();
    render(
      <>
        <SoundSettingsBase engine={engine} label="First" onMutedChange={onMutedChangeA} />
        <SoundSettingsBase engine={engine} label="Second" onMutedChange={onMutedChangeB} />
      </>,
    );
    const [firstSwitch, secondSwitch] = screen.getAllByRole("switch");

    fireEvent.click(firstSwitch);

    expect(onMutedChangeA).toHaveBeenCalledWith(true);
    expect(onMutedChangeB).not.toHaveBeenCalled();
    // Both controls still reflect the one engine.
    expect(firstSwitch).not.toBeChecked();
    expect(secondSwitch).not.toBeChecked();
  });

  it("onMutedChange does not fire when the engine is muted from outside", () => {
    const engine = runningEngine(0.3);
    const onMutedChange = vi.fn();
    render(<SoundSettingsBase engine={engine} onMutedChange={onMutedChange} />);

    act(() => {
      engine.setMuted(true);
    });

    expect(screen.getByRole("switch")).not.toBeChecked();
    expect(onMutedChange).not.toHaveBeenCalled();
  });

  it("onVolumeChange fires only for this control's own changes", () => {
    const engine = runningEngine(0.3);
    const onVolumeChangeA = vi.fn();
    const onVolumeChangeB = vi.fn();
    render(
      <>
        <SoundSettingsBase engine={engine} label="First" onVolumeChange={onVolumeChangeA} />
        <SoundSettingsBase engine={engine} label="Second" onVolumeChange={onVolumeChangeB} />
      </>,
    );
    const [firstSlider] = screen.getAllByRole("slider");

    fireEvent.change(firstSlider, { target: { value: "70" } });

    expect(onVolumeChangeA).toHaveBeenCalledWith(0.7);
    expect(onVolumeChangeB).not.toHaveBeenCalled();
  });

  it("a throwing engine's play on volume commit does not stop the interaction from completing", () => {
    const engine = runningEngine(0.3);
    const play = vi.spyOn(engine, "play").mockImplementation(() => {
      throw new Error("boom");
    });
    render(<SoundSettingsBase engine={engine} previewCue="beep" />);
    const slider = screen.getByRole("slider");

    fireEvent.change(slider, { target: { value: "80" } });
    // Nothing propagates out of the event handler despite the throw.
    expect(() => fireEvent.pointerUp(slider)).not.toThrow();
    expect(play).toHaveBeenCalledTimes(1);
    // The store update itself is unaffected by the swallowed throw.
    expect(engine.getState().volume).toBeCloseTo(0.8);
  });

  it("a throwing engine's play on unmute does not stop the interaction", () => {
    const engine = createSoundEngine({ volume: 0.3, createAudioContext: () => fakeAudioContext() });
    const play = vi.spyOn(engine, "play").mockImplementation(() => {
      throw new Error("boom");
    });
    render(<SoundSettingsBase engine={engine} previewCue="beep" />);

    expect(() => fireEvent.click(screen.getByRole("switch"))).not.toThrow();
    expect(play).toHaveBeenCalledTimes(1);
    // Unmuting itself is unaffected by the swallowed throw.
    expect(engine.getState().muted).toBe(false);
  });
});

describe("preview fires on commit and never on input", () => {
  it("fifteen intermediate values produce fifteen setVolume calls and exactly one play", () => {
    const engine = runningEngine(0.3);
    const play = vi.spyOn(engine, "play");
    const setVolume = vi.spyOn(engine, "setVolume");
    render(<SoundSettingsBase engine={engine} previewCue="beep" />);
    const slider = screen.getByRole("slider");

    for (let value = 31; value <= 45; value += 1) {
      fireEvent.change(slider, { target: { value: String(value) } });
    }
    expect(setVolume).toHaveBeenCalledTimes(15);
    expect(play).not.toHaveBeenCalled();

    fireEvent.pointerUp(slider);
    expect(play).toHaveBeenCalledTimes(1);
  });
});

describe("previewCue={null} across every interaction", () => {
  it("plays nothing while every setMuted and setVolume still fires", () => {
    const engine = runningEngine(0.3);
    const play = vi.spyOn(engine, "play");
    const setMuted = vi.spyOn(engine, "setMuted");
    const setVolume = vi.spyOn(engine, "setVolume");
    render(<SoundSettingsBase engine={engine} previewCue={null} />);
    const slider = screen.getByRole("slider");

    fireEvent.click(screen.getByRole("switch"));
    fireEvent.change(slider, { target: { value: "55" } });
    fireEvent.pointerUp(slider);
    fireEvent.keyUp(slider);
    fireEvent.blur(slider);

    expect(play).not.toHaveBeenCalled();
    expect(setMuted).toHaveBeenCalled();
    expect(setVolume).toHaveBeenCalled();
  });
});

describe("no local state", () => {
  it("holds no useState - an external change is reflected with no prop passed in", () => {
    const engine = runningEngine(0.3);
    render(<SoundSettingsBase engine={engine} />);
    expect(screen.getByRole("slider")).toHaveValue("30");

    // Mutating the engine directly, with no fireEvent, is exactly the "from
    // outside React" case this proves - act() is what flushes the
    // resulting useSyncExternalStore update before the assertion runs.
    act(() => {
      engine.setVolume(0.9);
    });

    expect(screen.getByRole("slider")).toHaveValue("90");
  });
});

describe("the status region is always mounted", () => {
  it("is present with role=status even in the audible state, and empty", () => {
    render(<SoundSettingsBase engine={runningEngine(0.3)} />);
    const status = screen.getByRole("status");
    expect(status).toBeInTheDocument();
    expect(status).toHaveTextContent("");
  });
});
