import {
  type ButtonHTMLAttributes,
  createContext,
  type CSSProperties,
  type ElementType,
  forwardRef,
  type HTMLAttributes,
  type MouseEvent,
  type ReactNode,
  useContext,
  useId,
  useMemo,
  useState,
} from "react";

import { useAnchoredPosition } from "../../hooks/useAnchoredPosition";
import { useDisclosure } from "../../hooks/useDisclosure";
import type { Placement } from "../../logic/position";
import { mergeRefs } from "../../utils/mergeRefs";
import { DismissableLayer } from "../DismissableLayer/DismissableLayer";
import { FocusScope } from "../FocusScope/FocusScope";
import { Portal } from "../Portal/Portal";
import { Slot } from "../Slot";

interface PopoverContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  contentId: string;
  triggerId: string;
  referenceEl: Element | null;
  setReferenceEl: (element: Element | null) => void;
  placement: Placement;
  offset: number;
  dismissOnEscape: boolean;
  dismissOnOutside: boolean;
}

const PopoverContext = createContext<PopoverContextValue | null>(null);

function usePopoverContext(part: string): PopoverContextValue {
  const ctx = useContext(PopoverContext);
  if (!ctx) {
    throw new Error(`Popover.${part} must be used within a <Popover>.`);
  }
  return ctx;
}

//  Root

export interface PopoverProps {
  children?: ReactNode;
  /** Controlled open state. */
  open?: boolean;
  /** Initial open state (uncontrolled). */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Preferred placement against the trigger. Default "bottom". */
  placement?: Placement;
  /** Gap between the trigger and the panel, in px. Default 8. */
  offset?: number;
  /** Dismiss on Escape. Default true. */
  dismissOnEscape?: boolean;
  /** Dismiss on an outside pointer. Default true. */
  dismissOnOutside?: boolean;
}

export function Popover({
  children,
  open,
  defaultOpen,
  onOpenChange,
  placement = "bottom",
  offset = 8,
  dismissOnEscape = true,
  dismissOnOutside = true,
}: PopoverProps): ReactNode {
  const { isOpen, setOpen } = useDisclosure({ open, defaultOpen, onOpenChange });
  const [referenceEl, setReferenceEl] = useState<Element | null>(null);
  const baseId = useId();

  const value = useMemo<PopoverContextValue>(
    () => ({
      open: isOpen,
      setOpen,
      contentId: `${baseId}-content`,
      triggerId: `${baseId}-trigger`,
      referenceEl,
      setReferenceEl,
      placement,
      offset,
      dismissOnEscape,
      dismissOnOutside,
    }),
    [isOpen, setOpen, baseId, referenceEl, placement, offset, dismissOnEscape, dismissOnOutside],
  );

  return <PopoverContext.Provider value={value}>{children}</PopoverContext.Provider>;
}

Popover.displayName = "Popover";

//  Trigger

export interface PopoverTriggerProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Render onto the single child element instead of a <button>. */
  asChild?: boolean;
}

export const PopoverTrigger = forwardRef<HTMLButtonElement, PopoverTriggerProps>(
  ({ asChild = false, onClick, ...rest }, ref) => {
    const ctx = usePopoverContext("Trigger");
    const Comp: ElementType = asChild ? Slot : "button";

    return (
      <Comp
        ref={mergeRefs(ref, ctx.setReferenceEl)}
        {...(asChild ? {} : { type: "button" as const })}
        id={ctx.triggerId}
        aria-haspopup="dialog"
        aria-expanded={ctx.open}
        aria-controls={ctx.open ? ctx.contentId : undefined}
        onClick={(event: MouseEvent<HTMLButtonElement>) => {
          onClick?.(event);
          if (!event.defaultPrevented) ctx.setOpen(!ctx.open);
        }}
        {...rest}
      />
    );
  },
);

PopoverTrigger.displayName = "PopoverTrigger";

//  Content

export interface PopoverContentProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

export const PopoverContent = forwardRef<HTMLDivElement, PopoverContentProps>(
  ({ children, style, ...rest }, ref) => {
    const ctx = usePopoverContext("Content");
    const { setFloating, x, y } = useAnchoredPosition(ctx.referenceEl, {
      placement: ctx.placement,
      offset: ctx.offset,
    });

    if (!ctx.open) return null;

    const positionStyle: CSSProperties = { position: "absolute", top: y, left: x, ...style };

    return (
      <Portal>
        <FocusScope trapped focusOnMount restoreFocus>
          <DismissableLayer
            onDismiss={() => ctx.setOpen(false)}
            disableEscape={!ctx.dismissOnEscape}
            disableOutsidePointer={!ctx.dismissOnOutside}
            excludeElements={[ctx.referenceEl]}>
            <div
              ref={mergeRefs(ref, setFloating)}
              role="dialog"
              id={ctx.contentId}
              aria-labelledby={ctx.triggerId}
              style={positionStyle}
              {...rest}>
              {children}
            </div>
          </DismissableLayer>
        </FocusScope>
      </Portal>
    );
  },
);

PopoverContent.displayName = "PopoverContent";

//  Close

export const PopoverClose = forwardRef<HTMLButtonElement, PopoverTriggerProps>(
  ({ asChild = false, onClick, ...rest }, ref) => {
    const ctx = usePopoverContext("Close");
    const Comp: ElementType = asChild ? Slot : "button";

    return (
      <Comp
        ref={ref}
        {...(asChild ? {} : { type: "button" as const })}
        onClick={(event: MouseEvent<HTMLButtonElement>) => {
          onClick?.(event);
          if (!event.defaultPrevented) ctx.setOpen(false);
        }}
        {...rest}
      />
    );
  },
);

PopoverClose.displayName = "PopoverClose";
