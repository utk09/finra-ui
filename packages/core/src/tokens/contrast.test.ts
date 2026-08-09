import { describe, expect, it } from "vitest";

import { readThemeTokens, type ThemeName, tokenColour } from "../../test/tokens";
import { contrastRatio } from "../logic/contrast";

/**
 * Contrast is a property of a *pair*, so tokenising a value proves nothing on
 * its own. A component can read `var(--finra-*)` everywhere and still paint
 * unreadable text, because the criterion is whether the ink and the surface it
 * lands on were chosen against each other, in every theme.
 *
 * The pairs below are the ones the shipped stylesheets actually create. Adding
 * a token does not extend this list; pairing one against a surface does.
 */

const SENTIMENTS = ["danger", "success", "warning", "info"] as const;

/** Body text. Large text and meaningful non-text graphics need 3 instead. */
const TEXT = 4.5;

interface Pairing {
  what: string;
  ink: string;
  surface: string;
  minimum: number;
}

function sentimentPairings(sentiment: string): Pairing[] {
  return [
    {
      // Button and Badge, primary variant.
      what: `${sentiment}: on-accent ink on the accent fill`,
      ink: `--finra-status-${sentiment}-foreground`,
      surface: `--finra-status-${sentiment}-accent`,
      minimum: TEXT,
    },
    {
      what: `${sentiment}: on-accent ink on the hover fill`,
      ink: `--finra-status-${sentiment}-foreground`,
      surface: `--finra-status-${sentiment}-accent-hover`,
      minimum: TEXT,
    },
    {
      what: `${sentiment}: on-accent ink on the active fill`,
      ink: `--finra-status-${sentiment}-foreground`,
      surface: `--finra-status-${sentiment}-accent-active`,
      minimum: TEXT,
    },
    {
      // Button and Badge secondary and tertiary, FormField's error message,
      // Textarea's count, every input's validation border.
      what: `${sentiment}: accent ink on the page`,
      ink: `--finra-status-${sentiment}-accent`,
      surface: "--finra-container-background",
      minimum: TEXT,
    },
    {
      // The surface a secondary or tertiary control hovers onto, and the wash
      // a Banner sits on. This is the pairing a mode-invariant accent fails.
      what: `${sentiment}: accent ink on its own subtle wash`,
      ink: `--finra-status-${sentiment}-accent`,
      surface: `--finra-status-${sentiment}-subtle`,
      minimum: TEXT,
    },
    {
      what: `${sentiment}: body ink on its own subtle wash`,
      ink: "--finra-container-foreground",
      surface: `--finra-status-${sentiment}-subtle`,
      minimum: TEXT,
    },
  ];
}

const PAIRINGS: Pairing[] = [
  ...SENTIMENTS.flatMap(sentimentPairings),
  {
    what: "actionable: on-accent ink on the accent fill",
    ink: "--finra-actionable-foreground",
    surface: "--finra-actionable-accent",
    minimum: TEXT,
  },
  {
    what: "actionable: on-accent ink on the hover fill",
    ink: "--finra-actionable-foreground",
    surface: "--finra-actionable-accent-hover",
    minimum: TEXT,
  },
  {
    what: "actionable: on-accent ink on the active fill",
    ink: "--finra-actionable-foreground",
    surface: "--finra-actionable-accent-active",
    minimum: TEXT,
  },
  {
    what: "actionable: accent ink on the page",
    ink: "--finra-actionable-accent",
    surface: "--finra-container-background",
    minimum: TEXT,
  },
  {
    what: "actionable: accent ink on its own subtle wash",
    ink: "--finra-actionable-accent",
    surface: "--finra-actionable-accent-subtle",
    minimum: TEXT,
  },
  {
    what: "container: body ink on the page",
    ink: "--finra-container-foreground",
    surface: "--finra-container-background",
    minimum: TEXT,
  },
  {
    // Placeholders, helper text, dropdown indicators, weekday headers.
    what: "container: muted ink on the page",
    ink: "--finra-container-foreground-muted",
    surface: "--finra-container-background",
    minimum: TEXT,
  },
  {
    what: "container: muted ink on the recessed surface",
    ink: "--finra-container-foreground-muted",
    surface: "--finra-container-background-subtle",
    minimum: TEXT,
  },
  {
    // Listbox options, calendar days, menu items.
    what: "container: body ink on a hovered row",
    ink: "--finra-container-foreground",
    surface: "--finra-container-background-hover",
    minimum: TEXT,
  },
  {
    // WCAG exempts inactive controls, which is not a licence to make them
    // unreadable: a field nobody can read is a field nobody can understand.
    what: "container: disabled ink on the disabled surface",
    ink: "--finra-container-disabled-foreground",
    surface: "--finra-container-disabled-background",
    minimum: TEXT,
  },
];

const THEMES: ThemeName[] = ["default", "dark"];

describe("token contrast", () => {
  describe.each(THEMES)("%s theme", (theme) => {
    const tokens = readThemeTokens(theme);

    it.each(PAIRINGS)("$what meets $minimum:1", ({ ink, surface, minimum }) => {
      const ratio = contrastRatio(tokenColour(tokens, ink), tokenColour(tokens, surface));
      expect(ratio).toBeGreaterThanOrEqual(minimum);
    });
  });

  // A clean sweep is only meaningful next to the size of what was swept. These
  // guard against a parser change that quietly resolves nothing and reports
  // every pairing as passing.
  describe("the sweep covers what it claims to", () => {
    it.each(THEMES)("resolves the %s token graph", (theme) => {
      const tokens = readThemeTokens(theme);
      expect(tokens.size).toBeGreaterThan(60);
      // Every value is fully resolved: an unresolved alias would pass a
      // contrast check by throwing, not by being correct.
      for (const value of tokens.values()) expect(value).not.toContain("var(");
    });

    it("checks both themes against every declared pairing", () => {
      expect(PAIRINGS.length).toBeGreaterThanOrEqual(29);
      expect(THEMES).toEqual(["default", "dark"]);
    });

    it("reads a theme override rather than the base value", () => {
      // The dark block remaps the semantic tier. If this ever came back equal,
      // the reader would be checking the light palette twice and calling it
      // two-theme coverage.
      const light = readThemeTokens("default");
      const dark = readThemeTokens("dark");
      expect(dark.get("--finra-container-background")).not.toBe(
        light.get("--finra-container-background"),
      );
      expect(dark.get("--finra-status-danger-accent")).not.toBe(
        light.get("--finra-status-danger-accent"),
      );
    });
  });
});
