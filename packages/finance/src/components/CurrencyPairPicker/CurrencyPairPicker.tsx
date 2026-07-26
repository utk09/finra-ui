import { FINRA_UI_ATTR, type ValidationStatus } from "@utk09/finra-ui";
import { ChevronDownIcon } from "@utk09/finra-ui-icons/react";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";
import { forwardRef, useMemo } from "react";

import type {
  CurrencyPair,
  CurrencyPairPickerBaseProps,
  CurrencyPairPickerClassNames,
  CurrencyPairPickerHandle,
} from "../../unstyled/CurrencyPairPicker/CurrencyPairPicker";
import { CurrencyPairPickerBase } from "../../unstyled/CurrencyPairPicker/CurrencyPairPicker";
import { componentIds } from "../componentIds";
import styles from "./CurrencyPairPicker.module.scss";

//  Root variants

const rootVariants = cva(styles.root, {
  variants: {
    variant: {
      primary: undefined,
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

export interface CurrencyPairPickerProps<T extends CurrencyPair = CurrencyPair>
  extends
    Omit<
      CurrencyPairPickerBaseProps<T>,
      | "classNames"
      | "dataAttributes"
      | "controlDataAttributes"
      | "badgeDataAttributes"
      | "renderIndicator"
      | "renderFavourite"
    >,
    VariantProps<typeof rootVariants> {
  /** Visual validation status. */
  validationStatus?: ValidationStatus;
  /** Stretch to fill the container width. */
  fullWidth?: boolean;
  /** Additional CSS class for the root wrapper. */
  className?: string;
}

const dataAttributes = { [FINRA_UI_ATTR]: componentIds.currencyPairPicker } as const;
const controlDataAttributes = {
  [FINRA_UI_ATTR]: componentIds.currencyPairPickerControl,
} as const;
const badgeDataAttributes = { [FINRA_UI_ATTR]: componentIds.currencyPairBadge } as const;

//  Styled render callbacks

function styledIndicator(_isOpen: boolean) {
  return <ChevronDownIcon aria-hidden="true" />;
}

function styledFavourite(active: boolean) {
  // Unicode star (no dedicated icon in the set); filled vs. outline conveys
  // state visually, while the accessible name carries it for assistive tech.
  return <span aria-hidden="true">{active ? "★" : "☆"}</span>;
}

//  Component

function CurrencyPairPickerRender<T extends CurrencyPair = CurrencyPair>(
  {
    className,
    variant,
    validationStatus,
    fullWidth,
    disabled,
    showFavourites = true,
    ...props
  }: CurrencyPairPickerProps<T>,
  ref: React.Ref<CurrencyPairPickerHandle>,
) {
  const classNames = useMemo<CurrencyPairPickerClassNames>(
    () => ({
      root: clsx(
        rootVariants({ variant }),
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        validationStatus && validationClasses[validationStatus],
        className,
      ),
      control: styles.control,
      input: styles.input,
      indicator: styles.indicator,
      indicatorOpen: styles.indicatorOpen,
      listbox: styles.listbox,
      options: styles.options,
      section: styles.section,
      sectionLabel: styles.sectionLabel,
      option: styles.option,
      optionHighlighted: styles.optionHighlighted,
      optionSelected: styles.optionSelected,
      optionDisabled: styles.optionDisabled,
      // No `optionFavourite`: a favourited pair is always lifted into the
      // Favourites section, so a per-row marker on top of the star would be
      // saying it a third time. The unstyled hook stays for custom skins.
      optionSymbol: styles.optionSymbol,
      optionName: styles.optionName,
      badges: styles.badges,
      badge: styles.badge,
      favouriteToggle: styles.favouriteToggle,
      favouriteActive: styles.favouriteActive,
      empty: styles.empty,
      loading: styles.loading,
      error: styles.error,
    }),
    [className, variant, validationStatus, fullWidth, disabled],
  );

  return (
    <CurrencyPairPickerBase<T>
      ref={ref}
      disabled={disabled}
      showFavourites={showFavourites}
      classNames={classNames}
      dataAttributes={dataAttributes}
      controlDataAttributes={controlDataAttributes}
      badgeDataAttributes={badgeDataAttributes}
      renderIndicator={styledIndicator}
      renderFavourite={showFavourites ? styledFavourite : undefined}
      {...props}
    />
  );
}

export const CurrencyPairPicker = forwardRef(CurrencyPairPickerRender) as <
  T extends CurrencyPair = CurrencyPair,
>(
  props: CurrencyPairPickerProps<T> & { ref?: React.Ref<CurrencyPairPickerHandle> },
) => React.ReactElement | null;

(CurrencyPairPicker as { displayName?: string }).displayName = "CurrencyPairPicker";
