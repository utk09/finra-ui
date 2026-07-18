/**
 * Framework-agnostic logic for a tab list (APG tabs pattern). Roving tabindex
 * moves focus between `role="tab"` children; the React adapter reads the live
 * tab list from the DOM (tabs are composed of children, not data), so these
 * helpers work purely on an index + count + orientation.
 */

export type TabsOrientation = "horizontal" | "vertical";

/** When a tab receives focus, is it selected immediately or only on Enter/Space? */
export type TabsActivationMode = "automatic" | "manual";

export interface TabsEffect {
  type: "focus";
  index: number;
}

export interface TabsKeyContext {
  /** Index of the currently focused tab within the enabled list. */
  currentIndex: number;
  /** Number of focusable (enabled) tabs. */
  count: number;
  /** Arrow-key axis. */
  orientation: TabsOrientation;
}

export interface TabsKeyResult {
  preventDefault: boolean;
  effects: TabsEffect[];
}

/**
 * Resolve a keydown inside a tab list to roving-focus movement. Horizontal lists
 * move on Left/Right; vertical lists on Up/Down. Home/End jump to the ends.
 * Focus wraps at both ends. Selection (automatic vs manual) is left to the
 * adapter - this only decides where focus lands.
 */
export function resolveTabsKey(key: string, ctx: TabsKeyContext): TabsKeyResult {
  const { currentIndex, count, orientation } = ctx;
  if (count === 0) return { preventDefault: false, effects: [] };

  const nextKey = orientation === "horizontal" ? "ArrowRight" : "ArrowDown";
  const prevKey = orientation === "horizontal" ? "ArrowLeft" : "ArrowUp";

  switch (key) {
    case nextKey:
      return {
        preventDefault: true,
        effects: [{ type: "focus", index: (currentIndex + 1) % count }],
      };
    case prevKey:
      return {
        preventDefault: true,
        effects: [{ type: "focus", index: (currentIndex - 1 + count) % count }],
      };
    case "Home":
      return { preventDefault: true, effects: [{ type: "focus", index: 0 }] };
    case "End":
      return { preventDefault: true, effects: [{ type: "focus", index: count - 1 }] };
    default:
      return { preventDefault: false, effects: [] };
  }
}
