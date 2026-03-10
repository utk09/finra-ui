import {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
  useId,
  forwardRef,
  type KeyboardEvent,
  type HTMLAttributes,
  type ReactNode,
  type ForwardedRef,
  type Ref,
} from "react";
import { mergeRefs } from "../../utils/mergeRefs";

// ─── Public Types ───

export interface ComboBoxOption<T = string> {
  value: T;
  label: string;
  group?: string;
  disabled?: boolean;
  favourite?: boolean;
}

export interface ComboBoxRenderOptionState {
  isSelected: boolean;
  isHighlighted: boolean;
  isDisabled: boolean;
  isFavourite: boolean;
}

export interface ComboBoxGroup<T = string> {
  label: string;
  options: ComboBoxOption<T>[];
}

/**
 * CSS class overrides that the styled layer injects into the unstyled base.
 * Every key is optional — when absent, no className is applied.
 */
export interface ComboBoxClassNames {
  root?: string;
  wrapper?: string;
  multiValueContainer?: string;
  pill?: string;
  pillText?: string;
  pillRemove?: string;
  singleValue?: string;
  input?: string;
  inputHidden?: string;
  indicator?: string;
  indicatorOpen?: string;
  listbox?: string;
  header?: string;
  footer?: string;
  options?: string;
  option?: string;
  optionHighlighted?: string;
  optionSelected?: string;
  optionDisabled?: string;
  optionCreate?: string;
  optionLabel?: string;
  checkIcon?: string;
  group?: string;
  groupLabel?: string;
  loading?: string;
  spinner?: string;
  empty?: string;
}

export interface ComboBoxBaseProps<T = string> extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "onChange" | "defaultValue"
> {
  /** Available options. */
  options: ComboBoxOption<T>[];

  // ─── Value ───
  /** Selected value(s). Single value or array for multiple. */
  value?: T | T[] | null;
  /** Called when selection changes. */
  onChange?: (value: T | T[] | null) => void;
  /** Enable multi-select mode. */
  multiple?: boolean;

  // ─── Typeahead ───
  /** Controlled input text. */
  inputValue?: string;
  /** Called when input text changes. */
  onInputChange?: (value: string) => void;
  /** Custom filter function. Return true to keep option. */
  filterFn?: (option: ComboBoxOption<T>, inputValue: string) => boolean;

  // ─── Async ───
  /** Show loading indicator. */
  loading?: boolean;
  /** Called when input changes to trigger async loading. */
  onLoadOptions?: (inputValue: string) => void;

  // ─── Creatable ───
  /** Allow creating new options from input. */
  creatable?: boolean;
  /** Called when user creates a new option. */
  onCreateOption?: (inputValue: string) => void;
  /** Custom label for the create option. */
  formatCreateLabel?: (inputValue: string) => string;

  // ─── Sections ───
  /** Content rendered above the options list. */
  header?: ReactNode;
  /** Content rendered below the options list. */
  footer?: ReactNode;

  // ─── Display ───
  placeholder?: string;
  disabled?: boolean;
  /** Message shown when no options match. */
  noOptionsMessage?: string | ReactNode;

  // ─── Rendering ───
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

  // ─── Open state ───
  /** Controlled open state. */
  open?: boolean;
  /** Called when open state changes. */
  onOpenChange?: (open: boolean) => void;

  // ─── Style injection ───
  /** CSS class overrides injected by the styled layer. */
  classNames?: ComboBoxClassNames;
  /** Root element data attributes. */
  dataAttributes?: Record<string, string>;
}

// ─── Default filter ───

function defaultFilter<T>(option: ComboBoxOption<T>, input: string): boolean {
  if (!input) return true;
  return option.label.toLowerCase().includes(input.toLowerCase());
}

// ─── Group options ───

function groupOptions<T>(options: ComboBoxOption<T>[]): {
  favourites: ComboBoxOption<T>[];
  groups: ComboBoxGroup<T>[];
  ungrouped: ComboBoxOption<T>[];
} {
  const favourites: ComboBoxOption<T>[] = [];
  const groupMap = new Map<string, ComboBoxOption<T>[]>();
  const ungrouped: ComboBoxOption<T>[] = [];

  for (const opt of options) {
    if (opt.favourite) {
      favourites.push(opt);
    }
    if (opt.group) {
      const list = groupMap.get(opt.group) ?? [];
      list.push(opt);
      groupMap.set(opt.group, list);
    } else {
      ungrouped.push(opt);
    }
  }

  const groups: ComboBoxGroup<T>[] = [];
  for (const [label, opts] of groupMap) {
    groups.push({ label, options: opts });
  }

  return { favourites, groups, ungrouped };
}

// ─── Utility: join class names (truthy only) ───

function cx(...classes: (string | false | undefined | null)[]): string | undefined {
  const result = classes.filter(Boolean).join(" ");
  return result || undefined;
}

