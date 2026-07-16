/**
 * Pure ComboBox computation logic - zero framework imports.
 * Used by React ComboBoxBase and future Lit finra-combobox.
 */

export interface ComboBoxOptionLike<T = string> {
  value: T;
  label: string;
  group?: string;
  disabled?: boolean;
  favourite?: boolean;
}

export interface ComboBoxGroupResult<T = string> {
  label: string;
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
  | { kind: "removeLastValue" };

/** Everything a keydown decision needs, with zero framework/DOM coupling. */
export interface ComboBoxKeyContext {
  isOpen: boolean;
  disabled: boolean;
  highlightedIndex: number;
  /** Options + the create affordance - the modulo base for wrap-around. */
  totalNavigable: number;
  /** Length of the flat option list (create affordance sits at this index). */
  flatOptionsLength: number;
  showCreateOption: boolean;
  multiple: boolean;
  inputValueEmpty: boolean;
  selectedCount: number;
}

export interface ComboBoxKeyResult {
  /** Whether the adapter should call `event.preventDefault()`. */
  preventDefault: boolean;
  effects: ComboBoxKeyEffect[];
}

const none = (): ComboBoxKeyResult => ({ preventDefault: false, effects: [] });

const wrapNext = (current: number, count: number): number => (current + 1) % count;
const wrapPrev = (current: number, count: number): number => (current - 1 + count) % count;

type KeyHandler = (ctx: ComboBoxKeyContext) => ComboBoxKeyResult;

/**
 * Keyboard map as data (Zag.js / React-Aria style). Each key maps to a pure
 * function of context → effects. RTL support (Phase 6) becomes a transform
 * over this table rather than edits scattered through a switch statement.
 */
const keyMap: Record<string, KeyHandler> = {
  ArrowDown: (ctx) =>
    ctx.isOpen
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
        },
  ArrowUp: (ctx) =>
    ctx.isOpen
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
        },
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
