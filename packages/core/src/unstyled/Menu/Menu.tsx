import {
  type ButtonHTMLAttributes,
  type CSSProperties,
  createContext,
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

import { componentIds, FINRA_UI_ATTR } from "../../componentIds";
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

/**
 * Props for the Menu root - the state owner. It renders nothing itself; the
 * visible parts are `MenuTrigger` and `MenuContent`.
 *
 * @remarks
 * Open state is controlled *or* uncontrolled: pass `open` to own it, or
 * `defaultOpen` to let the menu manage itself. Passing both makes `open` win.
 *
 * @example
 * ```tsx
 * <Menu placement="bottom-end">
 *   <MenuTrigger>Actions</MenuTrigger>
 *   <MenuContent aria-label="Actions">
 *     <MenuItem onSelect={edit}>Edit</MenuItem>
 *   </MenuContent>
 * </Menu>
 * ```
 */
export interface MenuProps {
  /** The trigger and content parts. */
  children?: ReactNode;
  /** Controlled open state. When set, the menu never changes it - handle `onOpenChange`. */
  open?: boolean;
  /** Initial open state when uncontrolled. Ignored if `open` is set. */
  defaultOpen?: boolean;
  /**
   * Fired whenever the menu wants to open or close - trigger click, Escape,
   * outside pointer, or an item selection.
   */
  onOpenChange?: (open: boolean) => void;
  /**
   * Preferred placement against the trigger. Default "bottom-start".
   *
   * @remarks
   * A preference, not a guarantee: the menu flips and shifts to stay in the
   * viewport.
   */
  placement?: Placement;
  /** Gap between the trigger and the menu, in px. Default 4. */
  offset?: number;
}

/**
 * Menu root - owns open state and placement. Renders nothing itself; compose it
 * with `MenuTrigger`, `MenuContent` and `MenuItem`.
 *
 * @see {@link MenuProps}
 */
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

/**
 * Props for the element that opens the menu. Wires `aria-haspopup`,
 * `aria-expanded` and `aria-controls` for you.
 *
 * @remarks
 * Opens on click, Enter and Space; ArrowDown opens onto the first item and
 * ArrowUp onto the last. Calling `preventDefault()` in your own `onClick` or
 * `onKeyDown` suppresses all of that, which is the supported way to gate
 * opening behind a confirmation.
 */
export interface MenuTriggerProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Render the single child element instead of a `<button>`, merging these
   * props onto it - for turning a link, or your own Button, into the trigger.
   *
   * @remarks
   * `type="button"` is only applied when this component renders its own
   * `<button>`, so it is never stamped onto an element where the attribute is
   * invalid. You are then responsible for the child being genuinely
   * interactive and focusable.
   *
   * @defaultValue `false`
   */
  asChild?: boolean;
}

/**
 * Opens the menu and anchors it.
 *
 * @see {@link MenuTriggerProps}
 */
export const MenuTrigger = forwardRef<HTMLButtonElement, MenuTriggerProps>(
  ({ asChild = false, onClick, onKeyDown, ...rest }, ref) => {
    const ctx = useMenuContext("Trigger");
    const Comp: ElementType = asChild ? Slot : "button";

    return (
      <Comp
        ref={mergeRefs(ref, ctx.setReferenceEl)}
        {...(asChild ? {} : { type: "button" as const })}
        id={ctx.triggerId}
        {...{ [FINRA_UI_ATTR]: componentIds.menuTrigger }}
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

/**
 * Props for the popup surface. Portalled, positioned against the trigger, and
 * dismissed on Escape or an outside pointer.
 *
 * @remarks
 * Owns roving focus and typeahead over its `MenuItem` children. Calling
 * `preventDefault()` in your own `onKeyDown` suppresses both, but **not**
 * dismissal - Escape still closes, because that lives in the surrounding
 * dismissable layer. A consumer cannot trap the user inside the menu.
 *
 * Give it an `aria-label`: the popup is detached from the trigger in the DOM,
 * so it has no accessible name of its own.
 */
export interface MenuContentProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Where the content is portalled. Defaults to `document.body`.
   *
   * @remarks
   * Pass a node you own to bring it back inside your subtree, so a token
   * override or a scoped rule declared on an ancestor reaches it. The default
   * escapes ancestor `overflow: hidden`, `z-index` and `transform` contexts.
   */
  container?: Element | null;
  /** `MenuItem` and `MenuSeparator` children. */
  children?: ReactNode;
}

/**
 * The menu surface. Portalled, with roving focus and typeahead.
 *
 * @see {@link MenuContentProps}
 */
export const MenuContent = forwardRef<HTMLDivElement, MenuContentProps>(
  ({ children, style, onKeyDown, container, ...rest }, ref) => {
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
      <Portal container={container}>
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

/**
 * Props for one command in the menu.
 *
 * @remarks
 * Set `disabled` to render it inert - it is then skipped by arrow navigation
 * and typeahead rather than merely being unclickable.
 *
 * Calling `preventDefault()` in your own `onClick` suppresses both `onSelect`
 * and the close, which is how you keep a menu open for a multi-step action.
 */
export interface MenuItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Called when the item is activated (click or Enter/Space). Closes the menu. */
  onSelect?: () => void;
  /**
   * Render the single child element instead of a `<button>`, merging these
   * props onto it - for a menu item that is really a link.
   *
   * @remarks
   * `type="button"` is only applied when this component renders its own
   * `<button>`, so it is never stamped onto an element where the attribute is
   * invalid.
   *
   * @defaultValue `false`
   */
  asChild?: boolean;
}

/**
 * One command in the menu.
 *
 * @see {@link MenuItemProps}
 */
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

/**
 * A divider between groups of menu items. Presentational only.
 */
export const MenuSeparator = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  // A static separator is not focusable and takes no value: aria-valuenow and
  // focusability apply to a splitter, which this is not.
  // biome-ignore lint/a11y/useFocusableInteractive: static separator, see above
  // biome-ignore lint/a11y/useAriaPropsForRole: static separator, see above
  (props, ref) => <div ref={ref} role="separator" {...props} />,
);

MenuSeparator.displayName = "MenuSeparator";
