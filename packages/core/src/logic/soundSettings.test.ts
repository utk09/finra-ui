import { describe, expect, it } from "vitest";

import { initialSoundState, soundReducer } from "./sound";
import { defaultSoundStatusMessages, percentToVolume, volumeToPercent } from "./soundSettings";

describe("volumeToPercent", () => {
  it.each([
    [0.3, 30, "the engine default"],
    [0, 0, "valid volume, not mute"],
    [1, 100, "boundary"],
    [0.456, 46, "display rounds; the engine is never written back to"],
    [0.004, 0, "rounds to zero while the engine is above zero"],
    [0.005, 1, "half rounds up"],
    [5, 100, "clamped before rounding"],
    [-1, 0, "clamped"],
    [Number.NaN, 0, "no honest percent exists; zero is the safe floor"],
    [
      Number.POSITIVE_INFINITY,
      100,
      "clamped, since the direction is unambiguous - the rule soundReducer applies",
    ],
    [Number.NEGATIVE_INFINITY, 0, "clamped at the other end for the same reason"],
  ])("volumeToPercent(%s) is %s (%s)", (volume, expected) => {
    expect(volumeToPercent(volume)).toBe(expected);
  });
});

describe("percentToVolume", () => {
  it.each([
    [30, 0.3, "30 / 100 is the same double as the literal 0.3"],
    [0, 0, ""],
    [100, 1, ""],
    [150, 1, "clamped"],
    [-5, 0, "clamped"],
    [Number.NaN, 0, ""],
    [Number.POSITIVE_INFINITY, 1, "clamped, mirroring volumeToPercent"],
    [Number.NEGATIVE_INFINITY, 0, "clamped, mirroring volumeToPercent"],
  ])("percentToVolume(%s) is %s (%s)", (percent, expected) => {
    expect(percentToVolume(percent)).toBe(expected);
  });
});

describe("one input, one answer across the feature", () => {
  it("clamps an infinity by direction and floors NaN, the way soundReducer does", () => {
    // soundReducer clamps Infinity to the engine's maximum volume and rejects
    // NaN outright. A mapping that must return a number cannot reject, so it
    // floors - but it must not disagree about the infinities.
    const clampedHigh = soundReducer(initialSoundState, {
      type: "setVolume",
      volume: Number.POSITIVE_INFINITY,
    });
    expect(volumeToPercent(Number.POSITIVE_INFINITY)).toBe(volumeToPercent(clampedHigh.volume));

    const clampedLow = soundReducer(initialSoundState, {
      type: "setVolume",
      volume: Number.NEGATIVE_INFINITY,
    });
    expect(volumeToPercent(Number.NEGATIVE_INFINITY)).toBe(volumeToPercent(clampedLow.volume));
  });
});

describe("round trip", () => {
  it("percentToVolume(volumeToPercent(v)) is idempotent for any v the control itself produced", () => {
    for (let percent = 0; percent <= 100; percent += 1) {
      const volume = percentToVolume(percent);
      expect(percentToVolume(volumeToPercent(volume))).toBe(volume);
    }
  });
});

describe("defaultSoundStatusMessages", () => {
  it("carries no entry for muted or volume, since the switch and slider already say those", () => {
    expect(defaultSoundStatusMessages.muted).toBeUndefined();
    expect(defaultSoundStatusMessages.volume).toBeUndefined();
  });

  it("carries a message for suspended, unsupported and disposed", () => {
    expect(defaultSoundStatusMessages.suspended).toBe(
      "Sound is blocked until you interact with the page.",
    );
    expect(defaultSoundStatusMessages.unsupported).toBe("This browser cannot play sounds.");
    expect(defaultSoundStatusMessages.disposed).toBe("Sound is off for the rest of this session.");
  });
});
