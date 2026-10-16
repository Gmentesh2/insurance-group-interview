import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
export const root = fileURLToPath(new URL('../', import.meta.url));
export async function config() {
  const text = await readFile(resolve(root, '.env'), 'utf8').catch(() => { throw new Error('Run node scripts/configure.mjs first.'); });
  const env = Object.fromEntries(text.split('\n').filter(line => /^[A-Za-z][A-Za-z0-9_]*=/.test(line)).map(line => { const i = line.indexOf('='); return [line.slice(0, i), line.slice(i + 1)]; }));
  return { ...process.env, ...env };
}
