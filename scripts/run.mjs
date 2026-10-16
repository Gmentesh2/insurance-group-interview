import { spawn } from 'node:child_process';
import { config, root } from './config.mjs';
import { resolve } from 'node:path';
const env = await config();
const composeArgs = ['compose', '--file', resolve(root,'compose.yaml'), '--project-name', 'insurance-group-interview'];
const runtime = Object.fromEntries(['PATH','HOME','USER','SHELL','TMPDIR','LANG','LC_ALL','TERM','COLORTERM','FORCE_COLOR','NODE_OPTIONS','PNPM_HOME','SystemRoot','ComSpec','TEMP','TMP','USERPROFILE','APPDATA','LOCALAPPDATA','ProgramData','ProgramFiles','ALLUSERSPROFILE'].filter(key=>process.env[key]!==undefined).map(key=>[key,process.env[key]]));
const commands = {
  db: ['docker', [...composeArgs,'up','-d','--wait','postgres'], root],
  'db:stop': ['docker', [...composeArgs,'stop','postgres'], root],
  api: ['dotnet', ['run','--no-launch-profile','--no-build'], resolve(root,'backend')],
  web: ['pnpm', ['dev','--port','3001'], resolve(root,'frontend')],
  migrate: ['dotnet', ['ef','database','update'], resolve(root,'backend')],
};
const command = commands[process.argv[2]];
if (!command) throw new Error(`Usage: node scripts/run.mjs ${Object.keys(commands).join('|')}`);
const action = process.argv[2];
const commandEnv = action === 'web' ? {...runtime,API_ORIGIN:'http://127.0.0.1:5081'} : action.startsWith('db') ? {...runtime,POSTGRES_PASSWORD:env.POSTGRES_PASSWORD} : {...env};
// Windows package-manager launchers are .cmd files and require cmd.exe.
// This command is fixed; no user input or private configuration enters the shell.
const windowsWeb = process.platform === 'win32' && action === 'web';
const child = spawn(windowsWeb ? process.env.ComSpec ?? 'cmd.exe' : command[0],windowsWeb ? ['/d','/s','/c','pnpm dev --port 3001'] : command[1],{cwd:command[2],env:commandEnv,stdio:'inherit'});
child.on('error',()=>{console.error(`Could not run ${command[0]}. Check the README prerequisites.`);process.exitCode=1;});
child.on('exit',code=>{process.exitCode=code??1;});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>child.kill(signal));
