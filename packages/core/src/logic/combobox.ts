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
