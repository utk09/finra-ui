import { useCallback } from "react";

import { useControlledValue } from "./useControlledValue";

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

/**
 * Manages open/close state with controlled/uncontrolled support.
 */
export function useDisclosure(options: UseDisclosureOptions = {}): UseDisclosureReturn {
  const { open, onOpenChange, defaultOpen = false } = options;

  const [isOpen, setOpen] = useControlledValue(open, defaultOpen, onOpenChange);

  const toggle = useCallback(() => {
    setOpen(!isOpen);
  }, [isOpen, setOpen]);

  const close = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  return { isOpen, setOpen, toggle, close };
}
