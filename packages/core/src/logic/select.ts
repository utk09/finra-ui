/**
 * Framework-agnostic logic for a select-only combobox (APG "Select-Only
 * Combobox" pattern: a `role="combobox"` button with `aria-activedescendant`
 * driving a popup `role="listbox"`).
 *
 * Keyboard handling is expressed as data (key -> effects) so the React executor
 * and a future Lit adapter drive the exact same decisions.
 */

/**
 * One option in a Select.
 *
 * @remarks
 * Flat by design - a select-only combobox has no grouping in this pattern. If
 * you need groups, favourites or free text, reach for ComboBox instead.
 *
 * @typeParam T - Type of the option's value. Defaults to `string`; a union of
 * literals makes the selected value narrow automatically.
 */
export interface SelectOptionData<T = string> {
  /** Identity. What a selection reports, and what equality is tested on. */
  value: T;
  /** Human-readable text. Both the visible label and what typeahead matches. */
  label: string;
  /** Rendered but not selectable; skipped by arrows, Home/End and typeahead. */
  disabled?: boolean;
}

//  Index helpers (pure, no DOM)

/** Index of the option whose value equals `value`, or -1. */
export function findSelectedIndex<T>(
  options: readonly SelectOptionData<T>[],
  value: T | undefined,
): number {
  return options.findIndex((option) => option.value === value);
}

/** First enabled index, or -1 when every option is disabled/empty. */
export function firstEnabledIndex<T>(options: readonly SelectOptionData<T>[]): number {
  return options.findIndex((option) => !option.disabled);
}

/** Last enabled index, or -1 when every option is disabled/empty. */
export function lastEnabledIndex<T>(options: readonly SelectOptionData<T>[]): number {
  for (let i = options.length - 1; i >= 0; i--) {
    if (!options[i].disabled) return i;
  }
  return -1;
}

/**
 * Next enabled index from `from` moving in `direction` (+1/-1). Wraps when
 * `loop` is true. `from` may be -1 (nothing active yet). Returns `from` when no
 * enabled option exists in range.
 */
export function nextEnabledIndex<T>(
  options: readonly SelectOptionData<T>[],
  from: number,
  direction: 1 | -1,
  loop: boolean,
): number {
  const count = options.length;
  if (count === 0) return -1;

  let index = from;
  for (let step = 0; step < count; step++) {
    index += direction;
    if (index < 0) {
      if (!loop) break;
      index = count - 1;
    } else if (index >= count) {
      if (!loop) break;
      index = 0;
    }
    if (!options[index].disabled) return index;
  }

  // No enabled option in the traveled range: stay put if `from` is itself
  // enabled, otherwise fall back to the first enabled option (or -1 if none).
  if (from >= 0 && from < count && !options[from].disabled) return from;
  return firstEnabledIndex(options);
}

/**
 * Index of the first enabled option whose label starts with `query`
 * (case-insensitive), searching after `from` and wrapping. Returns -1 for none.
 */
export function typeaheadIndex<T>(
  options: readonly SelectOptionData<T>[],
  query: string,
  from: number,
): number {
  const needle = query.toLowerCase();
  if (needle.length === 0) return -1;
  const count = options.length;
  for (let step = 1; step <= count; step++) {
    const index = (from + step) % count;
    const option = options[index];
    if (!option.disabled && option.label.toLowerCase().startsWith(needle)) return index;
  }
  return -1;
}

//  Keyboard resolution (key -> effects)

/**
 * A single state change the adapter should apply, emitted by
 * {@link resolveSelectKey}.
 *
 * @remarks
 * Data rather than callbacks, so the same decisions drive React today and Lit
 * later, and so they can be asserted directly in tests.
 */
