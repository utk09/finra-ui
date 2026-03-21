import { clsx } from "clsx";
import { forwardRef, useMemo } from "react";

import type { CalendarBaseProps, CalendarClassNames } from "../../unstyled/Calendar/Calendar";
import { CalendarBase } from "../../unstyled/Calendar/Calendar";
import { componentIds, FINRA_UI_ATTR } from "../componentIds";
import styles from "./Calendar.module.scss";

export interface CalendarProps extends CalendarBaseProps {
  /** Additional CSS class on the root element. */
  className?: string;
}

const defaultClassNames: CalendarClassNames = {
  root: styles.root,
  header: styles.header,
  navButton: styles.navButton,
  title: styles.title,
  weekdayRow: styles.row,
  weekday: styles.weekday,
  grid: styles.grid,
  row: styles.row,
  day: styles.day,
  dayToday: styles.dayToday,
  daySelected: styles.daySelected,
  dayDisabled: styles.dayDisabled,
  dayOutside: styles.dayOutside,
  footer: styles.footer,
};

export const Calendar = forwardRef<HTMLDivElement, CalendarProps>(
  ({ className, classNames: userClassNames, ...props }, ref) => {
    const mergedClassNames = useMemo<CalendarClassNames>(() => {
      if (!userClassNames)
        return { ...defaultClassNames, root: clsx(defaultClassNames.root, className) };

      const merged: CalendarClassNames = {};
      for (const key of Object.keys(defaultClassNames) as (keyof CalendarClassNames)[]) {
        merged[key] = clsx(defaultClassNames[key], userClassNames[key]);
      }
      merged.root = clsx(merged.root, className);
      return merged;
    }, [className, userClassNames]);

    return (
      <CalendarBase
        ref={ref}
        classNames={mergedClassNames}
        dataAttributes={{ [FINRA_UI_ATTR]: componentIds.calendar }}
        {...props}
      />
    );
  },
);

Calendar.displayName = "Calendar";
