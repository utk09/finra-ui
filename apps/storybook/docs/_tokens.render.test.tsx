import { renderToStaticMarkup } from "react-dom/server";
import { beforeAll, describe, expect, it } from "vitest";

import { parseTokenFile, TokenOverrideTemplate, TokenReference } from "./_tokens";

/**
 * `looksLikeColour` asks `CSS.supports` about literal values, which Node does
 * not provide. A small stand-in keeps both branches reachable: colour-shaped
 * literals get a chip, everything else does not.
 */
beforeAll(() => {
  (globalThis as { CSS?: unknown }).CSS ??= {
    supports: (_property: string, value: string) => /^(#|rgb|hsl|oklch)/.test(value),
  };
});

const files = [
  parseTokenFile(
    "color",
    `:root {
       --finra-color-primary-600: #2563eb;
       --finra-color-background: #ffffff;
     }
     [data-theme="dark"] {
       --finra-color-background: #111827;
     }`,
  ),
  parseTokenFile("spacing", `:root { --finra-spacing-4: 1rem; }`),
];

const html = (node: React.ReactElement) => renderToStaticMarkup(node);

describe("TokenReference", () => {
  it("renders one section per file, titled", () => {
    const out = html(<TokenReference files={files} />);
    expect(out).toContain("Colour palette");
    expect(out).toContain("Spacing");
  });

  it("counts the tokens on show", () => {
    expect(html(<TokenReference files={files} />)).toContain("Showing 3 of 3 tokens");
  });

  it("gives a themed file a column per selector block", () => {
    const out = html(<TokenReference files={files} />);
    expect(out).toContain(">default<");
    expect(out).toContain(">dark<");
  });

  it("puts the authored value in the cell", () => {
    expect(html(<TokenReference files={files} />)).toContain("#2563eb");
  });

  it("paints a chip from the token itself, so it follows the theme", () => {
    expect(html(<TokenReference files={files} />)).toContain("var(--finra-color-primary-600)");
  });

  it("does not paint a chip for a non-colour token", () => {
    const out = html(<TokenReference files={[files[1]]} />);
    expect(out).not.toContain("var(--finra-spacing-4)");
    expect(out).toContain("--finra-spacing-4");
  });

  it("labels the filter input", () => {
    expect(html(<TokenReference files={files} />)).toContain("Filter tokens");
  });

  it("falls back to the file slug when there is no friendly title", () => {
    const odd = [parseTokenFile("unknown-group", `:root { --x: 1; }`)];
    expect(html(<TokenReference files={odd} />)).toContain("unknown-group");
  });

  it("renders nothing but the shell when given no files", () => {
    const out = html(<TokenReference files={[]} />);
    expect(out).toContain("Showing 0 of 0 tokens");
  });
});

describe("TokenOverrideTemplate", () => {
  it("emits a paste-ready :root block", () => {
    const css = html(<TokenOverrideTemplate files={files} />);
    expect(css).toContain(":root {");
    expect(css).toContain("--finra-color-primary-600: #2563eb;");
    expect(css).toContain("}");
  });

  it("groups the block by source file", () => {
    expect(html(<TokenOverrideTemplate files={files} />)).toContain("/* Colour palette */");
  });

  it("emits the base value only, never the dark override", () => {
    const css = html(<TokenOverrideTemplate files={files} />);
    expect(css).toContain("--finra-color-background: #ffffff;");
    expect(css).not.toContain("#111827");
  });

  it("skips a token that has no base value", () => {
    const darkOnly = [parseTokenFile("x", `[data-theme="dark"] { --only-dark: #000; }`)];
    expect(html(<TokenOverrideTemplate files={darkOnly} />)).not.toContain("--only-dark");
  });
});
