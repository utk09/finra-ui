import {
  arrow,
  autoUpdate,
  computePosition,
  flip,
  type Middleware,
  offset,
  type Placement,
  shift,
} from "@floating-ui/dom";

export type { Placement } from "@floating-ui/dom";

/**
 * Framework-agnostic anchored-positioning over `@floating-ui/dom` (the DOM
 * package, so it is reusable from a future Lit adapter, not just React).
 * Wraps `computePosition` + `autoUpdate` with sensible flip/shift/offset
 * presets so overlay components don't each re-derive middleware.
 */

export interface AnchoredPositionOptions {
  /** Preferred side. Default "bottom". */
  placement?: Placement;
  /** Gap between the reference and the floating element, in px. */
  offset?: number;
  /** Flip to the opposite side when the preferred side overflows. Default true. */
  flip?: boolean;
  /** Shift along the axis to stay in view. Default true. */
  shift?: boolean;
  /** Padding from the viewport edge for flip/shift, in px. */
  padding?: number;
  /** Element to position as an arrow/pointer, if any. */
  arrowElement?: Element | null;
}

export interface AnchoredPosition {
  x: number;
  y: number;
  placement: Placement;
  /** Arrow offset, present only when `arrowElement` was supplied. */
  arrow?: { x?: number; y?: number };
}

function buildMiddleware(options: AnchoredPositionOptions): Middleware[] {
  const middleware: Middleware[] = [];
  if (options.offset != null) middleware.push(offset(options.offset));
  if (options.flip !== false) middleware.push(flip({ padding: options.padding }));
  if (options.shift !== false) middleware.push(shift({ padding: options.padding }));
  if (options.arrowElement) middleware.push(arrow({ element: options.arrowElement }));
  return middleware;
}

/** Compute a single anchored position for the floating element. */
export async function computeAnchoredPosition(
  reference: Element,
  floating: HTMLElement,
  options: AnchoredPositionOptions = {},
): Promise<AnchoredPosition> {
  const { x, y, placement, middlewareData } = await computePosition(reference, floating, {
    placement: options.placement ?? "bottom",
    middleware: buildMiddleware(options),
  });
  return { x, y, placement, arrow: middlewareData.arrow };
}

/**
 * Keep the floating element positioned as the reference and its scroll/resize
 * ancestors change. Calls `onUpdate` with each new position and returns a
 * cleanup function. Wraps floating-ui `autoUpdate`.
 */
export function trackAnchoredPosition(
  reference: Element,
  floating: HTMLElement,
  onUpdate: (position: AnchoredPosition) => void,
  options: AnchoredPositionOptions = {},
): () => void {
  return autoUpdate(reference, floating, () => {
    void computeAnchoredPosition(reference, floating, options).then(onUpdate);
  });
}
