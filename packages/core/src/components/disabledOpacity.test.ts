import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const componentsDir = dirname(fileURLToPath(import.meta.url));

/**
 * `--finra-opacity-disabled` dims non-text chrome and nothing else.
 *
 * `opacity` paints an element and its whole subtree into a group and composites
 * the finished group over the backdrop, so it reaches every colour underneath.
 * Put it on a control's root and the label goes with it: a disabled Switch label
 * declared 17.74:1 and rendered 3.39:1, and a disabled FormField wrapping a
 * disabled Input multiplied two groups into 1.36:1. Sixteen stylesheets shipped
 * that way, and `tokens/contrast.test.ts` could not see any of it, because it
 * compared declared tokens to declared tokens.
 *
 * The composited rows there now state `alpha: 1` for every piece of disabled
 * text. This is what makes that claim mean something: the set of usages below is
 * exhaustive, so moving the token onto anything else fails here.
 *
 * A part earns a place on this list only if no text renders inside it. That is a
 * fact about the DOM, which CSS cannot state, so it is asserted by whoever adds
 * the entry rather than derived. Text takes explicit disabled colours at full
 * opacity instead: the neutral `--finra-container-disabled-*` trio for a field,
 * or the sentiment's own accent on its own subtle wash where the sentiment has
 * to survive being disabled, as it does on Button and IconButton.
 *
 * Carrying no text qualifies a part; it does not oblige it. IconButton is
 * icon-only by construction and would qualify, and is deliberately absent: it
 * takes the same explicit colours Button does, because the two sit side by side
 * in a toolbar and only one of them fading reads as a defect.
 */
const CHROME: { file: string; selector: string; why: string }[] = [
  {
    file: "Checkbox/Checkbox.module.scss",
    selector: ".checkbox.disabled .indicator",
    why: "the box and its tick; the label is a sibling",
  },
  {
    file: "FileDropZone/FileDropZone.module.scss",
    selector: ".dropZone.disabled .icon",
    why: "decorative glyph above the prompt, which says the same thing",
  },
  {
    file: "NumberInput/NumberInput.module.scss",
    selector: ".stepButton:disabled",
    why: "a stepper arrow; the field it steps is a sibling",
  },
  {
    file: "RadioButton/RadioButton.module.scss",
    selector: ".radio.disabled .indicator",
    why: "the ring and its dot; the label is a sibling",
  },
  {
    file: "Slider/Slider.module.scss",
    selector: ".slider.disabled .input",
    why: "the groove and thumb; the label and value readout are siblings",
  },
  {
    file: "Switch/Switch.module.scss",
    selector: ".switch.disabled .track",
    why: "the track and thumb; the label is a sibling",
  },
];

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
 * Every selector that applies `--finra-opacity-disabled`, flattened through SCSS
 * nesting into the selector it compiles to.
 *
 * @remarks
 * Walks the brace nesting rather than indentation, resolves `&` against the
 * parent, and skips at-rules, which group their children without scoping them.
 */
function disabledOpacitySelectors(source: string): string[] {
  const code = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
  const found: string[] = [];
  const stack: string[] = [];
  let buffer = "";

  const flatten = (): string => {
    let selector = "";
    for (const part of stack) {
      if (part.startsWith("@")) continue;
      if (part.startsWith("&")) selector += part.slice(1);
      else selector = selector ? `${selector} ${part}` : part;
    }
    return selector;
  };

  for (const char of code) {
    if (char === "{") {
      stack.push(buffer.trim().replace(/\s+/g, " "));
      buffer = "";
    } else if (char === "}") {
      // A final declaration needs no semicolon, so check before unwinding.
      if (buffer.includes("--finra-opacity-disabled")) found.push(flatten());
      stack.pop();
      buffer = "";
    } else if (char === ";") {
      if (buffer.includes("--finra-opacity-disabled")) found.push(flatten());
      buffer = "";
    } else {
      buffer += char;
    }
  }
  return found;
}

describe("the detector itself", () => {
  // Without these, the sweep below is a check that has never been seen to fail,
  // which is indistinguishable from one that inspects nothing.
  it("flags the shape that shipped: an opacity on a labelled control's root", () => {
    const css = ".switch { color: red; &.disabled { opacity: var(--finra-opacity-disabled); } }";
    expect(disabledOpacitySelectors(css)).toEqual([".switch.disabled"]);
  });

  it("flags one nested under a descendant selector", () => {
    const css = ".switch { &.disabled { .track { opacity: var(--finra-opacity-disabled); } } }";
    expect(disabledOpacitySelectors(css)).toEqual([".switch.disabled .track"]);
  });

  it("reads through an at-rule, which groups but does not scope", () => {
    const css = "@media print { .tab { opacity: var(--finra-opacity-disabled); } }";
    expect(disabledOpacitySelectors(css)).toEqual([".tab"]);
  });

  it("is not fooled by a comment naming the token", () => {
    const css = "// never use --finra-opacity-disabled here\n.tab { color: red; }";
    expect(disabledOpacitySelectors(css)).toEqual([]);
  });

  it("ignores other opacities", () => {
    expect(disabledOpacitySelectors(".x { opacity: var(--finra-opacity-hover); }")).toEqual([]);
    expect(disabledOpacitySelectors(".x { opacity: 0; }")).toEqual([]);
  });
});

describe("the disabled opacity reaches no text", () => {
  const sheets = stylesheets();

  it("inspects every styled stylesheet", () => {
    // A clean result is only meaningful against a denominator.
    expect(sheets.length).toBeGreaterThan(20);
  });

  it("finds the token applied exactly where the list says, and nowhere else", () => {
    const actual = sheets
      .flatMap(({ name, source }) =>
        disabledOpacitySelectors(source).map((selector) => `${name} ${selector}`),
      )
      .sort();
    const expected = CHROME.map(({ file, selector }) => `${file} ${selector}`).sort();
    expect(actual).toEqual(expected);
  });

  it("says why each part carries no text", () => {
    // An entry without a reason is a rubber stamp, and the reason is the only
    // part of this a reader can check.
    for (const { why } of CHROME) expect(why.length).toBeGreaterThan(20);
  });
});
