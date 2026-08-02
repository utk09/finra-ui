import type { CSSProperties, ReactNode } from "react";

import { DocsLink } from "./DocsLink";

/**
 * Presentational helpers shared by the MDX pages.
 *
 * These are documentation furniture, not library components - nothing here is
 * published. They deliberately use the library's own custom properties so the
 * prose pages and the component previews stay in one visual language, and so a
 * token rename shows up here as a visible break rather than a silent drift.
 *
 * Files in this folder that are not `.mdx` are ignored by the story glob, so
 * this module never appears in the sidebar.
 */

const surface: CSSProperties = {
  border: "1px solid var(--finra-color-border)",
  borderRadius: "10px",
  background: "var(--finra-color-background)",
};

/** Page hero: product name, one-line promise, and the install line. */
export function Hero({
  title,
  tagline,
  children,
}: {
  title: string;
  tagline: string;
  children?: ReactNode;
}) {
  return (
    <div
      style={{
        ...surface,
        padding: "2rem",
        marginBottom: "2rem",
        background:
          "linear-gradient(135deg, var(--finra-color-primary-50) 0%, var(--finra-color-background) 60%)",
      }}>
      <h1
        style={{
          margin: 0,
          fontSize: "2.5rem",
          lineHeight: 1.1,
          letterSpacing: "-0.02em",
          color: "var(--finra-color-foreground)",
        }}>
        {title}
      </h1>
      <p
        style={{
          margin: "0.75rem 0 0",
          fontSize: "1.125rem",
          lineHeight: 1.5,
          maxWidth: "60ch",
          color: "var(--finra-color-neutral-600)",
        }}>
        {tagline}
      </p>
      {children ? <div style={{ marginTop: "1.5rem" }}>{children}</div> : null}
    </div>
  );
}

/** Responsive auto-fitting grid. `min` sets the narrowest a column may get. */
export function CardGrid({ children, min = "240px" }: { children: ReactNode; min?: string }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(auto-fit, minmax(${min}, 1fr))`,
        gap: "1rem",
        margin: "1.5rem 0",
      }}>
      {children}
    </div>
  );
}

/** A single grid cell. Pass `href` to make the whole card a link. */
export function Card({
  title,
  href,
  children,
}: {
  title: string;
  href?: string;
  children: ReactNode;
}) {
  const body = (
    <>
      <strong
        style={{
          display: "block",
          fontSize: "0.95rem",
          marginBottom: "0.4rem",
          color: "var(--finra-color-foreground)",
        }}>
        {title}
      </strong>
      <span
        style={{
          fontSize: "0.875rem",
          lineHeight: 1.5,
          color: "var(--finra-color-neutral-600)",
        }}>
        {children}
      </span>
    </>
  );

  const style: CSSProperties = {
    ...surface,
    display: "block",
    padding: "1rem",
    height: "100%",
    textDecoration: "none",
  };

  return href ? (
    <DocsLink href={href} style={style}>
      {body}
    </DocsLink>
  ) : (
    <div style={style}>{body}</div>
  );
}

/** Copyable command line. */
export function Command({ children }: { children: ReactNode }) {
  return (
    <pre
      style={{
        ...surface,
        margin: "0.5rem 0",
        padding: "0.75rem 1rem",
        overflowX: "auto",
        fontFamily: "var(--finra-font-mono, ui-monospace, monospace)",
        fontSize: "0.875rem",
        color: "var(--finra-color-foreground)",
      }}>
      <code>{children}</code>
    </pre>
  );
}

/**
 * Callout for the things that bite: a workaround, a constraint, or a rule that
 * is not guessable from the prop table.
 */
export function Note({
  kind = "info",
  title,
  children,
}: {
  kind?: "info" | "warning" | "success";
  title?: string;
  children: ReactNode;
}) {
  const palette = {
    info: { accent: "var(--finra-color-info)", bg: "var(--finra-color-info-subtle)" },
    warning: { accent: "var(--finra-color-warning)", bg: "var(--finra-color-warning-subtle)" },
    success: { accent: "var(--finra-color-success)", bg: "var(--finra-color-success-subtle)" },
  }[kind];

  return (
    <div
      style={{
        borderInlineStart: `3px solid ${palette.accent}`,
        borderRadius: "0 8px 8px 0",
        background: palette.bg,
        padding: "0.875rem 1rem",
        margin: "1.25rem 0",
        fontSize: "0.9rem",
        lineHeight: 1.6,
      }}>
      {title ? (
        <strong style={{ display: "block", marginBottom: "0.25rem", color: palette.accent }}>
          {title}
        </strong>
      ) : null}
      {children}
    </div>
  );
}

/**
 * A colour chip and the custom property that produced it.
 *
 * Reads the token live rather than hardcoding a hex, so these swatches follow
 * the Theme toolbar and a renamed token shows up here as a missing colour.
 */
export function Swatch({ token, note }: { token: string; note?: string }) {
  return (
    <div style={{ minInlineSize: 0 }}>
      <div
        style={{
          background: `var(${token})`,
          border: "1px solid var(--finra-color-border)",
          borderRadius: "8px",
          blockSize: "3rem",
        }}
      />
      <code
        style={{
          display: "block",
          marginTop: "0.4rem",
          fontSize: "0.7rem",
          lineHeight: 1.4,
          overflowWrap: "anywhere",
          color: "var(--finra-color-foreground)",
        }}>
        {token}
      </code>
      {note ? (
        <span
          style={{
            display: "block",
            fontSize: "0.7rem",
            lineHeight: 1.4,
            color: "var(--finra-color-neutral-600)",
          }}>
          {note}
        </span>
      ) : null}
    </div>
  );
}

/** Auto-fitting grid of {@link Swatch}es. */
export function SwatchGrid({ children, min = "128px" }: { children: ReactNode; min?: string }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(auto-fill, minmax(${min}, 1fr))`,
        gap: "0.75rem",
        margin: "1.25rem 0",
      }}>
      {children}
    </div>
  );
}

const ISSUES = "https://github.com/utk09/finra-ui/issues";

/**
 * Closing block for a consumer-facing page: where to report something.
 *
 * Repeated on every page on purpose. A reader who hits a problem should not
 * have to navigate anywhere to find out what to do about it.
 */
export function Support({ children }: { children?: ReactNode }) {
  return (
    <Note title="Something not working?">
      {children ? <>{children} </> : null}
      Please open a <DocsLink href={`${ISSUES}/new?template=bug_report.yml`}>bug report</DocsLink>{" "}
      or a <DocsLink href={`${ISSUES}/new?template=feature_request.yml`}>feature request</DocsLink>,
      or <DocsLink href={ISSUES}>browse open issues</DocsLink> first.
    </Note>
  );
}

/** Row of components on a neutral strip, for showing several at once. */
export function Sampler({ children, align = "center" }: { children: ReactNode; align?: string }) {
  return (
    <div
      style={{
        ...surface,
        display: "flex",
        flexWrap: "wrap",
        gap: "0.75rem",
        alignItems: align,
        padding: "1.5rem",
        margin: "1.5rem 0",
      }}>
      {children}
    </div>
  );
}
