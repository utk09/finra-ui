import { useLayoutEffect, useState } from "react";

import {
  type AnchoredPosition,
  type AnchoredPositionOptions,
  trackAnchoredPosition,
} from "../logic/position";

/**
 * What {@link useAnchoredPosition} returns: the computed coordinates plus the
 * ref to attach.
 *
 * @remarks
 * Inherits `x`, `y` and `placement` from {@link AnchoredPosition}. Read
 * `placement` rather than the option you passed - flip and shift may have
 * overridden it to keep the element on screen.
 */
export interface UseAnchoredPositionResult extends AnchoredPosition {
  /** Ref callback for the floating element. */
  setFloating: (element: HTMLElement | null) => void;
}

/**
 * Position a floating element against a reference element and keep it in place
 * as things scroll/resize. Pass the reference element (or `null` until it
 * mounts) and attach `setFloating` to the floating element; read `x`/`y`/
 * `placement` to style it (`position: absolute; top: y; left: x`).
 *
 * The positioning logic lives in the framework-agnostic `logic/position`
 * module (over `@floating-ui/dom`); this is the React adapter.
 */
export function useAnchoredPosition(
  reference: Element | null,
  options: AnchoredPositionOptions = {},
): UseAnchoredPositionResult {
  const [floating, setFloating] = useState<HTMLElement | null>(null);
  const [position, setPosition] = useState<AnchoredPosition>({
    x: 0,
    y: 0,
    placement: options.placement ?? "bottom",
  });

  const { placement, offset, flip, shift, padding, arrowElement } = options;

  useLayoutEffect(() => {
    if (!reference || !floating) return;
    return trackAnchoredPosition(reference, floating, setPosition, {
      placement,
      offset,
      flip,
      shift,
      padding,
      arrowElement,
    });
  }, [reference, floating, placement, offset, flip, shift, padding, arrowElement]);

  return { ...position, setFloating };
}
