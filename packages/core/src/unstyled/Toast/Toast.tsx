import { forwardRef, type HTMLAttributes, type ReactNode } from "react";

import { useStore } from "../../hooks/useStore";
import { toastController, type ToastData } from "../../logic/toast";
import { Portal } from "../Portal/Portal";

export type ToastPosition =
  "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";

/** Per-toast controls handed to a custom `renderToast`. */
export interface ToastControls {
  dismiss: () => void;
  pause: () => void;
  resume: () => void;
}

//  Item

export interface ToastItemProps extends HTMLAttributes<HTMLDivElement> {
  toast: ToastData;
  controls: ToastControls;
}

/** A live toast. Danger/warning are assertive (`role="alert"`); others polite. */
export const ToastItem = forwardRef<HTMLDivElement, ToastItemProps>(
  ({ toast, controls, ...rest }, ref) => {
    const assertive = toast.sentiment === "danger" || toast.sentiment === "warning";

    return (
      <div
        ref={ref}
        data-finra-ui="toast"
        data-sentiment={toast.sentiment}
        role={assertive ? "alert" : "status"}
        aria-live={assertive ? "assertive" : "polite"}
        onMouseEnter={controls.pause}
        onMouseLeave={controls.resume}
        {...rest}>
        {toast.title ? <div data-finra-ui="toast-title">{toast.title}</div> : null}
        {toast.description ? (
          <div data-finra-ui="toast-description">{toast.description}</div>
        ) : null}
        {toast.action ? (
          <button
            type="button"
            data-finra-ui="toast-action"
            onClick={() => {
              toast.action?.onClick();
              controls.dismiss();
            }}>
            {toast.action.label}
          </button>
        ) : null}
        <button
          type="button"
          data-finra-ui="toast-close"
          aria-label="Dismiss notification"
          onClick={controls.dismiss}>
          {"×"}
        </button>
      </div>
    );
  },
);

ToastItem.displayName = "ToastItem";

//  Region

export interface ToasterProps {
  /** Corner to stack toasts in. Default "bottom-right". */
  position?: ToastPosition;
  /** Accessible name for the toast region. Default "Notifications". */
  label?: string;
  /** Class on the region container. */
  className?: string;
  /** Render a toast yourself; defaults to the built-in {@link ToastItem}. */
  renderToast?: (toast: ToastData, controls: ToastControls) => ReactNode;
}

/**
 * Renders the shared toast queue into an `aria-live` region, portalled to the
 * body. Mount one `<Toaster>` near the app root; call `toast()` from anywhere.
 */
export function Toaster({
  position = "bottom-right",
  label = "Notifications",
  className,
  renderToast,
}: ToasterProps): ReactNode {
  const toasts = useStore(toastController.store, (state) => state.toasts);

  return (
    <Portal>
      <div
        data-finra-ui="toast-region"
        data-position={position}
        role="region"
        aria-label={label}
        className={className}>
        {toasts.map((toast) => {
          const controls: ToastControls = {
            dismiss: () => toastController.toast.dismiss(toast.id),
            pause: () => toastController.pause(toast.id),
            resume: () => toastController.resume(toast.id, toast.duration),
          };
          return renderToast ? (
            <div key={toast.id}>{renderToast(toast, controls)}</div>
          ) : (
            <ToastItem key={toast.id} toast={toast} controls={controls} />
          );
        })}
      </div>
    </Portal>
  );
}

Toaster.displayName = "Toaster";
