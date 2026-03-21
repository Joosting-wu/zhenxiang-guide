import { spawn } from 'child_process';

const child = spawn('node', [
  'node_modules/concurrently/dist/bin/concurrently.js',
  'node node_modules/nodemon/bin/nodemon.js --watch api --ext ts --exec "node --loader ts-node/esm api/server.ts"',
  'node node_modules/vite/bin/vite.js'
], { stdio: 'inherit', shell: true });

child.on('error', (err) => {
  console.error('Failed to start subprocess.', err);
});
