import {
  type ButtonHTMLAttributes,
  createContext,
  type CSSProperties,
  type ElementType,
  forwardRef,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
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
import { menuTypeahead, resolveMenuKey } from "../../logic/menu";
import type { Placement } from "../../logic/position";
import { mergeRefs } from "../../utils/mergeRefs";
import { DismissableLayer } from "../DismissableLayer/DismissableLayer";
import { Portal } from "../Portal/Portal";
import { Slot } from "../Slot";

/** Enabled menu items in DOM order (the roving-focus list). */
function getEnabledItems(root: HTMLElement | null): HTMLElement[] {
  if (!root) return [];
  return Array.from(
    root.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])'),
  );
}

interface MenuContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  openMenu: (toLast?: boolean) => void;
  openIntentRef: { current: "first" | "last" };
  contentId: string;
  triggerId: string;
  referenceEl: Element | null;
  setReferenceEl: (element: Element | null) => void;
  placement: Placement;
  offset: number;
}

const MenuContext = createContext<MenuContextValue | null>(null);

function useMenuContext(part: string): MenuContextValue {
  const ctx = useContext(MenuContext);
  if (!ctx) throw new Error(`Menu.${part} must be used within a <Menu>.`);
  return ctx;
}

//  Root

export interface MenuProps {
  children?: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Preferred placement against the trigger. Default "bottom-start". */
  placement?: Placement;
  /** Gap between the trigger and the menu, in px. Default 4. */
  offset?: number;
}

export function Menu({
  children,
  open,
  defaultOpen,
  onOpenChange,
  placement = "bottom-start",
  offset = 4,
}: MenuProps): ReactNode {
  const { isOpen, setOpen } = useDisclosure({ open, defaultOpen, onOpenChange });
  const [referenceEl, setReferenceEl] = useState<Element | null>(null);
  const openIntentRef = useRef<"first" | "last">("first");
  const baseId = useId();

  const openMenu = useCallback(
    (toLast = false): void => {
      openIntentRef.current = toLast ? "last" : "first";
      setOpen(true);
    },
    [setOpen],
  );

  const value = useMemo<MenuContextValue>(
    () => ({
      open: isOpen,
      setOpen,
      openMenu,
      openIntentRef,
      contentId: `${baseId}-menu`,
      triggerId: `${baseId}-trigger`,
      referenceEl,
      setReferenceEl,
      placement,
      offset,
    }),
    [isOpen, setOpen, openMenu, baseId, referenceEl, placement, offset],
  );

  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
}

Menu.displayName = "Menu";

//  Trigger

export interface MenuTriggerProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

export const MenuTrigger = forwardRef<HTMLButtonElement, MenuTriggerProps>(
  ({ asChild = false, onClick, onKeyDown, ...rest }, ref) => {
    const ctx = useMenuContext("Trigger");
    const Comp: ElementType = asChild ? Slot : "button";

    return (
      <Comp
        ref={mergeRefs(ref, ctx.setReferenceEl)}
        {...(asChild ? {} : { type: "button" as const })}
        id={ctx.triggerId}
        aria-haspopup="menu"
        aria-expanded={ctx.open}
        aria-controls={ctx.open ? ctx.contentId : undefined}
        onClick={(event: MouseEvent<HTMLButtonElement>) => {
          onClick?.(event);
          if (event.defaultPrevented) return;
          if (ctx.open) ctx.setOpen(false);
          else ctx.openMenu(false);
        }}
        onKeyDown={(event: KeyboardEvent<HTMLButtonElement>) => {
          onKeyDown?.(event);
          if (event.defaultPrevented || ctx.open) return;
          if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            ctx.openMenu(false);
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            ctx.openMenu(true);
          }
        }}
        {...rest}
      />
    );
  },
);

MenuTrigger.displayName = "MenuTrigger";

//  Content

export interface MenuContentProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

