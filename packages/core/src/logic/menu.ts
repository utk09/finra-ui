/**
 * Framework-agnostic logic for a menu button (APG menu-button pattern). Roving
 * focus moves between `role="menuitem"` children; the React adapter reads the
 * live item list from the DOM (menus are composed of children, not data), so
 * these helpers work purely on an index + count.
 */

export type MenuEffect = { type: "focus"; index: number } | { type: "close" };

export interface MenuKeyContext {
  /** Index of the currently focused item, or -1 if none. */
  currentIndex: number;
  /** Number of focusable (enabled) items. */
  count: number;
}

export interface MenuKeyResult {
  preventDefault: boolean;
  effects: MenuEffect[];
}

/** Resolve a keydown inside an open menu to focus movement / close. */
export function resolveMenuKey(key: string, ctx: MenuKeyContext): MenuKeyResult {
  const { currentIndex, count } = ctx;

  if (key === "Escape") return { preventDefault: true, effects: [{ type: "close" }] };
  // Tab closes the menu but is not prevented, so focus moves on naturally.
  if (key === "Tab") return { preventDefault: false, effects: [{ type: "close" }] };

  if (count === 0) return { preventDefault: false, effects: [] };

  switch (key) {
    case "ArrowDown":
      return {
        preventDefault: true,
        effects: [{ type: "focus", index: currentIndex < 0 ? 0 : (currentIndex + 1) % count }],
      };
    case "ArrowUp":
      return {
        preventDefault: true,
        effects: [
          {
            type: "focus",
            index: currentIndex < 0 ? count - 1 : (currentIndex - 1 + count) % count,
          },
        ],
      };
    case "Home":
      return { preventDefault: true, effects: [{ type: "focus", index: 0 }] };
    case "End":
      return { preventDefault: true, effects: [{ type: "focus", index: count - 1 }] };
    default:
      return { preventDefault: false, effects: [] };
  }
}

/**
 * Index of the first item label starting with `query` (case-insensitive),
 * searching after `from` and wrapping. Returns -1 for none. `labels` are the
 * enabled items in DOM order.
 */
export function menuTypeahead(labels: readonly string[], query: string, from: number): number {
  const needle = query.toLowerCase();
  if (needle.length === 0) return -1;
  const count = labels.length;
  for (let step = 1; step <= count; step++) {
    const index = (from + step) % count;
    if (labels[index].toLowerCase().startsWith(needle)) return index;
  }
  return -1;
}
