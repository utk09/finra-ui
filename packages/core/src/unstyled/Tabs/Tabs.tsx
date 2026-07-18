import {
  type ButtonHTMLAttributes,
  createContext,
  forwardRef,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
} from "react";

import { useControlledValue } from "../../hooks/useControlledValue";
import { resolveTabsKey, type TabsActivationMode, type TabsOrientation } from "../../logic/tabs";
import { mergeRefs } from "../../utils/mergeRefs";

/** Enabled tabs in DOM order (the roving-focus list). */
function getEnabledTabs(root: HTMLElement | null): HTMLElement[] {
  if (!root) return [];
  return Array.from(root.querySelectorAll<HTMLElement>('[role="tab"]:not([aria-disabled="true"])'));
}

interface TabsContextValue {
  value: string;
  setValue: (value: string) => void;
  orientation: TabsOrientation;
  activationMode: TabsActivationMode;
  baseId: string;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext(part: string): TabsContextValue {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error(`Tabs.${part} must be used within a <Tabs>.`);
  return ctx;
}

const tabId = (baseId: string, value: string): string => `${baseId}-tab-${value}`;
const panelId = (baseId: string, value: string): string => `${baseId}-panel-${value}`;

//  Root

export interface TabsProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** Selected tab value (controlled). */
  value?: string;
  /** Initial selected tab value (uncontrolled). */
  defaultValue?: string;
  /** Called when the selected tab changes. */
  onValueChange?: (value: string) => void;
  /** Arrow-key axis and `aria-orientation`. Default "horizontal". */
  orientation?: TabsOrientation;
  /**
   * "automatic" selects a tab as soon as it is focused (arrow keys); "manual"
   * only moves focus and selects on Enter/Space or click. Default "automatic".
   */
  activationMode?: TabsActivationMode;
  children?: ReactNode;
}

export const Tabs = forwardRef<HTMLDivElement, TabsProps>(
  (
    {
      value,
      defaultValue,
      onValueChange,
      orientation = "horizontal",
      activationMode = "automatic",
      children,
      ...rest
    },
    ref,
  ) => {
    const [selected, setSelected] = useControlledValue(value, defaultValue ?? "", onValueChange);
    const baseId = useId();

    const ctx = useMemo<TabsContextValue>(
      () => ({ value: selected, setValue: setSelected, orientation, activationMode, baseId }),
      [selected, setSelected, orientation, activationMode, baseId],
    );

    return (
      <TabsContext.Provider value={ctx}>
        <div ref={ref} data-orientation={orientation} {...rest}>
          {children}
        </div>
      </TabsContext.Provider>
    );
  },
);

Tabs.displayName = "Tabs";

//  List

export const TabList = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ children, onKeyDown, ...rest }, ref) => {
    const ctx = useTabsContext("List");
    const listRef = useRef<HTMLDivElement>(null);
    const { value, orientation, activationMode, setValue } = ctx;

    // Roving-tabindex fallback: a tab is tabbable only when selected, so if the
    // current value matches no tab (e.g. no default provided) nothing would be
    // reachable by keyboard. Make the first enabled tab tabbable in that case.
    useEffect(() => {
      const tabs = getEnabledTabs(listRef.current);
      const hasTabbable = tabs.some((t) => t.tabIndex === 0);
      if (!hasTabbable && tabs[0]) tabs[0].tabIndex = 0;
    }, [value]);

    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
      onKeyDown?.(event);
      if (event.defaultPrevented) return;

      const tabs = getEnabledTabs(listRef.current);
      const currentIndex = tabs.indexOf(document.activeElement as HTMLElement);
      const { preventDefault, effects } = resolveTabsKey(event.key, {
        currentIndex,
        count: tabs.length,
        orientation,
      });
      if (preventDefault) event.preventDefault();

      for (const effect of effects) {
        const el = tabs[effect.index];
        el.focus();
        // Automatic activation: selecting follows focus.
        const nextValue = el.dataset.value;
        if (activationMode === "automatic" && nextValue !== undefined) {
          setValue(nextValue);
        }
      }
    };

    return (
      // APG tabs: the tablist is a non-focusable container; the tabs hold focus
      // and the roving keydown handler lives here (bubbles up from the focused
      // tab). jsx-a11y wrongly wants the container itself focusable.
      // eslint-disable-next-line jsx-a11y/interactive-supports-focus
      <div
        ref={mergeRefs(ref, listRef)}
        role="tablist"
        aria-orientation={orientation}
        onKeyDown={handleKeyDown}
        {...rest}>
        {children}
      </div>
    );
  },
);

TabList.displayName = "TabList";

//  Tab

export interface TabProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Identifies this tab and its panel. */
  value: string;
}

export const Tab = forwardRef<HTMLButtonElement, TabProps>(
  ({ value, disabled, onClick, onKeyDown, ...rest }, ref) => {
    const ctx = useTabsContext("Tab");
    const selected = ctx.value === value;

    return (
      <button
        ref={ref}
        type="button"
        role="tab"
        id={tabId(ctx.baseId, value)}
        aria-selected={selected}
        aria-controls={panelId(ctx.baseId, value)}
        aria-disabled={disabled || undefined}
        disabled={disabled}
        tabIndex={selected ? 0 : -1}
        data-value={value}
        data-state={selected ? "active" : "inactive"}
        onClick={(event: MouseEvent<HTMLButtonElement>) => {
          onClick?.(event);
          // A disabled <button> blocks React's click, so no disabled guard needed.
          if (event.defaultPrevented) return;
          ctx.setValue(value);
        }}
        onKeyDown={(event: KeyboardEvent<HTMLButtonElement>) => {
          onKeyDown?.(event);
          if (event.defaultPrevented) return;
          // Manual activation: focus alone does not select; Enter/Space does.
          if (ctx.activationMode === "manual" && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            ctx.setValue(value);
          }
        }}
        {...rest}
      />
    );
  },
);

Tab.displayName = "Tab";

//  Panel

export interface TabPanelProps extends HTMLAttributes<HTMLDivElement> {
  /** Must match the `value` of the controlling tab. */
  value: string;
}

export const TabPanel = forwardRef<HTMLDivElement, TabPanelProps>(
  ({ value, children, ...rest }, ref) => {
    const ctx = useTabsContext("Panel");
    const selected = ctx.value === value;

    return (
      <div
        ref={ref}
        role="tabpanel"
        id={panelId(ctx.baseId, value)}
        aria-labelledby={tabId(ctx.baseId, value)}
        hidden={!selected}
        tabIndex={0}
        data-state={selected ? "active" : "inactive"}
        {...rest}>
        {children}
      </div>
    );
  },
);

TabPanel.displayName = "TabPanel";
