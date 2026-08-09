import { type CSSProperties, useMemo, useState } from "react";

/**
 * Live token reference, parsed from the library's own SCSS.
 *
 * Nothing here is hand-maintained. `import.meta.glob` pulls every
 * `tokens/_*.scss` in as raw text at build time, so a new token, or a whole new
 * token file, appears on the page as soon as it is written, and a removed one
 * disappears. The reference cannot drift from the stylesheet it documents.
 *
 * The trade: this parses SCSS with regular expressions rather than a real
 * parser. It handles what the token files contain today, which is one selector
 * block per line, one custom property per line, and `//` or block comments.
 * Nesting or interpolation would need a proper parser.
 */

//  Parsing

/** One custom property declaration, as written. */
interface Declaration {
  /** Full property name, including the leading dashes. */
  name: string;
  /** Right-hand side exactly as authored, e.g. `var(--finra-color-primary-600)`. */
  value: string;
  /** Which selector block it was declared in, normalised to a short label. */
  variant: string;
}

/** All declarations from one `_*.scss` file. */
interface TokenFile {
  /** Slug taken from the filename, e.g. `color`. */
  id: string;
  /** Column order for this file, `default` first. */
  variants: string[];
  /** One entry per token name, in declaration order. */
  tokens: { name: string; values: Record<string, string> }[];
}

/**
 * Turn a selector into a column label.
 *
 * `:root` is the base declaration, and the attribute selectors are the theme
 * and density overrides. Anything unrecognised keeps its selector verbatim
 * rather than being dropped, so a new kind of override is visible rather than
 * silently missing.
 */
function variantOf(selector: string): string {
  if (selector === ":root") return "default";
  const attr = selector.match(/^\[data-(?:theme|density)="([\w-]+)"\]$/);
  return attr ? attr[1] : selector;
}

const DECLARATION = /^(--[\w-]+)\s*:\s*(.+?);?\s*$/;

/** Extract every custom property from one stylesheet's source text. */
export function parseTokenFile(id: string, source: string): TokenFile {
  // Give every brace and declaration its own line before walking. The token
  // files are written one property per line today, but a single-line block is
  // valid SCSS and would otherwise be parsed as nothing at all, which is a
  // silent wrong answer on a page whose whole point is not drifting.
  const normalised = source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\{/g, "{\n")
    .replace(/\}/g, "\n}\n")
    .replace(/;/g, ";\n");

  const stack: string[] = [];
  const declarations: Declaration[] = [];

  for (const rawLine of normalised.split("\n")) {
    const line = rawLine.replace(/\/\/.*$/, "").trim();
    if (!line) continue;

    if (line.endsWith("{")) {
      stack.push(line.slice(0, -1).trim());
      continue;
    }
    if (line === "}") {
      stack.pop();
      continue;
    }

    const match = line.match(DECLARATION);
    if (match && stack.length > 0) {
      declarations.push({
        name: match[1],
        value: match[2].trim(),
        variant: variantOf(stack[stack.length - 1]),
      });
    }
  }

  // Preserve authoring order, which groups related tokens far better than
  // alphabetical would - the neutral ramp reads as a ramp.
  const byName = new Map<string, Record<string, string>>();
  for (const d of declarations) {
    const existing = byName.get(d.name);
    if (existing) existing[d.variant] = d.value;
    else byName.set(d.name, { [d.variant]: d.value });
  }

  const seen = new Set(declarations.map((d) => d.variant));
  const variants = ["default", ...[...seen].filter((v) => v !== "default").sort()];

  return {
    id,
    variants,
    tokens: [...byName].map(([name, values]) => ({ name, values })),
  };
}

/**
 * Every token file, newest state on every build.
 *
 * The glob is relative to this file: `docs/` -> `apps/storybook/` -> `apps/`
 * -> repo root. Eager so the page needs no async state.
 */
