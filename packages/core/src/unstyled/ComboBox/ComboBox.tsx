import {
  type CSSProperties,
  type ForwardedRef,
  forwardRef,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import { componentIds, FINRA_UI_ATTR } from "../../componentIds";
import { useAnchoredPosition } from "../../hooks/useAnchoredPosition";
import { useControlledValue } from "../../hooks/useControlledValue";
import { useFormField } from "../../hooks/useFormField";
import {
  defaultFilter,
  flattenOptions,
  groupOptions,
  nextActivePillAfterRemoval,
  resolveComboBoxKey,
  resolveComboBoxPillKey,
  resolveSelectOption,
  shouldShowCreateOption,
} from "../../logic/combobox";
import { cx } from "../../logic/cx";
import { mergeRefs } from "../../utils/mergeRefs";
import { DismissableLayer } from "../DismissableLayer/DismissableLayer";
import { Portal } from "../Portal/Portal";

//  Constants

/**
 * Screen-reader-only styling for the results live region. Inlined (rather than a
 * utility class) so unstyled consumers get the announcement without importing
 * any CSS.
 */
const SR_ONLY: CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  margin: -1,
  padding: 0,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
  border: 0,
};

function defaultFormatResultCount(count: number): string {
  if (count === 0) return "No results available";
  return `${count} result${count === 1 ? "" : "s"} available`;
}

//  Public Types

/**
 * One selectable option.
 *
 * @typeParam T - Type of the option's value. Defaults to `string`; pass a union
 * of literals and the selected value narrows with it.
 *
 * @example
 * ```tsx
 * const options: ComboBoxOption[] = [
 *   { value: "EURUSD", label: "EUR/USD", group: "Major", favourite: true },
 *   { value: "RUBUSD", label: "RUB/USD", disabled: true },
 * ];
 * ```
 */
export interface ComboBoxOption<T = string> {
  /** Identity. What `onChange` reports, and what equality is tested on. */
  value: T;
  /** Human-readable text. Filtering matches against this, and it is the fallback display. */
  label: string;
  /** Optional group heading. Options sharing a `group` are collected under it. */
  group?: string;
  /** Rendered but not selectable, and skipped by keyboard navigation. */
  disabled?: boolean;
  /**
   * Lifts the option into a pinned section above every group.
   *
   * @remarks
   * A favourited option is *moved*, not copied - it will not also appear under
   * its own `group`.
   */
  favourite?: boolean;
}

/**
 * The per-option state handed to a `renderOption` callback.
 *
 * @remarks
 * `isSelected` and `isHighlighted` are independent and often differ: the
 * highlight is the transient keyboard cursor, the selection is the committed
 * value. A row can be both, either, or neither.
 */
export interface ComboBoxRenderOptionState {
  /** This option is the committed value (or one of them, in multiple mode). */
  isSelected: boolean;
  /** This option currently holds the roving keyboard highlight. */
  isHighlighted: boolean;
  /** Mirrors {@link ComboBoxOption.disabled}. */
  isDisabled: boolean;
  /** Mirrors {@link ComboBoxOption.favourite}. */
  isFavourite: boolean;
}

/** A named group of options, as rendered in the listbox. */
export interface ComboBoxGroup<T = string> {
  /** The heading, taken from the members' {@link ComboBoxOption.group}. */
  label: string;
  /** Members, in source order. */
  options: ComboBoxOption<T>[];
}

/**
 * CSS class overrides that the styled layer injects into the unstyled base.
 * Every key is optional - when absent, no className is applied.
 */
