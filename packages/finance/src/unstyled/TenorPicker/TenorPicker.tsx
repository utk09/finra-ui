import { useClickOutside, useFormField } from "@utk09/finra-ui";
import {
  type ChangeEvent,
  type FocusEvent,
  forwardRef,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  buildTenorGroups,
  DEFAULT_STANDARD_TENORS,
  flattenGroups,
  moveTenorHighlight,
  type TenorGroupId,
  type TenorOptionModel,
} from "../../logic/tenorPicker";
import { parseTenorInput, type TenorInputParser } from "../../utils/tenor";

//  Types

/** Why a commit was rejected. */
export type TenorPickerInvalidReason = "unrecognized" | "invalid-value" | "disabled-tenor";

/** Imperative handle exposed via `ref`. */
export interface TenorPickerHandle {
  focus: () => void;
  clear: () => void;
  open: () => void;
  close: () => void;
  getValue: () => string | null;
}

/**
 * Marks the star affordance so the option's single mousedown handler can tell a
 * "toggle favourite" click from a "select this tenor" click, without the star
 * needing a handler (and therefore interactivity) of its own.
 */
const FAVOURITE_ATTR = "data-tenor-favourite";

export interface TenorPickerClassNames {
  root?: string;
  rootOpen?: string;
  input?: string;
  indicator?: string;
  indicatorOpen?: string;
  popup?: string;
  group?: string;
  groupLabel?: string;
  option?: string;
  optionHighlighted?: string;
  optionSelected?: string;
  optionDisabled?: string;
  optionFavourite?: string;
  optionLabel?: string;
  /**
   * The star affordance. Renamed from `favouriteButton`: it is no longer a
   * `<button>`, because a listbox `option` may not contain interactive
   * descendants (axe `nested-interactive`).
   */
  favouriteToggle?: string;
  favouriteActive?: string;
  check?: string;
  empty?: string;
}

export interface TenorPickerBaseProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "onChange" | "defaultValue" | "onInvalid"
> {
  /** Controlled value (canonical tenor string). */
  value?: string | null;
  /** Initial value (uncontrolled). */
  defaultValue?: string | null;
  /** Fired when the committed tenor changes (null when cleared). */
  onChange?: (tenor: string | null) => void;

  /** Tenors to offer. Defaults to the JIRA market set. */
  tenors?: readonly string[];
  /** Per-tenor display label overrides. */
  tenorLabels?: Record<string, string>;
  /** Tenors that cannot be selected. */
  disabledTenors?: readonly string[];
  /** Allow committing free-form typed tenors (e.g. `1y6m`). Default true. */
  allowCustom?: boolean;
  /** Replaceable parser. Defaults to {@link parseTenorInput}. */
  parser?: TenorInputParser;

  //  Groups
  /** Render options in semantic groups. When false, one flat list. Default true. */
  grouped?: boolean;
  /** Group render order. */
  groupOrder?: readonly TenorGroupId[];
  /** Groups to hide entirely. */
  hiddenGroups?: readonly TenorGroupId[];
  /** Group heading overrides. */
  groupLabels?: Partial<Record<TenorGroupId, string>>;

  //  Favourites (external/adapter-driven storage)
  /** Controlled favourites (canonical tenors). */
  favourites?: readonly string[];
  /** Initial favourites (uncontrolled). */
  defaultFavourites?: readonly string[];
  /** Fired when a favourite is toggled. */
  onFavouriteChange?: (tenor: string, favourite: boolean, favourites: string[]) => void;
  /** Show the pinned Favourites group + star toggles. Default true. */
  showFavourites?: boolean;
  /**
   * Appended to a favourited option's accessible name (e.g. "3M, favourite").
   * The star itself is decorative, so this is how the state is announced.
   */
  favouriteHint?: string;

  //  State
  disabled?: boolean;
  readOnly?: boolean;
  placeholder?: string;
  /** Shown when no options match the filter. */
  noOptionsMessage?: string;

  //  Style injection
  classNames?: TenorPickerClassNames;
  dataAttributes?: Record<string, string>;
  renderIndicator?: (isOpen: boolean) => ReactNode;
  renderFavourite?: (active: boolean) => ReactNode;
  renderCheck?: () => ReactNode;

  //  Events
  onInvalid?: (reason: TenorPickerInvalidReason) => void;
  onOpen?: () => void;
  onClose?: () => void;

  //  a11y / FormField
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
  "aria-label"?: string;
}

