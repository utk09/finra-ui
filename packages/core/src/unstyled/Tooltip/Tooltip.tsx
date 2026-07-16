import {
  createContext,
  type CSSProperties,
  type ElementType,
  type FocusEvent,
  forwardRef,
  type HTMLAttributes,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import { useAnchoredPosition } from "../../hooks/useAnchoredPosition";
import { useDisclosure } from "../../hooks/useDisclosure";
import type { Placement } from "../../logic/position";
import { mergeRefs } from "../../utils/mergeRefs";
import { Portal } from "../Portal/Portal";
import { Slot } from "../Slot";

interface TooltipContextValue {
  open: boolean;
  contentId: string;
  referenceEl: Element | null;
  setReferenceEl: (element: Element | null) => void;
  placement: Placement;
  show: () => void;
  hide: () => void;
  hideImmediate: () => void;
}

const TooltipContext = createContext<TooltipContextValue | null>(null);

function useTooltipContext(part: string): TooltipContextValue {
  const ctx = useContext(TooltipContext);
  if (!ctx) throw new Error(`Tooltip.${part} must be used within a <Tooltip>.`);
  return ctx;
}

//  Root

export interface TooltipProps {
  children?: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Delay before showing on hover/focus, in ms. Default 700. */
  openDelay?: number;
  /** Delay before hiding, in ms. Default 0. */
  closeDelay?: number;
  /** Preferred placement. Default "top". */
  placement?: Placement;
}

export function Tooltip({
  children,
  open,
  defaultOpen,
  onOpenChange,
  openDelay = 700,
  closeDelay = 0,
  placement = "top",
}: TooltipProps): ReactNode {
  const { isOpen, setOpen } = useDisclosure({ open, defaultOpen, onOpenChange });
  const [referenceEl, setReferenceEl] = useState<Element | null>(null);
  const baseId = useId();

  const openTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const clearTimers = useCallback(() => {
    clearTimeout(openTimer.current);
    clearTimeout(closeTimer.current);
  }, []);

  const show = useCallback(() => {
    clearTimeout(closeTimer.current);
    openTimer.current = setTimeout(() => setOpen(true), openDelay);
  }, [openDelay, setOpen]);

  const hide = useCallback(() => {
    clearTimeout(openTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), closeDelay);
  }, [closeDelay, setOpen]);

  const hideImmediate = useCallback(() => {
    clearTimers();
    setOpen(false);
  }, [clearTimers, setOpen]);

  useEffect(() => clearTimers, [clearTimers]);

  const value = useMemo<TooltipContextValue>(
    () => ({
      open: isOpen,
      contentId: `${baseId}-tooltip`,
      referenceEl,
      setReferenceEl,
      placement,
      show,
      hide,
      hideImmediate,
    }),
    [isOpen, baseId, referenceEl, placement, show, hide, hideImmediate],
  );

  return <TooltipContext.Provider value={value}>{children}</TooltipContext.Provider>;
}

Tooltip.displayName = "Tooltip";

//  Trigger

export interface TooltipTriggerProps extends HTMLAttributes<HTMLElement> {
  asChild?: boolean;
}

export const TooltipTrigger = forwardRef<HTMLElement, TooltipTriggerProps>(
  (
    {
      asChild = false,
      children,
      onPointerEnter,
      onPointerLeave,
      onFocus,
      onBlur,
      onKeyDown,
      ...rest
    },
    ref,
  ) => {
    const ctx = useTooltipContext("Trigger");
    const Comp: ElementType = asChild ? Slot : "button";

    return (
      <Comp
        ref={mergeRefs(ref, ctx.setReferenceEl)}
        {...(asChild ? {} : { type: "button" as const })}
        aria-describedby={ctx.open ? ctx.contentId : undefined}
        onPointerEnter={(event: PointerEvent<HTMLElement>) => {
          onPointerEnter?.(event);
          ctx.show();
        }}
        onPointerLeave={(event: PointerEvent<HTMLElement>) => {
          onPointerLeave?.(event);
          ctx.hide();
        }}
        onFocus={(event: FocusEvent<HTMLElement>) => {
          onFocus?.(event);
          ctx.show();
        }}
        onBlur={(event: FocusEvent<HTMLElement>) => {
          onBlur?.(event);
          ctx.hide();
        }}
        onKeyDown={(event: KeyboardEvent<HTMLElement>) => {
          onKeyDown?.(event);
          if (event.key === "Escape") ctx.hideImmediate();
        }}
        {...rest}>
        {children}
      </Comp>
    );
  },
);

TooltipTrigger.displayName = "TooltipTrigger";

//  Content

export interface TooltipContentProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  /** Gap between the trigger and the tooltip, in px. Default 6. */
  offset?: number;
}

export const TooltipContent = forwardRef<HTMLDivElement, TooltipContentProps>(
  ({ children, offset = 6, style, ...rest }, ref) => {
    const ctx = useTooltipContext("Content");
    const { setFloating, x, y } = useAnchoredPosition(ctx.referenceEl, {
      placement: ctx.placement,
      offset,
    });

    if (!ctx.open) return null;

    const positionStyle: CSSProperties = { position: "absolute", top: y, left: x, ...style };

    return (
      <Portal>
        <div
          ref={mergeRefs(ref, setFloating)}
          role="tooltip"
          id={ctx.contentId}
          style={positionStyle}
          {...rest}>
          {children}
        </div>
      </Portal>
    );
  },
);

TooltipContent.displayName = "TooltipContent";