export interface ComboBoxClassNames {
  /** Outermost element. */
  root?: string;
  /** The control shell holding the value(s), input and indicator. */
  wrapper?: string;
  /** Container for the pills plus the input, in multiple mode. */
  multiValueContainer?: string;
  /**
   * The `role="list"` wrapper around the selected pills. Layout-neutral in the
   * styled layer (`display: contents`) so the pills stay direct flex children
   * of the multi-value container.
   */
  pillList?: string;
  /** One selected-value pill. */
  pill?: string;
  /** The label span inside a pill. */
  pillText?: string;
  /** A pill's remove button. Keyboard-reachable via the pill roving tab group. */
  pillRemove?: string;
  /** The rendered value in single mode, when `renderValue` replaces the input text. */
  singleValue?: string;
  /** The text input. */
  input?: string;
  /** Applied to the input when a `renderValue` result is shown in its place. */
  inputHidden?: string;
  /** The portalled popup panel - border, shadow, elevation. */
  listbox?: string;
  /** Optional slot rendered above the options, inside the panel. */
  header?: string;
  /** Optional slot rendered below the options, inside the panel. */
  footer?: string;
  /** The scroll container inside the panel, so its chrome does not scroll away. */
  options?: string;
  /** One option row. */
  option?: string;
  /** Added to the option holding the roving keyboard highlight. */
  optionHighlighted?: string;
  /** Added to the committed option. Orthogonal to `optionHighlighted` - a row may carry both. */
  optionSelected?: string;
  /** Added to a disabled option. */
  optionDisabled?: string;
  /** The "create «query»" affordance shown when `allowCreate` is on. */
  optionCreate?: string;
  /** The label span inside an option. */
  optionLabel?: string;
  /** A group wrapper. */
  group?: string;
  /** A group's heading. */
  groupLabel?: string;
  /** The row shown while `loading` is true. */
  loading?: string;
  /** The row shown when nothing matches - carries `noOptionsMessage`. */
  empty?: string;
}

/**
 * Props for the unstyled ComboBox. The styled `ComboBox` wraps this and fills
 * in `classNames` plus its icon render props.
 *
 * @remarks
 * Ships no CSS of its own - supply {@link ComboBoxClassNames} (or none, and
 * style via the `data-*` hooks). The listbox is portalled, so it escapes
 * ancestor `overflow: hidden` and stacking contexts.
 *
 * Controlled only: `value` and `onChange` are required, and the component never
 * moves the value itself. It reports; the consumer decides.
 *
 * @typeParam T - Type of an option's value. Note that `value` is `T | T[]`
 * depending on {@link ComboBoxBaseProps.multiple}.
 *
 * @example
 * ```tsx
 * const [value, setValue] = useState<string | null>(null);
 * <ComboBoxBase options={options} value={value} onChange={setValue} aria-label="Pair" />
 * ```
 */
export interface ComboBoxBaseProps<T = string>
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
  /** Available options. */
  options: ComboBoxOption<T>[];

  //  Value
  /** Selected value(s). Single value or array for multiple. */
  value?: T | T[] | null;
  /** Called when selection changes. */
  onChange?: (value: T | T[] | null) => void;
  /** Enable multi-select mode. */
  multiple?: boolean;

  //  Typeahead
  /** Controlled input text. */
  inputValue?: string;
  /** Called when input text changes. */
  onInputChange?: (value: string) => void;
  /** Custom filter function. Return true to keep option. */
  filterFn?: (option: ComboBoxOption<T>, inputValue: string) => boolean;

  //  Async
  /** Show loading indicator. */
  loading?: boolean;
  /** Called when input changes to trigger async loading. */
  onLoadOptions?: (inputValue: string) => void;

  //  Creatable
  /** Allow creating new options from input. */
  creatable?: boolean;
  /** Called when user creates a new option. */
  onCreateOption?: (inputValue: string) => void;
  /** Custom label for the create option. */
  formatCreateLabel?: (inputValue: string) => string;

  //  Sections
  /** Content rendered above the options list. */
  header?: ReactNode;
  /** Content rendered below the options list. */
  footer?: ReactNode;

  //  Display
  /** Placeholder for the text input. */
  placeholder?: string;
  /** Disable the whole control - no opening, no typing, no pill removal. */
  disabled?: boolean;
  /** Message shown when no options match. */
  noOptionsMessage?: string | ReactNode;
  /**
   * Text announced by the results live region whenever the open listbox's
   * result count changes. Defaults to "N results available" / "No results
   * available". Return an empty string to silence the announcement.
   */
  formatResultCount?: (count: number) => string;

  //  Rendering
  /** Custom option renderer. */
  renderOption?: (option: ComboBoxOption<T>, state: ComboBoxRenderOptionState) => ReactNode;
  /** Custom selected value renderer (single mode). */
  renderValue?: (option: ComboBoxOption<T>) => ReactNode;
  /** Render the "selected check" icon beside a selected option. Return null to suppress. */
  renderCheckIcon?: () => ReactNode;
  /** Render the chevron/indicator icon. */
  renderIndicator?: (isOpen: boolean) => ReactNode;
  /** Render the pill remove button icon. */
  renderPillRemoveIcon?: () => ReactNode;
  /** Render the loading spinner content. */
  renderLoading?: () => ReactNode;

  //  Open state
  /** Controlled open state. */
  open?: boolean;
  /** Called when open state changes. */
  onOpenChange?: (open: boolean) => void;

  //  Style injection
  /**
   * Where the popup is portalled. Defaults to `document.body`.
   *
   * @remarks
   * Pass a node you own to bring the popup back inside your subtree, so a token
   * override or a scoped rule declared on an ancestor reaches it. Portalling to
   * the body is the default because it escapes ancestor `overflow: hidden`,
   * `z-index` and `transform` contexts.
   */
  container?: Element | null;
  /** CSS class overrides injected by the styled layer. */
  classNames?: ComboBoxClassNames;
  /** Root element data attributes. */
  dataAttributes?: Record<string, string>;
  /**
   * Data attributes for the control shell (the bordered box holding the pills,
   * input and indicator). Separate from `dataAttributes` because the shell is
   * the element consumers target for border/background overrides, and it is no
   * longer reachable by role - ARIA 1.2 moved `role="combobox"` to the input.
   */
  controlDataAttributes?: Record<string, string>;
}

