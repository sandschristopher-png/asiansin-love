// Tiny build step for the plain-node test scripts: transpiles the given lib/*.ts modules (and
// whatever lib modules they import) to ESM in a temp folder, then imports the entry module.
// Uses the project's own `typescript` package; no Next / bundler needed.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import ts from 'typescript';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = fs.mkdtempSync(path.join(os.tmpdir(), 'ail-ts-'));

const IMPORT_RE = /(from\s+|import\s*\(\s*|import\s+)(['"])(\.{1,2}\/[^'"]+|@\/lib\/[^'"]+)\2/g;

function build(libName, seen) {
  if (seen.has(libName)) return;
  seen.add(libName);
  const src = fs.readFileSync(path.join(ROOT, 'lib', `${libName}.ts`), 'utf8');
  const { outputText } = ts.transpileModule(src, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  const deps = [];
  const rewritten = outputText.replace(IMPORT_RE, (_m, kw, q, spec) => {
    const name = spec.replace(/^@\/lib\//, '').replace(/^\.\//, '').replace(/\.ts$/, '');
    deps.push(name);
    // Relative to this module, so nested libs (i18n/errors) can import top-level ones.
    const rel = path.posix.relative(path.posix.dirname(libName), name);
    return `${kw}${q}${rel.startsWith(".") ? rel : "./" + rel}.mjs${q}`;
  });
  const outFile = path.join(OUT, `${libName}.mjs`);
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, rewritten);
  deps.forEach((d) => build(d, seen));
}

export async function loadLib(libName) {
  build(libName, new Set());
  return import(pathToFileURL(path.join(OUT, `${libName}.mjs`)).href);
}

process.on('exit', () => {
  try {
    fs.rmSync(OUT, { recursive: true, force: true });
  } catch {
    // temp folder cleanup is best-effort
  }
});
