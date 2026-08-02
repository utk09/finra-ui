import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { filterTokenFiles, parseTokenFile } from "./_tokens";

const PACKAGES = join(dirname(fileURLToPath(import.meta.url)), "../../../packages");

/**
 * Every package that declares tokens, discovered rather than listed, so this
 * matches the page's glob instead of drifting from it.
 */
const TOKEN_DIRS = readdirSync(PACKAGES)
  .map((pkg) => join(PACKAGES, pkg, "src/tokens"))
  .filter((dir) => existsSync(dir));

/**
 * Parse the real stylesheets straight off disk.
 *
 * The page itself reaches them through `import.meta.glob`, which needs Vite's
 * resolution and is exercised by the rendered page. What matters here is that
 * the parser copes with the actual files, so this reads them directly.
 */
const realFiles = TOKEN_DIRS.flatMap((dir) =>
  readdirSync(dir)
    .filter((f) => f.startsWith("_") && f.endsWith(".scss") && f !== "_index.scss")
    .map((f) =>
      parseTokenFile(
        f.replace(/^_/, "").replace(/\.scss$/, ""),
        readFileSync(join(dir, f), "utf8"),
      ),
    ),
);

describe("parseTokenFile", () => {
  it("reads declarations out of the base block", () => {
    const file = parseTokenFile(
      "color",
      `:root {
         --finra-color-primary-600: #2563eb;
         --finra-color-neutral-50: #f9fafb;
       }`,
    );
    expect(file.id).toBe("color");
    expect(file.variants).toEqual(["default"]);
    expect(file.tokens).toEqual([
      { name: "--finra-color-primary-600", values: { default: "#2563eb" } },
      { name: "--finra-color-neutral-50", values: { default: "#f9fafb" } },
    ]);
  });

  it("keeps authoring order rather than sorting", () => {
    // A neutral ramp only reads as a ramp in the order it was written.
    const file = parseTokenFile(
      "x",
      `:root {
         --z: 1;
         --a: 2;
       }`,
    );
    expect(file.tokens.map((t) => t.name)).toEqual(["--z", "--a"]);
  });

  it("puts a theme override in its own column beside the base value", () => {
    const file = parseTokenFile(
      "semantic",
      `:root {
         --finra-actionable-accent: var(--finra-color-primary-600);
       }
       [data-theme="dark"] {
         --finra-actionable-accent: var(--finra-color-primary-300);
       }`,
    );
    expect(file.variants).toEqual(["default", "dark"]);
    expect(file.tokens[0].values).toEqual({
      default: "var(--finra-color-primary-600)",
      dark: "var(--finra-color-primary-300)",
    });
  });

  it("derives a column per density block", () => {
    const file = parseTokenFile(
      "density",
      `:root { --size: 2.25rem; }
       [data-density="high"] { --size: 1.75rem; }
       [data-density="low"] { --size: 2.75rem; }`,
    );
    expect(file.variants).toEqual(["default", "high", "low"]);
    expect(file.tokens[0].values).toEqual({
      default: "2.25rem",
      high: "1.75rem",
      low: "2.75rem",
    });
  });

  it("always lists the base column first", () => {
    const file = parseTokenFile(
      "density",
      `[data-density="low"] { --size: 2.75rem; }
       :root { --size: 2.25rem; }`,
    );
    expect(file.variants[0]).toBe("default");
  });

  it("keeps an unrecognised selector verbatim instead of dropping it", () => {
    // A new kind of override should be visible rather than silently missing.
    const file = parseTokenFile("x", `[data-motion="reduced"] { --dur: 0ms; }`);
    expect(file.variants).toEqual(["default", '[data-motion="reduced"]']);
  });

  it("ignores line and block comments", () => {
    const file = parseTokenFile(
      "x",
      `/* header comment
          --not-a-token: nope;
       */
       :root {
         // --also-not-a-token: nope;
         --real: 1px; // trailing note
       }`,
    );
    expect(file.tokens).toEqual([{ name: "--real", values: { default: "1px" } }]);
  });

  it("ignores a declaration outside any block", () => {
    expect(parseTokenFile("x", `--orphan: 1px;`).tokens).toEqual([]);
  });

  it("skips ordinary CSS properties", () => {
    const file = parseTokenFile("x", `:root { color: red; --kept: blue; }`);
    expect(file.tokens.map((t) => t.name)).toEqual(["--kept"]);
  });

  it("returns nothing for an empty stylesheet", () => {
    expect(parseTokenFile("x", "").tokens).toEqual([]);
  });
});

describe("filterTokenFiles", () => {
  const files = [
    parseTokenFile(
      "color",
      `:root {
         --finra-color-primary-600: #2563eb;
         --finra-color-neutral-500: #6b7280;
       }`,
    ),
    parseTokenFile("spacing", `:root { --finra-spacing-2: 0.5rem; }`),
  ];

  it("returns everything for an empty query", () => {
    expect(filterTokenFiles(files, "")).toBe(files);
  });

  it("matches on the token name", () => {
    const out = filterTokenFiles(files, "neutral");
    expect(out).toHaveLength(1);
    expect(out[0].tokens.map((t) => t.name)).toEqual(["--finra-color-neutral-500"]);
  });

  it("matches on the value, so a measurement finds its tokens", () => {
    const out = filterTokenFiles(files, "0.5rem");
    expect(out.map((f) => f.id)).toEqual(["spacing"]);
  });

  it("drops a file with no remaining tokens rather than rendering an empty table", () => {
    expect(filterTokenFiles(files, "zzz")).toEqual([]);
  });

  it("does not mutate the input", () => {
    filterTokenFiles(files, "neutral");
    expect(files[0].tokens).toHaveLength(2);
  });
});

describe("the real token files", () => {
  // The reference page exists so it cannot drift from the stylesheets. These
  // assert against the actual SCSS, so a parser change that quietly stops
  // reading them fails here rather than emptying the page.
  it("parses every token file", () => {
    expect(realFiles.map((f) => f.id).sort()).toEqual([
      "color",
      "density",
      "misc",
      "radius",
      "semantic",
      "shadows",
      "sizing",
      "spacing",
      "typography",
    ]);
  });

  it("finds a substantial number of tokens", () => {
    expect(realFiles.reduce((n, f) => n + f.tokens.length, 0)).toBeGreaterThan(100);
  });

  it("gives the colour and semantic files a dark column", () => {
    for (const id of ["color", "semantic"]) {
      expect(realFiles.find((f) => f.id === id)?.variants).toEqual(["default", "dark"]);
    }
  });

  it("gives the density file a column per level", () => {
    expect(realFiles.find((f) => f.id === "density")?.variants).toEqual(["default", "high", "low"]);
  });

  it("reads a semantic alias and its dark counterpart", () => {
    const accent = realFiles
      .find((f) => f.id === "semantic")
      ?.tokens.find((t) => t.name === "--finra-actionable-accent");
    expect(accent?.values).toEqual({
      default: "var(--finra-color-primary-600)",
      dark: "var(--finra-color-primary-300)",
    });
  });

  it("never emits a token name that is not a custom property", () => {
    for (const file of realFiles) {
      for (const token of file.tokens) expect(token.name.startsWith("--")).toBe(true);
    }
  });
});
