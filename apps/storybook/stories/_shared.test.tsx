import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  APPEARANCE,
  darkMode,
  darkModeOpen,
  forwardsTo,
  inDark,
  LabelledRow,
  NATIVE,
  nativeFieldArgTypes,
  Row,
  Stack,
  TokenScope,
} from "./_shared";

const html = (node: React.ReactElement) => renderToStaticMarkup(node);

/**
 * `inDark` returns the base story's own type, so the keys it adds are invisible
 * to TypeScript at the call site. Read the result through this shape instead.
 */
type DarkStory = {
  globals?: Record<string, string>;
  parameters?: {
    theme?: string;
    layout?: string;
    docs?: { description?: { story?: string }; source?: unknown };
  };
};

describe("inDark", () => {
  it("sets the theme as a parameter, not only as a global", () => {
    // The Vitest browser runner ignores a story's `globals`, so a variant that
    // only set one would render dark here and light under test, and the
    // accessibility check would audit the wrong theme.
    const story = inDark({ args: { children: "Save" } } as never) as DarkStory;
    expect(story.parameters?.theme).toBe("dark");
    expect(story.globals?.theme).toBe("dark");
  });

  it("keeps the base story's other parameters", () => {
    // A plain spread of `darkMode` replaces `parameters` wholesale and silently
    // drops things like `layout`. Merging is the whole reason this helper exists.
    const story = inDark({ parameters: { layout: "fullscreen" } }) as DarkStory;
    expect(story.parameters?.layout).toBe("fullscreen");
    expect(story.parameters?.theme).toBe("dark");
  });

  it("carries over args, render and play", () => {
    const play = () => {};
    const render = () => null;
    const story = inDark({ args: { a: 1 }, render, play } as never) as never as {
      args: { a: number };
      render: unknown;
      play: unknown;
    };
    expect(story.args).toEqual({ a: 1 });
    expect(story.render).toBe(render);
    expect(story.play).toBe(play);
  });

  it("preserves any globals the base already set", () => {
    const story = inDark({ globals: { density: "high" } } as never) as DarkStory;
    expect(story.globals).toEqual({ density: "high", theme: "dark" });
  });

  it("describes the variant, and lets the caller override the wording", () => {
    const auto = inDark({}) as DarkStory;
    expect(auto.parameters?.docs?.description?.story).toContain("dark");

    const custom = inDark({}, "Bespoke note.") as DarkStory;
    expect(custom.parameters?.docs?.description?.story).toBe("Bespoke note.");
  });

  it("keeps other docs settings on the base", () => {
    const story = inDark({ parameters: { docs: { source: { type: "code" } } } }) as DarkStory;
    expect(story.parameters?.docs?.source).toEqual({ type: "code" });
  });
});

describe("the dark presets", () => {
  it("both set the theme in both places", () => {
    for (const preset of [darkMode, darkModeOpen]) {
      expect(preset.globals.theme).toBe("dark");
      expect(preset.parameters.theme).toBe("dark");
    }
  });

  it("the open variant explains why it leaves the overlay up", () => {
    expect(darkModeOpen.parameters.docs.description.story).toContain("portalled");
  });
});

describe("forwardsTo", () => {
  it("names the element that receives everything not in the table", () => {
    const text = forwardsTo("button");
    expect(text).toContain("`button`");
    expect(text).toContain("data-*");
  });

  it("mentions the ref target only when there is one", () => {
    expect(forwardsTo("input", "input element")).toContain("ref");
    expect(forwardsTo("input")).not.toContain("ref");
  });

  it("supplies the article itself, so the caller passes a bare noun", () => {
    expect(forwardsTo("input", "radio input")).toContain("points at the radio input");
    expect(forwardsTo("input", "radio input")).not.toContain("the the");
  });
});

describe("argType fragments", () => {
  it("groups the native attributes under one category", () => {
    for (const argType of Object.values(nativeFieldArgTypes)) {
      expect(argType.table.category).toBe(NATIVE);
    }
  });

  it("uses distinct group names", () => {
    expect(NATIVE).not.toBe(APPEARANCE);
  });

  it("says a placeholder is not a label", () => {
    expect(nativeFieldArgTypes.placeholder.description).toContain("Never a substitute for a label");
  });
});

describe("layout helpers", () => {
  it("stacks vertically and rows wrap", () => {
    expect(html(<Stack>content</Stack>)).toContain("column");
    expect(html(<Row>content</Row>)).toContain("wrap");
  });

  it("honours gap and alignment overrides", () => {
    expect(html(<Stack gap="2rem">x</Stack>)).toContain("2rem");
    expect(html(<Row align="flex-end">x</Row>)).toContain("flex-end");
  });

  it("renders a labelled row's label and content", () => {
    const out = html(<LabelledRow label="Density">controls</LabelledRow>);
    expect(out).toContain("Density");
    expect(out).toContain("controls");
  });
});

describe("TokenScope", () => {
  it("writes the custom properties onto the wrapper", () => {
    const out = html(
      <TokenScope tokens={{ "--finra-actionable-accent": "#7c3aed" }}>content</TokenScope>,
    );
    expect(out).toContain("--finra-actionable-accent:#7c3aed");
    expect(out).toContain("content");
  });

  it("accepts several tokens at once", () => {
    const out = html(
      <TokenScope tokens={{ "--a": "1", "--b": "2" }} align="flex-start">
        x
      </TokenScope>,
    );
    expect(out).toContain("--a:1");
    expect(out).toContain("--b:2");
    expect(out).toContain("flex-start");
  });
});
