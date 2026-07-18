import { clsx } from "clsx";
import { forwardRef, type HTMLAttributes } from "react";

import {
  Menu as MenuRoot,
  MenuContent as MenuContentBase,
  type MenuContentProps as MenuContentBaseProps,
  MenuItem as MenuItemBase,
  type MenuItemProps as MenuItemBaseProps,
  type MenuProps,
  MenuSeparator as MenuSeparatorBase,
  MenuTrigger as MenuTriggerBase,
  type MenuTriggerProps,
} from "../../unstyled/Menu/Menu";
import { componentIds, FINRA_UI_ATTR } from "../componentIds";
import styles from "./Menu.module.scss";

export type { MenuProps, MenuTriggerProps };
export type MenuContentProps = MenuContentBaseProps;
export type MenuItemProps = MenuItemBaseProps;

/** Menu root - controlled/uncontrolled open state, placement. */
export const Menu = MenuRoot;

/**
 * Opens the menu. Wrap your own control with `asChild`
 * (e.g. `<MenuTrigger asChild><Button>Actions</Button></MenuTrigger>`).
 */
export const MenuTrigger = MenuTriggerBase;

/** Styled menu panel (portalled, anchored, roving focus, dismiss-on-escape/outside). */
export const MenuContent = forwardRef<HTMLDivElement, MenuContentProps>(
  ({ className, ...rest }, ref) => (
    <MenuContentBase
      ref={ref}
      {...{ [FINRA_UI_ATTR]: componentIds.menu }}
      className={clsx(styles.panel, className)}
      {...rest}
    />
  ),
);

MenuContent.displayName = "MenuContent";

/** Styled menu item. Provide `onSelect`; the menu closes on activation. */
export const MenuItem = forwardRef<HTMLButtonElement, MenuItemProps>(
  ({ className, ...rest }, ref) => (
    <MenuItemBase
      ref={ref}
      {...{ [FINRA_UI_ATTR]: componentIds.menuItem }}
      className={clsx(styles.item, className)}
      {...rest}
    />
  ),
);

MenuItem.displayName = "MenuItem";

/** Styled horizontal separator between menu items. */
export const MenuSeparator = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...rest }, ref) => (
    <MenuSeparatorBase
      ref={ref}
      {...{ [FINRA_UI_ATTR]: componentIds.menuSeparator }}
      className={clsx(styles.separator, className)}
      {...rest}
    />
  ),
);

MenuSeparator.displayName = "MenuSeparator";
