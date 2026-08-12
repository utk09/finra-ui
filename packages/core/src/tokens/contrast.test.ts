import { describe, expect, it } from "vitest";

import { readThemeTokens, type ThemeName, tokenColour } from "../../test/tokens";
import { compositeOver, contrastRatio } from "../logic/contrast";

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

/**
 * A disabled control's text, measured as it renders rather than as it is
 * declared.
 *
 * `opacity` paints an element and its whole subtree into a group and composites
 * the finished group over the backdrop, so an opacity anywhere above a text node
 * blends that text toward whatever sits behind. The pairs above cannot see it:
 * they compare two declared tokens, and the declared pair for a disabled Switch
 * label read 17.74:1 while Chromium rendered 3.39:1.
 *
 * So each row carries the alpha that actually reaches the text, and both the ink
 * and the surface are composited before measuring. `alpha: 1` is a claim that
 * nothing dims this text, and `components/disabledOpacity.test.ts` is what keeps
 * that claim true: it fails on any use of `--finra-opacity-disabled` that is not
 * on its list of text-free parts. Neither test is sufficient alone.
 */
interface DisabledPairing {
  what: string;
  ink: string;
  /** Painted behind the ink, inside the opacity group when there is one. */
  surface: string;
  /** Painted behind the group. Only reachable when `alpha` is below 1. */
  backdrop: string;
  /** The product of every `opacity` between this text and the page. */
  alpha: number;
  minimum: number;
}

const PAGE = "--finra-container-background";
const DISABLED_INK = "--finra-container-disabled-foreground";
const DISABLED_SURFACE = "--finra-container-disabled-background";
const MUTED_INK = "--finra-container-foreground-muted";

/** `[what, ink, surface]`. Every row is text at full opacity on the page. */
type DisabledText = [what: string, ink: string, surface: string];

/**
 * Button and IconButton keep their sentiment when disabled.
 *
 * @remarks
 * Every variant collapses to one inert treatment, the sentiment's accent on the
 * sentiment's own subtle wash, so the rows do not vary by variant. Emphasis is
 * how loudly a control asks to be pressed and an inert one asks for nothing;
 * meaning does not depend on whether the control can be operated, so a disabled
 * Delete stays red rather than going neutral.
 *
 * The same pairs already appear above as "accent ink on its own subtle wash",
 * which is the hover surface. Both are listed because they are two different
 * claims: change the hover wash and the hover rows move, change the disabled
 * treatment and these do, and a reader looking for what a disabled Button paints
 * should find it in the disabled table.
 *
 * IconButton's glyph is a graphic rather than text, so WCAG would allow 3:1 for
 * it. It is held to 4.5 here because the two controls sit side by side and are
 * meant to look alike, not because the specification demands it.
 */
const SENTIMENT_BUTTON_DISABLED: DisabledText[] = ["Button", "IconButton"].flatMap(
  (component): DisabledText[] => [
    [
      `${component}, disabled label, no sentiment`,
      "--finra-actionable-accent",
      "--finra-actionable-accent-subtle",
    ],
    ...SENTIMENTS.map(
      (sentiment): DisabledText => [
        `${component}, disabled ${sentiment} label`,
        `--finra-status-${sentiment}-accent`,
        `--finra-status-${sentiment}-subtle`,
      ],
    ),
  ],
);

