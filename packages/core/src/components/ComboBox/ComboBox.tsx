import {
  CheckIcon,
  ChevronDownIcon,
  CloseSmallIcon,
  SpinnerIcon,
} from "@utk09/finra-ui-icons/react";
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

/**
 * Props for the styled ComboBox - a text input with a filtered listbox popup.
 *
 * @remarks
 * Controlled: pass `value` and handle `onChange`. The component reports a
 * selection but never applies it itself, so a parent that ignores the callback
 * keeps its value - the same contract as a controlled `<input>`.
 *
 * Choosing between the three pickers: use **Select** when the choice is short
 * and needs no typing, **ComboBox** when filtering or free entry helps, and
 * `CurrencyPairPicker` (finance) when the options are instruments.
 *
 * @typeParam T - Type of an option's value. Note `value` widens to `T[]` when
 * {@link ComboBoxProps.multiple} is set.
 *
 * @example
 * ```tsx
 * const [value, setValue] = useState<string | null>(null);
 * <ComboBox options={options} value={value} onChange={setValue} placeholder="Search…" />
 * ```
 */
export interface ComboBoxProps<T = string>
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue">,
    VariantProps<typeof wrapperVariants> {
  /** Available options. Groups and favourites are derived from each option's own fields. */
  options: ComboBoxOption<T>[];
  /** Selected value; an array in `multiple` mode. `null` means nothing selected. */
  value?: T | T[] | null;
  /**
   * Fired on selection, deselection, and clearing.
   *
   * @remarks
   * In `multiple` mode, emptying the last pill reports `null` rather than `[]`,
   * so "is anything selected" stays one comparison.
   */
  onChange?: (value: T | T[] | null) => void;
  /**
   * Allow several selections, rendered as removable pills.
   *
   * @remarks
   * Pills form their own roving tab group: ArrowLeft from the start of the
   * input enters them, and Backspace on an empty input removes the last.
   *
   * @defaultValue `false`
   */
  multiple?: boolean;

  /** Controlled text in the input. Leave unset to let the component manage it. */
  inputValue?: string;
  /** Fired on every keystroke. Pair with `onLoadOptions` for a remote source. */
  onInputChange?: (value: string) => void;
  /**
   * Replace the built-in matcher.
   *
   * @remarks
   * The default is a case-insensitive substring match on `label`. Return `true`
   * for everything when filtering server-side, or the local pass will hide rows
   * the server just returned.
   */
  filterFn?: (option: ComboBoxOption<T>, inputValue: string) => boolean;

  /** Show the loading row instead of options. Set it from the keystroke, not the request. */
  loading?: boolean;
  /** Fired when options should be fetched for the current text. */
  onLoadOptions?: (inputValue: string) => void;

  /**
   * Offer a "create «text»" row when the text matches no option.
   *
   * @remarks
   * The component only *proposes* the new value through `onCreateOption`; it
   * never adds to `options` itself. Append it yourself and it appears on the
   * next render.
   *
   * @defaultValue `false`
   */
  creatable?: boolean;
  /** Fired when the create row is chosen, with the raw text. */
  onCreateOption?: (inputValue: string) => void;
  /** Label for the create row. Defaults to `Create "«text»"`. */
  formatCreateLabel?: (inputValue: string) => string;

  /** Content pinned above the options, inside the popup. Does not scroll away. */
  header?: ReactNode;
  /** Content pinned below the options, inside the popup. */
  footer?: ReactNode;

  /** Placeholder for the text input. */
  placeholder?: string;
  /** Disable the whole control - no opening, no typing, no pill removal. */
  disabled?: boolean;
  /** Validation state. `"error"` also sets `aria-invalid` on the input. */
  validationStatus?: ValidationStatus;
  /** Stretch to fill the container's inline size. */
  fullWidth?: boolean;
  /** Shown when nothing matches the current text. Defaults to "No options". */
  noOptionsMessage?: string | ReactNode;
  /**
   * Text announced by the results live region whenever the open listbox's
   * result count changes. Defaults to "N results available".
   */
  formatResultCount?: (count: number) => string;

  /**
   * Render an option's inner content.
   *
   * @remarks
   * Replaces the row's contents, not the row: it stays a `role="option"` and
   * stays selectable. Use `state` to reflect selection and highlight, which are
   * independent - a row can be both.
   */
  renderOption?: (option: ComboBoxOption<T>, state: ComboBoxRenderOptionState) => ReactNode;
  /** Render a selected value - the resting single-mode display, or each pill. */
  renderValue?: (option: ComboBoxOption<T>) => ReactNode;

  /** Controlled open state of the listbox. */
  open?: boolean;
  /** Fired whenever the listbox wants to open or close. */
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

/**
 * The control shell carries its own id: since ARIA 1.2 moved `role="combobox"`
 * onto the input, this element is otherwise unaddressable, and it is what
 * consumers override for border/background/validation styling.
 */
const comboBoxControlDataAttributes = { [FINRA_UI_ATTR]: componentIds.comboBoxControl } as const;

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
      pillList: styles.pillList,
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
      controlDataAttributes={comboBoxControlDataAttributes}
      renderCheckIcon={styledRenderCheckIcon}
      renderIndicator={styledRenderIndicator}
      renderPillRemoveIcon={styledRenderPillRemoveIcon}
      renderLoading={styledRenderLoading}
      {...props}
    />
  );
}

/**
 * A text input with a filtered listbox popup. Supports groups, favourites,
 * multi-select pills and free-text creation.
 *
 * @see {@link ComboBoxProps}
 */
export const ComboBox = forwardRef(ComboBoxRender) as <T = string>(
  props: ComboBoxProps<T> & { ref?: Ref<HTMLInputElement> },
) => React.ReactElement | null;

(ComboBox as { displayName?: string }).displayName = "ComboBox";
