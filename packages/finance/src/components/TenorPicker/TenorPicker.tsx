import { FINRA_UI_ATTR, type ValidationStatus } from "@utk09/finra-ui";
import { CheckIcon, ChevronDownIcon } from "@utk09/finra-ui-icons/react";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";
import { forwardRef, useMemo } from "react";

import type {
  TenorPickerBaseProps,
  TenorPickerClassNames,
  TenorPickerHandle,
} from "../../unstyled/TenorPicker/TenorPicker";
import { TenorPickerBase } from "../../unstyled/TenorPicker/TenorPicker";
import { componentIds } from "../componentIds";
import styles from "./TenorPicker.module.scss";

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

export interface TenorPickerProps
  extends
    Omit<
      TenorPickerBaseProps,
      "classNames" | "dataAttributes" | "renderIndicator" | "renderFavourite" | "renderCheck"
    >,
    VariantProps<typeof rootVariants> {
  /** Visual validation status. */
  validationStatus?: ValidationStatus;
  /** Stretch to fill the container width. */
  fullWidth?: boolean;
  /** Additional CSS class for the root wrapper. */
  className?: string;
}

const dataAttributes = { [FINRA_UI_ATTR]: componentIds.tenorPicker } as const;

//  Styled render callbacks

function styledIndicator(_isOpen: boolean) {
  return <ChevronDownIcon aria-hidden="true" />;
}

function styledCheck() {
  return <CheckIcon aria-hidden="true" />;
}

function styledFavourite(active: boolean) {
  // Unicode star (no dedicated icon in the set); filled vs. outline conveys state.
  return <span aria-hidden="true">{active ? "★" : "☆"}</span>;
}

//  Component

export const TenorPicker = forwardRef<TenorPickerHandle, TenorPickerProps>(
  (
    { className, variant, validationStatus, fullWidth, disabled, showFavourites = true, ...props },
    ref,
  ) => {
    const classNames = useMemo<TenorPickerClassNames>(
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
        indicator: styles.indicator,
        indicatorOpen: styles.indicatorOpen,
        popup: styles.popup,
        group: styles.group,
        groupLabel: styles.groupLabel,
        option: styles.option,
        optionHighlighted: styles.optionHighlighted,
        optionSelected: styles.optionSelected,
        optionDisabled: styles.optionDisabled,
        optionFavourite: styles.optionFavourite,
        optionLabel: styles.optionLabel,
        favouriteButton: styles.favouriteButton,
        favouriteActive: styles.favouriteActive,
        check: styles.check,
        empty: styles.empty,
      }),
      [className, variant, validationStatus, fullWidth, disabled],
    );

    return (
      <TenorPickerBase
        ref={ref}
        disabled={disabled}
        showFavourites={showFavourites}
        classNames={classNames}
        dataAttributes={dataAttributes}
        renderIndicator={styledIndicator}
        renderCheck={styledCheck}
        renderFavourite={showFavourites ? styledFavourite : undefined}
        {...props}
      />
    );
  },
);

TenorPicker.displayName = "TenorPicker";
