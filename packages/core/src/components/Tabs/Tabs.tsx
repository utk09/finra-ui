import { clsx } from "clsx";
import { forwardRef } from "react";

import {
  Tab as TabBase,
  type TabProps as TabBaseProps,
  TabList as TabListBase,
  type TabListProps as TabListBaseProps,
  TabPanel as TabPanelBase,
  type TabPanelProps as TabPanelBaseProps,
  type TabsProps,
  Tabs as TabsRoot,
} from "../../unstyled/Tabs/Tabs";
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
/**
 * Props for the styled tab strip.
 *
 * @remarks
 * Identical to the unstyled base's - the styled layer adds only CSS, no new API.
 */
export type TabListProps = TabListBaseProps;

/** Tabs root - controlled/uncontrolled selection, orientation, activation mode. */
export const Tabs = forwardRef<HTMLDivElement, TabsProps>(({ className, ...rest }, ref) => (
  <TabsRoot ref={ref} className={clsx(styles.root, className)} {...rest} />
));

Tabs.displayName = "Tabs";

/**
 * Styled tab strip (roving focus, arrow-key navigation).
 *
 * @see {@link TabListProps}
 */
export const TabList = forwardRef<HTMLDivElement, TabListProps>(({ className, ...rest }, ref) => (
  <TabListBase ref={ref} className={clsx(styles.list, className)} {...rest} />
));

TabList.displayName = "TabList";

/** Styled tab. Provide a `value` matching its `TabPanel`. */
export const Tab = forwardRef<HTMLButtonElement, TabProps>(({ className, ...rest }, ref) => (
  <TabBase ref={ref} className={clsx(styles.tab, className)} {...rest} />
));

Tab.displayName = "Tab";

/** Styled tab panel. Provide a `value` matching its `Tab`. */
export const TabPanel = forwardRef<HTMLDivElement, TabPanelProps>(({ className, ...rest }, ref) => (
  <TabPanelBase ref={ref} className={clsx(styles.panel, className)} {...rest} />
));

TabPanel.displayName = "TabPanel";