//  Component

function ComboBoxBaseRender<T = string>(
  {
    options,
    value,
    onChange,
    multiple = false,
    inputValue: controlledInputValue,
    onInputChange,
    filterFn,
    loading = false,
    onLoadOptions,
    creatable = false,
    onCreateOption,
    formatCreateLabel,
    header,
    footer,
    placeholder,
    disabled = false,
    noOptionsMessage = "No options",
    formatResultCount = defaultFormatResultCount,
    renderOption,
    renderValue,
    renderCheckIcon,
    renderIndicator,
    renderPillRemoveIcon,
    renderLoading,
    open: controlledOpen,
    onOpenChange,
    classNames: cn,
    container,
    dataAttributes,
    controlDataAttributes,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    id: idProp,
    "aria-describedby": ariaDescribedBy,
    "aria-invalid": ariaInvalid,
    ...props
  }: ComboBoxBaseProps<T>,
  forwardedRef: ForwardedRef<HTMLInputElement>,
): React.ReactElement {
  const id = useId();
  const listboxId = `${id}-listbox`;
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  // The control shell doubles as the positioning anchor, so it is tracked in
  // state (a ref would not re-run the positioning effect when it mounts).
  const [controlEl, setControlEl] = useState<HTMLDivElement | null>(null);

  //  Internal state
  const [isOpen, setOpen] = useControlledValue(controlledOpen, false, onOpenChange);
  const [currentInputValue, setInputValue] = useControlledValue(
    controlledInputValue,
    "",
    onInputChange,
  );
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  // Roving tab stop across the selected-value pills (multi-select only).
  const [activePillIndex, setActivePillIndex] = useState(0);
  const pillListRef = useRef<HTMLDivElement>(null);
  // Set when a removal should hand focus to another pill once React re-renders.
  // `expectedCount` is the pill count that removal should produce; if the next
  // commit disagrees, the parent declined and the request is dropped.
  const pendingPillFocus = useRef<{ index: number; expectedCount: number } | null>(null);

  // Wire the combobox input into an enclosing FormField (the input is the
  // labelable element). Works at any depth; no-op when standalone.
  const field = useFormField({
    id: idProp,
    "aria-describedby": ariaDescribedBy,
    "aria-invalid": ariaInvalid,
    disabled,
  });
  const isDisabled = field.disabled;

  //  Selected values as array
  const selectedValues = useMemo<T[]>(() => {
    if (value == null) return [];
    return Array.isArray(value) ? value : [value];
  }, [value]);

  const isSelected = useCallback(
    (optValue: T) => selectedValues.some((v) => v === optValue),
    [selectedValues],
  );

  //  Filtered options
  const filter = filterFn ?? defaultFilter;
  const filteredOptions = useMemo(
    () => options.filter((opt) => filter(opt, currentInputValue)),
    [options, filter, currentInputValue],
  );

  //  Flat list for keyboard navigation (order mirrors the rendered sections)
  const flatOptions = useMemo(() => flattenOptions(filteredOptions), [filteredOptions]);

  // Show create option?
  const showCreateOption = shouldShowCreateOption({
    creatable,
    inputValue: currentInputValue,
    options,
  });

  const createLabel = formatCreateLabel
    ? formatCreateLabel(currentInputValue.trim())
    : `Create "${currentInputValue.trim()}"`;

  const totalNavigable = flatOptions.length + (showCreateOption ? 1 : 0);

  //  Selection logic - the multi/single decision lives in `resolveSelectOption`;
  //  this adapter only applies the resulting value/input/close to its setters.
  const selectOption = useCallback(
    (opt: ComboBoxOption<T>) => {
      const result = resolveSelectOption(opt, { multiple, selectedValues });
      if (!result) return;

      onChange?.(result.nextValue);
      setInputValue(result.inputValue);
      if (result.close) setOpen(false);

      inputRef.current?.focus();
    },
    [multiple, selectedValues, onChange, setInputValue, setOpen],
  );

  const removeValue = useCallback(
    (val: T) => {
      if (!multiple) return;
      const next = selectedValues.filter((v) => v !== val);
      onChange?.(next.length > 0 ? next : null);
      inputRef.current?.focus();
    },
    [multiple, selectedValues, onChange],
  );

  //  Pill keyboard navigation - decisions live in `resolveComboBoxPillKey`.

  // Clamp rather than reset: if the value shrinks from outside (controlled
  // `onChange`), a stale index would leave every pill at tabIndex -1 and drop
  // the whole group out of the tab order.
  const effectiveActivePill = Math.min(activePillIndex, Math.max(0, selectedValues.length - 1));

  /** Focus the remove button of pill `index`, if it is rendered. */
  const focusPill = useCallback((index: number) => {
    const list = pillListRef.current;
    if (!list) return;
    const btn = list.querySelector(`[data-pill-index="${index}"]`) as HTMLElement | null;
    btn?.focus();
  }, []);

  /**
   * Remove pill `index` and keep focus inside the widget: on the pill that took
   * its place, or back in the text input once none are left.
   */
  const removePillAt = useCallback(
    (index: number) => {
      // `index` always addresses a rendered pill: it comes either from the
      // render loop or from the resolver, which is bounded by `pillCount`.
      const val = selectedValues[index];

      // Only chase focus when it was already inside the pill list - i.e. the
      // removal came from the keyboard. A mouse click should leave focus alone.
      const fromKeyboard = pillListRef.current?.contains(document.activeElement) ?? false;

      const remaining = selectedValues.length - 1;
      const nextActive = nextActivePillAfterRemoval(index, remaining);

      const next = selectedValues.filter((v) => v !== val);
      onChange?.(next.length > 0 ? next : null);

      if (!fromKeyboard) return;

      if (nextActive == null) {
        inputRef.current?.focus();
      } else {
        setActivePillIndex(nextActive);
        // The pill only exists once the parent re-renders with the new value,
        // so record what that render should look like and verify it below.
        pendingPillFocus.current = { index: nextActive, expectedCount: remaining };
      }
    },
    [selectedValues, onChange],
  );

  // Two guards, both needed:
  //
  // Unkeyed, so the request is consumed on the very next commit whatever caused
  // it - keying it to `selectedValues` left it armed indefinitely when a
  // controlled parent declined the removal.
  //
  // `expectedCount`, because "declined" can mean no re-render at all (the index
  // is unchanged, so the setState bails). The request then survives until some
  // unrelated render, and without this check that render would yank focus into
  // the pill list out of nowhere.
  useEffect(() => {
    const pending = pendingPillFocus.current;
    if (!pending) return;
    pendingPillFocus.current = null;
    if (selectedValues.length === pending.expectedCount) focusPill(pending.index);
  });

  const handlePillKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      // Read direction off the list itself - the handler is bound to it, so
      // currentTarget is always the element we want.
      const rtl = getComputedStyle(e.currentTarget).direction === "rtl";

      const { preventDefault, effects } = resolveComboBoxPillKey(e.key, {
        activeIndex: effectiveActivePill,
        pillCount: selectedValues.length,
        rtl,
      });

      if (preventDefault) e.preventDefault();

      for (const effect of effects) {
        switch (effect.kind) {
          case "setActivePill":
            setActivePillIndex(effect.index);
            focusPill(effect.index);
            break;
          case "removePill":
            removePillAt(effect.index);
            break;
          case "focusInput":
            inputRef.current?.focus();
            break;
        }
      }
    },
    [effectiveActivePill, selectedValues.length, focusPill, removePillAt],
  );

  //  Keyboard - decision logic lives in the pure `resolveComboBoxKey` machine;
  //  this adapter only executes the effects it returns against local setters.
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      const { preventDefault, effects } = resolveComboBoxKey(e.key, {
        isOpen,
        disabled: isDisabled,
        highlightedIndex,
        totalNavigable,
        flatOptionsLength: flatOptions.length,
        showCreateOption,
        multiple,
        inputValueEmpty: currentInputValue === "",
        selectedCount: selectedValues.length,
        altKey: e.altKey,
        caretAtStart: e.currentTarget.selectionStart === 0 && e.currentTarget.selectionEnd === 0,
      });

      if (preventDefault) e.preventDefault();

      for (const effect of effects) {
        switch (effect.kind) {
          case "setOpen":
            setOpen(effect.open);
            break;
          case "setHighlight":
            setHighlightedIndex(effect.index);
            break;
          case "selectOption":
            selectOption(flatOptions[effect.index]);
            break;
          case "createOption":
            onCreateOption?.(currentInputValue.trim());
            setInputValue("");
            break;
          case "removeLastValue":
            removeValue(selectedValues[selectedValues.length - 1]);
            break;
          case "focusLastPill": {
            const last = selectedValues.length - 1;
            setActivePillIndex(last);
            focusPill(last);
            break;
          }
        }
      }
    },
    [
      isDisabled,
      isOpen,
      setOpen,
      highlightedIndex,
      totalNavigable,
      flatOptions,
      selectOption,
      showCreateOption,
      onCreateOption,
      currentInputValue,
      setInputValue,
      multiple,
      selectedValues,
      removeValue,
      focusPill,
    ],
  );

  //  Input change
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setInputValue(val);
      if (!isOpen) setOpen(true);
      setHighlightedIndex(0);
      onLoadOptions?.(val);
      // Single mode: clear selection when user edits input text
      if (!multiple && value != null) {
        onChange?.(null);
      }
    },
    [setInputValue, isOpen, setOpen, onLoadOptions, multiple, value, onChange],
  );

  //  Focus
  const handleFocus = useCallback(() => {
    if (!isDisabled && !isOpen) {
      setOpen(true);
    }
  }, [isDisabled, isOpen, setOpen]);

  // Close on Escape / outside pointer. Handled by DismissableLayer on the
  // portalled listbox rather than a click-outside hook on the root, since the
  // listbox is no longer a DOM descendant of the root.
  const handleDismiss = useCallback(() => {
    setOpen(false);
    setHighlightedIndex(-1);
  }, [setOpen]);

  // Anchor the portalled listbox to the control shell.
  const { setFloating, x, y } = useAnchoredPosition(controlEl, {
    placement: "bottom-start",
    offset: 4,
  });

  // Scroll highlighted into view
  useEffect(() => {
    if (highlightedIndex < 0 || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-index="${highlightedIndex}"]`);
    if (el) {
      el.scrollIntoView?.({ block: "nearest" });
    }
  }, [highlightedIndex]);

  //  Grouped rendering data
  const { favourites, groups, ungrouped } = useMemo(
    () => groupOptions(filteredOptions),
    [filteredOptions],
  );

  //  Helper: get option id
  const getOptionId = (index: number) => `${id}-option-${index}`;

  //  Helper: render a single option
  const renderSingleOption = (opt: ComboBoxOption<T>, flatIdx: number) => {
    const state: ComboBoxRenderOptionState = {
      isSelected: isSelected(opt.value),
      isHighlighted: highlightedIndex === flatIdx,
      isDisabled: opt.disabled ?? false,
      isFavourite: opt.favourite ?? false,
    };

    return (
      <div
        key={`${flatIdx}-${String(opt.value)}`}
        id={getOptionId(flatIdx)}
        role="option"
        tabIndex={-1}
        data-index={flatIdx}
        aria-selected={state.isSelected}
        aria-disabled={state.isDisabled || undefined}
        data-highlighted={state.isHighlighted || undefined}
        data-selected={state.isSelected || undefined}
        data-disabled={state.isDisabled || undefined}
        {...{ [FINRA_UI_ATTR]: componentIds.comboBoxOption }}
        className={cx(
          cn?.option,
          state.isHighlighted && cn?.optionHighlighted,
          state.isSelected && cn?.optionSelected,
          state.isDisabled && cn?.optionDisabled,
        )}
        onMouseDown={(e) => {
          e.preventDefault(); // keep focus on input
          selectOption(opt);
        }}
        onMouseEnter={() => setHighlightedIndex(flatIdx)}>
        {renderOption ? (
          renderOption(opt, state)
        ) : (
          <>
            <span
              className={cn?.optionLabel}
              {...{ [FINRA_UI_ATTR]: componentIds.comboBoxOptionLabel }}>
              {opt.label}
            </span>
            {state.isSelected && renderCheckIcon ? renderCheckIcon() : null}
          </>
        )}
      </div>
    );
  };

  //  Render selected values (multi mode)
  //
  //  The pills form a single Tab stop with a roving tabindex across the remove
  //  buttons (React Aria TagGroup model). Previously every remove button was
  //  `tabIndex={-1}` with only a mousedown handler, so removing a value was
  //  impossible without a pointer.
  const renderSelectedPills = () => {
    if (!multiple || selectedValues.length === 0) return null;
    return selectedValues.map((val, index) => {
      const opt = options.find((o) => o.value === val);
      if (!opt) return null;
      return (
        <span
          key={String(val)}
          className={cn?.pill}
          {...{ [FINRA_UI_ATTR]: componentIds.comboBoxPill }}
          data-combobox-pill
          role="listitem">
          <span className={cn?.pillText} {...{ [FINRA_UI_ATTR]: componentIds.comboBoxPillText }}>
            {renderValue ? renderValue(opt) : opt.label}
          </span>
          {!isDisabled ? (
            <button
              type="button"
              className={cn?.pillRemove}
              {...{ [FINRA_UI_ATTR]: componentIds.comboBoxPillRemove }}
              data-pill-index={index}
              tabIndex={index === effectiveActivePill ? 0 : -1}
              aria-label={`Remove ${opt.label}`}
              onFocus={() => setActivePillIndex(index)}
              onClick={() => removePillAt(index)}
              onMouseDown={(e) => {
                // Keep focus off the button on pointer interaction so the input
                // keeps the caret; the click handler still fires.
                e.preventDefault();
                e.stopPropagation();
              }}>
              {renderPillRemoveIcon ? renderPillRemoveIcon() : "\u00d7"}
            </button>
          ) : null}
        </span>
      );
    });
  };

  //  Display value for single mode
  const singleDisplayValue = useMemo(() => {
    if (multiple) return currentInputValue;
    if (isOpen) return currentInputValue;
    if (value != null && !renderValue) {
      const opt = options.find((o) => o.value === value);
      if (opt) return opt.label;
    }
    return currentInputValue;
  }, [multiple, isOpen, currentInputValue, value, options, renderValue]);

  // Custom single value display
  const singleValueNode = useMemo(() => {
    if (multiple || isOpen || value == null || !renderValue) return null;
    const opt = options.find((o) => o.value === value);
    if (!opt) return null;
    return (
      <span className={cn?.singleValue} {...{ [FINRA_UI_ATTR]: componentIds.comboBoxSingleValue }}>
        {renderValue(opt)}
      </span>
    );
  }, [multiple, isOpen, value, options, renderValue, cn?.singleValue]);

  //  Build option list sections
  const optionSections: ReactNode[] = [];
  let runningIndex = 0;

  // Favourites section
  if (favourites.length > 0) {
    optionSections.push(
      <div
        key="__fav-group"
        role="group"
        aria-label="Favourites"
        className={cn?.group}
        {...{ [FINRA_UI_ATTR]: componentIds.comboBoxGroup }}
        data-combobox-group="favourites">
        <div
          className={cn?.groupLabel}
          {...{ [FINRA_UI_ATTR]: componentIds.comboBoxGroupLabel }}
          data-combobox-group-label
          aria-hidden="true">
          Favourites
        </div>
        {favourites.map((opt) => {
          const node = renderSingleOption(opt, runningIndex);
          runningIndex++;
          return node;
        })}
      </div>,
    );
  }

  // Named groups
  for (const group of groups) {
    const nonFavOpts = group.options.filter((o) => !o.favourite);
    if (nonFavOpts.length === 0) continue;
    optionSections.push(
      <div
        key={`__group-${group.label}`}
        role="group"
        aria-label={group.label}
        className={cn?.group}
        {...{ [FINRA_UI_ATTR]: componentIds.comboBoxGroup }}
        data-combobox-group={group.label}>
        <div
          className={cn?.groupLabel}
          {...{ [FINRA_UI_ATTR]: componentIds.comboBoxGroupLabel }}
          data-combobox-group-label
          aria-hidden="true">
          {group.label}
        </div>
        {nonFavOpts.map((opt) => {
          const node = renderSingleOption(opt, runningIndex);
          runningIndex++;
          return node;
        })}
      </div>,
    );
  }

  // Ungrouped (non-favourite)
  const ungroupedNonFav = ungrouped.filter((o) => !o.favourite);
  if (ungroupedNonFav.length > 0) {
    if (favourites.length > 0 || groups.length > 0) {
      optionSections.push(
        <div
          key="__ungrouped"
          role="group"
          aria-label="All"
          className={cn?.group}
          {...{ [FINRA_UI_ATTR]: componentIds.comboBoxGroup }}
          data-combobox-group="all">
          <div
            className={cn?.groupLabel}
            {...{ [FINRA_UI_ATTR]: componentIds.comboBoxGroupLabel }}
            data-combobox-group-label
            aria-hidden="true">
            All
          </div>
          {ungroupedNonFav.map((opt) => {
            const node = renderSingleOption(opt, runningIndex);
            runningIndex++;
            return node;
          })}
        </div>,
      );
    } else {
      for (const opt of ungroupedNonFav) {
        optionSections.push(renderSingleOption(opt, runningIndex));
        runningIndex++;
      }
    }
  }

  // Create option
  if (showCreateOption) {
    const createIdx = runningIndex;
    optionSections.push(
      <div
        key="__create"
        id={getOptionId(createIdx)}
        role="option"
        tabIndex={-1}
        data-index={createIdx}
        aria-selected={false}
        data-highlighted={highlightedIndex === createIdx || undefined}
        data-combobox-create
        {...{ [FINRA_UI_ATTR]: componentIds.comboBoxOption }}
        className={cx(
          cn?.option,
          cn?.optionCreate,
          highlightedIndex === createIdx && cn?.optionHighlighted,
        )}
        onMouseDown={(e) => {
          e.preventDefault();
          onCreateOption?.(currentInputValue.trim());
          setInputValue("");
        }}
        onMouseEnter={() => setHighlightedIndex(createIdx)}>
        {createLabel}
      </div>,
    );
  }

  const hasOptions = flatOptions.length > 0 || showCreateOption;

  //  Shared input props
  //
  //  ARIA 1.2 puts `role="combobox"` (and its expanded/controls/haspopup state)
  //  on the *text input* itself. It used to sit on the wrapper <div> with the
  //  input marked `role="searchbox"`, which is non-conformant: screen readers
  //  announced a search field with no popup relationship, and the expanded
  //  state was on an element the user never focused.
  const inputProps = {
    type: "text" as const,
    role: "combobox" as const,
    id: field.id,
    "aria-autocomplete": "list" as const,
    "aria-expanded": isOpen,
    "aria-haspopup": "listbox" as const,
    "aria-controls": isOpen ? listboxId : undefined,
    "aria-activedescendant":
      isOpen && highlightedIndex >= 0 ? getOptionId(highlightedIndex) : undefined,
    "aria-label": ariaLabel ?? placeholder,
    "aria-labelledby": ariaLabelledBy,
    "aria-describedby": field["aria-describedby"],
    "aria-invalid": field["aria-invalid"],
    "aria-required": field["aria-required"],
    onChange: handleInputChange,
    onKeyDown: handleKeyDown,
    onFocus: handleFocus,
    disabled: isDisabled,
  };

  return (
    <div
      className={cn?.root}
      {...{ [FINRA_UI_ATTR]: componentIds.comboBox }}
      {...dataAttributes}
      {...props}>
      {/* Presentational shell only - all combobox ARIA lives on the input. */}
      <div
        ref={setControlEl}
        className={cn?.wrapper}
        data-disabled={isDisabled || undefined}
        {...controlDataAttributes}>
        {multiple ? (
          <div
            className={cn?.multiValueContainer}
            {...{ [FINRA_UI_ATTR]: componentIds.comboBoxMultiValue }}>
            {selectedValues.length > 0 ? (
              // One Tab stop for the whole set; arrows move within it. The list
              // wraps only the pills - an <input> is not a valid list child.
              //
              // The handler is delegated from the focusable remove buttons inside. The list
              // itself must stay non-focusable: a focusable role="list" would add a dead tab
              // stop, so tabIndex is deliberately absent.
              <div
                ref={pillListRef}
                role="list"
                className={cn?.pillList}
                {...{ [FINRA_UI_ATTR]: componentIds.comboBoxPillList }}
                onKeyDown={handlePillKeyDown}>
                {renderSelectedPills()}
              </div>
            ) : null}
            <input
              ref={mergeRefs(forwardedRef, inputRef)}
              className={cn?.input}
              {...{ [FINRA_UI_ATTR]: componentIds.comboBoxInput }}
              {...inputProps}
              value={currentInputValue}
              placeholder={selectedValues.length === 0 ? placeholder : undefined}
            />
          </div>
        ) : (
          <>
            {singleValueNode}
            <input
              ref={mergeRefs(forwardedRef, inputRef)}
              className={cx(cn?.input, singleValueNode ? cn?.inputHidden : undefined)}
              {...{ [FINRA_UI_ATTR]: componentIds.comboBoxInput }}
              {...inputProps}
              value={singleDisplayValue}
              placeholder={placeholder}
            />
          </>
        )}
        {renderIndicator ? renderIndicator(isOpen) : null}
      </div>

      {/*
        Portalled so the listbox escapes any ancestor `overflow: hidden` /
        `z-index` / `transform` context - inline rendering meant it was clipped
        inside scrollable panels and table cells.
      */}
      {isOpen ? (
        <Portal container={container}>
          <DismissableLayer
            ref={setFloating}
            className={cn?.listbox}
            {...{ [FINRA_UI_ATTR]: componentIds.comboBoxListbox }}
            style={{
              position: "absolute",
              top: y,
              left: x,
              // Match the control's width so the list lines up under it.
              minInlineSize: controlEl?.getBoundingClientRect().width,
            }}
            onDismiss={handleDismiss}
            // The control holds the input and indicator; pointing at either
            // must not count as "outside" or the click would close then reopen.
            excludeElements={[controlEl]}>
            {header ? (
              <div className={cn?.header} {...{ [FINRA_UI_ATTR]: componentIds.comboBoxHeader }}>
                {header}
              </div>
            ) : null}

            <div
              ref={listRef}
              id={listboxId}
              role="listbox"
              aria-multiselectable={multiple || undefined}
              className={cn?.options}
              {...{ [FINRA_UI_ATTR]: componentIds.comboBoxOptions }}
              tabIndex={-1}>
              {loading ? (
                <div
                  role="presentation"
                  className={cn?.loading}
                  {...{ [FINRA_UI_ATTR]: componentIds.comboBoxLoading }}
                  aria-live="polite">
                  {renderLoading ? renderLoading() : "Loading..."}
                </div>
              ) : !hasOptions ? (
                <div
                  role="presentation"
                  className={cn?.empty}
                  {...{ [FINRA_UI_ATTR]: componentIds.comboBoxEmpty }}
                  aria-live="polite">
                  {noOptionsMessage}
                </div>
              ) : (
                optionSections
              )}
            </div>

            {footer ? (
              <div className={cn?.footer} {...{ [FINRA_UI_ATTR]: componentIds.comboBoxFooter }}>
                {footer}
              </div>
            ) : null}
          </DismissableLayer>
        </Portal>
      ) : null}

      {/*
        Result-count announcement. The region is always mounted (a live region
        added to the DOM at the same time as its content is unreliably
        announced); only its text changes. Silent while closed or loading - the
        loading node has its own aria-live.
      */}
      <div
        {...{ [FINRA_UI_ATTR]: componentIds.comboBoxStatus }}
        role="status"
        aria-live="polite"
        style={SR_ONLY}>
        {isOpen && !loading ? formatResultCount(totalNavigable) : ""}
      </div>
    </div>
  );
}

/**
 * Unstyled ComboBox. Ships no CSS; supply `classNames`.
 *
 * @see {@link ComboBoxBaseProps}
 */
export const ComboBoxBase = forwardRef(ComboBoxBaseRender) as <T = string>(
  props: ComboBoxBaseProps<T> & { ref?: Ref<HTMLInputElement> },
) => React.ReactElement | null;

(ComboBoxBase as { displayName?: string }).displayName = "ComboBoxBase";
