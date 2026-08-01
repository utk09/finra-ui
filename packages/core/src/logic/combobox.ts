/**
 * Pure ComboBox computation logic - zero framework imports.
 * Used by React ComboBoxBase and future Lit finra-combobox.
 */

/**
 * The minimum an option must provide for this module to filter, group and
 * navigate it.
 *
 * @remarks
 * Deliberately structural rather than a class, so a consumer's own option type
 * satisfies it without conversion. The rendering layer's `ComboBoxOption` is
 * this shape plus presentation concerns.
 *
 * @typeParam T - Type of the option's value. Defaults to `string`; use a union
 * of literals to have TypeScript narrow what a selection can be.
 */
export interface ComboBoxOptionLike<T = string> {
  /** Identity. What `onChange` reports, and what equality is tested on. */
  value: T;
  /** Human-readable text. Filtering and typeahead both match against this. */
  label: string;
  /**
   * Optional group heading. Options sharing a `group` are collected under it;
   * options without one fall into the ungrouped bucket.
   *
   * @see {@link groupOptions}
   */
  group?: string;
  /** Rendered but not selectable, and skipped by keyboard navigation. */
  disabled?: boolean;
  /**
   * Lifts the option into a pinned "favourites" section above every group.
   *
   * @remarks
   * A favourited option is *moved*, not copied - it will not also appear under
   * its own `group`.
   */
  favourite?: boolean;
}

/** One named group of options, as returned by {@link groupOptions}. */
export interface ComboBoxGroupResult<T = string> {
  /** The heading, taken verbatim from the members' {@link ComboBoxOptionLike.group}. */
  label: string;
  /** Members, in the order they appeared in the source list. */
  options: ComboBoxOptionLike<T>[];
}

/** Default case-insensitive substring filter. */
export function defaultFilter<T>(option: ComboBoxOptionLike<T>, input: string): boolean {
  if (!input) return true;
  return option.label.toLowerCase().includes(input.toLowerCase());
}

/** Partition options into favourites, named groups, and ungrouped. */
export function groupOptions<T>(options: ComboBoxOptionLike<T>[]): {
  favourites: ComboBoxOptionLike<T>[];
  groups: ComboBoxGroupResult<T>[];
  ungrouped: ComboBoxOptionLike<T>[];
} {
  const favourites: ComboBoxOptionLike<T>[] = [];
  const groupMap = new Map<string, ComboBoxOptionLike<T>[]>();
  const ungrouped: ComboBoxOptionLike<T>[] = [];

  for (const opt of options) {
    if (opt.favourite) {
      favourites.push(opt);
    }
    if (opt.group) {
      const list = groupMap.get(opt.group) ?? [];
      list.push(opt);
      groupMap.set(opt.group, list);
    } else {
      ungrouped.push(opt);
    }
  }

  const groups: ComboBoxGroupResult<T>[] = [];
  for (const [label, opts] of groupMap) {
    groups.push({ label, options: opts });
  }

  return { favourites, groups, ungrouped };
}

//  Navigation / selection derivations - framework-agnostic

/**
 * Flatten grouped options into the single keyboard-navigable list, in the exact
 * order the listbox renders them: favourites first, then each named group's
 * non-favourite options, then ungrouped non-favourites. The index into this
 * list is what `highlightedIndex` and `aria-activedescendant` address, so the
 * order MUST match the render order.
 */
export function flattenOptions<T>(filtered: ComboBoxOptionLike<T>[]): ComboBoxOptionLike<T>[] {
  const { favourites, groups, ungrouped } = groupOptions(filtered);
  const flat: ComboBoxOptionLike<T>[] = [];
  for (const f of favourites) flat.push(f);
  for (const g of groups) {
    for (const o of g.options) {
      if (!o.favourite) flat.push(o);
    }
  }
  for (const o of ungrouped) {
    if (!o.favourite) flat.push(o);
  }
  return flat;
}

/**
 * Whether the "create new option" affordance should appear: creatable mode, a
 * non-blank input, and no existing option whose label already matches it
 * (case-insensitive).
 */