export type SelectEffect =
  /** Show the popup, with `activeIndex` pre-highlighted (the selected option, or the first enabled one). */
  | { type: "open"; activeIndex: number }
  /** Hide the popup. Does not change the selection. */
  | { type: "close" }
  /** Move the highlight without selecting - this is `aria-activedescendant`, not a commit. */
  | { type: "setActive"; index: number }
  /** Commit the option at `index`. The adapter also closes the popup afterwards. */
  | { type: "select"; index: number };

/** Everything a Select keydown decision needs, with zero framework/DOM coupling. */
export interface SelectKeyContext<T = string> {
  /** Whether the popup is currently shown. Most keys mean different things when it is not. */
  open: boolean;
  /** Index of the highlighted option, or `-1` for none. */
  activeIndex: number;
  /** Index of the committed option, or `-1` for none. Opening highlights this first. */
  selectedIndex: number;
  /** The full flat option list. Needed because navigation skips disabled entries. */
  options: readonly SelectOptionData<T>[];
  /** Wrap navigation past the ends. Default true. */
  loop?: boolean;
}

/** The decision for one keypress: what to suppress, and what to do. */
export interface SelectKeyResult {
  /** Whether the adapter should call `event.preventDefault()`. */
  preventDefault: boolean;
  /** Effects to apply in order. Empty means the key was not handled here. */
  effects: SelectEffect[];
}

const OPEN_KEYS = new Set(["ArrowDown", "ArrowUp", "Enter", " "]);

/** Active index to land on when opening, based on selection and open direction. */
function openActiveIndex<T>(ctx: SelectKeyContext<T>, key: string): number {
  if (ctx.selectedIndex >= 0 && !ctx.options[ctx.selectedIndex]?.disabled) {
    return ctx.selectedIndex;
  }
  return key === "ArrowUp" ? lastEnabledIndex(ctx.options) : firstEnabledIndex(ctx.options);
}

/**
 * Decide what one keypress on a Select should do.
 *
 * @remarks
 * Pure - it reads the context and returns effects, touching no DOM and no
 * framework state. Handles both the open and closed cases: typeahead and the
 * arrows open the popup when it is shut, rather than being inert.
 *
 * @typeParam T - Type of an option's value.
 * @param key - The `KeyboardEvent.key` value.
 * @param ctx - Current open state, indices and options.
 * @returns Whether to suppress the event, and the effects to apply.
 */
export function resolveSelectKey<T = string>(
  key: string,
  ctx: SelectKeyContext<T>,
): SelectKeyResult {
  const loop = ctx.loop ?? true;

  if (!ctx.open) {
    if (OPEN_KEYS.has(key)) {
      return {
        preventDefault: true,
        effects: [{ type: "open", activeIndex: openActiveIndex(ctx, key) }],
      };
    }
    return { preventDefault: false, effects: [] };
  }

  switch (key) {
    case "ArrowDown":
      return {
        preventDefault: true,
        effects: [
          { type: "setActive", index: nextEnabledIndex(ctx.options, ctx.activeIndex, 1, loop) },
        ],
      };
    case "ArrowUp":
      return {
        preventDefault: true,
        effects: [
          { type: "setActive", index: nextEnabledIndex(ctx.options, ctx.activeIndex, -1, loop) },
        ],
      };
    case "Home":
      return {
        preventDefault: true,
        effects: [{ type: "setActive", index: firstEnabledIndex(ctx.options) }],
      };
    case "End":
      return {
        preventDefault: true,
        effects: [{ type: "setActive", index: lastEnabledIndex(ctx.options) }],
      };
    case "Enter":
    case " ":
      return ctx.activeIndex >= 0
        ? { preventDefault: true, effects: [{ type: "select", index: ctx.activeIndex }] }
        : { preventDefault: true, effects: [{ type: "close" }] };
    case "Escape":
      return { preventDefault: true, effects: [{ type: "close" }] };
    case "Tab":
      return { preventDefault: false, effects: [{ type: "close" }] };
    default:
      return { preventDefault: false, effects: [] };
  }
}
