import type { StrictArgTypes } from "storybook/internal/types";

/**
 * Post-processing for the metadata `react-docgen` produces.
 *
 * Two things arrive wrong by default, on every component:
 *
 * 1. **Block tags survive in component descriptions.** `@see {@link BadgeProps}`
 *    renders as literal text on the page, braces and all.
 * 2. **`@defaultValue` and `@remarks` are thrown away on props.** Storybook
 *    strips recognised tags out of a prop description but only fills the
 *    Default column from a destructuring default or `defaultProps`. Defaults
 *    that live in a cva `defaultVariants` block, or are only documented, leave
 *    the column empty even though the JSDoc states them.
 *
 * Fixed here rather than in 32 components, so a newly written `@defaultValue`
 * shows up without anyone wiring it to a story.
 */

/** Built in `main.ts`: exported symbol name to its path from the repo root. */
declare const __FINRA_SYMBOL_INDEX__: Record<string, string>;

const SYMBOLS: Record<string, string> =
  typeof __FINRA_SYMBOL_INDEX__ === "undefined" ? {} : __FINRA_SYMBOL_INDEX__;

const SOURCE_BASE = "https://github.com/utk09/finra-ui/blob/main/";

/**
 * Turn `{@link Symbol}` into a Markdown link to the declaration.
 *
 * A member reference (`{@link ToastApi.success}`) resolves on the part before
 * the dot, which is the file that declares it. Anything the index does not know
 * falls back to inline code, so an unresolved name still reads as a symbol
 * rather than as punctuation.
 */
