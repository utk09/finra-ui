import { describe, expect, it } from "vitest";

import {
  describeComponent,
  enhanceArgTypesFromDocgen,
  linkifySymbols,
  mergeInheritedArgTypes,
} from "./docgen";

/** Stand-in for a component carrying a docgen record. */
function withDocgen(props: Record<string, unknown>, description?: string) {
  return { __docgenInfo: { description, props } };
}

describe("linkifySymbols", () => {
  it("leaves text without a link tag alone", () => {
    expect(linkifySymbols("Plain prose.")).toBe("Plain prose.");
  });

  it("falls back to inline code for an unknown symbol", () => {
    // The symbol index is built by `main.ts` and is absent under test, so every
    // name takes the fallback path. That is the important behaviour: an
    // unresolved name must still read as a symbol, never as raw braces.
    expect(linkifySymbols("See {@link NotAThing}.")).toBe("See `NotAThing`.");
  });

  it("keeps a member reference readable and normalises the separator", () => {
    expect(linkifySymbols("{@link ToastApi.success}")).toBe("`ToastApi.success`");
    expect(linkifySymbols("{@link ToastApi#success}")).toBe("`ToastApi.success`");
  });

  it("rewrites every occurrence, not just the first", () => {
    expect(linkifySymbols("{@link A} then {@link B}")).toBe("`A` then `B`");
  });

  it("tolerates extra whitespace after the tag", () => {
    expect(linkifySymbols("{@link   Spaced}")).toBe("`Spaced`");
  });
});

describe("describeComponent", () => {
  it("returns an empty string when there is no docblock", () => {
    expect(describeComponent(undefined)).toBe("");
    expect(describeComponent("")).toBe("");
  });

  it("keeps the summary and drops nothing when there are no tags", () => {
    expect(describeComponent("A small inline status or count.")).toBe(
      "A small inline status or count.",
    );
  });

  it("drops @see when it only points at the props interface", () => {
    // The props table is rendered directly below on the same page, so repeating
    // it is noise. This is the single most common docblock in the library.
    const raw = "A small inline status or count.\n\n@see {@link BadgeProps}";
    expect(describeComponent(raw)).toBe("A small inline status or count.");
  });

  it("keeps @see when it points somewhere else", () => {
    const raw = "Opens the menu.\n\n@see {@link useDisclosure}";
    expect(describeComponent(raw)).toBe("Opens the menu.\n\nSee also: `useDisclosure`");
  });

  it("promotes @remarks into the visible description", () => {
    const raw = "Summary line.\n\n@remarks\nThe part that explains the trade-off.";
    expect(describeComponent(raw)).toBe("Summary line.\n\nThe part that explains the trade-off.");
  });

  it("keeps @example, which carries the copyable snippet", () => {
    const raw = "Summary.\n\n@example\n```tsx\n<Badge>Hi</Badge>\n```";
    expect(describeComponent(raw)).toContain("<Badge>Hi</Badge>");
  });

  it("orders summary, remarks then example", () => {
    const raw = "S.\n\n@remarks\nR.\n\n@example\nE.";
    expect(describeComponent(raw)).toBe("S.\n\nR.\n\nE.");
  });
});

describe("enhanceArgTypesFromDocgen", () => {
  it("returns the arg types untouched when the component has no docgen", () => {
    const argTypes = { variant: { name: "variant" } } as never;
    expect(enhanceArgTypesFromDocgen(argTypes, {})).toBe(argTypes);
  });

  it("fills the Default column from @defaultValue", () => {
    // Storybook only reads a destructuring default, so a default applied by a
    // cva `defaultVariants` block is invisible without this.
    const argTypes = { variant: { name: "variant", table: {} } } as never;
    const component = withDocgen({
      variant: { description: 'Visual emphasis.\n\n@defaultValue "primary"' },
    });
    const out = enhanceArgTypesFromDocgen(argTypes, component) as never as Record<
      string,
      { table: { defaultValue?: { summary: string } } }
    >;
    expect(out.variant.table.defaultValue).toEqual({ summary: '"primary"' });
  });

  it("does not overwrite a default the story already set", () => {
    const argTypes = {
      variant: { name: "variant", table: { defaultValue: { summary: "from story" } } },
    } as never;
    const component = withDocgen({ variant: { description: '@defaultValue "primary"' } });
    const out = enhanceArgTypesFromDocgen(argTypes, component) as never as Record<
      string,
      { table: { defaultValue: { summary: string } } }
    >;
    expect(out.variant.table.defaultValue.summary).toBe("from story");
  });

  it("folds @remarks into the description", () => {
    const argTypes = { variant: { name: "variant", description: "old" } } as never;
    const component = withDocgen({
      variant: { description: "Visual emphasis.\n\n@remarks\nOrthogonal to sentiment." },
    });
    const out = enhanceArgTypesFromDocgen(argTypes, component) as never as Record<
      string,
      { description: string }
    >;
    expect(out.variant.description).toBe("Visual emphasis.\n\nOrthogonal to sentiment.");
  });

  it("ignores props the docgen record does not mention", () => {
    const argTypes = { onlyInStory: { name: "onlyInStory", description: "kept" } } as never;
    const out = enhanceArgTypesFromDocgen(argTypes, withDocgen({})) as never as Record<
      string,
      { description: string }
    >;
    expect(out.onlyInStory.description).toBe("kept");
  });
});

