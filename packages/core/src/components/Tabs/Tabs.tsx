import { clsx } from "clsx";
import { forwardRef, type HTMLAttributes } from "react";

import {
  Tab as TabBase,
  type TabProps as TabBaseProps,
  TabList as TabListBase,
  TabPanel as TabPanelBase,
  type TabPanelProps as TabPanelBaseProps,
  type TabsProps,
  Tabs as TabsRoot,
} from "../../unstyled/Tabs/Tabs";
import { componentIds, FINRA_UI_ATTR } from "../componentIds";
import styles from "./Tabs.module.scss";

export type { TabsProps };
/**
 * Props for a styled tab button.
 *
 * @remarks
 * Identical to the unstyled base's - the styled layer adds only CSS, no new API.
 */
export type TabProps = TabBaseProps;
/**
 * Props for a styled tab panel.
 *
 * @remarks
 * Identical to the unstyled base's - the styled layer adds only CSS, no new API.
 */
export type TabPanelProps = TabPanelBaseProps;

/** Tabs root - controlled/uncontrolled selection, orientation, activation mode. */
export const Tabs = forwardRef<HTMLDivElement, TabsProps>(({ className, ...rest }, ref) => (
  <TabsRoot
    ref={ref}
    {...{ [FINRA_UI_ATTR]: componentIds.tabs }}
    className={clsx(styles.root, className)}
    {...rest}
  />
));

Tabs.displayName = "Tabs";

/** Styled tab strip (roving focus, arrow-key navigation). */
export const TabList = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...rest }, ref) => (
    <TabListBase
      ref={ref}
      {...{ [FINRA_UI_ATTR]: componentIds.tabList }}
      className={clsx(styles.list, className)}
      {...rest}
    />
  ),
);

TabList.displayName = "TabList";

/** Styled tab. Provide a `value` matching its `TabPanel`. */
export const Tab = forwardRef<HTMLButtonElement, TabProps>(({ className, ...rest }, ref) => (
  <TabBase
    ref={ref}
    {...{ [FINRA_UI_ATTR]: componentIds.tab }}
    className={clsx(styles.tab, className)}
    {...rest}
  />
));

Tab.displayName = "Tab";

/** Styled tab panel. Provide a `value` matching its `Tab`. */
export const TabPanel = forwardRef<HTMLDivElement, TabPanelProps>(({ className, ...rest }, ref) => (
  <TabPanelBase
    ref={ref}
    {...{ [FINRA_UI_ATTR]: componentIds.tabPanel }}
    className={clsx(styles.panel, className)}
    {...rest}
  />
));

TabPanel.displayName = "TabPanel";
