import {
  forwardRef,
  isValidElement,
  cloneElement,
  type ReactNode,
  type HTMLAttributes,
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

export interface SlotProps extends HTMLAttributes<HTMLElement> {
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