/** Text on a control the consumer has disabled, one row per component. */
const DISABLED_TEXT: DisabledText[] = [
  ...SENTIMENT_BUTTON_DISABLED,
  ["Checkbox, label", DISABLED_INK, PAGE],
  ["ComboBox, field text", DISABLED_INK, DISABLED_SURFACE],
  ["ComboBox, disabled option", DISABLED_INK, PAGE],
  // finance, reading the same two core tokens as Input.
  ["DateInput, field text", DISABLED_INK, DISABLED_SURFACE],
  ["FileDropZone, prompt", MUTED_INK, DISABLED_SURFACE],
  ["FormField, label", DISABLED_INK, PAGE],
  ["FormField, helper text", MUTED_INK, PAGE],
  ["FormField, error message", "--finra-status-danger-accent", PAGE],
  ["Input, field text", DISABLED_INK, DISABLED_SURFACE],
  ["Menu, disabled item", DISABLED_INK, PAGE],
  ["NumberInput, field text", DISABLED_INK, DISABLED_SURFACE],
  ["RadioButton, label", DISABLED_INK, PAGE],
  ["Select, trigger value", DISABLED_INK, DISABLED_SURFACE],
  ["Select, disabled option", DISABLED_INK, PAGE],
  ["Slider, label", DISABLED_INK, PAGE],
  ["Slider, value readout", MUTED_INK, PAGE],
  ["Switch, label", DISABLED_INK, PAGE],
  ["Tabs, disabled tab", DISABLED_INK, PAGE],
  ["Textarea, field text", DISABLED_INK, DISABLED_SURFACE],
  ["Textarea, character count", MUTED_INK, DISABLED_SURFACE],
];

const DISABLED_PAIRINGS: DisabledPairing[] = DISABLED_TEXT.map(([what, ink, surface]) => ({
  what,
  ink,
  surface,
  backdrop: PAGE,
  alpha: 1,
  minimum: TEXT,
}));

const THEMES: ThemeName[] = ["default", "dark"];

function compositedRatio(tokens: Map<string, string>, pairing: DisabledPairing): number {
  const backdrop = tokenColour(tokens, pairing.backdrop);
  return contrastRatio(
    compositeOver(tokenColour(tokens, pairing.ink), backdrop, pairing.alpha),
    compositeOver(tokenColour(tokens, pairing.surface), backdrop, pairing.alpha),
  );
}

describe("token contrast", () => {
  describe.each(THEMES)("%s theme", (theme) => {
    const tokens = readThemeTokens(theme);

    it.each(PAIRINGS)("$what meets $minimum:1", ({ ink, surface, minimum }) => {
      const ratio = contrastRatio(tokenColour(tokens, ink), tokenColour(tokens, surface));
      expect(ratio).toBeGreaterThanOrEqual(minimum);
    });

    it.each(DISABLED_PAIRINGS)("$what renders at $minimum:1 when disabled", (pairing) => {
      expect(compositedRatio(tokens, pairing)).toBeGreaterThanOrEqual(pairing.minimum);
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
      expect(DISABLED_PAIRINGS.length).toBeGreaterThanOrEqual(30);
      // Button and IconButton carry five rows each: the sentiment-less default
      // and the four sentiments. A treatment that quietly went back to one
      // neutral row for all five would still satisfy the floor above.
      expect(SENTIMENT_BUTTON_DISABLED).toHaveLength(10);
      expect(THEMES).toEqual(["default", "dark"]);
    });

    it("fails the disabled rows when an opacity reaches the text", () => {
      // The composited check is worthless if it cannot see the defect it exists
      // for, and every shipped row now declares `alpha: 1`, so nothing in the
      // table exercises the compositing path. This replays the configuration
      // that shipped: body ink and the recessed field surface under a single
      // 0.5 group, which Chromium rendered at 3.32:1 on the Input disabled
      // story against a declared 16.98:1.
      const tokens = readThemeTokens("default");
      const shipped: DisabledPairing = {
        what: "Input, field text, as it shipped",
        ink: "--finra-container-foreground",
        surface: DISABLED_SURFACE,
        backdrop: PAGE,
        alpha: 0.5,
        minimum: TEXT,
      };
      expect(compositedRatio(tokens, shipped)).toBeCloseTo(3.32, 2);
      expect(compositedRatio(tokens, shipped)).toBeLessThan(TEXT);
      // Same pair, nothing dimming it: the number the old suite was checking.
      expect(compositedRatio(tokens, { ...shipped, alpha: 1 })).toBeGreaterThan(TEXT);
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
