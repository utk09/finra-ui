import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { type AudioContextLike, createSoundEngine } from "../../logic/sound";
import { SoundSettings } from "./SoundSettings";

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

describe("SoundSettings (styled)", () => {
  it("classes every part", () => {
    const engine = createSoundEngine({ createAudioContext: () => fakeAudioContext(), volume: 0.3 });
    engine.setMuted(false);
    render(<SoundSettings engine={engine} />);

    expect(screen.getByTestId("sound-settings").className).toMatch(/soundSettings/);
    expect(screen.getByTestId("sound-settings-label").className).toMatch(/label/);
    expect(screen.getByTestId("sound-settings-icon").className).toMatch(/icon/);
    expect(screen.getByTestId("sound-settings-mute").className).toMatch(/mute/);
    expect(screen.getByTestId("sound-settings-volume").className).toMatch(/volume/);
    expect(screen.getByTestId("sound-settings-status").className).toMatch(/status/);
  });

  it("gives both controls visible text, and that text is their accessible name", () => {
    const engine = createSoundEngine({ createAudioContext: () => fakeAudioContext(), volume: 0.3 });
    engine.setMuted(false);
    render(<SoundSettings engine={engine} />);

    // Visible: what a sighted user reads beside each control.
    expect(screen.getByTestId("switch-label")).toHaveTextContent("Sound");
    expect(screen.getByTestId("slider-label")).toHaveTextContent("Volume");

    // And the same string is the accessible name, so there is one name rather
    // than an aria-label silently overriding what is on screen.
    expect(screen.getByRole("switch", { name: "Sound" })).toBeInTheDocument();
    expect(screen.getByRole("slider", { name: "Volume" })).toBeInTheDocument();
  });

  it("renders custom soundLabel and volumeLabel as that visible text", () => {
    const engine = createSoundEngine({ createAudioContext: () => fakeAudioContext(), volume: 0.3 });
    engine.setMuted(false);
    render(<SoundSettings engine={engine} soundLabel="Alerts" volumeLabel="Level" />);

    expect(screen.getByTestId("switch-label")).toHaveTextContent("Alerts");
    expect(screen.getByTestId("slider-label")).toHaveTextContent("Level");
    expect(screen.getByRole("switch", { name: "Alerts" })).toBeInTheDocument();
    expect(screen.getByRole("slider", { name: "Level" })).toBeInTheDocument();
  });

  it("keeps aria-valuetext on the slider alongside its visible label", () => {
    const engine = createSoundEngine({
      createAudioContext: () => fakeAudioContext(),
      volume: 0.45,
    });
    engine.setMuted(false);
    render(<SoundSettings engine={engine} />);

    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuetext", "45%");
  });

  it("renders the styled Switch and Slider, not the bare bases", () => {
    const engine = createSoundEngine({ createAudioContext: () => fakeAudioContext(), volume: 0.3 });
    engine.setMuted(false);
    render(<SoundSettings engine={engine} />);

    // The styled Switch roots on a label carrying its own track/thumb ids.
    expect(screen.getByTestId("switch-track")).toBeInTheDocument();
  });

  it("shows the plain volume glyph when audible - no diagonal slash", () => {
    const engine = createSoundEngine({ createAudioContext: () => fakeAudioContext(), volume: 0.3 });
    engine.setMuted(false);
    render(<SoundSettings engine={engine} />);

    // The off variant's only difference from the on variant is one <line>,
    // the diagonal slash - see the icon data's own doc comment.
    expect(screen.getByTestId("sound-settings-icon").innerHTML).not.toContain("<line");
  });

  it("shows the crossed-out glyph whenever silentReason is non-null (muted, by default)", () => {
    const engine = createSoundEngine({ volume: 0.3 }); // muted: true (default)
    render(<SoundSettings engine={engine} />);

    expect(screen.getByTestId("sound-settings-icon").innerHTML).toContain("<line");
  });

  it("shows the crossed-out glyph at zero volume", () => {
    const engine = createSoundEngine({ createAudioContext: () => fakeAudioContext(), volume: 0 });
    engine.setMuted(false);
    render(<SoundSettings engine={engine} />);

    expect(screen.getByTestId("sound-settings-icon").innerHTML).toContain("<line");
  });

  it("shows the crossed-out glyph while suspended", () => {
    const engine = createSoundEngine({
      createAudioContext: () => fakeAudioContext("suspended"),
      volume: 0.3,
    });
    engine.setMuted(false);
    engine.play("beep"); // discovers the suspended state through the real seam
    render(<SoundSettings engine={engine} />);

    expect(screen.getByTestId("sound-settings-icon").innerHTML).toContain("<line");
  });

  it("shows the crossed-out glyph when unsupported", () => {
    const engine = createSoundEngine({
      createAudioContext: () => {
        throw new Error("no AudioContext in this realm");
      },
      volume: 0.3,
    });
    engine.setMuted(false);
    engine.play("beep");
    render(<SoundSettings engine={engine} />);

    expect(screen.getByTestId("sound-settings-icon").innerHTML).toContain("<line");
  });

  it("shows the crossed-out glyph when disposed", () => {
    const engine = createSoundEngine({ createAudioContext: () => fakeAudioContext(), volume: 0.3 });
    engine.dispose();
    render(<SoundSettings engine={engine} />);

    expect(screen.getByTestId("sound-settings-icon").innerHTML).toContain("<line");
  });

  it("renderIcon={() => null} renders no icon element, same as the base", () => {
    const engine = createSoundEngine({ createAudioContext: () => fakeAudioContext(), volume: 0.3 });
    engine.setMuted(false);
    render(<SoundSettings engine={engine} renderIcon={() => null} />);

    expect(screen.queryByTestId("sound-settings-icon")).not.toBeInTheDocument();
  });

  it("applies an additional className to the root", () => {
    const engine = createSoundEngine({ createAudioContext: () => fakeAudioContext(), volume: 0.3 });
    render(<SoundSettings engine={engine} className="mine" />);
    expect(screen.getByTestId("sound-settings")).toHaveClass("mine");
  });

  it("forwards ref to the root", () => {
    const engine = createSoundEngine({ createAudioContext: () => fakeAudioContext(), volume: 0.3 });
    let node: HTMLDivElement | null = null;
    render(
      <SoundSettings
        engine={engine}
        ref={(el) => {
          node = el;
        }}
      />,
    );
    expect(node).toBeInstanceOf(HTMLDivElement);
  });
});
