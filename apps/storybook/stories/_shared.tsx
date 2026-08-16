import type { Meta, StoryObj } from "@storybook/react-vite";
import { FINRA_UI_ATTR } from "@utk09/finra-ui";
import type { CSSProperties, ReactNode } from "react";

/**
 * Shared story furniture.
 *
 * Everything here exists to keep 35 story files saying the same thing the same
 * way. Import from `./_shared`; this file is not matched by the story glob, so
 * it never appears in the sidebar.
 */

//  Finding a rendered part

/**
 * A rendered part, by its `data-finra-ui` id, or `null`.
 *
 * @remarks
 * Use this in a play function rather than Testing Library's `getByTestId`.
 * `testIdAttribute` is remapped to `data-finra-ui` in
 * `.storybook/vitest.setup.ts`, which the `stories` Vitest project loads and
 * `preview.tsx` never does. A `getByTestId` therefore means the id under
 * `test:stories` and the default `data-testid` in the live `pnpm dev` preview,
 * where it throws; a `queryByTestId` is worse, because it quietly returns
 * `null` there and the assertion passes having checked nothing.
 *
 * Reading the attribute is also what a consumer's own CSS does, so a story that
 * measures through it is measuring the published override surface.
 */
export function part(scope: ParentNode, id: string): HTMLElement | null {
  return scope.querySelector<HTMLElement>(`[${FINRA_UI_ATTR}="${id}"]`);
}

/** Every rendered part carrying `id`, in document order. See {@link part}. */
export function parts(scope: ParentNode, id: string): HTMLElement[] {
  return [...scope.querySelectorAll<HTMLElement>(`[${FINRA_UI_ATTR}="${id}"]`)];
}

//  Dark mode coverage

/**
 * Spread into a story to render and audit it in dark mode.
 *
 * @remarks
 * Why this exists: the accessibility addon runs axe per story against whatever
 * globals that story resolves to, and every story used to resolve to
 * `theme: "light"`. Dark mode was therefore never audited at all, which is how
 * a set of overlays shipped with foreground and background resolving to the
 * same colour - text that was invisible rather than merely low contrast, and no
 * failing check anywhere.
 *
 * A per-story `globals` entry overrides the toolbar for that story only, so
 * these variants are audited in dark mode even on a normal light-mode run.
 *
 * For anything that opens - menu, listbox, dialog, tooltip, popup calendar -
 * pair this with a `play` that opens it and leaves it open. The addon's check
 * is an `afterEach`, so it sees the DOM as `play` left it; without that step
 * axe only ever inspects the closed trigger, and portalled content is never
 * examined.
 *
 * @example
 * ```tsx
 * export const DarkMode: Story = {
 *   ...darkMode,
 *   args: { children: "Save" },
 * };
 *
 * export const DarkModeOpen: Story = {
 *   ...darkMode,
 *   play: async ({ canvasElement }) => {
 *     await userEvent.click(within(canvasElement).getByRole("combobox"));
 *     await screen.findByRole("listbox");
 *   },
 * };
 * ```
 */
/**
 * The theme has to travel as a **parameter**, not only as a global.
 *
 * The Vitest browser runner does not apply a story's `globals`, so a story that
 * only sets `globals.theme` renders dark in the Storybook UI and light under
 * test - the accessibility check then audits the wrong theme and reports a
 * pass. `globals` is still set here so the toolbar reflects reality when you
 * open the story by hand; `parameters.theme` is what the preview decorator
 * actually reads, and what makes the check real.
 */
const DARK: { globals: { theme: string }; parameters: { theme: string } } = {
  globals: { theme: "dark" },
  parameters: { theme: "dark" },
};

export const darkMode = {
  ...DARK,
  parameters: {
    ...DARK.parameters,
    docs: {
      description: {
        story:
          "Rendered in dark mode. This variant exists so the accessibility check audits dark contrast, which the light-mode stories cannot do.",
      },
    },
  },
} satisfies Pick<StoryObj, "globals" | "parameters">;

/** As {@link darkMode}, but for a story whose `play` leaves an overlay open. */
export const darkModeOpen = {
  ...DARK,
  parameters: {
    ...DARK.parameters,
    docs: {
      description: {
        story:
          "Dark mode with the overlay left open by the play function, so axe inspects the portalled content rather than just the closed trigger.",
      },
    },
  },
} satisfies Pick<StoryObj, "globals" | "parameters">;

const DEFAULT_DARK_DESCRIPTION =
  "The same story in dark mode. It exists so the accessibility check audits dark contrast: a story only ever resolves to one theme, so light-mode stories cannot cover it.";

/**
 * Derive a dark-mode variant of an existing story.
 *
 * @remarks
 * Preferred over spreading {@link darkMode} directly, because a plain spread
 * replaces the base story's `parameters` wholesale and silently drops things
 * like its `layout`. This merges instead, so the variant differs from its base
 * in exactly one respect: the resolved theme.
 *
 * The base story's `args`, `render` and `play` all carry over. Inheriting
 * `play` is deliberate - an interaction worth asserting in light is worth
 * asserting in dark, and for anything portalled it is what puts the open state
 * in front of axe.
 *
 * @param base - The story to mirror.
 * @param description - Overrides the default note shown under the story.
 *
 * @example
 * ```tsx
 * export const DarkMode: Story = inDark(Primary);
 * ```
 */
