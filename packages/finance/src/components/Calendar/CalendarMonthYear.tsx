import { Select, SelectContent, SelectTrigger } from "@utk09/finra-ui";
import type { ReactNode } from "react";

import { MONTH_NAMES } from "../../logic/calendar";
import type { CalendarTitleApi } from "../../unstyled/Calendar/Calendar";
import styles from "./Calendar.module.scss";

export interface CalendarMonthYearProps {
  /** Title API injected by `Calendar`'s `renderTitle` (or the `monthYearDropdowns` prop). */
  api: CalendarTitleApi;
}

/**
 * Header quick-nav: month + year dropdowns (core `Select`). Months out of the
 * min/max range disable themselves; the year list is bounded by min/max.
 */
export function CalendarMonthYear({ api }: CalendarMonthYearProps): ReactNode {
  const monthOptions = MONTH_NAMES.map((name, index) => ({
    value: String(index),
    label: name,
    disabled: api.isMonthDisabled(index),
  }));
  const yearOptions = api.years.map((year) => ({ value: String(year), label: String(year) }));

  return (
    <div className={styles.monthYear}>
      <Select
        options={monthOptions}
        value={String(api.monthIndex)}
        onValueChange={(v) => api.setMonthIndex(Number(v))}>
        <SelectTrigger aria-label="Month" />
        <SelectContent aria-label="Month" />
      </Select>
      <Select
        options={yearOptions}
        value={String(api.year)}
        onValueChange={(v) => api.setYear(Number(v))}>
        <SelectTrigger aria-label="Year" />
        <SelectContent aria-label="Year" />
      </Select>
    </div>
  );
}
