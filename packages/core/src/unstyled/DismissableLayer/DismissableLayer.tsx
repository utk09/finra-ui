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
  children?: ReactNode;
}

/**
 * Wraps overlay content so it dismisses on Escape (when topmost) or on a pointer
 * outside its bounds. Layers stack: nested overlays close inner-first. The
 * dismiss logic lives in the framework-agnostic `logic/dismiss` module.
 */
export const DismissableLayer = forwardRef<HTMLDivElement, DismissableLayerProps>(
  ({ onDismiss, disableEscape, disableOutsidePointer, children, ...rest }, ref) => {
    const innerRef = useRef<HTMLDivElement>(null);

    // Keep the latest onDismiss without re-registering the layer each render.
    const onDismissRef = useRef(onDismiss);
    onDismissRef.current = onDismiss;

    useEffect(
      () =>
        registerDismissLayer({
          getElement: () => innerRef.current,
          onDismiss: (reason) => onDismissRef.current?.(reason),
          disableEscape,
          disableOutsidePointer,
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
