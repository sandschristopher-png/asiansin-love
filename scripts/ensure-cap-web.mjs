// Capacitor needs its webDir (out/) to exist before `cap sync`, but the app is loaded from https://meetin.asia and ships
// no web assets. out/ is not committed, so a fresh clone gets a one-line placeholder here. Run via `npm run cap:sync`.
import fs from 'node:fs';
import path from 'node:path';

const dir = path.resolve('out');
const index = path.join(dir, 'index.html');
if (!fs.existsSync(index)) {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    index,
    '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Meet in Asia</title></head><body style="margin:0;background:#fff"></body></html>\n'
  );
  console.log('created out/index.html (placeholder for cap sync)');
}
