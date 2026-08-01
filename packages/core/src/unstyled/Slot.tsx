import {
  cloneElement,
  forwardRef,
  type HTMLAttributes,
  isValidElement,
  type ReactNode,
  type Ref,
} from "react";

import { mergeRefs } from "../utils/mergeRefs";

function mergeProps(
  slotProps: Record<string, unknown>,
  childProps: Record<string, unknown>,
): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...slotProps, ...childProps };

  for (const key of Object.keys(slotProps)) {
    if (key === "children" || key === "ref") continue;

    const slotVal = slotProps[key];
    const childVal = childProps[key];

    // Merge event handlers
    if (typeof slotVal === "function" && typeof childVal === "function") {
      merged[key] = (...args: unknown[]) => {
        childVal(...args);
        slotVal(...args);
      };
    }

    // Merge className
    if (key === "className" && typeof slotVal === "string" && typeof childVal === "string") {
      merged[key] = `${slotVal} ${childVal}`.trim();
    }

    // Merge style
    if (key === "style" && typeof slotVal === "object" && typeof childVal === "object") {
      merged[key] = { ...(slotVal as object), ...(childVal as object) };
    }
  }

  return merged;
}

/**
 * Props for {@link Slot} - the primitive behind every `asChild` prop.
 *
 * @remarks
 * Merges its own props onto the single child element rather than rendering a
 * wrapper: `className` is concatenated, `style` is merged, and event handlers
 * are chained with the child's called first. Renders `null` if `children` is
 * not a single valid element.
 */
export interface SlotProps extends HTMLAttributes<HTMLElement> {
  /** Exactly one React element. Anything else renders nothing. */
  children?: ReactNode;
}

export const Slot = forwardRef<HTMLElement, SlotProps>(
  ({ children, ...slotProps }, forwardedRef) => {
    if (!isValidElement(children)) {
      return null;
    }

    const childProps = children.props as Record<string, unknown>;
    const childRef = (children as unknown as { ref?: Ref<HTMLElement> }).ref;

    return cloneElement(children, {
      ...mergeProps(slotProps, childProps),
      ref: mergeRefs(forwardedRef, childRef),
    } as Record<string, unknown>);
  },
);

Slot.displayName = "Slot";
