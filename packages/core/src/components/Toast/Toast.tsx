import { clsx } from "clsx";
import type { ReactNode } from "react";

import { Toaster as ToasterBase, type ToasterProps } from "../../unstyled/Toast/Toast";
import styles from "./Toast.module.scss";

export type { ToasterProps, ToastPosition } from "../../unstyled/Toast/Toast";

/**
 * Styled toast region. Mount one near the app root; call `toast()` from
 * anywhere. Sentiment colours + corner positioning come from tokens.
 */
export function Toaster({ className, ...rest }: ToasterProps): ReactNode {
  return <ToasterBase className={clsx(styles.region, className)} {...rest} />;
}

Toaster.displayName = "Toaster";
