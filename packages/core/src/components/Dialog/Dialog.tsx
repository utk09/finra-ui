import { clsx } from "clsx";
import { forwardRef, type HTMLAttributes, type ReactNode } from "react";

import { componentIds, FINRA_UI_ATTR } from "../../componentIds";
import {
  DialogClose as DialogCloseBase,
  DialogContent as DialogContentBase,
  type DialogContentProps as DialogContentBaseProps,
  DialogDescription as DialogDescriptionBase,
  type DialogProps,
  Dialog as DialogRoot,
  DialogTitle as DialogTitleBase,
  DialogTrigger as DialogTriggerBase,
  type DialogTriggerProps,
} from "../../unstyled/Dialog/Dialog";
import styles from "./Dialog.module.scss";

export type { DialogProps, DialogTriggerProps };
/**
 * Props for the styled modal panel.
 *
 * @remarks
 * Identical to the unstyled base's - the styled layer adds only the backdrop
 * and panel CSS, no new API.
 */
export type DialogContentProps = DialogContentBaseProps;

/**
 * Props for the dialog's heading.
 *
 * @remarks
 * Declared rather than inlined as `HTMLAttributes<HTMLHeadingElement>` so the
 * generated documentation has a named type to describe. Everything not listed
 * is forwarded to the `<h2>`.
 */
export interface DialogTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  /** Heading text. Keep it short enough to read as a title. */
  children?: ReactNode;
}

/**
 * Props for the supporting text under the title.
 *
 * @remarks
 * Everything not listed is forwarded to the `<p>`.
 */
export interface DialogDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  /** One or two sentences explaining what confirming will do. */
  children?: ReactNode;
}

/** Dialog root - controlled/uncontrolled open state, dismiss options. */
export const Dialog = DialogRoot;

/**
 * Opens the dialog. Wrap your own control with `asChild`
 * (e.g. `<DialogTrigger asChild><Button>Open</Button></DialogTrigger>`).
 */
export const DialogTrigger = DialogTriggerBase;

/** Styled modal panel (portalled, focus-trapped, dismiss-on-escape/outside). */
export const DialogContent = forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, overlayClassName, ...rest }, ref) => (
    <DialogContentBase
      ref={ref}
      {...{ [FINRA_UI_ATTR]: componentIds.dialog }}
      className={clsx(styles.panel, className)}
      overlayClassName={clsx(styles.overlay, overlayClassName)}
      {...rest}
    />
  ),
);

DialogContent.displayName = "DialogContent";

/**
 * The dialog's heading. Supplies its accessible name via `aria-labelledby`, so
 * every `DialogContent` should contain one.
 */
export const DialogTitle = forwardRef<HTMLHeadingElement, DialogTitleProps>(
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

/**
 * Supporting text under the dialog title, linked via `aria-describedby`.
 */
export const DialogDescription = forwardRef<HTMLParagraphElement, DialogDescriptionProps>(
  ({ className, ...rest }, ref) => (
    <DialogDescriptionBase
      ref={ref}
      {...{ [FINRA_UI_ATTR]: componentIds.dialogDescription }}
      className={clsx(styles.description, className)}
      {...rest}
    />
  ),
);

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
