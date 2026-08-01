/**
 * Framework-agnostic logic for a tab list (APG tabs pattern). Roving tabindex
 * moves focus between `role="tab"` children; the React adapter reads the live
 * tab list from the DOM (tabs are composed of children, not data), so these
 * helpers work purely on an index + count + orientation.
 */

/**
 * Which axis the arrow keys walk.
 *
 * @remarks
 * `"horizontal"` binds Left/Right, `"vertical"` binds Up/Down - never both, so
 * the unbound axis stays available for scrolling the page.
 */
export type TabsOrientation = "horizontal" | "vertical";

/** When a tab receives focus, is it selected immediately or only on Enter/Space? */
export type TabsActivationMode = "automatic" | "manual";

/**
 * A single change the adapter should apply.
 *
 * @remarks
 * Only ever "move focus". Whether that focus also *selects* is the adapter's
 * call, driven by {@link TabsActivationMode} - which is what keeps this module
 * agnostic about it.
 */
export interface TabsEffect {
  /** The only effect kind: move DOM focus. */
  type: "focus";
  /** Destination index, within the enabled-tabs list. Already wrapped. */
  index: number;
}

/** Everything a tab-list keydown decision needs, with zero framework/DOM coupling. */
export interface TabsKeyContext {
  /** Index of the currently focused tab within the enabled list. */
  currentIndex: number;
  /** Number of focusable (enabled) tabs. */
  count: number;
  /** Arrow-key axis. */
  orientation: TabsOrientation;
}

/** The decision for one keypress: what to suppress, and where focus goes. */
export interface TabsKeyResult {
  /** Whether the adapter should call `event.preventDefault()`. */
  preventDefault: boolean;
  /** Effects to apply in order. Empty means the key was not handled here. */
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
