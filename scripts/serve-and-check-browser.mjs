#!/usr/bin/env node
/**
 * Serves the built gallery on a free port and runs `check-browser-frames`
 * against it, so the gate is one command rather than three and can never be run
 * against a stale server someone left up on 4180.
 */
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';

const freePort = () =>
  new Promise((res, rej) => {
    const s = createServer();
    s.on('error', rej);
    s.listen(0, () => {
      const {port} = s.address();
      s.close(() => res(port));
    });
  });

const port = await freePort();
const preview = spawn('npx', ['vite', 'preview', '--port', String(port), '--strictPort'], {
  stdio: ['ignore', 'pipe', 'pipe'],
});

const up = await new Promise((res) => {
  const t = setTimeout(() => res(false), 30000);
  preview.stdout.on('data', (b) => {
    if (String(b).includes(`:${port}`)) {
      clearTimeout(t);
      res(true);
    }
  });
});
if (!up) {
  preview.kill();
  throw new Error('check:browser: vite preview never came up');
}

/** Both browser gates share the one server; the counts one is seconds. */
const run = async (script) => {
  const child = spawn(
    process.execPath,
    [script, '--base', `http://localhost:${port}`, ...process.argv.slice(2)],
    {stdio: 'inherit'},
  );
  return (await new Promise((res) => child.on('exit', res))) ?? 1;
};

const counts = await run('scripts/check-gallery-counts.mjs');
const frames = await run('scripts/check-browser-frames.mjs');
preview.kill();
process.exit(counts || frames);