// ─── Component ───

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
    renderOption,
    renderValue,
    renderCheckIcon,
    renderIndicator,
    renderPillRemoveIcon,
    renderLoading,
    open: controlledOpen,
    onOpenChange,
    classNames: cn,
    dataAttributes,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    ...props
  }: ComboBoxBaseProps<T>,
  forwardedRef: ForwardedRef<HTMLInputElement>,
): React.ReactElement {
  const id = useId();
  const listboxId = `${id}-listbox`;
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ─── Internal state ───
  const [internalInputValue, setInternalInputValue] = useState("");
  const [internalOpen, setInternalOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const isOpen = controlledOpen ?? internalOpen;
  const currentInputValue = controlledInputValue ?? internalInputValue;

  const setOpen = useCallback(
    (next: boolean) => {
      if (controlledOpen === undefined) {
        setInternalOpen(next);
      }
      onOpenChange?.(next);
    },
    [controlledOpen, onOpenChange],
  );

  const setInputValue = useCallback(
    (next: string) => {
      if (controlledInputValue === undefined) {
        setInternalInputValue(next);
      }
      onInputChange?.(next);
    },
    [controlledInputValue, onInputChange],
  );

  // ─── Selected values as array ───
  const selectedValues = useMemo<T[]>(() => {
    if (value == null) return [];
    return Array.isArray(value) ? value : [value];
  }, [value]);

  const isSelected = useCallback(
    (optValue: T) => selectedValues.some((v) => v === optValue),
    [selectedValues],
  );

  // ─── Filtered options ───
  const filter = filterFn ?? defaultFilter;
  const filteredOptions = useMemo(
    () => options.filter((opt) => filter(opt, currentInputValue)),
    [options, filter, currentInputValue],
  );

  // ─── Flat list for keyboard navigation ───
  const flatOptions = useMemo(() => {
    const { favourites, groups, ungrouped } = groupOptions(filteredOptions);
    const flat: ComboBoxOption<T>[] = [];
    for (const f of favourites) flat.push(f);
    for (const g of groups) {
      for (const o of g.options) {
        if (!o.favourite) flat.push(o);
      }
    }
    for (const o of ungrouped) {
      if (!o.favourite) flat.push(o);
    }
    return flat;
  }, [filteredOptions]);

  // Show create option?
  const showCreateOption =
    creatable &&
    currentInputValue.trim() !== "" &&
    !options.some((o) => o.label.toLowerCase() === currentInputValue.trim().toLowerCase());

  const createLabel = formatCreateLabel
    ? formatCreateLabel(currentInputValue.trim())
    : `Create "${currentInputValue.trim()}"`;

  const totalNavigable = flatOptions.length + (showCreateOption ? 1 : 0);

  // ─── Selection logic ───
  const selectOption = useCallback(
    (opt: ComboBoxOption<T>) => {
      if (opt.disabled) return;

      if (multiple) {
        const next = isSelected(opt.value)
          ? selectedValues.filter((v) => v !== opt.value)
          : [...selectedValues, opt.value];
        onChange?.(next);
        setInputValue("");
      } else {
        onChange?.(opt.value);
        setInputValue(opt.label);
        setOpen(false);
      }

      inputRef.current?.focus();
    },
    [multiple, isSelected, selectedValues, onChange, setInputValue, setOpen],
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

  // ─── Keyboard ───
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (disabled) return;

      switch (e.key) {
        case "ArrowDown": {
          e.preventDefault();
          if (!isOpen) {
            setOpen(true);
            setHighlightedIndex(0);
          } else {
            setHighlightedIndex((prev) => (prev + 1) % totalNavigable);
          }
          break;
        }
        case "ArrowUp": {
          e.preventDefault();
          if (!isOpen) {
            setOpen(true);
            setHighlightedIndex(totalNavigable - 1);
          } else {
            setHighlightedIndex((prev) => (prev - 1 + totalNavigable) % totalNavigable);
          }
          break;
        }
        case "Enter": {
          e.preventDefault();
          if (isOpen && highlightedIndex >= 0) {
            if (highlightedIndex < flatOptions.length) {
              selectOption(flatOptions[highlightedIndex]);
            } else if (showCreateOption) {
              onCreateOption?.(currentInputValue.trim());
              setInputValue("");
            }
          } else if (!isOpen) {
            setOpen(true);
          }
          break;
        }
        case "Escape": {
          if (isOpen) {
            e.preventDefault();
            setOpen(false);
            setHighlightedIndex(-1);
          }
          break;
        }
        case "Backspace": {
          if (multiple && currentInputValue === "" && selectedValues.length > 0) {
            removeValue(selectedValues[selectedValues.length - 1]);
          }
          break;
        }
        case "Home": {
          if (isOpen) {
            e.preventDefault();
            setHighlightedIndex(0);
          }
          break;
        }
        case "End": {
          if (isOpen) {
            e.preventDefault();
            setHighlightedIndex(totalNavigable - 1);
          }
          break;
        }
      }
    },
    [
      disabled,
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
    ],
  );

  // ─── Input change ───
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setInputValue(val);
      if (!isOpen) setOpen(true);
      setHighlightedIndex(0);
      onLoadOptions?.(val);
    },
    [setInputValue, isOpen, setOpen, onLoadOptions],
  );

  // ─── Focus ───
  const handleFocus = useCallback(() => {
    if (!disabled && !isOpen) {
      setOpen(true);
    }
  }, [disabled, isOpen, setOpen]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, setOpen]);

  // Scroll highlighted into view
  useEffect(() => {
    if (highlightedIndex < 0 || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-index="${highlightedIndex}"]`);
    if (el) {
      el.scrollIntoView?.({ block: "nearest" });
    }
  }, [highlightedIndex]);

  // ─── Grouped rendering data ───
  const { favourites, groups, ungrouped } = useMemo(
    () => groupOptions(filteredOptions),
    [filteredOptions],
  );

  // ─── Helper: get option id ───
  const getOptionId = (index: number) => `${id}-option-${index}`;

  // ─── Helper: render a single option ───
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
            <span className={cn?.optionLabel}>{opt.label}</span>
            {state.isSelected && renderCheckIcon ? renderCheckIcon() : null}
          </>
        )}
      </div>
    );
  };

  // ─── Render selected values (multi mode) ───
  const renderSelectedPills = () => {
    if (!multiple) return null;
    return selectedValues.map((val) => {
      const opt = options.find((o) => o.value === val);
      if (!opt) return null;
      return (
        <span key={String(val)} className={cn?.pill} data-combobox-pill>
          <span className={cn?.pillText}>{renderValue ? renderValue(opt) : opt.label}</span>
          {!disabled ? (
            <button
              type="button"
              className={cn?.pillRemove}
              tabIndex={-1}
              aria-label={`Remove ${opt.label}`}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                removeValue(val);
              }}>
              {renderPillRemoveIcon ? renderPillRemoveIcon() : "\u00d7"}
            </button>
          ) : null}
        </span>
      );
    });
  };

  // ─── Display value for single mode ───
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
    return <span className={cn?.singleValue}>{renderValue(opt)}</span>;
  }, [multiple, isOpen, value, options, renderValue, cn?.singleValue]);

  // ─── Build option list sections ───
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
        data-combobox-group="favourites">
        <div className={cn?.groupLabel} data-combobox-group-label aria-hidden="true">
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
        data-combobox-group={group.label}>
        <div className={cn?.groupLabel} data-combobox-group-label aria-hidden="true">
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
          data-combobox-group="all">
          <div className={cn?.groupLabel} data-combobox-group-label aria-hidden="true">
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

  // ─── Shared input props ───
  const inputProps = {
    type: "text" as const,
    role: "searchbox" as const,
    "aria-autocomplete": "list" as const,
    "aria-controls": isOpen ? listboxId : undefined,
    "aria-activedescendant":
      isOpen && highlightedIndex >= 0 ? getOptionId(highlightedIndex) : undefined,
    "aria-label": ariaLabel ?? placeholder,
    "aria-labelledby": ariaLabelledBy,
    onChange: handleInputChange,
    onKeyDown: handleKeyDown,
    onFocus: handleFocus,
    disabled,
  };

  return (
    <div ref={containerRef} className={cn?.root} {...dataAttributes} {...props}>
      <div
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listboxId : undefined}
        aria-haspopup="listbox"
        aria-disabled={disabled || undefined}
        className={cn?.wrapper}>
        {multiple ? (
          <div className={cn?.multiValueContainer}>
            {renderSelectedPills()}
            <input
              ref={mergeRefs(forwardedRef, inputRef)}
              className={cn?.input}
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
              {...inputProps}
              value={singleDisplayValue}
              placeholder={placeholder}
            />
          </>
        )}
        {renderIndicator ? renderIndicator(isOpen) : null}
      </div>

      {isOpen ? (
        <div className={cn?.listbox}>
          {header ? <div className={cn?.header}>{header}</div> : null}

          <div
            ref={listRef}
            id={listboxId}
            role="listbox"
            aria-multiselectable={multiple || undefined}
            className={cn?.options}
            tabIndex={-1}>
            {loading ? (
              <div role="presentation" className={cn?.loading} aria-live="polite">
                {renderLoading ? renderLoading() : "Loading..."}
              </div>
            ) : !hasOptions ? (
              <div role="presentation" className={cn?.empty} aria-live="polite">
                {noOptionsMessage}
              </div>
            ) : (
              optionSections
            )}
          </div>

          {footer ? <div className={cn?.footer}>{footer}</div> : null}
        </div>
      ) : null}
    </div>
  );
}

export const ComboBoxBase = forwardRef(ComboBoxBaseRender) as <T = string>(
  props: ComboBoxBaseProps<T> & { ref?: Ref<HTMLInputElement> },
) => React.ReactElement | null;

(ComboBoxBase as { displayName?: string }).displayName = "ComboBoxBase";
