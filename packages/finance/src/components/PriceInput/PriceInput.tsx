import { FINRA_UI_ATTR, type ValidationStatus } from "@utk09/finra-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";
import { forwardRef, useMemo } from "react";

import type {
  PriceInputBaseProps,
  PriceInputClassNames,
  PriceInputHandle,
} from "../../unstyled/PriceInput/PriceInput";
import { PriceInputBase } from "../../unstyled/PriceInput/PriceInput";
import type { PriceSegment, PriceSegmentKind } from "../../utils/priceFormat";
import { componentIds } from "../componentIds";
import styles from "./PriceInput.module.scss";

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

const segClass: Record<PriceSegmentKind, string> = {
  sign: styles.segSign,
  integer: styles.segInteger,
  separator: styles.segSeparator,
  primary: styles.segPrimary,
  precision: styles.segPrecision,
  "big-figure": styles.segBigFigure,
  pips: styles.segPips,
  "fractional-pip": styles.segFractionalPip,
  unit: styles.segUnit,
};

function renderSegments(segments: PriceSegment[]) {
  // One inline line so the mixed-size segments share a text baseline
  // (flex items would center-align instead).
  return (
    <span className={styles.line}>
      {segments.map((seg, index) => (
        <span key={index} className={segClass[seg.kind]}>
          {seg.text}
        </span>
      ))}
    </span>
  );
}

export interface PriceInputProps
  extends
    Omit<PriceInputBaseProps, "classNames" | "dataAttributes" | "renderDisplay">,
    VariantProps<typeof rootVariants> {
  /** Visual validation status. */
  validationStatus?: ValidationStatus;
  /** Stretch to fill the container width. */
  fullWidth?: boolean;
  /** Render primary vs precision digits with visual hierarchy. */
  digitHierarchy?: boolean;
  /** Additional CSS class for the root wrapper. */
  className?: string;
}

const dataAttributes = { [FINRA_UI_ATTR]: componentIds.priceInput } as const;

export const PriceInput = forwardRef<PriceInputHandle, PriceInputProps>(
  (
    { className, variant, validationStatus, fullWidth, disabled, digitHierarchy, ...props },
    ref,
  ) => {
    const classNames = useMemo<PriceInputClassNames>(
      () => ({
        root: clsx(
          rootVariants({ variant }),
          fullWidth && styles.fullWidth,
          disabled && styles.disabled,
          validationStatus && validationClasses[validationStatus],
          digitHierarchy && styles.hasHierarchy,
          className,
        ),
        input: styles.input,
        display: styles.display,
      }),
      [className, variant, validationStatus, fullWidth, disabled, digitHierarchy],
    );

    return (
      <PriceInputBase
        ref={ref}
        disabled={disabled}
        classNames={classNames}
        dataAttributes={dataAttributes}
        renderDisplay={digitHierarchy ? renderSegments : undefined}
        {...props}
      />
    );
  },
);

PriceInput.displayName = "PriceInput";