export function inDark<S extends { parameters?: Record<string, unknown> }>(
  base: S,
  description: string = DEFAULT_DARK_DESCRIPTION,
): S {
  const docs = (base.parameters?.docs ?? {}) as Record<string, unknown>;
  return {
    ...base,
    globals: { ...((base as { globals?: object }).globals ?? {}), theme: "dark" },
    parameters: {
      ...base.parameters,
      // Read by the preview decorator. Must be a parameter, not only a global:
      // see the note on DARK above.
      theme: "dark",
      docs: { ...docs, description: { story: description } },
    },
  };
}

//  Layout

const stackBase: CSSProperties = { display: "flex", gap: "1rem" };

/** Vertical stack. Replaces the hand-written flex column in every showcase. */
export function Stack({
  children,
  gap = "1rem",
  align,
}: {
  children: ReactNode;
  gap?: string;
  align?: CSSProperties["alignItems"];
}) {
  return (
    <div style={{ ...stackBase, flexDirection: "column", gap, alignItems: align }}>{children}</div>
  );
}

/** Horizontal row that wraps. */
export function Row({
  children,
  gap = "0.75rem",
  align = "center",
}: {
  children: ReactNode;
  gap?: string;
  align?: CSSProperties["alignItems"];
}) {
  return <div style={{ ...stackBase, flexWrap: "wrap", alignItems: align, gap }}>{children}</div>;
}

/**
 * Labelled row, for showcases that compare one axis.
 *
 * The label is a real text node rather than a fixed-width span so it stays
 * legible at every density.
 */
export function LabelledRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
      <span
        style={{
          minInlineSize: "7rem",
          color: "var(--finra-container-foreground)",
          fontSize: "0.875rem",
        }}>
        {label}
      </span>
      {children}
    </div>
  );
}

/**
 * Re-point semantic tokens for everything inside.
 *
 * Backs the `Overrides` story each component carries. It demonstrates the
 * supported way to restyle: redeclare a token on an ancestor and every
 * component below follows, with no class name involved and dark mode still
 * working. Custom properties are valid in a React `style` object, but the type
 * does not admit them, hence the cast.
 */
export function TokenScope({
  tokens,
  children,
  align = "center",
}: {
  tokens: Record<string, string>;
  children: ReactNode;
  align?: CSSProperties["alignItems"];
}) {
  return (
    <div
      style={
        {
          display: "flex",
          flexWrap: "wrap",
          alignItems: align,
          gap: "0.75rem",
          ...tokens,
        } as CSSProperties
      }>
      {children}
    </div>
  );
}

//  Reusable argTypes
//
//  react-docgen reads each component's own interface, so props declared there
//  already arrive with their description and type. These fill the gaps it
//  cannot: grouping, and the handful of DOM attributes worth surfacing as
//  controls even though they are inherited rather than declared.

/** Group name for props that come from the underlying DOM element. */
export const NATIVE = "Native attributes";

/** Group name for the appearance axes shared across the library. */
export const APPEARANCE = "Appearance";

/**
 * Sentence for a component description, naming the element that receives
 * everything not listed in the table.
 *
 * @remarks
 * The prop tables deliberately omit inherited DOM attributes; a table with 250
 * rows helps nobody. This says where they go instead.
 *
 * Assign the result to `parameters.docs.forwardsTo`, which is appended to the
 * component's own docblock. `parameters.docs.description.component` is resolved
 * *instead of* the extractor that reads that docblock, so a story using it
 * replaces the component summary rather than adding to it.
 *
 * `ref` is a bare noun phrase: this supplies the article.
 */
export function forwardsTo(element: string, ref?: string): string {
  const refText = ref ? ` \`ref\` points at the ${ref}.` : "";
  return `Any prop not listed here is forwarded to the underlying \`${element}\`, including \`id\`, \`name\`, \`data-*\` and every ARIA attribute.${refText}`;
}

/** Controls for the DOM attributes most worth toggling on a form control. */
export const nativeFieldArgTypes = {
  disabled: {
    control: "boolean",
    description: "Native disabled state. A disabled control is not focusable and reports no value.",
    table: { category: NATIVE, type: { summary: "boolean" } },
  },
  required: {
    control: "boolean",
    description: "Native required state. Sets `aria-required` for assistive technology.",
    table: { category: NATIVE, type: { summary: "boolean" } },
  },
  readOnly: {
    control: "boolean",
    description: "Value is visible and focusable but not editable. Unlike `disabled`, it submits.",
    table: { category: NATIVE, type: { summary: "boolean" } },
  },
  placeholder: {
    control: "text",
    description: "Hint text. Never a substitute for a label, which `FormField` supplies.",
    table: { category: NATIVE, type: { summary: "string" } },
  },
  "aria-label": {
    control: "text",
    description:
      "Accessible name for a control with no visible label. Prefer a visible one via `FormField`; use this only where the surrounding design supplies the meaning.",
    table: { category: NATIVE, type: { summary: "string" } },
  },
} satisfies Meta["argTypes"];

/** Put the shared appearance axes in their own table group. */
export const appearanceArgTypes = {
  variant: { table: { category: APPEARANCE } },
  sentiment: { table: { category: APPEARANCE } },
  validationStatus: { table: { category: APPEARANCE } },
  fullWidth: { table: { category: APPEARANCE } },
} satisfies Meta["argTypes"];
