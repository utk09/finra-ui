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
  DateTenorPickerBaseProps,
  DateTenorPickerClassNames,
  DateTenorPickerHandle,
} from "../../unstyled/DateTenorPicker/DateTenorPicker";
import { DateTenorPickerBase } from "../../unstyled/DateTenorPicker/DateTenorPicker";
import calendarStyles from "../Calendar/Calendar.module.scss";
import { componentIds } from "../componentIds";
import styles from "./DateTenorPicker.module.scss";

//  Root variants

const rootVariants = cva(styles.root, {
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

//  Props

export interface DateTenorPickerProps
  extends
    Omit<
      DateTenorPickerBaseProps,
      | "classNames"
      | "dataAttributes"
      | "renderCalendarIcon"
      | "renderIndicator"
      | "renderCalendarNavPrev"
      | "renderCalendarNavNext"
    >,
    VariantProps<typeof rootVariants> {
  /** Visual validation status. */
  validationStatus?: ValidationStatus;
  /** Stretch to fill the container width. */
  fullWidth?: boolean;
  /** Additional CSS class for the root wrapper. */
  className?: string;
}

const dataAttributes = { [FINRA_UI_ATTR]: componentIds.dateTenorPicker } as const;

//  Styled render callbacks

function styledCalendarIcon() {
  return <CalendarIcon aria-hidden="true" />;
}

function styledIndicator(_isOpen: boolean) {
  return <ChevronDownIcon aria-hidden="true" />;
}

function styledNavPrev() {
  return <ChevronLeftIcon aria-hidden="true" />;
}

function styledNavNext() {
  return <ChevronRightIcon aria-hidden="true" />;
}

//  Component

export const DateTenorPicker = forwardRef<DateTenorPickerHandle, DateTenorPickerProps>(
  ({ className, variant, validationStatus, fullWidth, disabled, ...props }, ref) => {
    const classNames = useMemo<DateTenorPickerClassNames>(
      () => ({
        root: clsx(
          rootVariants({ variant }),
          fullWidth && styles.fullWidth,
          disabled && styles.disabled,
          validationStatus && validationClasses[validationStatus],
          className,
        ),
        rootOpen: styles.open,
        input: styles.input,
        adornment: styles.calendarButton,
        indicator: styles.indicator,
        indicatorOpen: styles.indicatorOpen,
        popup: styles.popup,
        calendarSection: styles.calendarSection,
        tenorSection: styles.tenorSection,
        tenorTitle: styles.tenorTitle,
        tenorGrid: styles.tenorGrid,
        tenor: styles.tenor,
        tenorHighlighted: styles.tenorHighlighted,
        tenorDisabled: styles.tenorDisabled,
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
          dayHighlighted: calendarStyles.dayHighlighted,
          weekNumber: calendarStyles.weekNumber,
          footer: calendarStyles.footer,
        },
      }),
      [className, variant, validationStatus, fullWidth, disabled],
    );

    return (
      <DateTenorPickerBase
        ref={ref}
        disabled={disabled}
        classNames={classNames}
        dataAttributes={dataAttributes}
        renderCalendarIcon={styledCalendarIcon}
        renderIndicator={styledIndicator}
        renderCalendarNavPrev={styledNavPrev}
        renderCalendarNavNext={styledNavNext}
        {...props}
      />
    );
  },
);

DateTenorPicker.displayName = "DateTenorPicker";
