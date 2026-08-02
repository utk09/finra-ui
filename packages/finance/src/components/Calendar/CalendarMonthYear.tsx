import { FINRA_UI_ATTR, Select, SelectContent, SelectTrigger } from "@utk09/finra-ui";
import type { ReactNode } from "react";

import { componentIds } from "../../componentIds";
import type { CalendarTitleApi } from "../../unstyled/Calendar/Calendar";
import styles from "./Calendar.module.scss";

/**
 * Props for the prebuilt month + year dropdown header.
 *
 * @remarks
 * Turn it on with the Calendar's `monthYearDropdowns` prop rather than wiring
 * this by hand; render it through `renderTitle` only when you need to place it
 * yourself. Worth enabling whenever users pick dates far from today - paging a
 * month at a time to reach a maturity two years out is painful.
 */
export interface CalendarMonthYearProps {
  /** Title API injected by `Calendar`'s `renderTitle` (or the `monthYearDropdowns` prop). */
  api: CalendarTitleApi;
}

/**
 * Header quick-nav: month + year dropdowns (core `Select`). Months out of the
 * min/max range disable themselves; the year list is bounded by min/max.
 */
export function CalendarMonthYear({ api }: CalendarMonthYearProps): ReactNode {
  const monthOptions = api.monthNames.map((name, index) => ({
    value: String(index),
    label: name,
    disabled: api.isMonthDisabled(index),
  }));
  const yearOptions = api.years.map((year) => ({ value: String(year), label: String(year) }));

  return (
    <div className={styles.monthYear} {...{ [FINRA_UI_ATTR]: componentIds.calendarMonthYear }}>
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
