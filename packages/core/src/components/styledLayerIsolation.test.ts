import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const componentsDir = dirname(fileURLToPath(import.meta.url));

function stylesheets(): { name: string; source: string }[] {
  const found: { name: string; source: string }[] = [];
  for (const entry of readdirSync(componentsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const dir = join(componentsDir, entry.name);
    for (const file of readdirSync(dir)) {
      if (file.endsWith(".module.scss")) {
        found.push({
          name: `${entry.name}/${file}`,
          source: readFileSync(join(dir, file), "utf8"),
        });
      }
    }
  }
  return found;
}

/**
 * Selectors that reach an element without going through a class this
 * stylesheet owns.
 *
 * Walks the brace nesting rather than reading indentation, because an at-rule
 * indents its children without scoping them.
 */
function unscopedPartSelectors(source: string): string[] {
  const offenders: string[] = [];
  const stack: string[] = [];
  let buffer = "";

  // Comments first. A comment sits between the previous rule and the selector,
  // so it lands in the buffer, and any prose containing a full stop then reads
  // as a class and hides the very rule it describes.
  const code = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");

  for (const char of code) {
    if (char === "{") {
      const selector = buffer.trim().replace(/\s+/g, " ");
      stack.push(selector);
      // An at-rule groups its children; it does not scope them, so it does not
      // count as an ancestor when deciding whether a rule is reachable.
      const chain = stack.filter((s) => !s.startsWith("@"));
      if (
        selector.includes("[data-finra-ui") &&
        !chain.some((s) => s.includes(".") && !s.startsWith("["))
      ) {
        offenders.push(selector);
      }
      buffer = "";
    } else if (char === "}") {
      stack.pop();
      buffer = "";
    } else if (char === ";") {
      buffer = "";
    } else {
      buffer += char;
    }
  }
  return offenders;
}

describe("the detector itself", () => {
  // Without these, the sweep below is a check that has never been seen to fail,
  // which is indistinguishable from one that inspects nothing.
  it("flags a rule hung directly on a part id", () => {
    expect(unscopedPartSelectors('[data-finra-ui="toast"] { color: red; }')).toEqual([
      '[data-finra-ui="toast"]',
    ]);
  });

  it("flags one wrapped in an at-rule, which groups but does not scope", () => {
    const css =
      '@media (prefers-reduced-motion: reduce) { [data-finra-ui="toast"] { color: red; } }';
    expect(unscopedPartSelectors(css)).toEqual(['[data-finra-ui="toast"]']);
  });

  it("is not fooled by a comment containing a full stop", () => {
    const css = '// Targeted globally here.\n[data-finra-ui="toast"] { color: red; }';
    expect(unscopedPartSelectors(css)).toEqual(['[data-finra-ui="toast"]']);
  });

  it("accepts a part reached through a class the stylesheet owns", () => {
    expect(unscopedPartSelectors('.region [data-finra-ui="toast"] { color: red; }')).toEqual([]);
    expect(unscopedPartSelectors(".field { > [data-finra-ui] { color: red; } }")).toEqual([]);
  });
});

describe("styled layer isolation", () => {
  const sheets = stylesheets();

  it("inspects every styled stylesheet", () => {
    // A clean result is only meaningful against a denominator.
    expect(sheets.length).toBeGreaterThan(20);
  });

  it.each(sheets)(
    "$name styles its own parts through a class, not a global data-finra-ui selector",
    ({ source }) => {
      // `data-finra-ui` is the consumer's override hook and is stamped by the
      // unstyled layer. A styled rule hung on it directly also paints every
      // unstyled usage, which is meant to ship no CSS at all.
      expect(unscopedPartSelectors(source)).toEqual([]);
    },
  );
});
