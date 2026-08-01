import type { IncrementAction } from "./increment";

/**
 * Consumer-configurable keyboard mapping for the finance numeric inputs. Keys
 * are normalized to a chord string (`"shift+ArrowUp"`); each maps to a semantic
 * {@link KeyAction}. This decouples *which key* from *what it does*, so a
 * consuming app can bind Arrow Up to a tick, a primary digit, or anything else
 * (PP-002). Merge over {@link DEFAULT_PRICE_KEYMAP} to override selectively.
 */

/** How Left/Right arrows move the caret (the component performs the move). */
export type NavMode = "digit" | "primary" | "group" | "standard";

/** What a bound key does. */
export type KeyAction =
  | { kind: "increment"; direction: 1 | -1; action: IncrementAction }
  | { kind: "nav"; direction: 1 | -1; mode: NavMode }
  | { kind: "commit" }
  | { kind: "revert" };

/**
 * The subset of a keyboard event this module reads.
 *
 * @remarks
 * Structural rather than the DOM type, so the keymap stays framework-free and
 * can be driven from a plain object in tests or from a Lit adapter.
 */
export interface KeyEventLike {
  /** The `KeyboardEvent.key` value, e.g. `"ArrowUp"` or `"d"`. Case matters for letters. */
  key: string;
  /** Shift held. */
  shiftKey?: boolean;
  /** Control held. */
  ctrlKey?: boolean;
  /** Alt (Option) held. */
  altKey?: boolean;
  /** Meta (Command / Windows) held. */
  metaKey?: boolean;
}

/**
 * A binding table from key chord to action.
 *
 * @remarks
 * Data, not a switch, so a desk can rebind keys without forking the component.
 * Chords are built by {@link keyChord} in a fixed modifier order
 * (`ctrl+alt+shift+meta+Key`), so a table's keys must follow it to match.
 */
export type KeyMap = Record<string, KeyAction>;

/** Normalize an event to a deterministic chord: `ctrl+alt+shift+meta+<key>`. */
export function keyChord(event: KeyEventLike): string {
  const mods: string[] = [];
  if (event.ctrlKey) mods.push("ctrl");
  if (event.altKey) mods.push("alt");
  if (event.shiftKey) mods.push("shift");
  if (event.metaKey) mods.push("meta");
  return [...mods, event.key].join("+");
}

/** Look up the action bound to an event, or `undefined` if unmapped. */
export function resolveKey(event: KeyEventLike, keymap: KeyMap): KeyAction | undefined {
  return keymap[keyChord(event)];
}

/**
 * Amount stepping: Arrow = ±`step`, Shift+Arrow and Page = ±`largeStep`
 * (ten steps by default). Enter commits, Escape reverts. Left/Right are left
 * unbound so the caret moves natively - an amount has no digit groups worth
 * navigating between.
 *
 * A factory rather than a constant because the step is a prop: a module-level
 * map cannot name a value that does not exist until render.
 */
export function createAmountKeymap(step: number, largeStep: number = step * 10): KeyMap {
  return {
    ArrowUp: { kind: "increment", direction: 1, action: { type: "amount", amount: step } },
    ArrowDown: { kind: "increment", direction: -1, action: { type: "amount", amount: step } },
    "shift+ArrowUp": {
      kind: "increment",
      direction: 1,
      action: { type: "amount", amount: largeStep },
    },
    "shift+ArrowDown": {
      kind: "increment",
      direction: -1,
      action: { type: "amount", amount: largeStep },
    },
    PageUp: { kind: "increment", direction: 1, action: { type: "amount", amount: largeStep } },
    PageDown: { kind: "increment", direction: -1, action: { type: "amount", amount: largeStep } },
    Enter: { kind: "commit" },
    Escape: { kind: "revert" },
  };
}

/**
 * Sensible default: Arrow = ±1 tick, Shift+Arrow = ±10 ticks, Ctrl+Arrow =
 * ±1 primary digit; Left/Right = digit navigation; Enter commits, Escape
 * reverts. Consumers override any binding.
 */
export const DEFAULT_PRICE_KEYMAP: KeyMap = {
  ArrowUp: { kind: "increment", direction: 1, action: { type: "tick" } },
  ArrowDown: { kind: "increment", direction: -1, action: { type: "tick" } },
  "shift+ArrowUp": { kind: "increment", direction: 1, action: { type: "tick", ticks: 10 } },
  "shift+ArrowDown": { kind: "increment", direction: -1, action: { type: "tick", ticks: 10 } },
  "ctrl+ArrowUp": { kind: "increment", direction: 1, action: { type: "primary" } },
  "ctrl+ArrowDown": { kind: "increment", direction: -1, action: { type: "primary" } },
  ArrowLeft: { kind: "nav", direction: -1, mode: "digit" },
  ArrowRight: { kind: "nav", direction: 1, mode: "digit" },
  Enter: { kind: "commit" },
  Escape: { kind: "revert" },
};
