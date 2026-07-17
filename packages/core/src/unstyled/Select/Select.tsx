import {
  type ButtonHTMLAttributes,
  createContext,
  type CSSProperties,
  type ElementType,
  forwardRef,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import { useAnchoredPosition } from "../../hooks/useAnchoredPosition";
import { useDisclosure } from "../../hooks/useDisclosure";
import type { Placement } from "../../logic/position";
import {
  findSelectedIndex,
  firstEnabledIndex,
  resolveSelectKey,
  type SelectOptionData,
  typeaheadIndex,
} from "../../logic/select";
import { mergeRefs } from "../../utils/mergeRefs";
import { DismissableLayer } from "../DismissableLayer/DismissableLayer";
import { Portal } from "../Portal/Portal";
import { Slot } from "../Slot";

export type { SelectOptionData };

/** Milliseconds of idle before the typeahead query resets. */
const TYPEAHEAD_RESET_MS = 500;

interface SelectContextValue {
  open: boolean;
  options: readonly SelectOptionData[];
  value: string | undefined;
  selectedIndex: number;
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  selectByIndex: (index: number) => void;
  toggle: () => void;
  openWith: (activeIndex: number) => void;
  close: () => void;
  handleKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
  placeholder?: string;
  triggerId: string;
  listboxId: string;
  optionId: (index: number) => string;
  referenceEl: Element | null;
  setReferenceEl: (element: Element | null) => void;
  placement: Placement;
  offset: number;
  dismissOnEscape: boolean;
  dismissOnOutside: boolean;
}

const SelectContext = createContext<SelectContextValue | null>(null);

function useSelectContext(part: string): SelectContextValue {
  const ctx = useContext(SelectContext);
  if (!ctx) {
    throw new Error(`Select.${part} must be used within a <Select>.`);
  }
  return ctx;
}

//  Root

export interface SelectProps {
  children?: ReactNode;
  /** Options rendered in the listbox and used for keyboard nav / labels. */
  options: readonly SelectOptionData[];
  /** Controlled selected value. */
  value?: string;
  /** Initial selected value (uncontrolled). */
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Controlled open state. */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Text shown on the trigger when nothing is selected. */
  placeholder?: string;
  /** Preferred placement of the listbox. Default "bottom". */
  placement?: Placement;
  /** Gap between the trigger and the listbox, in px. Default 6. */
  offset?: number;
  /** Wrap keyboard navigation past the ends. Default true. */
  loop?: boolean;
  /** Dismiss on Escape. Default true. */
  dismissOnEscape?: boolean;
  /** Dismiss on an outside pointer. Default true. */
  dismissOnOutside?: boolean;
}

export function Select({
  children,
  options,
  value: valueProp,
  defaultValue,
  onValueChange,
  open,
  defaultOpen,
  onOpenChange,
  placeholder,
  placement = "bottom",
  offset = 6,
  loop = true,
  dismissOnEscape = true,
  dismissOnOutside = true,
}: SelectProps): ReactNode {
  const { isOpen, setOpen: setOpenRaw } = useDisclosure({ open, defaultOpen, onOpenChange });

  // Controlled/uncontrolled value. `undefined` means "no selection", which the
  // shared useControlledValue hook can't represent, so it's inlined here.
  const [internalValue, setInternalValue] = useState<string | undefined>(defaultValue);
  const isValueControlled = valueProp !== undefined;
  const value = isValueControlled ? valueProp : internalValue;

  const selectValue = useCallback(
    (next: string) => {
      if (!isValueControlled) setInternalValue(next);
      onValueChange?.(next);
    },
    [isValueControlled, onValueChange],
  );

  const [activeIndex, setActiveIndex] = useState(-1);
  const baseId = useId();
  const selectedIndex = useMemo(() => findSelectedIndex(options, value), [options, value]);

  const [referenceEl, setReferenceEl] = useState<Element | null>(null);

  const defaultActiveIndex = useCallback(() => {
    if (selectedIndex >= 0 && !options[selectedIndex]?.disabled) return selectedIndex;
    return firstEnabledIndex(options);
  }, [selectedIndex, options]);

  const openWith = useCallback(
    (index: number) => {
      setOpenRaw(true);
      setActiveIndex(index);
    },
    [setOpenRaw],
  );

  const close = useCallback(() => setOpenRaw(false), [setOpenRaw]);

  const toggle = useCallback(() => {
    if (isOpen) close();
    else openWith(defaultActiveIndex());
  }, [isOpen, close, openWith, defaultActiveIndex]);

  const selectByIndex = useCallback(
    (index: number) => {
      const option = options[index];
      if (option && !option.disabled) {
        selectValue(option.value);
        close();
      }
    },
    [options, selectValue, close],
  );

  // Typeahead: accumulate printable keys, jump to the first matching option.
  const queryRef = useRef("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timerRef.current), []);

  const handleTypeahead = useCallback(
    (char: string) => {
      clearTimeout(timerRef.current);
      queryRef.current += char;
      timerRef.current = setTimeout(() => {
        queryRef.current = "";
      }, TYPEAHEAD_RESET_MS);

      const from = isOpen ? activeIndex : selectedIndex;
      const index = typeaheadIndex(options, queryRef.current, from);
      if (index >= 0) {
        if (isOpen) setActiveIndex(index);
        else openWith(index);
      }
    },
    [isOpen, activeIndex, selectedIndex, options, openWith],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      const { preventDefault, effects } = resolveSelectKey(event.key, {
        open: isOpen,
        activeIndex,
        selectedIndex,
        options,
        loop,
      });
      if (preventDefault) event.preventDefault();

      for (const effect of effects) {
        if (effect.type === "open") openWith(effect.activeIndex);
        else if (effect.type === "close") close();
        else if (effect.type === "setActive") setActiveIndex(effect.index);
        else selectByIndex(effect.index);
      }

      const isPrintable =
        effects.length === 0 &&
        event.key.length === 1 &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey;
      if (isPrintable) handleTypeahead(event.key);
    },
    [
      isOpen,
      activeIndex,
      selectedIndex,
      options,
      loop,
      openWith,
      close,
      selectByIndex,
      handleTypeahead,
    ],
  );

  const contextValue = useMemo<SelectContextValue>(
    () => ({
      open: isOpen,
      options,
      value,
      selectedIndex,
      activeIndex,
      setActiveIndex,
      selectByIndex,
      toggle,
      openWith,
      close,
      handleKeyDown,
      placeholder,
      triggerId: `${baseId}-trigger`,
      listboxId: `${baseId}-listbox`,
      optionId: (index: number) => `${baseId}-option-${index}`,
      referenceEl,
      setReferenceEl,
      placement,
      offset,
      dismissOnEscape,
      dismissOnOutside,
    }),
    [
      isOpen,
      options,
      value,
      selectedIndex,
      activeIndex,
      selectByIndex,
      toggle,
      openWith,
      close,
      handleKeyDown,
      placeholder,
      baseId,
      referenceEl,
      placement,
      offset,
      dismissOnEscape,
      dismissOnOutside,
    ],
  );

  return <SelectContext.Provider value={contextValue}>{children}</SelectContext.Provider>;
}

Select.displayName = "Select";

//  Trigger

export interface SelectTriggerProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Render onto the single child element instead of a <button>. */
  asChild?: boolean;
}

