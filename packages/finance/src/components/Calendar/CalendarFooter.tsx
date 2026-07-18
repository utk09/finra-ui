import { Button } from "@utk09/finra-ui";
import type { ReactNode } from "react";

import type { CalendarFooterApi } from "../../unstyled/Calendar/Calendar";
import { resolveTenor } from "../../utils/tenor";
import styles from "./Calendar.module.scss";

//  Today button

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

export interface CalendarShortcut {
  /** Button text, e.g. "1M". */
  label: string;
  /** Forward tenor resolved against today, e.g. "1w", "1m", "6m", "1y". */
  tenor: string;
}

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
    <div className={styles.shortcuts}>
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
