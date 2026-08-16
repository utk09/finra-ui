/**
 * Pure helpers behind the sound settings control: the volume/percent
 * conversion a range input needs, and the default copy for each silent
 * reason the engine can report.
 *
 * Framework-agnostic by design: no React, no DOM, no engine. The percent
 * mapping cannot live in a component file because it is what the control's
 * `aria-valuetext` and rendered value both read from, and a future Lit
 * adapter needs the identical maths.
 */

import type { SoundSilentReason } from "./sound";

// The same rule `soundReducer` applies to volume, so one input never has two
// answers inside one feature: an infinity clamps, because its direction is
// unambiguous, and `NaN` floors. The reducer rejects `NaN` outright, which a
// mapping that must return a number cannot do, so 0 stands in - the one value
// that is never a lie about audibility.
function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
}

/**
 * Engine volume (0..1) as whole percent, for a range input.
 *
 * @remarks
 * Clamps first, then rounds, so an out-of-range or non-finite volume never
 * produces a percent outside 0..100. `Infinity` clamps to 100 and `NaN` floors
 * to 0, matching how `soundReducer` treats each.
 */
export function volumeToPercent(volume: number): number {
  return Math.round(clamp(volume, 0, 1) * 100);
}

/**
 * Whole percent back to engine volume (0..1).
 *
 * @remarks
 * Clamps first, then divides, mirroring {@link volumeToPercent} exactly,
 * infinities and `NaN` included.
 */
export function percentToVolume(percent: number): number {
  return clamp(percent, 0, 100) / 100;
}

/**
 * Default status copy, keyed by the engine's own silent reason.
 *
 * @remarks
 * No entry for `"muted"` or `"volume"`: the switch and the slider already say
 * those states, so a status message would repeat what is already visible.
 */
export const defaultSoundStatusMessages: Partial<Record<SoundSilentReason, string>> = {
  suspended: "Sound is blocked until you interact with the page.",
  unsupported: "This browser cannot play sounds.",
  disposed: "Sound is off for the rest of this session.",
};
