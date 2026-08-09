import { describe, expect, it } from "vitest";

import { readThemeTokens, resolveTokenGraph, tokenColour } from "./tokens";

describe("resolveTokenGraph", () => {
  it("collects declarations from :root", () => {
    const tokens = resolveTokenGraph([`:root { --a: #fff; --b: #000; }`], "default");
    expect(Object.fromEntries(tokens)).toEqual({ "--a": "#fff", "--b": "#000" });
  });

  it("resolves an alias chain to its literal", () => {
    const tokens = resolveTokenGraph(
      [`:root { --raw: #123456; --mid: var(--raw); --top: var(--mid); }`],
      "default",
    );
    expect(tokens.get("--top")).toBe("#123456");
  });

  it("layers the theme block over :root", () => {
    const source = `
      :root { --surface: #ffffff; --ink: var(--surface); }
      [data-theme="dark"] { --surface: #000000; }
    `;
    // The alias is declared only on :root, so this is the substitution rule
    // that catches a token which looks themed and is not.
    expect(resolveTokenGraph([source], "default").get("--ink")).toBe("#ffffff");
    expect(resolveTokenGraph([source], "dark").get("--ink")).toBe("#000000");
  });

  it("ignores the theme block entirely for the default theme", () => {
    const source = `
      :root { --x: #aaa; }
      [data-theme="dark"] { --x: #bbb; }
    `;
    expect(resolveTokenGraph([source], "default").get("--x")).toBe("#aaa");
  });

  it("ignores blocks that are neither :root nor the theme", () => {
    const source = `
      :root { --x: #aaa; }
      [data-density="high"] { --x: #ccc; }
    `;
    expect(resolveTokenGraph([source], "dark").get("--x")).toBe("#aaa");
  });

  it("merges across sources in order", () => {
    const tokens = resolveTokenGraph(
      [`:root { --x: #111; --y: #222; }`, `:root { --x: #333; }`],
      "default",
    );
    expect(tokens.get("--x")).toBe("#333");
    expect(tokens.get("--y")).toBe("#222");
  });

  it("strips line comments before parsing", () => {
    const tokens = resolveTokenGraph([`:root { // --ghost: #fff;\n --real: #000; }`], "default");
    expect(tokens.has("--ghost")).toBe(false);
    expect(tokens.get("--real")).toBe("#000");
  });

  it("ignores plain declarations that are not custom properties", () => {
    const tokens = resolveTokenGraph([`:root { color: red; --kept: #fff; }`], "default");
    expect([...tokens.keys()]).toEqual(["--kept"]);
  });

  //  The failure modes are the reason this takes source text rather than paths.

  it("throws when an alias names a token that was never declared", () => {
    expect(() => resolveTokenGraph([`:root { --a: var(--missing); }`], "default")).toThrow(
      /--missing is referenced but never declared/,
    );
  });

  it("throws on an alias cycle rather than recursing forever", () => {
    expect(() => resolveTokenGraph([`:root { --a: var(--b); --b: var(--a); }`], "default")).toThrow(
      /cycle/,
    );
  });
});

describe("tokenColour", () => {
  it("parses a declared token", () => {
    expect(tokenColour(new Map([["--x", "#dc2626"]]), "--x")).toEqual({ r: 220, g: 38, b: 38 });
  });

  it("names the token when it is missing", () => {
    expect(() => tokenColour(new Map(), "--absent")).toThrow(/--absent is not declared/);
  });

  it("names the token when its value is not an opaque hex colour", () => {
    // The scrim is deliberately `rgb(0 0 0 / 50%)`, so this is a real value in
    // the real files and not a hypothetical.
    expect(() => tokenColour(new Map([["--scrim", "rgb(0 0 0 / 50%)"]]), "--scrim")).toThrow(
      /not an opaque hex colour/,
    );
  });
});

describe("readThemeTokens", () => {
  it("reads the shipped colour files for both themes", () => {
    for (const theme of ["default", "dark"] as const) {
      const tokens = readThemeTokens(theme);
      expect(tokens.size).toBeGreaterThan(60);
      expect(tokens.get("--finra-container-background")).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});
