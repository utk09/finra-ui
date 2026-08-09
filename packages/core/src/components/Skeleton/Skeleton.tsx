import { clsx } from "clsx";
import { forwardRef } from "react";

import { SkeletonBase, type SkeletonBaseProps } from "../../unstyled/Skeleton/Skeleton";
import styles from "./Skeleton.module.scss";

/**
 * Props for the styled loading placeholder.
 *
 * @remarks
 * Identical to the unstyled base's, minus the class injection point the styled
 * layer fills in. It takes no dimensions: a `text` placeholder sizes itself
 * from the surrounding line-height, and `circular` and `rectangular` size from
 * a rule against `[data-finra-ui="skeleton"]`.
 *
 * @example
 * ```tsx
 * <Skeleton lines={3} />
 * ```
 */
export type SkeletonProps = Omit<SkeletonBaseProps, "classNames">;

/**
 * A loading placeholder, hidden from assistive tech.
 *
 * @see {@link SkeletonProps}
 */
export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(({ className, ...rest }, ref) => (
  <SkeletonBase
    ref={ref}
    className={clsx(styles.skeleton, className)}
    classNames={{ line: styles.line }}
    {...rest}
  />
));

Skeleton.displayName = "Skeleton";
