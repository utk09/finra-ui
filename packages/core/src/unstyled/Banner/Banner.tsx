import { forwardRef, type HTMLAttributes, type ReactNode } from "react";

import { componentIds, FINRA_UI_ATTR } from "../../componentIds";
import { liveRegionAttributes } from "../../logic/liveRegion";
import type { Sentiment } from "../../types/variants";

/** CSS class overrides injected by the styled layer. */
export interface BannerClassNames {
  /** The leading icon slot. Rendered only when `renderIcon` returns something. */
  icon?: string;
  /** Wrapper around the title and the body. */
  content?: string;
  /** The bold first line. */
  title?: string;
  /** The body text. */
  description?: string;
  /** The trailing action slot. */
  action?: string;
  /** The dismiss button. */
  close?: string;
}

/**
 * Props for the unstyled banner - an inline status message that occupies
 * layout space.
 *
 * @remarks
 * The counterpart to Toast. A toast is transient and portalled out of the
 * document flow; a banner is part of the page, so mounting one moves the
 * content below it down and dismissing it moves that content back.
 *
 * Whether the banner announces itself is decided by `sentiment`. With one it is
 * a live region, assertive for danger and warning and polite otherwise. Without
 * one it has no role at all, because a decorative banner interrupting a screen
 * reader on mount is noise.
 *
 * @example
 * ```tsx
 * <BannerBase sentiment="warning" title="Market closed">
 *   Orders entered now queue until 09:30.
 * </BannerBase>
 * ```
 */
export interface BannerBaseProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Colour meaning, and how loudly the banner announces.
   *
   * @remarks
   * Never the sole carrier of the meaning: the title or the body has to say it
   * too, since colour alone fails for colour-blind users and in high-contrast
   * modes.
   */
  sentiment?: Sentiment;
  /** Bold first line. */
  title?: string;
  /**
   * Show a dismiss button.
   *
   * @defaultValue `false`
   */
  dismissible?: boolean;
  /**
   * Fired when the dismiss button is activated.
   *
   * @remarks
   * Removing the banner is the caller's job. The banner does not unmount
   * itself, because what replaces the space it occupied is a layout decision.
   */
  onDismiss?: () => void;
  /**
   * Accessible name for the dismiss button.
   *
   * @defaultValue `"Dismiss"`
   */
  dismissLabel?: string;
  /** Trailing action, typically a Button. */
  action?: ReactNode;
  /**
   * Leading icon. The unstyled layer ships none, so nothing is rendered until
   * this returns a node; the styled layer injects a sentiment icon.
   */
  renderIcon?: (sentiment: Sentiment | undefined) => ReactNode;
  /**
   * Render the dismiss button's icon. Defaults to a `×` character.
   *
   * @remarks
   * The unstyled layer ships no icons, so the default is a text glyph rather
   * than an SVG. The button carries its own accessible name, so whatever this
   * returns is decorative.
   */
  renderCloseIcon?: () => ReactNode;
  /** CSS class overrides injected by the styled layer. */
  classNames?: BannerClassNames;
}

/**
 * Unstyled inline status message. Occupies layout space, unlike Toast.
 *
 * @see {@link BannerBaseProps}
 */
export const BannerBase = forwardRef<HTMLDivElement, BannerBaseProps>(
  (
    {
      sentiment,
      title,
      dismissible = false,
      onDismiss,
      dismissLabel = "Dismiss",
      action,
      renderIcon,
      renderCloseIcon,
      classNames: cn,
      children,
      ...props
    },
    ref,
  ) => {
    // A banner with no sentiment is part of the page rather than news about it,
    // so it gets no live-region role at all.
    const announced = sentiment ? liveRegionAttributes(sentiment) : undefined;
    const icon = renderIcon?.(sentiment);

    return (
      <div
        ref={ref}
        {...{ [FINRA_UI_ATTR]: componentIds.banner }}
        data-sentiment={sentiment}
        {...announced}
        {...props}>
        {icon === undefined || icon === null ? null : (
          <span
            {...{ [FINRA_UI_ATTR]: componentIds.bannerIcon }}
            className={cn?.icon}
            aria-hidden="true">
            {icon}
          </span>
        )}
        <div {...{ [FINRA_UI_ATTR]: componentIds.bannerContent }} className={cn?.content}>
          {title ? (
            <div {...{ [FINRA_UI_ATTR]: componentIds.bannerTitle }} className={cn?.title}>
              {title}
            </div>
          ) : null}
          {children === undefined || children === null ? null : (
            <div
              {...{ [FINRA_UI_ATTR]: componentIds.bannerDescription }}
              className={cn?.description}>
              {children}
            </div>
          )}
        </div>
        {action ? (
          <div {...{ [FINRA_UI_ATTR]: componentIds.bannerAction }} className={cn?.action}>
            {action}
          </div>
        ) : null}
        {dismissible ? (
          <button
            type="button"
            {...{ [FINRA_UI_ATTR]: componentIds.bannerClose }}
            className={cn?.close}
            aria-label={dismissLabel}
            onClick={onDismiss}>
            {renderCloseIcon ? renderCloseIcon() : "×"}
          </button>
        ) : null}
      </div>
    );
  },
);

BannerBase.displayName = "BannerBase";
