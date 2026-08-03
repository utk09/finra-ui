import { Fragment, forwardRef, type HTMLAttributes, type ReactNode } from "react";

import { componentIds, FINRA_UI_ATTR } from "../../componentIds";
import { useStore } from "../../hooks/useStore";
import { type ToastControls, type ToastData, toastController } from "../../logic/toast";
import { Portal } from "../Portal/Portal";

/**
 * Which corner (or edge centre) the toast region stacks in.
 *
 * @remarks
 * `top-*` positions stack downwards and `bottom-*` upwards, so the newest toast
 * is always the one nearest the edge and never displaces the one being read.
 */
export type ToastPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

//  Item

/**
 * Props for one rendered toast.
 *
 * @remarks
 * You rarely construct these - `Toaster` supplies them. They matter when you
 * pass your own `renderToast`, which receives exactly this shape.
 */
export interface ToastItemProps extends HTMLAttributes<HTMLDivElement> {
  /** The toast to render, with every default already resolved. */
  toast: ToastData;
  /** Dismiss/pause/resume for this toast. Wire `pause`/`resume` to hover and focus. */
  controls: ToastControls;
}

/** A live toast. Danger/warning are assertive (`role="alert"`); others polite. */
export const ToastItem = forwardRef<HTMLDivElement, ToastItemProps>(
  ({ toast, controls, ...rest }, ref) => {
    const assertive = toast.sentiment === "danger" || toast.sentiment === "warning";

    return (
      // The element does carry a role; Biome cannot resolve the conditional.
      // Pause-on-hover stops a toast expiring while it is being read.
      // biome-ignore lint/a11y/noStaticElementInteractions: role is set conditionally, see above
      <div
        ref={ref}
        {...{ [FINRA_UI_ATTR]: componentIds.toast }}
        data-sentiment={toast.sentiment}
        role={assertive ? "alert" : "status"}
        aria-live={assertive ? "assertive" : "polite"}
        onMouseEnter={controls.pause}
        onMouseLeave={controls.resume}
        {...rest}>
        {toast.title ? (
          <div {...{ [FINRA_UI_ATTR]: componentIds.toastTitle }}>{toast.title}</div>
        ) : null}
        {toast.description ? (
          <div {...{ [FINRA_UI_ATTR]: componentIds.toastDescription }}>{toast.description}</div>
        ) : null}
        {toast.action ? (
          <button
            type="button"
            {...{ [FINRA_UI_ATTR]: componentIds.toastAction }}
            onClick={() => {
              toast.action?.onClick();
              controls.dismiss();
            }}>
            {toast.action.label}
          </button>
        ) : null}
        <button
          type="button"
          {...{ [FINRA_UI_ATTR]: componentIds.toastClose }}
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

/**
 * Props for the toast region - the single mount point that renders the shared
 * queue.
 *
 * @remarks
 * Mount exactly one `Toaster` near the root of the app. It subscribes to the
 * shared {@link toastController}, so anything calling `toast()` anywhere reaches
 * it without prop-drilling. Two mounted at once means every toast renders twice.
 *
 * @example
 * ```tsx
 * <Toaster position="top-right" />
 * // …anywhere else, with no import of the Toaster itself:
 * toast.success("Order filled");
 * ```
 */
export interface ToasterProps {
  /**
   * Where the toast region is portalled. Defaults to `document.body`.
   *
   * @remarks
   * Unlike the popup components, this places the whole region rather than one
   * overlay. Pass a node you own to keep toasts inside a themed subtree.
   */
  container?: Element | null;
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
  container,
}: ToasterProps): ReactNode {
  const toasts = useStore(toastController.store, (state) => state.toasts);

  return (
    <Portal container={container}>
      <div
        {...{ [FINRA_UI_ATTR]: componentIds.toastRegion }}
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
          // A Fragment, not a wrapper element: what `renderToast` returns is the
          // toast, and it has to be a direct child of the region for the
          // region's `gap` and alignment to reach it.
          return renderToast ? (
            <Fragment key={toast.id}>{renderToast(toast, controls)}</Fragment>
          ) : (
            <ToastItem key={toast.id} toast={toast} controls={controls} />
          );
        })}
      </div>
    </Portal>
  );
}

Toaster.displayName = "Toaster";
