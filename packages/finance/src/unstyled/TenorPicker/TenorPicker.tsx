import { FINRA_UI_ATTR, useClickOutside, useFormField } from "@utk09/finra-ui";
import { cx } from "@utk09/finra-ui/utils";
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

import { componentIds } from "../../componentIds";
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
/**
 * Why a typed commit was rejected.
 *
 * @remarks
 * The three are worth distinguishing to the user: `"unrecognized"` means the
 * text is not a tenor at all, `"invalid-value"` that it parsed but the number
 * is out of range (`0M`), and `"disabled-tenor"` that it is a real tenor this
 * field does not offer. Collapsing them would tell someone their typing was
 * wrong when it was really their number.
 */
export type TenorPickerInvalidReason = "unrecognized" | "invalid-value" | "disabled-tenor";

/** Imperative handle exposed via `ref`. */
export interface TenorPickerHandle {
  /** Move DOM focus to the text field. */
  focus: () => void;
  /** Commit `null`. Fires `onChange`, exactly as clearing by hand would. */
  clear: () => void;
  /** Open the popup. A no-op while disabled or read-only. */
  open: () => void;
  /** Close the popup and drop any highlight. */
  close: () => void;
  /** The committed tenor in canonical form, or null. */
  getValue: () => string | null;
}

/**
 * Marks the star affordance so the option's single mousedown handler can tell a
 * "toggle favourite" click from a "select this tenor" click, without the star
 * needing a handler (and therefore interactivity) of its own.
 */
const FAVOURITE_ATTR = "data-tenor-favourite";

/**
 * CSS class overrides the styled layer injects into the unstyled base.
 *
 * @remarks
 * Every key is optional - when absent, no className is applied at all (not an
 * empty `class` attribute).
 */
export interface TenorPickerClassNames {
  /** Outermost element. */
  root?: string;
  /** Applied to the root *in addition to* `root` while the popup is open. */
  rootOpen?: string;
  /** The text field carrying `role="combobox"`. */
  input?: string;
  /** The open/close affordance. */
  indicator?: string;
  /** Applied to the indicator *in addition to* `indicator` while open. */
  indicatorOpen?: string;
  /** The popup panel. */
  popup?: string;
  /** A group wrapper (Favourites / Weeks / Months / …). */
  group?: string;
  /** A group's heading. */
  groupLabel?: string;
  /** One option row. */
  option?: string;
  /** Added to the row holding the roving keyboard highlight. */
  optionHighlighted?: string;
  /** Added to the committed row. Orthogonal to `optionHighlighted` - a row may carry both. */
  optionSelected?: string;
  /** Added to a disabled row. */
  optionDisabled?: string;
  /** Added to a favourited row. */
  optionFavourite?: string;
  /** The label span inside a row. */
  optionLabel?: string;
  /**
   * The star affordance. Renamed from `favouriteButton`: it is no longer a
   * `<button>`, because a listbox `option` may not contain interactive
   * descendants (axe `nested-interactive`).
   */
  favouriteToggle?: string;
  /** Added to the star *in addition to* `favouriteToggle` when the tenor is favourited. */
  favouriteActive?: string;
  /** The tick shown on the committed row, when `renderCheck` supplies one. */
  check?: string;
  /** The row shown when nothing matches the current filter. */
  empty?: string;
}

/**
 * Props for the unstyled TenorPicker.
 *
 * @remarks
 * Ships no CSS - supply {@link TenorPickerClassNames}, or style via the
 * `data-*` hooks.
 *
 * Accepts free-form entry as well as selection, normalising `3 months`, `1y6m`
 * and `90d` to canonical form. Set `allowCustom={false}` to restrict input to
 * the offered list.
 */
export interface TenorPickerBaseProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue" | "onInvalid"> {
  /** Controlled value (canonical tenor string). */
  value?: string | null;
  /** Initial value (uncontrolled). */
  defaultValue?: string | null;
  /** Fired when the committed tenor changes (null when cleared). */
  onChange?: (tenor: string | null) => void;

  /** Tenors to offer. Defaults to the standard market set. */
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
  /** Disable the whole control - no opening, no typing, no favouriting. */
  disabled?: boolean;
  /** Show the committed value but refuse edits. The popup stays shut. */
  readOnly?: boolean;
  /** Placeholder for the text field. */
  placeholder?: string;
  /** Shown when no options match the filter. */
  noOptionsMessage?: string;

  //  Style injection
  /** CSS class names injected by the styled layer. */
  classNames?: TenorPickerClassNames;
  /** data-* attributes injected by the styled layer. */
  dataAttributes?: Record<string, string>;
  /** Render the open/close affordance. Receives the current open state. */
  renderIndicator?: (isOpen: boolean) => ReactNode;
  /**
   * Render the favourite star. Omit it and no star is rendered at all, which
   * also disables the pointer route to favouriting.
   */
  renderFavourite?: (active: boolean) => ReactNode;
  /** Render the tick shown on the committed option. */
  renderCheck?: () => ReactNode;

  //  Events
  /** Fired when a typed commit is rejected, with which rule refused it. */
  onInvalid?: (reason: TenorPickerInvalidReason) => void;
  /** Fired when the popup opens. Not fired again while it is already open. */
  onOpen?: () => void;
  /** Fired when the popup closes. Not fired again while it is already closed. */
  onClose?: () => void;

  //  a11y / FormField
  /** Explicit control id. Auto-generated, or taken from an enclosing FormField, if omitted. */
  id?: string;
  /** Ids of describing elements. Merged with any an enclosing FormField supplies. */
  "aria-describedby"?: string;
  /** Marks the control invalid. An enclosing FormField sets this from its own validation status. */
  "aria-invalid"?: boolean;
  /** Accessible name. Required unless an enclosing FormField or a visible label supplies one. */
  "aria-label"?: string;
}

