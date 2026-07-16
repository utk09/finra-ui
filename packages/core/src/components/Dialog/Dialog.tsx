import { clsx } from "clsx";
import { forwardRef, type HTMLAttributes } from "react";

import {
  Dialog as DialogRoot,
  DialogClose as DialogCloseBase,
  DialogContent as DialogContentBase,
  type DialogContentProps as DialogContentBaseProps,
  DialogDescription as DialogDescriptionBase,
  type DialogProps,
  DialogTitle as DialogTitleBase,
  DialogTrigger as DialogTriggerBase,
  type DialogTriggerProps,
} from "../../unstyled/Dialog/Dialog";
import { componentIds, FINRA_UI_ATTR } from "../componentIds";
import styles from "./Dialog.module.scss";

export type { DialogProps, DialogTriggerProps };
export type DialogContentProps = DialogContentBaseProps;

/** Dialog root - controlled/uncontrolled open state, dismiss options. */
export const Dialog = DialogRoot;

/**
 * Opens the dialog. Wrap your own control with `asChild`
 * (e.g. `<DialogTrigger asChild><Button>Open</Button></DialogTrigger>`).
 */
export const DialogTrigger = DialogTriggerBase;

/** Styled modal panel (portalled, focus-trapped, dismiss-on-escape/outside). */
export const DialogContent = forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, ...rest }, ref) => (
    <DialogContentBase
      ref={ref}
      {...{ [FINRA_UI_ATTR]: componentIds.dialog }}
      className={clsx(styles.panel, className)}
      {...rest}
    />
  ),
);

DialogContent.displayName = "DialogContent";

export const DialogTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...rest }, ref) => (
    <DialogTitleBase
      ref={ref}
      {...{ [FINRA_UI_ATTR]: componentIds.dialogTitle }}
      className={clsx(styles.title, className)}
      {...rest}
    />
  ),
);

DialogTitle.displayName = "DialogTitle";

export const DialogDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, ...rest }, ref) => (
  <DialogDescriptionBase
    ref={ref}
    {...{ [FINRA_UI_ATTR]: componentIds.dialogDescription }}
    className={clsx(styles.description, className)}
    {...rest}
  />
));

DialogDescription.displayName = "DialogDescription";

/**
 * Closes the dialog. Unstyled by design - style it yourself or wrap your own
 * control with `asChild` (e.g. footer `<DialogClose asChild><Button/></DialogClose>`).
 */
export const DialogClose = forwardRef<HTMLButtonElement, DialogTriggerProps>(
  ({ className, ...rest }, ref) => (
    <DialogCloseBase
      ref={ref}
      {...{ [FINRA_UI_ATTR]: componentIds.dialogClose }}
      className={className}
      {...rest}
    />
  ),
);

DialogClose.displayName = "DialogClose";
