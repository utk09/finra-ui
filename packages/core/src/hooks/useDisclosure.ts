import { useCallback, useRef } from "react";

import {
  createDisclosureStore,
  type DisclosureState,
  type DisclosureStore,
} from "../logic/disclosure";
import { useStore } from "./useStore";

/**
 * Options for {@link useDisclosure}.
 *
 * @remarks
 * Controlled and uncontrolled are decided by `open` alone: pass it to own the
 * state, omit it to let the hook manage its own. `defaultOpen` applies only in
 * the uncontrolled case.
 */
export interface UseDisclosureOptions {
  /** Controlled open state. When undefined, disclosure manages its own state. */
  open?: boolean;
  /** Called when open state changes. */
  onOpenChange?: (open: boolean) => void;
  /** Default open state for uncontrolled mode. */
  defaultOpen?: boolean;
}

/** What {@link useDisclosure} hands back. */
export interface UseDisclosureReturn {
  /** Current open state - the controlled `open` when given, else the internal one. */
  isOpen: boolean;
  /**
   * Request a specific state.
   *
   * @remarks
   * Always fires `onOpenChange`, but only updates internal state when
   * uncontrolled - so a controlled consumer that ignores the callback keeps its
   * value, exactly as with a controlled input.
   */
  setOpen: (next: boolean) => void;
  /** Flip the current state. Shorthand for `setOpen(!isOpen)`. */
  toggle: () => void;
  /** Request close. Shorthand for `setOpen(false)`. */
  close: () => void;
}

const selectOpen = (state: DisclosureState) => state.open;

/**
 * Manages open/close state with controlled/uncontrolled support.
 *
 * The behaviour lives in the framework-agnostic disclosure machine
 * ({@link createDisclosureStore}); this hook is the React adapter and layers
 * the controlled-prop override on top of the uncontrolled store.
 */
export function useDisclosure(options: UseDisclosureOptions = {}): UseDisclosureReturn {
  const { open, onOpenChange, defaultOpen = false } = options;

  const storeRef = useRef<DisclosureStore | null>(null);
  storeRef.current ??= createDisclosureStore(defaultOpen);
  const store = storeRef.current;

  const isControlled = open !== undefined;
  const uncontrolledOpen = useStore(store, selectOpen);
  const isOpen = isControlled ? open : uncontrolledOpen;

  const setOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) store.send({ type: "set", open: next });
      onOpenChange?.(next);
    },
    [isControlled, store, onOpenChange],
  );

  const toggle = useCallback(() => {
    setOpen(!isOpen);
  }, [isOpen, setOpen]);

  const close = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  return { isOpen, setOpen, toggle, close };
}