export function shouldShowCreateOption<T>(args: {
  creatable: boolean;
  inputValue: string;
  options: ComboBoxOptionLike<T>[];
}): boolean {
  const trimmed = args.inputValue.trim();
  if (!args.creatable || trimmed === "") return false;
  return !args.options.some((o) => o.label.toLowerCase() === trimmed.toLowerCase());
}

/** The state change a selection produces, for the adapter to apply. */
export interface ComboBoxSelectResult<T> {
  /** Value to emit via `onChange`. */
  nextValue: T | T[] | null;
  /** Text to write into the input. */
  inputValue: string;
  /** Whether the menu should close. */
  close: boolean;
}

/**
 * Resolve selecting an option. Returns `null` for disabled options (the caller
 * does nothing). Multi-select toggles membership, keeps the menu open, and
 * clears the input; single-select sets the value, shows its label, and closes.
 */
export function resolveSelectOption<T>(
  option: ComboBoxOptionLike<T>,
  ctx: { multiple: boolean; selectedValues: T[] },
): ComboBoxSelectResult<T> | null {
  if (option.disabled) return null;

  if (ctx.multiple) {
    const isSelected = ctx.selectedValues.some((v) => v === option.value);
    const nextValue = isSelected
      ? ctx.selectedValues.filter((v) => v !== option.value)
      : [...ctx.selectedValues, option.value];
    return { nextValue, inputValue: "", close: false };
  }

  return { nextValue: option.value, inputValue: option.label, close: true };
}

//  Keyboard behaviour - framework-agnostic

/**
 * A single state mutation a keydown resolves to. The framework adapter
 * (React `ComboBoxBase`, future Lit `finra-combobox`) executes these against
 * its own setters - the pure layer never touches the DOM or component state.
 */
export type ComboBoxKeyEffect =
  | { kind: "setOpen"; open: boolean }
  | { kind: "setHighlight"; index: number }
  /** Select the option at this flat-list index. */
  | { kind: "selectOption"; index: number }
  /** Commit the "create new option" affordance from the current input. */
  | { kind: "createOption" }
  /** Remove the last selected value (multi-select Backspace-on-empty). */
  | { kind: "removeLastValue" }
  /** Move focus out of the input and onto the last selected pill. */
  | { kind: "focusLastPill" };

/** Everything a keydown decision needs, with zero framework/DOM coupling. */
export interface ComboBoxKeyContext {
  /** Whether the listbox popup is currently shown. Most keys mean different things when it is not. */
  isOpen: boolean;
  /** When true every key is swallowed and no effects are produced. */
  disabled: boolean;
  /** Index of the active option, or `-1` for "nothing highlighted yet". */
  highlightedIndex: number;
  /** Options + the create affordance - the modulo base for wrap-around. */
  totalNavigable: number;
  /** Length of the flat option list (create affordance sits at this index). */
  flatOptionsLength: number;
  /** Whether a "create «query»" row is currently offered at the end of the list. */
  showCreateOption: boolean;
  /** Multi-select mode. Enables the pill behaviours: Backspace-to-remove and ArrowLeft-to-pills. */
  multiple: boolean;
  /** Whether the text field is empty - the precondition for Backspace removing a pill. */
  inputValueEmpty: boolean;
  /** How many values are currently selected. Zero suppresses the pill behaviours entirely. */
  selectedCount: number;
  /**
   * Alt modifier. APG combobox: Alt+ArrowDown opens the popup *without* moving
   * the active option, and Alt+ArrowUp closes it - distinct from the bare arrows.
   */
  altKey?: boolean;
  /**
   * Whether the text caret sits at position 0 with nothing selected. Only then
   * may ArrowLeft leave the input and enter the pill list; otherwise the browser
   * must keep handling it as normal caret movement.
   */
  caretAtStart?: boolean;
}

/**
 * The decision for one keypress: what to suppress, and what to do.
 *
 * @remarks
 * Deliberately data, not callbacks. The adapter (React today, Lit later)
 * executes the effects against its own state, which is what lets this whole
 * module stay framework-free and directly unit-testable.
 */
export interface ComboBoxKeyResult {
  /** Whether the adapter should call `event.preventDefault()`. */
  preventDefault: boolean;
  /** Effects to apply in order. Empty means the key was not handled here. */
  effects: ComboBoxKeyEffect[];
}

