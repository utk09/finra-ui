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

/**
 * Props for the Tooltip root - the state owner. It renders nothing itself; the
 * visible parts are `TooltipTrigger` and `TooltipContent`.
 *
 * @remarks
 * A tooltip is supplementary: it must never be the only place information
 * lives, and it must never contain interactive content, because it is not
 * reachable by pointer or keyboard once shown. For anything the user needs to
 * click, use a Popover.
 *
 * Shows on hover *and* focus, so keyboard users get it too.
 *
 * @example
 * ```tsx
 * <Tooltip placement="right">
 *   <TooltipTrigger asChild><IconButton icon={<InfoIcon />} /></TooltipTrigger>
 *   <TooltipContent>Settles T+2</TooltipContent>
 * </Tooltip>
 * ```
 */
export interface TooltipProps {
  /** The trigger and content parts. */
  children?: ReactNode;
  /** Controlled open state. When set, the tooltip never changes it - handle `onOpenChange`. */
  open?: boolean;
  /** Initial open state when uncontrolled. Ignored if `open` is set. */
  defaultOpen?: boolean;
  /** Fired whenever the tooltip wants to open or close - hover, focus, Escape or blur. */
  onOpenChange?: (open: boolean) => void;
  /** Delay before showing on hover/focus, in ms. Default 700. */
  openDelay?: number;
  /** Delay before hiding, in ms. Default 0. */
  closeDelay?: number;
  /** Preferred placement. Default "top". */
  placement?: Placement;
}

/**
 * Tooltip root - owns open state and hover/focus delays. Renders nothing itself;
 * compose it with `TooltipTrigger` and `TooltipContent`.
 *
 * @see {@link TooltipProps}
 */
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

/**
 * Props for the element the tooltip describes.
 *
 * @remarks
 * Almost always used with `asChild`, wrapping a real control - the tooltip
 * shows on focus as well as hover, so the trigger has to be focusable or
 * keyboard users never see it.
 */
export interface TooltipTriggerProps extends HTMLAttributes<HTMLElement> {
  /**
   * Render onto the single child element instead of the default tag, merging
   * these props onto it.
   *
   * @remarks
   * `className` is concatenated, `style` merged, and handlers chained with the
   * child's called first. You become responsible for the child being genuinely
   * interactive and focusable.
   *
   * @defaultValue `false`
   */
  asChild?: boolean;
}

/**
 * The element the tooltip describes. Usually used with `asChild`.
 *
 * @see {@link TooltipTriggerProps}
 */
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

/**
 * Props for the tooltip bubble. Portalled, positioned against the trigger, and
 * carrying `role="tooltip"`.
 *
 * @remarks
 * Reached by assistive tech through the trigger's `aria-describedby`, not by
 * focus. Keep the content short and non-interactive - anything focusable in
 * here is unreachable, because moving toward it dismisses the tooltip.
 */
export interface TooltipContentProps extends HTMLAttributes<HTMLDivElement> {
  /** Bubble contents. Plain text or simple inline markup - never controls. */
  children?: ReactNode;
  /** Gap between the trigger and the tooltip, in px. Default 6. */
  offset?: number;
}

/**
 * The tooltip bubble. Portalled and positioned; must not contain controls.
 *
 * @see {@link TooltipContentProps}
 */
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
