import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { DocsLink, resolveDocsHref } from "./DocsLink";

const html = (node: React.ReactElement) => renderToStaticMarkup(node);

describe("resolveDocsHref", () => {
  it("prefixes a docs path so it resolves against the manager, not the frame", () => {
    // Docs render inside `iframe.html`, where a bare `?path=` resolves to
    // `iframe.html?path=`, a URL with no story id that renders blank.
    expect(resolveDocsHref("?path=/docs/components-button--docs")).toBe(
      "./?path=/docs/components-button--docs",
    );
  });

  it("leaves an absolute URL alone", () => {
    expect(resolveDocsHref("https://example.com/x")).toBe("https://example.com/x");
  });

  it("leaves an anchor alone", () => {
    expect(resolveDocsHref("#section")).toBe("#section");
  });
});

describe("DocsLink", () => {
  it("sends an internal link to the top window", () => {
    const out = html(<DocsLink href="?path=/docs/x--docs">Go</DocsLink>);
    expect(out).toContain('href="./?path=/docs/x--docs"');
    expect(out).toContain('target="_top"');
    expect(out).not.toContain("rel=");
  });

  it("opens an external link in a new tab with a safe rel", () => {
    const out = html(<DocsLink href="https://example.com">Out</DocsLink>);
    expect(out).toContain('target="_blank"');
    expect(out).toContain('rel="noopener noreferrer"');
  });

  it("treats any scheme as external", () => {
    expect(html(<DocsLink href="mailto:a@b.c">Mail</DocsLink>)).toContain('target="_blank"');
  });

  it("survives a missing href", () => {
    expect(html(<DocsLink>Bare</DocsLink>)).toContain('target="_top"');
  });

  it("passes extra attributes through", () => {
    expect(html(<DocsLink href="#x" id="anchor" />)).toContain('id="anchor"');
  });
});