const none = (): ComboBoxKeyResult => ({ preventDefault: false, effects: [] });

const wrapNext = (current: number, count: number): number => (current + 1) % count;

/**
 * Nothing highlighted (-1) must step to the LAST option, not `count - 2`.
 * Reachable: focusing the input opens the listbox without a highlight, so
 * ArrowUp would otherwise skip the final option.
 */
const wrapPrev = (current: number, count: number): number =>
  current < 0 ? count - 1 : (current - 1 + count) % count;

type KeyHandler = (ctx: ComboBoxKeyContext) => ComboBoxKeyResult;

/**
 * Keyboard map as data (Zag.js / React-Aria style). Each key maps to a pure
 * function of context → effects, so directional concerns like RTL become a
 * transform over this table rather than edits scattered through a switch.
 */
const keyMap: Record<string, KeyHandler> = {
  ArrowDown: (ctx) => {
    // APG: Alt+ArrowDown opens the popup but does NOT move the active option.
    if (!ctx.isOpen && ctx.altKey) {
      return { preventDefault: true, effects: [{ kind: "setOpen", open: true }] };
    }
    return ctx.isOpen
      ? {
          preventDefault: true,
          effects: [
            { kind: "setHighlight", index: wrapNext(ctx.highlightedIndex, ctx.totalNavigable) },
          ],
        }
      : {
          preventDefault: true,
          effects: [
            { kind: "setOpen", open: true },
            { kind: "setHighlight", index: 0 },
          ],
        };
  },
  ArrowUp: (ctx) => {
    // APG: Alt+ArrowUp closes the popup, leaving focus on the input.
    if (ctx.isOpen && ctx.altKey) {
      return {
        preventDefault: true,
        effects: [
          { kind: "setOpen", open: false },
          { kind: "setHighlight", index: -1 },
        ],
      };
    }
    return ctx.isOpen
      ? {
          preventDefault: true,
          effects: [
            { kind: "setHighlight", index: wrapPrev(ctx.highlightedIndex, ctx.totalNavigable) },
          ],
        }
      : {
          preventDefault: true,
          effects: [
            { kind: "setOpen", open: true },
            { kind: "setHighlight", index: ctx.totalNavigable - 1 },
          ],
        };
  },
  // Tab must close the popup but never swallow the event - focus has to leave.
  Tab: (ctx) =>
    ctx.isOpen
      ? {
          preventDefault: false,
          effects: [
            { kind: "setOpen", open: false },
            { kind: "setHighlight", index: -1 },
          ],
        }
      : none(),
  Enter: (ctx) => {
    const effects: ComboBoxKeyEffect[] = [];
    if (ctx.isOpen && ctx.highlightedIndex >= 0) {
      if (ctx.highlightedIndex < ctx.flatOptionsLength) {
        effects.push({ kind: "selectOption", index: ctx.highlightedIndex });
      } else if (ctx.showCreateOption) {
        effects.push({ kind: "createOption" });
      }
    } else if (!ctx.isOpen) {
      effects.push({ kind: "setOpen", open: true });
    }
    return { preventDefault: true, effects };
  },
  Escape: (ctx) =>
    ctx.isOpen
      ? {
          preventDefault: true,
          effects: [
            { kind: "setOpen", open: false },
            { kind: "setHighlight", index: -1 },
          ],
        }
      : none(),
  Backspace: (ctx) =>
    ctx.multiple && ctx.inputValueEmpty && ctx.selectedCount > 0
      ? { preventDefault: false, effects: [{ kind: "removeLastValue" }] }
      : none(),
  // ArrowLeft from the very start of the input steps into the pill list. Any
  // other caret position falls through so normal text navigation still works.
  ArrowLeft: (ctx) =>
    ctx.multiple && ctx.caretAtStart && ctx.selectedCount > 0
      ? { preventDefault: true, effects: [{ kind: "focusLastPill" }] }
      : none(),
  Home: (ctx) =>
    ctx.isOpen ? { preventDefault: true, effects: [{ kind: "setHighlight", index: 0 }] } : none(),
  End: (ctx) =>
    ctx.isOpen
      ? { preventDefault: true, effects: [{ kind: "setHighlight", index: ctx.totalNavigable - 1 }] }
      : none(),
};