describe("mergeInheritedArgTypes", () => {
  it("is a no-op when no base is given", () => {
    const argTypes = { label: { name: "label" } } as never;
    expect(mergeInheritedArgTypes(argTypes, undefined)).toBe(argTypes);
  });

  it("adds a prop the styled layer inherits but does not re-declare", () => {
    // `CheckboxProps extends CheckboxBaseProps`, and docgen does not follow
    // `extends` across modules, so `indeterminate` is otherwise missing.
    const argTypes = { label: { name: "label" } } as never;
    const base = withDocgen({
      indeterminate: { description: "Mixed state.", required: false, tsType: { name: "boolean" } },
    });
    const out = mergeInheritedArgTypes(argTypes, base) as never as Record<
      string,
      { description: string; table: { type?: { summary: string } } }
    >;
    expect(out.indeterminate.description).toBe("Mixed state.");
    expect(out.indeterminate.table.type).toEqual({ summary: "boolean" });
  });

  it("does not replace a prop the styled layer already documents", () => {
    const argTypes = { label: { name: "label", description: "styled wins" } } as never;
    const base = withDocgen({ label: { description: "base loses" } });
    const out = mergeInheritedArgTypes(argTypes, base) as never as Record<
      string,
      { description: string }
    >;
    expect(out.label.description).toBe("styled wins");
  });

  it("backfills a description onto a prop a story declared as a bare control", () => {
    // `argTypes: { indeterminate: { control: "boolean" } }` creates an entry
    // with no description, which then shadowed the documented one on the base.
    // An entry that exists is not the same as an entry that is documented.
    const argTypes = { indeterminate: { name: "indeterminate", control: "boolean" } } as never;
    const base = withDocgen({
      indeterminate: {
        description: "Show the mixed state.\n@remarks A DOM property, not an attribute.",
      },
    });
    const out = mergeInheritedArgTypes(argTypes, base) as never as Record<
      string,
      { description: string; control: string }
    >;
    expect(out.indeterminate.description).toBe(
      "Show the mixed state.\n\nA DOM property, not an attribute.",
    );
    // The story's own control must survive the backfill.
    expect(out.indeterminate.control).toBe("boolean");
  });

  it("backfills a default onto a prop the styled layer re-declared without one", () => {
    // A styled wrapper that restates its props but not their defaults leaves the
    // column empty; the default is applied by the base.
    const argTypes = { mode: { name: "mode", table: {} } } as never;
    const base = withDocgen({ mode: { defaultValue: { value: '"single"' } } });
    const out = mergeInheritedArgTypes(argTypes, base) as never as Record<
      string,
      { table: { defaultValue?: { summary: string } } }
    >;
    expect(out.mode.table.defaultValue).toEqual({ summary: '"single"' });
  });

  it("prefers a documented default over none at all on an inherited prop", () => {
    const base = withDocgen({
      weekStartsOn: { description: "First day.\n\n@defaultValue 1" },
    });
    const out = mergeInheritedArgTypes({} as never, base) as never as Record<
      string,
      { table: { defaultValue?: { summary: string } } }
    >;
    expect(out.weekStartsOn.table.defaultValue).toEqual({ summary: "1" });
  });

  it("skips props the styled layer omits from the base", () => {
    // `extends Omit<PriceInputBaseProps, "classNames">` means the styled
    // component does not accept it. Documenting it advertises an API that does
    // not compile.
    const base = withDocgen({
      classNames: { description: "Style injection." },
      tickSize: { description: "Smallest increment." },
    });
    const out = mergeInheritedArgTypes({} as never, base, ["classNames"]) as never as Record<
      string,
      unknown
    >;
    expect(out.classNames).toBeUndefined();
    expect(out.tickSize).toBeDefined();
  });

  it("omits nothing when no list is given", () => {
    const base = withDocgen({ classNames: { description: "Style injection." } });
    const out = mergeInheritedArgTypes({} as never, base) as never as Record<string, unknown>;
    expect(out.classNames).toBeDefined();
  });

  it("leaves the default absent when the base states none", () => {
    const base = withDocgen({ onSelect: { description: "Fired on selection." } });
    const out = mergeInheritedArgTypes({} as never, base) as never as Record<
      string,
      { table: { defaultValue?: { summary: string } } }
    >;
    expect(out.onSelect.table.defaultValue).toBeUndefined();
  });
});