//  Component

export const TenorPickerBase = forwardRef<TenorPickerHandle, TenorPickerBaseProps>(
  (
    {
      value,
      defaultValue,
      onChange,
      tenors = DEFAULT_STANDARD_TENORS,
      tenorLabels,
      disabledTenors,
      allowCustom = true,
      parser = parseTenorInput,
      grouped = true,
      groupOrder,
      hiddenGroups,
      groupLabels,
      favourites,
      defaultFavourites,
      onFavouriteChange,
      showFavourites = true,
      favouriteHint = "favourite",
      disabled,
      readOnly,
      placeholder = "Select or type a tenor…",
      noOptionsMessage = "No matching tenors",
      classNames: cn,
      dataAttributes,
      renderIndicator,
      renderFavourite,
      renderCheck,
      onInvalid,
      onOpen,
      onClose,
      id,
      "aria-describedby": ariaDescribedBy,
      "aria-invalid": ariaInvalid,
      "aria-label": ariaLabel,
      ...props
    },
    forwardedRef,
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const baseId = useId();
    const popupId = `${baseId}-popup`;
    const optionId = (index: number): string => `${baseId}-opt-${index}`;

    // FormField wiring (id, aria-describedby/invalid/required); no-op standalone.
    const field = useFormField({
      id,
      "aria-describedby": ariaDescribedBy,
      "aria-invalid": ariaInvalid,
      disabled,
    });

    //  Value (controlled / uncontrolled)

    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = useState<string | null>(defaultValue ?? null);
    const currentValue = isControlled ? value : internalValue;

    const displayFor = useCallback(
      (tenor: string | null): string => (tenor ? (tenorLabels?.[tenor] ?? tenor) : ""),
      [tenorLabels],
    );

    const [inputText, setInputText] = useState(() => displayFor(defaultValue ?? null));
    const [isOpen, setIsOpen] = useState(false);
    const [highlight, setHighlight] = useState(-1);
    // Whether the user is actively typing a filter (vs. showing the committed value).
    const [filtering, setFiltering] = useState(false);

    // Sync controlled value → displayed text (when not mid-filter).
    useEffect(() => {
      if (isControlled && !filtering) setInputText(displayFor(value ?? null));
    }, [isControlled, value, filtering, displayFor]);

    //  Favourites (controlled / uncontrolled)

    const isFavControlled = favourites !== undefined;
    const [internalFavourites, setInternalFavourites] = useState<string[]>(() => [
      ...(defaultFavourites ?? []),
    ]);
    const currentFavourites = isFavControlled ? favourites : internalFavourites;

    const toggleFavourite = useCallback(
      (tenor: string) => {
        const has = currentFavourites.includes(tenor);
        const next = has
          ? currentFavourites.filter((t) => t !== tenor)
          : [...currentFavourites, tenor];
        if (!isFavControlled) setInternalFavourites(next);
        onFavouriteChange?.(tenor, !has, next);
      },
      [currentFavourites, isFavControlled, onFavouriteChange],
    );

    //  Grouped option model

    const query = filtering ? inputText.trim() : "";

    const groups = useMemo(
      () =>
        buildTenorGroups({
          tenors,
          labels: tenorLabels,
          disabledTenors,
          favourites: currentFavourites,
          showFavourites,
          groupOrder,
          hiddenGroups,
          groupLabels,
          query,
          parser,
          grouped,
        }),
      [
        tenors,
        tenorLabels,
        disabledTenors,
        currentFavourites,
        showFavourites,
        groupOrder,
        hiddenGroups,
        groupLabels,
        query,
        parser,
        grouped,
      ],
    );

    const flat = useMemo(() => flattenGroups(groups), [groups]);
    const flatIndexOf = useCallback(
      (tenor: string): number => flat.findIndex((o) => o.tenor === tenor),
      [flat],
    );

    //  Open / close

    const openPopup = useCallback(() => {
      if (disabled || readOnly) return;
      setFiltering(false);
      setIsOpen((prev) => {
        if (!prev) onOpen?.();
        return true;
      });
    }, [disabled, readOnly, onOpen]);

    const closePopup = useCallback(() => {
      setHighlight(-1);
      setFiltering(false);
      setIsOpen((prev) => {
        if (prev) onClose?.();
        return false;
      });
    }, [onClose]);

    useClickOutside(containerRef, closePopup, isOpen);

    //  Commit

    const commitTenor = useCallback(
      (tenor: string | null) => {
        if (!isControlled) setInternalValue(tenor);
        onChange?.(tenor);
        setInputText(displayFor(tenor));
        setFiltering(false);
      },
      [isControlled, onChange, displayFor],
    );

    const revertInput = useCallback(() => {
      setInputText(displayFor(currentValue ?? null));
      setFiltering(false);
    }, [displayFor, currentValue]);

    /** Parse + validate `raw`, committing the canonical tenor on success. */
    const commitText = useCallback(
      (raw: string): boolean => {
        const trimmed = raw.trim();
        if (!trimmed) {
          commitTenor(null);
          return true;
        }
        if (!allowCustom) {
          revertInput();
          return false;
        }
        const result = parser(trimmed);
        if (!result.valid || !result.tenor) {
          onInvalid?.(result.error === "invalid-value" ? "invalid-value" : "unrecognized");
          revertInput();
          return false;
        }
        if (disabledTenors?.includes(result.tenor)) {
          onInvalid?.("disabled-tenor");
          revertInput();
          return false;
        }
        commitTenor(result.tenor);
        return true;
      },
      [allowCustom, parser, disabledTenors, onInvalid, commitTenor, revertInput],
    );

    const selectOption = useCallback(
      (option: TenorOptionModel | undefined) => {
        if (!option || option.disabled) return;
        commitTenor(option.tenor);
        closePopup();
        inputRef.current?.focus();
      },
      [commitTenor, closePopup],
    );

    //  Handlers

    const handleInputChange = useCallback(
      (event: ChangeEvent<HTMLInputElement>) => {
        if (disabled || readOnly) return;
        setInputText(event.target.value);
        setFiltering(true);
        setHighlight(-1);
        if (!isOpen) openPopup();
      },
      [disabled, readOnly, isOpen, openPopup],
    );

    const handleInputBlur = useCallback(
      (event: FocusEvent<HTMLInputElement>) => {
        // Focus moving into the popup is not a real blur-commit.
        if (containerRef.current?.contains(event.relatedTarget as Node | null)) return;
        if (filtering) commitText(inputText);
      },
      [filtering, commitText, inputText],
    );

    const move = useCallback(
      (direction: 1 | -1) =>
        setHighlight((current) => moveTenorHighlight(flat, current, direction)),
      [flat],
    );

    const handleInputKeyDown = useCallback(
      (event: KeyboardEvent<HTMLInputElement>) => {
        if (disabled || readOnly) return;

        if (event.key === "ArrowDown") {
          event.preventDefault();
          if (!isOpen) {
            openPopup();
            setHighlight(moveTenorHighlight(flat, -1, 1));
          } else {
            move(1);
          }
        } else if (event.key === "ArrowUp") {
          event.preventDefault();
          if (isOpen) move(-1);
        } else if (event.key === "Enter") {
          if (isOpen && highlight >= 0) {
            event.preventDefault();
            selectOption(flat[highlight]);
          } else {
            event.preventDefault();
            if (commitText(inputText)) closePopup();
          }
        } else if (event.key === "Escape") {
          if (isOpen) {
            event.preventDefault();
            revertInput();
            closePopup();
          }
        } else if (event.key === " " && event.ctrlKey) {
          event.preventDefault();
          openPopup();
          setHighlight(moveTenorHighlight(flat, -1, 1));
        } else if (event.ctrlKey && event.key.toLowerCase() === "d") {
          // Ctrl+D toggles the highlighted option's favourite. The star is
          // decorative, so this is the only keyboard route to favouriting -
          // without it the feature is mouse-only (FIN-002-04 requires it be
          // keyboard accessible).
          if (isOpen && showFavourites && highlight >= 0) {
            event.preventDefault();
            toggleFavourite(flat[highlight].tenor);
          }
        }
        // Tab falls through: blur commits, native focus move proceeds.
      },
      [
        disabled,
        readOnly,
        isOpen,
        highlight,
        flat,
        inputText,
        openPopup,
        move,
        selectOption,
        commitText,
        closePopup,
        revertInput,
        showFavourites,
        toggleFavourite,
      ],
    );

    //  Imperative handle

    useImperativeHandle(
      forwardedRef,
      () => ({
        focus: () => inputRef.current?.focus(),
        clear: () => commitTenor(null),
        open: openPopup,
        close: closePopup,
        getValue: () => currentValue ?? null,
      }),
      [commitTenor, openPopup, closePopup, currentValue],
    );

    const activeDescendant = isOpen && highlight >= 0 ? optionId(highlight) : undefined;

    const renderOption = (option: TenorOptionModel): ReactNode => {
      const index = flatIndexOf(option.tenor);
      const selected = option.tenor === currentValue;
      return (
        <div
          key={option.tenor}
          role="option"
          id={optionId(index)}
          // Roving highlight via aria-activedescendant on the input; options
          // are not in the tab sequence but must be programmatically focusable.
          tabIndex={-1}
          aria-selected={selected}
          aria-disabled={option.disabled || undefined}
          // Favourite state rides on the option's name (the star is decorative),
          // so screen-reader users hear it without a second focusable control.
          aria-label={
            showFavourites && option.favourite ? `${option.label}, ${favouriteHint}` : undefined
          }
          className={
            [
              cn?.option,
              index === highlight && cn?.optionHighlighted,
              selected && cn?.optionSelected,
              option.disabled && cn?.optionDisabled,
              option.favourite && cn?.optionFavourite,
            ]
              .filter(Boolean)
              .join(" ") || undefined
          }
          // One handler for the whole option. Hit-testing the star here (rather
          // than giving it its own handler) keeps the star a plain element:
          // a listbox `option` may not contain interactive descendants, and a
          // nested <button> both broke that rule and was unreachable anyway
          // (tabIndex -1, and options are not in the tab sequence).
          onMouseDown={(event) => {
            event.preventDefault();
            if (
              showFavourites &&
              (event.target as Element).closest?.(`[${FAVOURITE_ATTR}]`) !== null
            ) {
              toggleFavourite(option.tenor);
              return;
            }
            selectOption(option);
          }}>
          <span className={cn?.optionLabel}>{option.label}</span>
          {selected && renderCheck ? (
            <span className={cn?.check} aria-hidden="true">
              {renderCheck()}
            </span>
          ) : null}
          {showFavourites && renderFavourite ? (
            // Decorative: the favourite state is carried by the option's own
            // accessible name, so announcing the star again would be noise.
            <span
              {...{ [FAVOURITE_ATTR]: "" }}
              aria-hidden="true"
              className={
                [cn?.favouriteToggle, option.favourite && cn?.favouriteActive]
                  .filter(Boolean)
                  .join(" ") || undefined
              }>
              {renderFavourite(option.favourite)}
            </span>
          ) : null}
        </div>
      );
    };

    return (
      <div
        ref={containerRef}
        className={[cn?.root, isOpen && cn?.rootOpen].filter(Boolean).join(" ") || undefined}
        {...dataAttributes}
        {...props}>
        <input
          ref={inputRef}
          className={cn?.input}
          type="text"
          role="combobox"
          id={field.id}
          value={inputText}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          autoComplete="off"
          aria-expanded={isOpen}
          aria-controls={isOpen ? popupId : undefined}
          aria-haspopup="listbox"
          aria-activedescendant={activeDescendant}
          aria-describedby={field["aria-describedby"]}
          aria-invalid={field["aria-invalid"]}
          aria-required={field["aria-required"]}
          aria-label={ariaLabel}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          onClick={() => {
            if (!disabled && !readOnly && !isOpen) openPopup();
          }}
        />

        {renderIndicator ? (
          <span
            className={
              [cn?.indicator, isOpen && cn?.indicatorOpen].filter(Boolean).join(" ") || undefined
            }
            aria-hidden="true">
            {renderIndicator(isOpen)}
          </span>
        ) : null}

        {isOpen ? (
          <div className={cn?.popup} id={popupId} role="listbox" aria-label={ariaLabel}>
            {flat.length === 0 ? (
              <div className={cn?.empty} role="presentation">
                {noOptionsMessage}
              </div>
            ) : grouped ? (
              groups.map((group) => (
                <div key={group.id} className={cn?.group} role="group" aria-label={group.label}>
                  <div className={cn?.groupLabel} aria-hidden="true">
                    {group.label}
                  </div>
                  {group.options.map(renderOption)}
                </div>
              ))
            ) : (
              flat.map(renderOption)
            )}
          </div>
        ) : null}
      </div>
    );
  },
);

TenorPickerBase.displayName = "TenorPickerBase";
