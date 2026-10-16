import { randomBytes } from 'node:crypto';
import { writeFile, chmod } from 'node:fs/promises';
import { resolve } from 'node:path';
import { root } from './config.mjs';
const password = randomBytes(24).toString('hex');
const operatorPassword = `Ig!${randomBytes(16).toString('hex')}Aa1`;
const content = `POSTGRES_PASSWORD=${password}\nConnectionStrings__Insurance=Host=127.0.0.1;Port=55462;Database=insurance_interview;Username=insurance_interview;Password=${password};Maximum Pool Size=10\nASPNETCORE_URLS=http://127.0.0.1:5081\nASPNETCORE_ENVIRONMENT=Development\nFrontendUrl=http://localhost:3001\nOperator__Email=operator@insurance.demo\nOperator__Password=${operatorPassword}\n`;
try {
  await writeFile(resolve(root, '.env'), content, {flag:'wx', mode:0o600});
  console.log('Created private local .env with generated database/operator credentials. No original project configuration was read.');
} catch(e) {if(e.code !== 'EEXIST')throw e;console.log('Preserved existing .env.');}
await chmod(resolve(root,'.env'),0o600);
