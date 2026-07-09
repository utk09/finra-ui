import { useCallback, useRef } from "react";

import {
  createDisclosureStore,
  type DisclosureState,
  type DisclosureStore,
} from "../logic/disclosure";
import { useStore } from "./useStore";

export interface UseDisclosureOptions {
  /** Controlled open state. When undefined, disclosure manages its own state. */
  open?: boolean;
  /** Called when open state changes. */
  onOpenChange?: (open: boolean) => void;
  /** Default open state for uncontrolled mode. */
  defaultOpen?: boolean;
}

export interface UseDisclosureReturn {
  isOpen: boolean;
  setOpen: (next: boolean) => void;
  toggle: () => void;
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