export const SelectTrigger = forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ asChild = false, children, onClick, onKeyDown, ...rest }, ref) => {
    const ctx = useSelectContext("Trigger");
    const Comp: ElementType = asChild ? Slot : "button";

    const activeId = ctx.open && ctx.activeIndex >= 0 ? ctx.optionId(ctx.activeIndex) : undefined;
    const selectedLabel = ctx.selectedIndex >= 0 ? ctx.options[ctx.selectedIndex].label : undefined;

    return (
      <Comp
        ref={mergeRefs(ref, ctx.setReferenceEl)}
        {...(asChild ? {} : { type: "button" as const })}
        role="combobox"
        id={ctx.triggerId}
        aria-haspopup="listbox"
        aria-expanded={ctx.open}
        aria-controls={ctx.open ? ctx.listboxId : undefined}
        aria-activedescendant={activeId}
        onClick={(event: MouseEvent<HTMLButtonElement>) => {
          onClick?.(event);
          if (!event.defaultPrevented) ctx.toggle();
        }}
        onKeyDown={(event: KeyboardEvent<HTMLButtonElement>) => {
          onKeyDown?.(event);
          if (!event.defaultPrevented) ctx.handleKeyDown(event);
        }}
        {...rest}>
        {children ?? selectedLabel ?? ctx.placeholder}
      </Comp>
    );
  },
);

SelectTrigger.displayName = "SelectTrigger";

//  Value (selected label / placeholder)

export interface SelectValueProps extends HTMLAttributes<HTMLSpanElement> {
  /** Fallback text when nothing is selected (defaults to the Select's placeholder). */
  placeholder?: string;
}

export const SelectValue = forwardRef<HTMLSpanElement, SelectValueProps>(
  ({ placeholder, ...rest }, ref) => {
    const ctx = useSelectContext("Value");
    const label = ctx.selectedIndex >= 0 ? ctx.options[ctx.selectedIndex].label : undefined;
    return (
      <span ref={ref} {...rest}>
        {label ?? placeholder ?? ctx.placeholder}
      </span>
    );
  },
);

SelectValue.displayName = "SelectValue";

//  Content (listbox)

export interface SelectContentProps extends HTMLAttributes<HTMLDivElement> {
  /** Render an option's inner content. Defaults to its label. */
  renderOption?: (option: SelectOptionData, index: number) => ReactNode;
}

export const SelectContent = forwardRef<HTMLDivElement, SelectContentProps>(
  ({ renderOption, style, ...rest }, ref) => {
    const ctx = useSelectContext("Content");
    const { setFloating, x, y } = useAnchoredPosition(ctx.referenceEl, {
      placement: ctx.placement,
      offset: ctx.offset,
    });

    if (!ctx.open) return null;

    const positionStyle: CSSProperties = { position: "absolute", top: y, left: x, ...style };

    return (
      <Portal>
        <DismissableLayer
          ref={mergeRefs(ref, setFloating)}
          role="listbox"
          id={ctx.listboxId}
          style={positionStyle}
          onDismiss={() => ctx.close()}
          disableEscape={!ctx.dismissOnEscape}
          disableOutsidePointer={!ctx.dismissOnOutside}
          excludeElements={[ctx.referenceEl]}
          {...rest}>
          {ctx.options.map((option, index) => {
            const selected = index === ctx.selectedIndex;
            const active = index === ctx.activeIndex;
            return (
              <div
                key={`${index}-${option.value}`}
                id={ctx.optionId(index)}
                role="option"
                tabIndex={-1}
                aria-selected={selected}
                aria-disabled={option.disabled || undefined}
                data-finra-ui="select-option"
                data-active={active || undefined}
                data-selected={selected || undefined}
                data-disabled={option.disabled || undefined}
                onMouseDown={(event) => {
                  event.preventDefault(); // keep focus on the trigger
                  if (!option.disabled) ctx.selectByIndex(index);
                }}
                onMouseEnter={() => {
                  if (!option.disabled) ctx.setActiveIndex(index);
                }}>
                {renderOption ? renderOption(option, index) : option.label}
              </div>
            );
          })}
        </DismissableLayer>
      </Portal>
    );
  },
);

SelectContent.displayName = "SelectContent";