/**
 * Resolve a keydown to its effects without touching the DOM. Disabled
 * combo-boxes swallow every key. Unmapped keys are a no-op (the adapter lets
 * the browser handle normal typing).
 */
export function resolveComboBoxKey(key: string, ctx: ComboBoxKeyContext): ComboBoxKeyResult {
  if (ctx.disabled) return none();
  const handler = keyMap[key];
  return handler ? handler(ctx) : none();
}

//  Selected-pill navigation (multi-select) - framework-agnostic

/**
 * Effects for keyboard interaction with the selected-value pills. Pills use a
 * roving tab stop (React Aria's TagGroup model): the whole list is one Tab stop,
 * arrows move within it, and stepping off the end returns to the text input.
 */
export type ComboBoxPillEffect =
  | { kind: "setActivePill"; index: number }
  /** Remove the pill at this index. */
  | { kind: "removePill"; index: number }
  /** Leave the pill list and put focus back in the text input. */
  | { kind: "focusInput" };

/**
 * Context for a keypress that lands on a selected-value pill rather than the
 * text input.
 *
 * @remarks
 * Pills form their own roving tab group (the React Aria TagGroup model): one
 * tab stop for the whole list, arrows to move within it. Without this, removing
 * a value would be pointer-only.
 */
export interface ComboBoxPillKeyContext {
  /** Index of the pill currently holding the roving tab stop. */
  activeIndex: number;
  /** How many pills are rendered. */
  pillCount: number;
  /** Under `dir="rtl"` the horizontal arrows swap. */
  rtl?: boolean;
}

/** The decision for one keypress inside the pill list. @see {@link ComboBoxKeyResult} */
export interface ComboBoxPillKeyResult {
  /** Whether the adapter should call `event.preventDefault()`. */
  preventDefault: boolean;
  /** Effects to apply in order. Empty means the key was not handled here. */
  effects: ComboBoxPillEffect[];
}

const nonePill = (): ComboBoxPillKeyResult => ({ preventDefault: false, effects: [] });

/** Step to `index`, or back to the input when stepping past the last pill. */
function movePill(index: number, pillCount: number): ComboBoxPillKeyResult {
  if (index >= pillCount) {
    return { preventDefault: true, effects: [{ kind: "focusInput" }] };
  }
  return {
    preventDefault: true,
    effects: [{ kind: "setActivePill", index: Math.max(0, index) }],
  };
}

/**
 * Resolve a keydown while a pill has focus. Delete and Backspace both remove -
 * Delete is the APG-documented key, Backspace matches what users reflexively
 * press on a token they just tabbed onto.
 */
export function resolveComboBoxPillKey(
  key: string,
  ctx: ComboBoxPillKeyContext,
): ComboBoxPillKeyResult {
  if (ctx.pillCount === 0) return nonePill();

  const forward = ctx.rtl ? -1 : 1;

  switch (key) {
    case "ArrowRight":
      return movePill(ctx.activeIndex + forward, ctx.pillCount);
    case "ArrowLeft":
      return movePill(ctx.activeIndex - forward, ctx.pillCount);
    case "Home":
      return movePill(0, ctx.pillCount);
    case "End":
      return movePill(ctx.pillCount - 1, ctx.pillCount);
    case "Delete":
    case "Backspace":
      return {
        preventDefault: true,
        effects: [{ kind: "removePill", index: ctx.activeIndex }],
      };
    case "Escape":
      return { preventDefault: true, effects: [{ kind: "focusInput" }] };
    default:
      return nonePill();
  }
}

/**
 * Where focus belongs after removing the pill at `removedIndex`. Prefers the
 * pill that slid into its place, falls back to the new last pill, and returns
 * `null` (meaning "the text input") when the list is now empty.
 */
export function nextActivePillAfterRemoval(
  removedIndex: number,
  remainingCount: number,
): number | null {
  if (remainingCount <= 0) return null;
  return Math.min(removedIndex, remainingCount - 1);
}
