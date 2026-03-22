import { FINRA_UI_ATTR, type ValidationStatus } from "@utk09/finra-ui";
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "@utk09/finra-ui-icons/react";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";
import { forwardRef, useMemo } from "react";

import type { DateInputBaseProps, DateInputClassNames } from "../../unstyled/DateInput/DateInput";
import { DateInputBase } from "../../unstyled/DateInput/DateInput";
import calendarStyles from "../Calendar/Calendar.module.scss";
import { componentIds } from "../componentIds";
import styles from "./DateInput.module.scss";

const dateInputVariants = cva(styles.wrapper, {
  variants: {
    variant: {
      primary: styles.variantPrimary,
      secondary: styles.variantSecondary,
      tertiary: styles.variantTertiary,
    },
  },
  defaultVariants: {
    variant: "primary",
  },
});

const validationClasses: Record<ValidationStatus, string> = {
  error: styles.statusError,
  warning: styles.statusWarning,
  success: styles.statusSuccess,
};

export interface DateInputProps
  extends
    Omit<
      DateInputBaseProps,
      | "classNames"
      | "dataAttributes"
      | "renderCalendarIcon"
      | "renderCalendarNavPrev"
      | "renderCalendarNavNext"
    >,
    VariantProps<typeof dateInputVariants> {
  /** Visual validation status. */
  validationStatus?: ValidationStatus;
  /** Stretch to fill container width. */
  fullWidth?: boolean;
  /** Additional CSS class for the wrapper. */
  className?: string;
}

function styledCalendarIcon() {
  return <CalendarIcon aria-hidden="true" {...{ [FINRA_UI_ATTR]: componentIds.calendarIcon }} />;
}

function styledNavPrev() {
  return <ChevronLeftIcon aria-hidden="true" />;
}

function styledNavNext() {
  return <ChevronRightIcon aria-hidden="true" />;
}

export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  ({ className, variant, validationStatus, fullWidth, disabled, ...props }, ref) => {
    const classNames = useMemo<DateInputClassNames>(
      () => ({
        root: clsx(
          dateInputVariants({ variant }),
          validationStatus && validationClasses[validationStatus],
          disabled && styles.disabled,
          fullWidth && styles.fullWidth,
          className,
        ),
        calendarOpen: styles.calendarOpen,
        input: styles.field,
        adornment: styles.adornment,
        popup: styles.popup,
        calendar: {
          root: calendarStyles.root,
          header: calendarStyles.header,
          navButton: calendarStyles.navButton,
          title: calendarStyles.title,
          weekdayRow: calendarStyles.weekdayRow,
          weekday: calendarStyles.weekday,
          grid: calendarStyles.grid,
          row: calendarStyles.row,
          day: calendarStyles.day,
          dayToday: calendarStyles.dayToday,
          daySelected: calendarStyles.daySelected,
          dayDisabled: calendarStyles.dayDisabled,
          dayOutside: calendarStyles.dayOutside,
          footer: calendarStyles.footer,
        },
      }),
      [className, variant, validationStatus, fullWidth, disabled],
    );

    return (
      <DateInputBase
        ref={ref}
        disabled={disabled}
        classNames={classNames}
        dataAttributes={{
          [FINRA_UI_ATTR]: componentIds.dateInput,
        }}
        renderCalendarIcon={styledCalendarIcon}
        renderCalendarNavPrev={styledNavPrev}
        renderCalendarNavNext={styledNavNext}
        {...props}
      />
    );
  },
);

DateInput.displayName = "DateInput";
