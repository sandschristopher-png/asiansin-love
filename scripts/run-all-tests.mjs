// `npm test`: runs every "<name>:test" script in package.json, one after another, and fails if any of them fails.
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const scripts = JSON.parse(fs.readFileSync('package.json', 'utf8')).scripts ?? {};
const suites = Object.keys(scripts).filter((name) => name.endsWith(':test'));
const failed = [];
for (const name of suites) {
  console.log(`\n=== npm run ${name}`);
  const run = spawnSync('npm', ['run', name, '--silent'], { stdio: 'inherit', shell: true });
  if (run.status !== 0) failed.push(name);
}
console.log(`\n${suites.length - failed.length}/${suites.length} suites passed${failed.length ? `; failed: ${failed.join(', ')}` : ''}`);
process.exit(failed.length ? 1 : 0);
