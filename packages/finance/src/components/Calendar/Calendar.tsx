import { FINRA_UI_ATTR } from "@utk09/finra-ui";
import { clsx } from "clsx";
import { forwardRef, useMemo } from "react";

import type { CalendarBaseProps, CalendarClassNames } from "../../unstyled/Calendar/Calendar";
import { CalendarBase } from "../../unstyled/Calendar/Calendar";
import { componentIds } from "../componentIds";
import styles from "./Calendar.module.scss";
import { CalendarMonthYear } from "./CalendarMonthYear";

export interface CalendarProps extends CalendarBaseProps {
  /** Additional CSS class on the root element. */
  className?: string;
  /**
   * Replace the static header title with month + year dropdown quick-nav.
   * Ignored when a custom `renderTitle` is supplied. Default false.
   */
  monthYearDropdowns?: boolean;
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
  dayHighlighted: styles.dayHighlighted,
  weekNumber: styles.weekNumber,
  footer: styles.footer,
};

export const Calendar = forwardRef<HTMLDivElement, CalendarProps>(
  ({ className, classNames: userClassNames, monthYearDropdowns, renderTitle, ...props }, ref) => {
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

    // An explicit renderTitle wins; otherwise opt into the month/year dropdowns.
    const resolvedRenderTitle =
      renderTitle ?? (monthYearDropdowns ? (api) => <CalendarMonthYear api={api} /> : undefined);

    return (
      <CalendarBase
        ref={ref}
        classNames={mergedClassNames}
        dataAttributes={{ [FINRA_UI_ATTR]: componentIds.calendar }}
        renderTitle={resolvedRenderTitle}
        {...props}
      />
    );
  },
);

Calendar.displayName = "Calendar";
