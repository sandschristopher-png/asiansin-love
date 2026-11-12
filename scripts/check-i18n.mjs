// Locale parity check. Run: npm run i18n:check
// Every locale must have exactly the keys of messages/en.json, with the same {placeholders},
// no empty values, and no emoji or flag characters. Exits 1 on any problem.
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'messages');
const LOCALES = ['en', 'fil', 'vi', 'th', 'id', 'ms', 'km', 'es', 'ja', 'ko', 'zh'];

function flatten(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object') flatten(v, key, out);
    else out[key] = v;
  }
  return out;
}

const placeholders = (s) => [...String(s).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');
// Pictographs, regional-indicator flags, variation selector-16 and ZWJ sequences.
const EMOJI = /[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}️‍]/u;

const files = readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => f.replace('.json', ''));
const problems = [];
for (const l of LOCALES) if (!files.includes(l)) problems.push(`missing file messages/${l}.json`);
for (const f of files) if (!LOCALES.includes(f)) problems.push(`unexpected file messages/${f}.json`);

const en = flatten(JSON.parse(readFileSync(join(dir, 'en.json'), 'utf8')));
const enKeys = Object.keys(en);

for (const l of LOCALES) {
  if (!files.includes(l)) continue;
  const m = flatten(JSON.parse(readFileSync(join(dir, `${l}.json`), 'utf8')));
  for (const k of enKeys) {
    if (!(k in m)) problems.push(`${l}: missing key ${k}`);
    else {
      if (typeof m[k] !== 'string' || m[k].trim() === '') problems.push(`${l}: empty value ${k}`);
      if (placeholders(m[k]) !== placeholders(en[k])) problems.push(`${l}: placeholder mismatch ${k} (en {${placeholders(en[k])}} vs {${placeholders(m[k])}})`);
      if (EMOJI.test(m[k])) problems.push(`${l}: emoji or flag in ${k}`);
    }
  }
  for (const k of Object.keys(m)) if (!(k in en)) problems.push(`${l}: extra key ${k}`);
}

if (problems.length) {
  console.error(problems.slice(0, 60).join('\n'));
  if (problems.length > 60) console.error(`... and ${problems.length - 60} more`);
  console.error(`\ni18n parity FAILED (${problems.length} problems)`);
  process.exit(1);
}
console.log(`i18n parity OK: ${LOCALES.length} locales x ${enKeys.length} keys, placeholders match, no emoji`);
