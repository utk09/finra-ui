import {
  CloseSmallIcon,
  ErrorIcon,
  InfoIcon,
  SuccessCircleIcon,
  WarningIcon,
} from "@utk09/finra-ui-icons/react";
import { clsx } from "clsx";
import { forwardRef, type ReactNode } from "react";

import type { Sentiment } from "../../types/variants";
import { BannerBase, type BannerBaseProps } from "../../unstyled/Banner/Banner";
import styles from "./Banner.module.scss";

/**
 * Colour meaning for a banner.
 *
 * @remarks
 * Also decides how loudly the banner announces: danger and warning interrupt a
 * screen reader, success and info wait their turn, and a banner with no
 * sentiment says nothing on mount.
 */
export type BannerSentiment = Sentiment;

const sentimentClasses: Record<BannerSentiment, string> = {
  danger: styles.sentimentDanger,
  success: styles.sentimentSuccess,
  warning: styles.sentimentWarning,
  info: styles.sentimentInfo,
};

const sentimentIcons: Record<BannerSentiment, ReactNode> = {
  danger: <ErrorIcon />,
  success: <SuccessCircleIcon />,
  warning: <WarningIcon />,
  info: <InfoIcon />,
};

function styledRenderCloseIcon(): ReactNode {
  return <CloseSmallIcon />;
}

/**
 * Props for the styled banner.
 *
 * @remarks
 * Takes an icon node where the base takes a render prop, so the common case is
 * a single element rather than a callback.
 *
 * @example
 * ```tsx
 * <Banner sentiment="warning" title="Market closed" dismissible onDismiss={hide}>
 *   Orders entered now queue until 09:30.
 * </Banner>
 * ```
 */
export interface BannerProps extends Omit<BannerBaseProps, "renderIcon" | "classNames"> {
  /** Colour meaning. Omit for a neutral banner with no status colour. */
  sentiment?: BannerSentiment;
  /**
   * Replace the default sentiment icon. Pass `null` to render none.
   *
   * @remarks
   * A banner with no sentiment has no default icon, because there is no status
   * for a glyph to reinforce.
   */
  icon?: ReactNode | null;
}

/**
 * An inline status message that occupies layout space.
 *
 * @see {@link BannerProps}
 */
export const Banner = forwardRef<HTMLDivElement, BannerProps>(
  ({ className, sentiment, icon, renderCloseIcon, ...rest }, ref) => {
    // Omitting `icon` takes the sentiment's glyph; passing `null` takes none.
    const resolved = icon === undefined && sentiment ? sentimentIcons[sentiment] : (icon ?? null);

    return (
      <BannerBase
        ref={ref}
        sentiment={sentiment}
        className={clsx(styles.banner, sentiment && sentimentClasses[sentiment], className)}
        classNames={{
          icon: styles.icon,
          content: styles.content,
          title: styles.title,
          description: styles.description,
          action: styles.action,
          close: styles.close,
        }}
        renderIcon={resolved === null ? undefined : () => resolved}
        renderCloseIcon={renderCloseIcon ?? styledRenderCloseIcon}
        {...rest}
      />
    );
  },
);

Banner.displayName = "Banner";
