import { CloseSmallIcon } from "@utk09/finra-ui-icons/react";
import { clsx } from "clsx";
import type { ReactNode } from "react";

import { Toaster as ToasterBase, type ToasterProps } from "../../unstyled/Toast/Toast";
import styles from "./Toast.module.scss";

export type { ToasterProps, ToastPosition } from "../../unstyled/Toast/Toast";

function styledRenderCloseIcon(): ReactNode {
  return <CloseSmallIcon />;
}

/**
 * Styled toast region. Mount one near the app root; call `toast()` from
 * anywhere. Sentiment colours + corner positioning come from tokens.
 */
export function Toaster({ className, renderCloseIcon, ...rest }: ToasterProps): ReactNode {
  return (
    <ToasterBase
      className={clsx(styles.region, className)}
      renderCloseIcon={renderCloseIcon ?? styledRenderCloseIcon}
      {...rest}
    />
  );
}

Toaster.displayName = "Toaster";