export const MenuContent = forwardRef<HTMLDivElement, MenuContentProps>(
  ({ children, style, onKeyDown, ...rest }, ref) => {
    const ctx = useMenuContext("Content");
    const menuRef = useRef<HTMLDivElement>(null);
    const { setFloating, x, y } = useAnchoredPosition(ctx.referenceEl, {
      placement: ctx.placement,
      offset: ctx.offset,
    });

    // Typeahead query, reset after a pause.
    const queryRef = useRef("");
    const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    const { open, referenceEl } = ctx;
    const openIntentRef = ctx.openIntentRef;

    // Focus the first (or last) item on open; restore focus to the trigger on close.
    useEffect(() => {
      if (!open) return;
      const items = getEnabledItems(menuRef.current);
      const target = openIntentRef.current === "last" ? items[items.length - 1] : items[0];
      target?.focus();
      return () => {
        clearTimeout(timerRef.current);
        (referenceEl as HTMLElement | null)?.focus?.();
      };
    }, [open, referenceEl, openIntentRef]);

    if (!ctx.open) return null;

    const positionStyle: CSSProperties = { position: "absolute", top: y, left: x, ...style };

    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
      onKeyDown?.(event);
      if (event.defaultPrevented) return;

      const items = getEnabledItems(menuRef.current);
      const currentIndex = items.indexOf(document.activeElement as HTMLElement);
      const { preventDefault, effects } = resolveMenuKey(event.key, {
        currentIndex,
        count: items.length,
      });
      if (preventDefault) event.preventDefault();

      for (const effect of effects) {
        if (effect.type === "focus") items[effect.index]?.focus();
        else ctx.setOpen(false);
      }

      // Typeahead (printable single keys, excluding Space which activates items).
      const isPrintable =
        effects.length === 0 &&
        event.key.length === 1 &&
        event.key !== " " &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey;
      if (isPrintable) {
        clearTimeout(timerRef.current);
        queryRef.current += event.key;
        timerRef.current = setTimeout(() => {
          queryRef.current = "";
        }, 500);
        const labels = items.map((item) => item.textContent ?? "");
        const index = menuTypeahead(labels, queryRef.current, currentIndex);
        if (index >= 0) items[index]?.focus();
      }
    };

    return (
      <Portal>
        <DismissableLayer
          ref={mergeRefs(ref, menuRef, setFloating)}
          role="menu"
          id={ctx.contentId}
          aria-labelledby={ctx.triggerId}
          tabIndex={-1}
          style={positionStyle}
          onKeyDown={handleKeyDown}
          onDismiss={() => ctx.setOpen(false)}
          excludeElements={[ctx.referenceEl]}
          {...rest}>
          {children}
        </DismissableLayer>
      </Portal>
    );
  },
);

MenuContent.displayName = "MenuContent";

//  Item

export interface MenuItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Called when the item is activated (click or Enter/Space). Closes the menu. */
  onSelect?: () => void;
  asChild?: boolean;
}

export const MenuItem = forwardRef<HTMLButtonElement, MenuItemProps>(
  ({ asChild = false, onSelect, onClick, disabled, ...rest }, ref) => {
    const ctx = useMenuContext("Item");
    const Comp: ElementType = asChild ? Slot : "button";

    return (
      <Comp
        ref={ref}
        {...(asChild ? {} : { type: "button" as const })}
        role="menuitem"
        tabIndex={-1}
        aria-disabled={disabled || undefined}
        disabled={disabled}
        onClick={(event: MouseEvent<HTMLButtonElement>) => {
          onClick?.(event);
          if (event.defaultPrevented || disabled) return;
          onSelect?.();
          ctx.setOpen(false);
        }}
        {...rest}
      />
    );
  },
);

MenuItem.displayName = "MenuItem";

//  Separator

export const MenuSeparator = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  (props, ref) => <div ref={ref} role="separator" {...props} />,
);

MenuSeparator.displayName = "MenuSeparator";