export function linkifySymbols(text: string): string {
  return text.replace(/\{@link\s+([A-Za-z_$][\w$]*)((?:[.#][\w$]+)*)\}/g, (_, name, member) => {
    const path = SYMBOLS[name];
    const label = `${name}${(member as string).replace(/#/g, ".")}`;
    return path ? `[\`${label}\`](${SOURCE_BASE}${path})` : `\`${label}\``;
  });
}

/** Everything before the first block tag. */
function summaryOf(text: string): string {
  return text.split(/^@\w+/m)[0].trim();
}

/**
 * Body of one block tag, e.g. `remarks`. Empty when the tag is absent.
 *
 * Deliberately not using the `m` flag: with it, `$` matches the end of a *line*
 * and the body is truncated after the first one, which silently swallowed
 * multi-line `@example` blocks.
 */
function tagBody(text: string, tag: string): string {
  const match = text.match(new RegExp(`(?:^|\\n)@${tag}[ \\t]*\\n?([\\s\\S]*?)(?=\\n@\\w+|$)`));
  return match ? match[1].trim() : "";
}

/** Single-line tag value, e.g. `@defaultValue "primary"`. Here `m` is correct. */
function tagValue(text: string, tag: string): string {
  const match = text.match(new RegExp(`^@${tag}[ \\t]+(.+)$`, "m"));
  return match ? match[1].trim() : "";
}

/**
 * Rebuild a component description for display.
 *
 * Keeps the summary and `@remarks`, drops `@see` when it only points at the
 * props interface the table below already documents, and links anything else.
 */
export function describeComponent(raw: string | undefined): string {
  if (!raw) return "";
  const parts = [summaryOf(raw)];

  const remarks = tagBody(raw, "remarks");
  if (remarks) parts.push(remarks);

  const see = tagValue(raw, "see");
  // `@see {@link XProps}` is the convention for "the props are documented on
  // the interface". On a page that renders that interface as a table directly
  // below, repeating it is noise.
  if (see && !/^\{@link\s+\w*Props\}$/.test(see)) parts.push(`See also: ${see}`);

  const example = tagBody(raw, "example");
  if (example) parts.push(example);

  return linkifySymbols(parts.filter(Boolean).join("\n\n"));
}

/** Docgen shape we read off the component. Only the fields used here. */
interface DocgenProp {
  description?: string;
  defaultValue?: { value?: string } | null;
  required?: boolean;
  tsType?: { name?: string; raw?: string };
}

/** Read the docgen record off a component, if the plugin attached one. */
function docgenPropsOf(component: unknown): Record<string, DocgenProp> | undefined {
  return (component as { __docgenInfo?: { props?: Record<string, DocgenProp> } })?.__docgenInfo
    ?.props;
}

/**
 * Add the props a styled component inherits from its unstyled base.
 *
 * `react-docgen` reads a component's own interface and stops there: it does not
 * follow `extends CheckboxBaseProps` into another module, so a styled component
 * documents only what it adds. The base is a real component with its own
 * docgen record, so the missing props can be merged in from there.
 *
 * Opt in per story with `parameters.docs.inheritsFrom`, which keeps the
 * relationship explicit and greppable. Where the styled props narrow the base
 * with `Omit`, mirror that list in `inheritedOmit` or the table will advertise
 * props the component does not accept:
 *
 * ```ts
 * parameters: {
 *   docs: { inheritsFrom: PriceInputBase, inheritedOmit: ["classNames", "dataAttributes"] },
 * }
 * ```
 */
export function mergeInheritedArgTypes(
  argTypes: StrictArgTypes,
  base: unknown,
  omit: readonly string[] = [],
): StrictArgTypes {
  const props = docgenPropsOf(base);
  if (!props) return argTypes;

  const excluded = new Set(omit);
  for (const [name, prop] of Object.entries(props)) {
    // A styled wrapper that declares `extends Omit<XBaseProps, "classNames">`
    // does not accept those props. Merging them anyway documents an API that
    // does not compile.
    if (excluded.has(name)) continue;
    const existing = argTypes[name];
    if (existing) {
      // The prop is already listed, but a styled wrapper that re-declares its
      // props without re-stating the defaults leaves the column empty. The
      // default is applied by the base, so read it from there.
      const value = prop.defaultValue?.value ?? tagValue(prop.description ?? "", "defaultValue");
      if (value && !existing.table?.defaultValue?.summary) {
        existing.table = { ...existing.table, defaultValue: { summary: value } };
      }
      // A story that declares only a control (`indeterminate: { control:
      // "boolean" }`) creates an entry with no description, which then shadows
      // the documented one on the base. Fill it rather than skip it: an entry
      // that exists is not the same as an entry that is documented.
      if (!existing.description) {
        const own = summaryOf(prop.description ?? "");
        const detail = tagBody(prop.description ?? "", "remarks");
        const text = [own, detail].filter(Boolean).join("\n\n");
        if (text) existing.description = linkifySymbols(text);
      }
      continue;
    }
    const summary = summaryOf(prop.description ?? "");
    const remarks = tagBody(prop.description ?? "", "remarks");
    argTypes[name] = {
      name,
      description: linkifySymbols([summary, remarks].filter(Boolean).join("\n\n")),
      type: { name: "other", required: prop.required ?? false },
      table: {
        type: prop.tsType?.name ? { summary: prop.tsType.name } : undefined,
        defaultValue: (() => {
          const value =
            prop.defaultValue?.value ?? tagValue(prop.description ?? "", "defaultValue");
          return value ? { summary: value } : undefined;
        })(),
      },
    } as StrictArgTypes[string];
  }
  return argTypes;
}

/**
 * Fill in what Storybook drops: documented defaults, and `@remarks` prose.
 *
 * Runs against the raw docgen record rather than the already-parsed argType,
 * because Storybook removes the block tags before the argType is built.
 */
export function enhanceArgTypesFromDocgen(
  argTypes: StrictArgTypes,
  component: unknown,
): StrictArgTypes {
  const props = docgenPropsOf(component);
  if (!props) return argTypes;

  for (const [name, argType] of Object.entries(argTypes)) {
    const raw = props[name]?.description;
    if (!raw) continue;

    const documented = tagValue(raw, "defaultValue");
    const existing = argType.table?.defaultValue?.summary;
    if (documented && !existing) {
      argType.table = { ...argType.table, defaultValue: { summary: documented } };
    }

    const remarks = tagBody(raw, "remarks");
    const summary = summaryOf(raw);
    const description = [summary, remarks].filter(Boolean).join("\n\n");
    if (description) argType.description = linkifySymbols(description);
  }

  return argTypes;
}