//  Component

/**
 * Unstyled TenorPicker. Ships no CSS; supply `classNames`.
 *
 * @see {@link TenorPickerBaseProps}
 */
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

    // Keep the visible text in step with the committed value, except while the
    // user is mid-filter. Not restricted to the controlled case: while
    // uncontrolled the display still has to follow a formatting prop change.
    useEffect(() => {
      if (!filtering) setInputText(displayFor(currentValue ?? null));
    }, [filtering, displayFor, currentValue]);

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
        // The displayed text is only ours to set while uncontrolled. Under a
        // controlled `value` the consumer decides whether the selection sticks -
        // they may reject it - so the text follows `value` through the sync
        // effect above and never runs ahead of it.
        if (!isControlled) {
          setInternalValue(tenor);
          setInputText(displayFor(tenor));
        }
        onChange?.(tenor);
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
          // without it the feature would be mouse-only.
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
          {...{ [FINRA_UI_ATTR]: componentIds.tenorPickerOption }}
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
          className={cx(
            cn?.option,
            index === highlight && cn?.optionHighlighted,
            selected && cn?.optionSelected,
            option.disabled && cn?.optionDisabled,
            option.favourite && cn?.optionFavourite,
          )}
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
          <span
            className={cn?.optionLabel}
            {...{ [FINRA_UI_ATTR]: componentIds.tenorPickerOptionLabel }}>
            {option.label}
          </span>
          {selected && renderCheck ? (
            <span
              className={cn?.check}
              aria-hidden="true"
              {...{ [FINRA_UI_ATTR]: componentIds.tenorPickerCheck }}>
              {renderCheck()}
            </span>
          ) : null}
          {showFavourites && renderFavourite ? (
            // Decorative: the favourite state is carried by the option's own
            // accessible name, so announcing the star again would be noise.
            <span
              {...{ [FAVOURITE_ATTR]: "", [FINRA_UI_ATTR]: componentIds.tenorPickerFavourite }}
              aria-hidden="true"
              className={cx(cn?.favouriteToggle, option.favourite && cn?.favouriteActive)}>
              {renderFavourite(option.favourite)}
            </span>
          ) : null}
        </div>
      );
    };

    return (
      <div
        ref={containerRef}
        className={cx(cn?.root, isOpen && cn?.rootOpen)}
        {...{ [FINRA_UI_ATTR]: componentIds.tenorPicker }}
        {...dataAttributes}
        {...props}>
        <input
          {...{ [FINRA_UI_ATTR]: componentIds.tenorPickerInput }}
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
            className={cx(cn?.indicator, isOpen && cn?.indicatorOpen)}
            aria-hidden="true"
            {...{ [FINRA_UI_ATTR]: componentIds.tenorPickerIndicator }}>
            {renderIndicator(isOpen)}
          </span>
        ) : null}

        {isOpen ? (
          <div
            className={cn?.popup}
            {...{ [FINRA_UI_ATTR]: componentIds.tenorPickerPopup }}
            id={popupId}
            role="listbox"
            aria-label={ariaLabel}>
            {flat.length === 0 ? (
              <div
                className={cn?.empty}
                role="presentation"
                {...{ [FINRA_UI_ATTR]: componentIds.tenorPickerEmpty }}>
                {noOptionsMessage}
              </div>
            ) : grouped ? (
              groups.map((group) => (
                <div
                  key={group.id}
                  className={cn?.group}
                  role="group"
                  aria-label={group.label}
                  {...{ [FINRA_UI_ATTR]: componentIds.tenorPickerGroup }}>
                  <div
                    className={cn?.groupLabel}
                    aria-hidden="true"
                    {...{ [FINRA_UI_ATTR]: componentIds.tenorPickerGroupLabel }}>
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
