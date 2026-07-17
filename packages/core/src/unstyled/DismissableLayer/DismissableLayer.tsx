import { forwardRef, type HTMLAttributes, type ReactNode, useEffect, useRef } from "react";

import { type DismissReason, registerDismissLayer } from "../../logic/dismiss";
import { mergeRefs } from "../../utils/mergeRefs";

export interface DismissableLayerProps extends HTMLAttributes<HTMLDivElement> {
  /** Called when the layer should close, with why (Escape or outside pointer). */
  onDismiss?: (reason: DismissReason) => void;
  /** Do not dismiss on Escape. */
  disableEscape?: boolean;
  /** Do not dismiss on outside pointer. */
  disableOutsidePointer?: boolean;
  /**
   * Elements outside the layer that should NOT count as "outside" - typically
   * the trigger, so clicking it toggles rather than dismissing then re-opening.
   */
  excludeElements?: readonly (Element | null)[];
  children?: ReactNode;
}

/**
 * Wraps overlay content so it dismisses on Escape (when topmost) or on a pointer
 * outside its bounds. Layers stack: nested overlays close inner-first. The
 * dismiss logic lives in the framework-agnostic `logic/dismiss` module.
 */
export const DismissableLayer = forwardRef<HTMLDivElement, DismissableLayerProps>(
  (
    { onDismiss, disableEscape, disableOutsidePointer, excludeElements, children, ...rest },
    ref,
  ) => {
    const innerRef = useRef<HTMLDivElement>(null);

    // Keep the latest onDismiss / excludeElements without re-registering the layer.
    const onDismissRef = useRef(onDismiss);
    onDismissRef.current = onDismiss;
    const excludeRef = useRef(excludeElements);
    excludeRef.current = excludeElements;

    useEffect(
      () =>
        registerDismissLayer({
          getElement: () => innerRef.current,
          onDismiss: (reason) => onDismissRef.current?.(reason),
          disableEscape,
          disableOutsidePointer,
          getExtraElements: () => excludeRef.current ?? [],
        }),
      [disableEscape, disableOutsidePointer],
    );

    return (
      <div ref={mergeRefs(ref, innerRef)} {...rest}>
        {children}
      </div>
    );
  },
);

DismissableLayer.displayName = "DismissableLayer";
