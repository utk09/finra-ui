import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { parseHexColor, type Rgb } from "../src/logic/contrast";

const TOKENS_DIR = join(dirname(fileURLToPath(import.meta.url)), "../src/tokens");

/**
 * The token files that declare colour. Density, sizing and motion carry no
 * colour, so resolving them would only add noise to a lookup failure.
 */
const COLOUR_FILES = ["_color.scss", "_semantic.scss"];

/** A theme, named by the `data-theme` value that selects it. */
export type ThemeName = "default" | "dark";

interface Block {
  selector: string;
  body: string;
}

/**
 * Split a stylesheet into its top-level rule blocks.
 *
 * @remarks
 * The colour token files are deliberately flat: a selector, then declarations,
 * with no nesting. Anything nested would be silently mis-scoped here, which is why the caller asserts the shape it depends on rather than trusting it.
 */
function blocks(source: string): Block[] {
  const withoutComments = source.replace(/\/\/.*$/gm, "");
  const found: Block[] = [];
  const pattern = /([^{}]+)\{([^{}]*)\}/g;
  let match = pattern.exec(withoutComments);
  while (match !== null) {
    found.push({ selector: match[1].trim(), body: match[2] });
    match = pattern.exec(withoutComments);
  }
  return found;
}

function declarations(body: string): Map<string, string> {
  const found = new Map<string, string>();
  for (const statement of body.split(";")) {
    const match = statement.match(/(--[\w-]+)\s*:\s*([\s\S]+)/);
    if (match) found.set(match[1].trim(), match[2].trim());
  }
  return found;
}

function scopeOf(selector: string): ThemeName | null {
  if (selector.includes('[data-theme="dark"]')) return "dark";
  if (selector.includes(":root")) return "default";
  return null;
}

/**
 * Resolve a set of stylesheets into every colour token, as the given theme sees
 * it, with each value reduced to a literal.
 *
 * @remarks
 * Declarations are layered the way the cascade layers them: `:root` first, then
 * the theme's own block on top. That is what makes an alias declared only on
 * `:root` resolve against the theme's values here, matching how the browser
 * substitutes a custom property at the element carrying the declaration.
 *
 * Takes source text rather than paths so that a malformed graph can be handed
 * to it directly. The failure modes below are the point of the function, and an
 * error path that cannot be reached from a test is an error path nobody has
 * checked.
 *
 * @throws If a `var()` reference names a token that does not exist, or if the
 * chain does not terminate. Both mean the token graph is broken, which is worth
 * failing on rather than skipping past.
 */
export function resolveTokenGraph(sources: string[], theme: ThemeName): Map<string, string> {
  const declared = new Map<string, string>();
  const scopes: ThemeName[] = theme === "default" ? ["default"] : ["default", theme];

  for (const scope of scopes) {
    for (const source of sources) {
      for (const block of blocks(source)) {
        if (scopeOf(block.selector) !== scope) continue;
        for (const [name, value] of declarations(block.body)) declared.set(name, value);
      }
    }
  }

  const resolve = (value: string, seen: string[]): string => {
    const alias = value.match(/^var\((--[\w-]+)\)$/);
    if (!alias) return value;

    const name = alias[1];
    if (seen.includes(name)) throw new Error(`token alias cycle: ${[...seen, name].join(" -> ")}`);

    const next = declared.get(name);
    if (next === undefined) throw new Error(`token ${name} is referenced but never declared`);

    return resolve(next, [...seen, name]);
  };

  const resolved = new Map<string, string>();
  for (const [name, value] of declared) resolved.set(name, resolve(value, [name]));
  return resolved;
}

/** {@link resolveTokenGraph} over the colour token files this package ships. */
export function readThemeTokens(theme: ThemeName): Map<string, string> {
  const sources = COLOUR_FILES.map((file) => readFileSync(join(TOKENS_DIR, file), "utf8"));
  return resolveTokenGraph(sources, theme);
}

/**
 * Look a token up and parse it, failing with the token's name rather than with
 * `null` several frames later.
 */
export function tokenColour(tokens: Map<string, string>, name: string): Rgb {
  const value = tokens.get(name);
  if (value === undefined) throw new Error(`token ${name} is not declared`);

  const parsed = parseHexColor(value);
  if (!parsed) throw new Error(`token ${name} is ${value}, which is not an opaque hex colour`);

  return parsed;
}
