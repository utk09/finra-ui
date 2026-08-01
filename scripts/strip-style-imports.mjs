/**
 * Remove stylesheet side-effect imports from emitted declaration files.
 *
 * `tsc` always preserves side-effect imports in `.d.ts` output, including
 * `import "./styles/global.scss"`. That line is meaningless in a declaration
 * (a stylesheet has no types) and actively harmful once published: the path
 * resolves relative to `dist`, where no `.scss` exists, so a consumer without
 * `skipLibCheck` gets TS2307 from our own type definitions.
 *
 * The alternative would be shipping an ambient `declare module "*.scss"`, which
 * would silently type every stylesheet import in the consumer's own code. That
 * is a worse trade, so the imports are stripped instead.
 *
 * Usage: node ../../scripts/strip-style-imports.mjs [outDir]
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const STYLE_IMPORT = /^\s*import\s+["'][^"']+\.(?:s?css)["'];?\s*$/gm;

/** Every `.d.ts` under `dir`, recursively. */
function declarationFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) out.push(...declarationFiles(path));
    else if (entry.endsWith(".d.ts")) out.push(path);
  }
  return out;
}

const outDir = resolve(process.argv[2] ?? "dist");
let changed = 0;

for (const file of declarationFiles(outDir)) {
  const source = readFileSync(file, "utf8");
  const stripped = source.replace(STYLE_IMPORT, "");
  if (stripped !== source) {
    writeFileSync(file, stripped);
    changed += 1;
  }
}

console.log(`strip-style-imports: cleaned ${changed} declaration file(s) in ${outDir}`);