const SOURCES = import.meta.glob("../../../packages/*/src/tokens/_*.scss", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;

/** Human-facing section titles. Unlisted files fall back to their slug. */
const FILE_TITLES: Record<string, string> = {
  color: "Colour palette",
  semantic: "Semantic characteristics",
  density: "Density",
  spacing: "Spacing",
  typography: "Typography",
  radius: "Radius",
  shadows: "Shadows",
  sizing: "Shared sizes",
  misc: "Motion, focus, stacking and cursors",
};

/** Order sections so the tiers read top to bottom; the rest follow. */
const FILE_ORDER = [
  "color",
  "semantic",
  "spacing",
  "typography",
  "radius",
  "shadows",
  "sizing",
  "misc",
];

/** Every parsed token file, in display order. Exported so tests can assert on it. */
export const TOKEN_FILES: TokenFile[] = Object.entries(SOURCES)
  .map(([path, source]) => {
    const id =
      path
        .split("/")
        .pop()
        ?.replace(/^_/, "")
        .replace(/\.scss$/, "") ?? path;
    return parseTokenFile(id, source);
  })
  .filter((file) => file.tokens.length > 0)
  .sort((a, b) => {
    const ai = FILE_ORDER.indexOf(a.id);
    const bi = FILE_ORDER.indexOf(b.id);
    return (ai === -1 ? FILE_ORDER.length : ai) - (bi === -1 ? FILE_ORDER.length : bi);
  });

/** Total token count, for the summary line. */
export const TOKEN_COUNT = TOKEN_FILES.reduce((n, f) => n + f.tokens.length, 0);

//  Rendering

const mono: CSSProperties = {
  fontFamily: "var(--finra-font-mono, ui-monospace, monospace)",
  fontSize: "0.75rem",
};

const cell: CSSProperties = {
  ...mono,
  padding: "0.35rem 0.6rem",
  borderBlockEnd: "var(--finra-border-thin) solid var(--finra-container-border)",
  textAlign: "start",
  verticalAlign: "middle",
};

/**
 * Colour chip for a token, or nothing when the token is not a colour.
 *
 * `CSS.supports` is asked about the *authored* value, which is right for a
 * literal and wrong-but-harmless for a `var()` alias: aliases in these files
 * only ever point at other tokens in the same tier, so the chip is shown when
 * the name says colour. The chip itself paints with `var()`, so whatever it
 * resolves to is what you see, and it follows the Theme toolbar for free.
 */
function looksLikeColour(name: string, value: string): boolean {
  if (value.startsWith("var("))
    return /color|accent|foreground|background|border|subtle/.test(name);
  return CSS.supports("color", value);
}

function TokenRow({ token, variants }: { token: TokenFile["tokens"][number]; variants: string[] }) {
  const primary = token.values.default ?? Object.values(token.values)[0] ?? "";
  const colour = looksLikeColour(token.name, primary);

  return (
    <tr>
      <th scope="row" style={{ ...cell, fontWeight: 400 }}>
        <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {colour ? (
            <span
              aria-hidden="true"
              style={{
                inlineSize: "1rem",
                blockSize: "1rem",
                flex: "0 0 auto",
                borderRadius: "4px",
                border: "var(--finra-border-thin) solid var(--finra-container-border)",
                background: `var(${token.name})`,
              }}
            />
          ) : null}
          <span style={{ overflowWrap: "anywhere" }}>{token.name}</span>
        </span>
      </th>
      {variants.map((variant) => (
        <td key={variant} style={{ ...cell, color: "var(--finra-container-foreground-muted)" }}>
          {token.values[variant] ?? ""}
        </td>
      ))}
    </tr>
  );
}

/**
 * Narrow the reference to tokens matching `needle`.
 *
 * Matches on the name or on any of the values, so searching `0.5rem` finds
 * every token set to it and `neutral` finds the ones aliasing that ramp. Files
 * left with nothing are dropped rather than rendering an empty table.
 */
export function filterTokenFiles(files: TokenFile[], needle: string): TokenFile[] {
  if (!needle) return files;
  return files
    .map((file) => ({
      ...file,
      tokens: file.tokens.filter(
        (t) =>
          t.name.toLowerCase().includes(needle) ||
          Object.values(t.values).some((v) => v.toLowerCase().includes(needle)),
      ),
    }))
    .filter((file) => file.tokens.length > 0);
}

/**
 * Searchable reference for every token the library declares.
 *
 * One table per source file, one column per selector block that file defines,
 * so the theme and density overrides sit beside the value they replace instead
 * of in a separate list nobody cross-references.
 */
export function TokenReference({ files = TOKEN_FILES }: { files?: TokenFile[] } = {}) {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const filtered = useMemo(() => filterTokenFiles(files, needle), [needle, files]);

  const total = files.reduce((n, f) => n + f.tokens.length, 0);
  const shown = filtered.reduce((n, f) => n + f.tokens.length, 0);

  return (
    <div>
      <label
        style={{
          display: "block",
          marginBlockEnd: "0.4rem",
          fontSize: "0.875rem",
          fontWeight: 600,
          color: "var(--finra-container-foreground)",
        }}>
        Filter tokens
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="accent, neutral, density, 0.5rem"
          style={{
            display: "block",
            inlineSize: "100%",
            marginBlockStart: "0.3rem",
            padding: "0.5rem 0.75rem",
            fontSize: "0.875rem",
            fontWeight: 400,
            color: "var(--finra-container-foreground)",
            background: "var(--finra-container-background)",
            border: "var(--finra-border-thin) solid var(--finra-container-border)",
            borderRadius: "8px",
          }}
        />
      </label>

      <p
        aria-live="polite"
        style={{ fontSize: "0.8rem", color: "var(--finra-container-foreground-muted)" }}>
        Showing {shown} of {total} tokens.
      </p>

      {filtered.map((file) => (
        <section key={file.id} style={{ margin: "1.75rem 0" }}>
          <h3 style={{ fontSize: "1rem", margin: "0 0 0.5rem" }}>
            {FILE_TITLES[file.id] ?? file.id}
          </h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{ inlineSize: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th scope="col" style={{ ...cell, fontSize: "0.75rem" }}>
                    Token
                  </th>
                  {file.variants.map((variant) => (
                    <th key={variant} scope="col" style={{ ...cell, fontSize: "0.75rem" }}>
                      {variant}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {file.tokens.map((token) => (
                  <TokenRow key={token.name} token={token} variants={file.variants} />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      {filtered.length === 0 ? (
        <p style={{ color: "var(--finra-container-foreground-muted)" }}>
          No token matches <code>{query}</code>.
        </p>
      ) : null}
    </div>
  );
}

/**
 * Every token and its default value as a paste-ready CSS block.
 *
 * The point of the page for anyone bringing their own stylesheet: one place to
 * copy from, rather than reading the tables and retyping names.
 */
export function TokenOverrideTemplate({ files = TOKEN_FILES }: { files?: TokenFile[] } = {}) {
  const css = useMemo(() => {
    const lines: string[] = [":root {"];
    for (const file of files) {
      lines.push(`  /* ${FILE_TITLES[file.id] ?? file.id} */`);
      for (const token of file.tokens) {
        if (token.values.default) lines.push(`  ${token.name}: ${token.values.default};`);
      }
    }
    lines.push("}");
    return lines.join("\n");
  }, [files]);

  return (
    <pre
      style={{
        ...mono,
        maxBlockSize: "24rem",
        overflow: "auto",
        padding: "1rem",
        border: "var(--finra-border-thin) solid var(--finra-container-border)",
        borderRadius: "10px",
        background: "var(--finra-container-background)",
        color: "var(--finra-container-foreground)",
      }}>
      <code>{css}</code>
    </pre>
  );
}
