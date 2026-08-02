import type { AnchorHTMLAttributes } from "react";

/**
 * The one piece of docs furniture the preview itself needs.
 *
 * Kept in its own module because `preview.tsx` registers it as the Markdown
 * `a` override. Importing it from `_components.tsx` would pull every hero,
 * card and callout in that file into the bundle each story loads, none of
 * which a story uses.
 */

/** Anything with a scheme (`https:`, `mailto:`) leaves the site. */
const EXTERNAL_HREF = /^[a-z][a-z0-9+.-]*:/i;

/**
 * Rewrite a Storybook docs link so it resolves against the manager, not the
 * preview frame.
 *
 * A docs page is rendered inside `iframe.html`, so a bare `?path=/docs/x`
 * resolves against *that* file and produces `iframe.html?path=/docs/x` - a URL
 * carrying no `id` parameter, which renders as a blank frame. Prefixing `./`
 * resolves against the directory instead, giving the manager URL. It is used in
 * preference to a root-relative `/?path=` because the two files are siblings,
 * so this keeps working under a sub-path deploy.
 */
export function resolveDocsHref(href: string): string {
  return href.startsWith("?path=") ? `./${href}` : href;
}

/**
 * Anchor that escapes the preview iframe.
 *
 * Registered as the `a` override in `preview.tsx`, so every Markdown link on
 * every MDX page goes through it without the author having to remember. A link
 * inside the iframe otherwise navigates the iframe itself: internal links land
 * on a blank frame, and external ones replace the preview with another site
 * while the Storybook chrome stays wrapped around it.
 *
 * Literal `<a>` written as JSX in an MDX file is **not** routed through the
 * component map, so those have to use this component by name.
 */
export function DocsLink({
  href = "",
  children,
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const external = EXTERNAL_HREF.test(href);
  return (
    <a
      href={resolveDocsHref(href)}
      target={external ? "_blank" : "_top"}
      rel={external ? "noopener noreferrer" : undefined}
      {...rest}>
      {children}
    </a>
  );
}
