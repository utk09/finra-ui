import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const componentsDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(componentsDir, "..", "..", "..", "..");

/**
 * Every consumer-facing place the core component count is written down.
 *
 * The count is a number a human types, in prose, in files no test used to
 * read, so it goes stale silently and is only ever noticed by someone
 * counting by hand. The icons package pins its own count for the same reason.
 * A new place that states the count belongs on this list.
 */
const COUNTED = [
  "README.md",
  "packages/core/README.md",
  "packages/finance/README.md",
  "packages/icons/README.md",
  "apps/storybook/docs/Introduction.mdx",
];

/** `N components`, as the prose spells it. */
const STATED_COUNT = /(\d+) components/;

/**
 * A component is a directory under `components/` holding a styled wrapper.
 *
 * Directory count alone would include nothing today, but a future shared
 * fixture folder would inflate it, so presence of the wrapper is what counts.
 */
function styledComponents(): string[] {
  return readdirSync(componentsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .filter((entry) => {
      const files = readdirSync(join(componentsDir, entry.name));
      return files.includes(`${entry.name}.tsx`);
    })
    .map((entry) => entry.name);
}

describe("the stated component count", () => {
  const actual = styledComponents();

  it("counts every styled component directory", () => {
    // A clean result is only meaningful against a denominator.
    expect(actual.length).toBeGreaterThan(20);
    expect(actual).toContain("Button");
    expect(actual).toContain("SoundSettings");
  });

  it.each(COUNTED)("%s states it", (file) => {
    const source = readFileSync(join(repoRoot, file), "utf8");
    const stated = source.match(STATED_COUNT);

    // Without this, a reworded sentence turns the check below into a check of
    // nothing, and the number goes stale exactly as it did before.
    expect(stated, `no "N components" phrase found in ${file}`).not.toBeNull();
    expect(Number(stated?.[1])).toBe(actual.length);
  });
});
