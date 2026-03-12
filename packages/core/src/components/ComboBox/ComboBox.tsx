import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";
import {
  type ForwardedRef,
  forwardRef,
  type HTMLAttributes,
  type ReactNode,
  type Ref,
  useMemo,
} from "react";

import { CheckIcon, ChevronDownIcon, CloseSmallIcon, SpinnerIcon } from "../../assets/icons";
import {
  ComboBoxBase,
  type ComboBoxClassNames,
  type ComboBoxOption,
  type ComboBoxRenderOptionState,
} from "../../unstyled/ComboBox/ComboBox";
import { componentIds, FINRA_UI_ATTR } from "../componentIds";
import type { ValidationStatus } from "../Input/Input";
import styles from "./ComboBox.module.scss";

//  Re-export types from unstyled
export type {
  ComboBoxGroup,
  ComboBoxOption,
  ComboBoxRenderOptionState,
} from "../../unstyled/ComboBox/ComboBox";

//  Variants

const wrapperVariants = cva(styles.wrapper, {
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

const validationClasses: Record<string, string> = {
  error: styles.statusError,
  warning: styles.statusWarning,
  success: styles.statusSuccess,
};

//  Props

export interface ComboBoxProps<T = string>
  extends
    Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue">,
    VariantProps<typeof wrapperVariants> {
  options: ComboBoxOption<T>[];
  value?: T | T[] | null;
  onChange?: (value: T | T[] | null) => void;
  multiple?: boolean;

  inputValue?: string;
  onInputChange?: (value: string) => void;
  filterFn?: (option: ComboBoxOption<T>, inputValue: string) => boolean;

  loading?: boolean;
  onLoadOptions?: (inputValue: string) => void;

  creatable?: boolean;
  onCreateOption?: (inputValue: string) => void;
  formatCreateLabel?: (inputValue: string) => string;

  header?: ReactNode;
  footer?: ReactNode;

  placeholder?: string;
  disabled?: boolean;
  validationStatus?: ValidationStatus;
  fullWidth?: boolean;
  noOptionsMessage?: string | ReactNode;

  renderOption?: (option: ComboBoxOption<T>, state: ComboBoxRenderOptionState) => ReactNode;
  renderValue?: (option: ComboBoxOption<T>) => ReactNode;

  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

//  Module-level stable render callbacks

function styledRenderCheckIcon(): ReactNode {
  return <CheckIcon className={styles.checkIcon} aria-hidden="true" />;
}

function styledRenderIndicator(isCurrentOpen: boolean): ReactNode {
  return (
    <span
      className={clsx(styles.indicator, isCurrentOpen && styles.indicatorOpen)}
      aria-hidden="true">
      <ChevronDownIcon />
    </span>
  );
}

function styledRenderPillRemoveIcon(): ReactNode {
  return <CloseSmallIcon />;
}

function styledRenderLoading(): ReactNode {
  return (
    <>
      <SpinnerIcon className={styles.spinner} aria-hidden="true" />
      Loading...
    </>
  );
}

//  Static data attribute for the root element

const comboBoxDataAttributes = { [FINRA_UI_ATTR]: componentIds.comboBox } as const;

//  Component

function ComboBoxRender<T = string>(
  {
    className,
    variant,
    validationStatus,
    fullWidth,
    disabled = false,
    open,
    ...props
  }: ComboBoxProps<T>,
  forwardedRef: ForwardedRef<HTMLInputElement>,
): React.ReactElement {
  // Build the classNames object that maps unstyled slots to SCSS module classes.
  // The wrapper class is dynamic (depends on variant, validation, disabled, open),
  // so we compute it inside a useMemo keyed on those values.
  const classNames = useMemo<ComboBoxClassNames>(
    () => ({
      root: clsx(styles.comboBox, fullWidth && styles.fullWidth, className),
      wrapper: clsx(
        wrapperVariants({ variant }),
        disabled && styles.disabled,
        validationStatus && validationClasses[validationStatus],
        open && styles.open,
      ),
      multiValueContainer: styles.multiValueContainer,
      pill: styles.pill,
      pillText: styles.pillText,
      pillRemove: styles.pillRemove,
      singleValue: styles.singleValue,
      input: styles.input,
      inputHidden: styles.inputHidden,
      indicator: styles.indicator,
      indicatorOpen: styles.indicatorOpen,
      listbox: styles.listbox,
      header: styles.header,
      footer: styles.footer,
      options: styles.options,
      option: styles.option,
      optionHighlighted: styles.optionHighlighted,
      optionSelected: styles.optionSelected,
      optionDisabled: styles.optionDisabled,
      optionCreate: styles.optionCreate,
      optionLabel: styles.optionLabel,
      checkIcon: styles.checkIcon,
      group: styles.group,
      groupLabel: styles.groupLabel,
      loading: styles.loading,
      spinner: styles.spinner,
      empty: styles.empty,
    }),
    [className, variant, validationStatus, fullWidth, disabled, open],
  );

  return (
    <ComboBoxBase<T>
      ref={forwardedRef}
      disabled={disabled}
      open={open}
      classNames={classNames}
      dataAttributes={comboBoxDataAttributes}
      renderCheckIcon={styledRenderCheckIcon}
      renderIndicator={styledRenderIndicator}
      renderPillRemoveIcon={styledRenderPillRemoveIcon}
      renderLoading={styledRenderLoading}
      {...props}
    />
  );
}

export const ComboBox = forwardRef(ComboBoxRender) as <T = string>(
  props: ComboBoxProps<T> & { ref?: Ref<HTMLInputElement> },
) => React.ReactElement | null;

(ComboBox as { displayName?: string }).displayName = "ComboBox";
