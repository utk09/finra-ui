import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const componentsDir = dirname(fileURLToPath(import.meta.url));

/**
 * No finance component dims a disabled state with `--finra-opacity-disabled`.
 *
 * `opacity` composites an element's whole subtree as a group, so it blends every
 * colour inside toward the backdrop, text included. Every component in this
 * package is a field or a picker whose disabled state carries text, so there is
 * nothing here the token could legitimately dim: DateInput shipped with it on
 * the field wrapper and rendered its value at 3.32:1 against a declared 16.98:1.
 *
 * Disabled state is stated as colour instead, through
 * `--finra-container-disabled-background`, `--finra-container-disabled-border`
 * and `--finra-container-disabled-foreground`, which the core package pairs
 * against each other in `tokens/contrast.test.ts`.
 *
 * The core half of this rule lists the chrome parts allowed to dim, because core
 * owns tracks, indicators and thumbs. That list is deliberately absent here: a
 * finance component that needs one is a conversation, not a quiet addition.
 */
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

/** Declarations only: a comment naming the token is prose, not a usage. */
function usesDisabledOpacity(source: string): boolean {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/[^\n]*/g, "")
    .includes("--finra-opacity-disabled");
}

describe("the disabled opacity reaches no text", () => {
  const sheets = stylesheets();

  it("inspects every styled stylesheet", () => {
    // A clean result is only meaningful against a denominator.
    expect(sheets.length).toBeGreaterThan(5);
  });

  it("detects the token when it is present", () => {
    // A check that has never been seen to fail is indistinguishable from one
    // that inspects nothing. This is the shape DateInput shipped.
    const shipped = ".wrapper.disabled { opacity: var(--finra-opacity-disabled); }";
    expect(usesDisabledOpacity(shipped)).toBe(true);
    expect(usesDisabledOpacity("// never --finra-opacity-disabled\n.x { color: red; }")).toBe(
      false,
    );
  });

  it.each(sheets)("$name states disabled as colour, not opacity", ({ source }) => {
    expect(usesDisabledOpacity(source)).toBe(false);
  });
});
