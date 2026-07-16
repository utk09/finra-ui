import {
  type ButtonHTMLAttributes,
  createContext,
  type ElementType,
  forwardRef,
  type HTMLAttributes,
  type MouseEvent,
  type ReactNode,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
} from "react";

import { useDisclosure } from "../../hooks/useDisclosure";
import { lockBodyScroll } from "../../logic/scrollLock";
import { DismissableLayer } from "../DismissableLayer/DismissableLayer";
import { FocusScope } from "../FocusScope/FocusScope";
import { Portal } from "../Portal/Portal";
import { Slot } from "../Slot";

interface DialogContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  contentId: string;
  titleId: string;
  descriptionId: string;
  triggerId: string;
  titlePresent: boolean;
  descriptionPresent: boolean;
  setTitlePresent: (present: boolean) => void;
  setDescriptionPresent: (present: boolean) => void;
  dismissOnEscape: boolean;
  dismissOnOutside: boolean;
}

const DialogContext = createContext<DialogContextValue | null>(null);

function useDialogContext(part: string): DialogContextValue {
  const ctx = useContext(DialogContext);
  if (!ctx) {
    throw new Error(`Dialog.${part} must be used within a <Dialog>.`);
  }
  return ctx;
}

//  Root

export interface DialogProps {
  children?: ReactNode;
  /** Controlled open state. */
  open?: boolean;
  /** Initial open state (uncontrolled). */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Dismiss on Escape. Default true. */
  dismissOnEscape?: boolean;
  /** Dismiss on an outside pointer / backdrop. Default true. */
  dismissOnOutside?: boolean;
}

export function Dialog({
  children,
  open,
  defaultOpen,
  onOpenChange,
  dismissOnEscape = true,
  dismissOnOutside = true,
}: DialogProps): ReactNode {
  const { isOpen, setOpen } = useDisclosure({ open, defaultOpen, onOpenChange });
  const baseId = useId();
  const [titlePresent, setTitlePresent] = useState(false);
  const [descriptionPresent, setDescriptionPresent] = useState(false);

  const value = useMemo<DialogContextValue>(
    () => ({
      open: isOpen,
      setOpen,
      contentId: `${baseId}-content`,
      titleId: `${baseId}-title`,
      descriptionId: `${baseId}-description`,
      triggerId: `${baseId}-trigger`,
      titlePresent,
      descriptionPresent,
      setTitlePresent,
      setDescriptionPresent,
      dismissOnEscape,
      dismissOnOutside,
    }),
    [isOpen, setOpen, baseId, titlePresent, descriptionPresent, dismissOnEscape, dismissOnOutside],
  );

  return <DialogContext.Provider value={value}>{children}</DialogContext.Provider>;
}

Dialog.displayName = "Dialog";

//  Trigger

export interface DialogTriggerProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Render onto the single child element instead of a <button>. */
  asChild?: boolean;
}

export const DialogTrigger = forwardRef<HTMLButtonElement, DialogTriggerProps>(
  ({ asChild = false, onClick, ...rest }, ref) => {
    const ctx = useDialogContext("Trigger");
    const Comp: ElementType = asChild ? Slot : "button";

    return (
      <Comp
        ref={ref}
        {...(asChild ? {} : { type: "button" as const })}
        id={ctx.triggerId}
        aria-haspopup="dialog"
        aria-expanded={ctx.open}
        aria-controls={ctx.open ? ctx.contentId : undefined}
        onClick={(event: MouseEvent<HTMLButtonElement>) => {
          onClick?.(event);
          if (!event.defaultPrevented) ctx.setOpen(true);
        }}
        {...rest}
      />
    );
  },
);

DialogTrigger.displayName = "DialogTrigger";

//  Content

export interface DialogContentProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

export const DialogContent = forwardRef<HTMLDivElement, DialogContentProps>(
  ({ children, ...rest }, ref) => {
    const ctx = useDialogContext("Content");

    useEffect(() => {
      if (!ctx.open) return;
      return lockBodyScroll();
    }, [ctx.open]);

    if (!ctx.open) return null;

    return (
      <Portal>
        <div data-finra-ui="dialog-overlay" />
        <FocusScope trapped>
          <DismissableLayer
            onDismiss={() => ctx.setOpen(false)}
            disableEscape={!ctx.dismissOnEscape}
            disableOutsidePointer={!ctx.dismissOnOutside}>
            <div
              ref={ref}
              role="dialog"
              aria-modal="true"
              id={ctx.contentId}
              aria-labelledby={ctx.titlePresent ? ctx.titleId : undefined}
              aria-describedby={ctx.descriptionPresent ? ctx.descriptionId : undefined}
              {...rest}>
              {children}
            </div>
          </DismissableLayer>
        </FocusScope>
      </Portal>
    );
  },
);

DialogContent.displayName = "DialogContent";

//  Title / Description (register presence for the dialog's a11y names)

export const DialogTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ children, ...rest }, ref) => {
    const ctx = useDialogContext("Title");
    const { setTitlePresent } = ctx;

    useEffect(() => {
      setTitlePresent(true);
      return () => setTitlePresent(false);
    }, [setTitlePresent]);

    return (
      <h2 ref={ref} id={ctx.titleId} {...rest}>
        {children}
      </h2>
    );
  },
);

DialogTitle.displayName = "DialogTitle";

export const DialogDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ children, ...rest }, ref) => {
  const ctx = useDialogContext("Description");
  const { setDescriptionPresent } = ctx;

  useEffect(() => {
    setDescriptionPresent(true);
    return () => setDescriptionPresent(false);
  }, [setDescriptionPresent]);

  return (
    <p ref={ref} id={ctx.descriptionId} {...rest}>
      {children}
    </p>
  );
});

DialogDescription.displayName = "DialogDescription";

//  Close

export const DialogClose = forwardRef<HTMLButtonElement, DialogTriggerProps>(
  ({ asChild = false, onClick, ...rest }, ref) => {
    const ctx = useDialogContext("Close");
    const Comp: ElementType = asChild ? Slot : "button";

    return (
      <Comp
        ref={ref}
        {...(asChild ? {} : { type: "button" as const })}
        onClick={(event: MouseEvent<HTMLButtonElement>) => {
          onClick?.(event);
          if (!event.defaultPrevented) ctx.setOpen(false);
        }}
        {...rest}
      />
    );
  },
);

DialogClose.displayName = "DialogClose";
