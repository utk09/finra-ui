import { type ReactNode, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Props for {@link Portal}.
 *
 * @remarks
 * Exists so overlays escape ancestor `overflow: hidden`, `z-index` stacking
 * contexts and `transform` containing blocks - all of which clip or mis-place a
 * popup that renders inline.
 *
 * SSR-safe: renders nothing until mounted, since there is no `document` to
 * portal into on the server.
 */
export interface PortalProps {
  /** Content to render into the container. */
  children: ReactNode;
  /**
   * Where to render the portalled content. Defaults to `document.body`.
   */
  container?: Element | null;
  /**
   * Render children in place instead of portalling. Useful for tests or when a
   * parent already provides the correct stacking/overflow context.
   */
  disabled?: boolean;
}

/**
 * Render children into another part of the DOM (default `document.body`) so
 * overlays escape ancestor `overflow: hidden` / `z-index` / `transform`
 * contexts.
 *
 * Because portalled content leaves its ancestor subtree, it loses the
 * `data-theme` / `data-density` attributes that drive finra-ui's theming (there
 * is no React provider to carry them). Portal snapshots those from the nearest
 * ancestor of its in-tree position and re-applies them on a wrapper around the
 * portalled content, so overlays render with the theme of where they were
 * declared - not the theme of `document.body`.
 *
 * The snapshot is taken on mount; a theme toggled while the portal is open is
 * not tracked (overlays are typically short-lived). Wrap long-lived portalled
 * UI in its own `data-theme` if that matters.
 *
 * Re-applying the attributes is necessary but not sufficient. `color` is an
 * inherited property, and the portalled subtree inherits it from
 * `document.body` rather than from where it was declared. With `data-theme` set
 * on an inner element - which the docs explicitly allow, "any ancestor" - body
 * keeps the light ink, so anything in an overlay that does not set its own
 * colour renders dark-on-dark. The wrapper therefore restates the themed
 * foreground. The `inherit` fallback means that a consumer using `/unstyled`
 * without the library stylesheet gets exactly the previous behaviour.
 */
export function Portal({ children, container, disabled }: PortalProps): ReactNode {
  // Ref callback (not useRef) so the layout effect re-runs once the anchor
  // mounts and we can read the surrounding theme/density.
  const [anchor, setAnchor] = useState<HTMLSpanElement | null>(null);
  const [theme, setTheme] = useState<string | null>(null);
  const [density, setDensity] = useState<string | null>(null);

  useLayoutEffect(() => {
    if (!anchor) return;
    setTheme(anchor.closest("[data-theme]")?.getAttribute("data-theme") ?? null);
    setDensity(anchor.closest("[data-density]")?.getAttribute("data-density") ?? null);
  }, [anchor]);

  if (disabled) return <>{children}</>;

  const target = container ?? (typeof document !== "undefined" ? document.body : null);
  if (!target) return null;

  return (
    <>
      <span ref={setAnchor} style={{ display: "none" }} aria-hidden="true" />
      {createPortal(
        <div
          data-finra-ui-portal=""
          data-theme={theme ?? undefined}
          data-density={density ?? undefined}
          style={{ color: "var(--finra-container-foreground, inherit)" }}>
          {children}
        </div>,
        target,
      )}
    </>
  );
}

Portal.displayName = "Portal";
