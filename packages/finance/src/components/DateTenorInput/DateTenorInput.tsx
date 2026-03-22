import { FINRA_UI_ATTR, type ValidationStatus } from "@utk09/finra-ui";
import {
  CalendarIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@utk09/finra-ui-icons/react";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";
import { forwardRef, useMemo } from "react";

import type {
  DateTenorInputBaseProps,
  DateTenorInputClassNames,
} from "../../unstyled/DateTenorInput/DateTenorInput";
import { DateTenorInputBase } from "../../unstyled/DateTenorInput/DateTenorInput";
import calendarStyles from "../Calendar/Calendar.module.scss";
import { componentIds } from "../componentIds";
import styles from "./DateTenorInput.module.scss";

//  Variant CVA (for the trigger)

const triggerVariants = cva(styles.trigger, {
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

//  Validation classes

const validationClasses: Record<ValidationStatus, string> = {
  error: styles.statusError,
  warning: styles.statusWarning,
  success: styles.statusSuccess,
};

//  Props

export interface DateTenorInputProps
  extends
    Omit<
      DateTenorInputBaseProps,
      | "classNames"
      | "dataAttributes"
      | "renderCalendarIcon"
      | "renderIndicator"
      | "renderCalendarNavPrev"
      | "renderCalendarNavNext"
    >,
    VariantProps<typeof triggerVariants> {
  /** Visual validation status. */
  validationStatus?: ValidationStatus;
  /** Stretch to fill container width. */
  fullWidth?: boolean;
  /** Additional CSS class for the root wrapper. */
  className?: string;
}

//  Static data attributes

const dateTenorDataAttributes = { [FINRA_UI_ATTR]: componentIds.dateTenorInput } as const;

//  Styled render callbacks

function styledCalendarIcon() {
  return <CalendarIcon aria-hidden="true" {...{ [FINRA_UI_ATTR]: componentIds.calendarIcon }} />;
}

function styledIndicator(_isOpen: boolean) {
  return <ChevronDownIcon />;
}

function styledNavPrev() {
  return <ChevronLeftIcon aria-hidden="true" />;
}

function styledNavNext() {
  return <ChevronRightIcon aria-hidden="true" />;
}

//  Component

export const DateTenorInput = forwardRef<HTMLDivElement, DateTenorInputProps>(
  ({ className, variant, validationStatus, fullWidth, disabled, ...props }, ref) => {
    const classNames = useMemo<DateTenorInputClassNames>(
      () => ({
        root: clsx(
          styles.root,
          fullWidth && styles.fullWidth,
          disabled && styles.disabled,
          className,
        ),
        trigger: clsx(
          triggerVariants({ variant }),
          validationStatus && validationClasses[validationStatus],
        ),
        triggerOpen: styles.open,
        dateInput: styles.dateInput,
        tenorBadge: styles.tenorBadge,
        calendarButton: styles.calendarButton,
        indicator: styles.indicator,
        indicatorOpen: styles.indicatorOpen,
        popup: styles.popup,
        calendarSection: styles.calendarSection,
        tenorSection: styles.tenorSection,
        tenorTitle: styles.tenorTitle,
        tenorGrid: styles.tenorGrid,
        tenor: styles.tenor,
        tenorSelected: styles.tenorSelected,
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
      <DateTenorInputBase
        ref={ref}
        disabled={disabled}
        classNames={classNames}
        dataAttributes={dateTenorDataAttributes}
        renderCalendarIcon={styledCalendarIcon}
        renderIndicator={styledIndicator}
        renderCalendarNavPrev={styledNavPrev}
        renderCalendarNavNext={styledNavNext}
        {...props}
      />
    );
  },
);

DateTenorInput.displayName = "DateTenorInput";
