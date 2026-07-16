import { type ReactNode, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";

export interface PortalProps {
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
          data-density={density ?? undefined}>
          {children}
        </div>,
        target,
      )}
    </>
  );
}

Portal.displayName = "Portal";
