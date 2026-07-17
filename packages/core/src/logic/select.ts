/**
 * Framework-agnostic logic for a select-only combobox (APG "Select-Only
 * Combobox" pattern: a `role="combobox"` button with `aria-activedescendant`
 * driving a popup `role="listbox"`).
 *
 * Keyboard handling is expressed as data (key -> effects) so the React executor
 * and a future Lit adapter drive the exact same decisions.
 */

export interface SelectOptionData<T = string> {
  value: T;
  label: string;
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

export type SelectEffect =
  | { type: "open"; activeIndex: number }
  | { type: "close" }
  | { type: "setActive"; index: number }
  | { type: "select"; index: number };

export interface SelectKeyContext<T = string> {
  open: boolean;
  activeIndex: number;
  selectedIndex: number;
  options: readonly SelectOptionData<T>[];
  /** Wrap navigation past the ends. Default true. */
  loop?: boolean;
}

export interface SelectKeyResult {
  preventDefault: boolean;
  effects: SelectEffect[];
}

const OPEN_KEYS = new Set(["ArrowDown", "ArrowUp", "Enter", " ", "Spacebar"]);

/** Active index to land on when opening, based on selection and open direction. */
function openActiveIndex<T>(ctx: SelectKeyContext<T>, key: string): number {
  if (ctx.selectedIndex >= 0 && !ctx.options[ctx.selectedIndex]?.disabled) {
    return ctx.selectedIndex;
  }
  return key === "ArrowUp" ? lastEnabledIndex(ctx.options) : firstEnabledIndex(ctx.options);
}

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
    case "Spacebar":
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
