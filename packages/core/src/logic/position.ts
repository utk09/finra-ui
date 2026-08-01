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

/**
 * How to place a floating element against its anchor.
 *
 * @remarks
 * Every option is a *preference*. Flip and shift may override `placement` to
 * keep the element on screen, which is why {@link AnchoredPosition} reports the
 * placement actually used rather than echoing this one back.
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

/** A computed position, ready to apply as `position: absolute` coordinates. */
export interface AnchoredPosition {
  /** Left offset in px, relative to the positioning container. */
  x: number;
  /** Top offset in px, relative to the positioning container. */
  y: number;
  /**
   * The placement actually used.
   *
   * @remarks
   * May differ from the one requested, because flip and shift override it to
   * keep the element in view. Read this - not your own option - when styling a
   * side-dependent effect such as an entry animation or an arrow.
   */
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
