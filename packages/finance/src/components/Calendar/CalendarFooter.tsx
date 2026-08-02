import { Button, FINRA_UI_ATTR } from "@utk09/finra-ui";
import type { ReactNode } from "react";

import { componentIds } from "../../componentIds";
import type { CalendarFooterApi } from "../../unstyled/Calendar/Calendar";
import { resolveTenor } from "../../utils/tenor";
import styles from "./Calendar.module.scss";

//  Today button

/**
 * Props for the prebuilt "go to today" footer button.
 *
 * @remarks
 * Decide with `navigateOnly` whether pressing it *selects* today or merely
 * *navigates* to today's month. Navigating is the safer default for a range
 * picker, where an accidental selection would restart the range.
 */
export interface CalendarTodayButtonProps {
  /** Footer API injected by `Calendar`'s function `footer`. */
  api: CalendarFooterApi;
  /** Button label. Default "Go to today". */
  children?: ReactNode;
  /** Navigate to today's month without selecting it. Default false (selects today). */
  navigateOnly?: boolean;
}

/** Prebuilt footer: a "go to today" button. Wire via `footer={(api) => <CalendarTodayButton api={api} />}`. */
export function CalendarTodayButton({
  api,
  children = "Go to today",
  navigateOnly = false,
}: CalendarTodayButtonProps): ReactNode {
  const disabled = !navigateOnly && api.isDateDisabled(api.today);
  return (
    <Button
      variant="tertiary"
      disabled={disabled}
      onClick={() => (navigateOnly ? api.goToToday() : api.selectToday())}>
      {children}
    </Button>
  );
}

//  Tenor shortcuts

/**
 * One shortcut button: a label and the forward tenor it resolves to.
 *
 * @remarks
 * Resolved against *today*, not against the currently displayed month - so "1M"
 * always means one month from now, however far the user has paged.
 */
export interface CalendarShortcut {
  /** Button text, e.g. "1M". */
  label: string;
  /** Forward tenor resolved against today, e.g. "1w", "1m", "6m", "1y". */
  tenor: string;
}

/**
 * Props for a prebuilt row of relative-date shortcut buttons.
 *
 * @remarks
 * The quick way to offer "1W / 1M / 3M" beneath a date picker. Each button
 * selects `today + tenor` directly, skipping the paging a distant date would
 * otherwise need.
 *
 * @example
 * ```tsx
 * <Calendar footer={(api) => (
 *   <CalendarShortcuts api={api} shortcuts={[
 *     { label: "1W", tenor: "1w" },
 *     { label: "1M", tenor: "1m" },
 *   ]} />
 * )} />
 * ```
 */
export interface CalendarShortcutsProps {
  /** Footer API injected by `Calendar`'s function `footer`. */
  api: CalendarFooterApi;
  /** Shortcut buttons; each selects `today + tenor`. */
  shortcuts: readonly CalendarShortcut[];
}

/**
 * Prebuilt footer: tenor shortcut buttons (1W / 1M / 6M / ...). Each resolves
 * `today + tenor` via the shared tenor grammar and selects it; buttons whose
 * target falls out of the min/max range disable themselves.
 */
export function CalendarShortcuts({ api, shortcuts }: CalendarShortcutsProps): ReactNode {
  return (
    <div className={styles.shortcuts} {...{ [FINRA_UI_ATTR]: componentIds.calendarShortcuts }}>
      {shortcuts.map(({ label, tenor }) => {
        const target = resolveTenor(tenor, api.today);
        const disabled = !target || api.isDateDisabled(target);
        return (
          <Button
            key={label}
            variant="tertiary"
            disabled={disabled}
            onClick={target ? () => api.select(target) : undefined}>
            {label}
          </Button>
        );
      })}
    </div>
  );
}
