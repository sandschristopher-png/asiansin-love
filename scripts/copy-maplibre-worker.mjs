// maplibre-gl 6 runs its tile worker as a module worker, and the bundler cannot resolve that worker's URL (the page then
// fails with "Worker failed to load"). So the worker file is served as a plain static file from public/ and the map is told
// where it is (MapCanvas calls setWorkerUrl). Runs before dev and build (package.json predev / prebuild); the copy is
// not committed.
import fs from 'node:fs';
import path from 'node:path';

const from = path.resolve('node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs');
const to = path.resolve('public/maplibre-gl-worker.mjs');
if (!fs.existsSync(from)) {
  console.warn('maplibre-gl is not installed: skipped copying its worker');
  process.exit(0);
}
fs.copyFileSync(from, to);
console.log('copied maplibre-gl-worker.mjs to public/');
