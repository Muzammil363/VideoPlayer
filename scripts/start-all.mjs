import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const rootDir = path.resolve(path.dirname(__filename), '..');

const processes = [
  {
    name: 'backend',
    command: 'node',
    args: ['app.js'],
    cwd: path.join(rootDir, 'Backend'),
  },
  {
    name: 'worker',
    command: 'node',
    args: ['worker.js'],
    cwd: path.join(rootDir, 'Backend'),
  },
  {
    name: 'frontend',
    command: 'node',
    args: ['node_modules/vite/bin/vite.js'],
    cwd: path.join(rootDir, 'Frontend'),
  },
];

const children = [];
let shuttingDown = false;

const createChildEnv = () => {
  if (process.platform !== 'win32') return process.env;

  const env = {};
  const seen = new Set();

  for (const [key, value] of Object.entries(process.env)) {
    const normalizedKey = key.toUpperCase();
    if (seen.has(normalizedKey)) continue;
    seen.add(normalizedKey);
    env[key] = value;
  }

  return env;
};

const childEnv = createChildEnv();

const prefixOutput = (name, stream, chunk) => {
  const text = chunk.toString();
  for (const line of text.split(/\r?\n/)) {
    if (line.trim()) {
      stream.write(`[${name}] ${line}\n`);
    }
  }
};

const stopAll = (signal = 'SIGTERM') => {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log('\nStopping VideoPlayer services...');

  for (const child of children) {
    if (!child.killed) {
      child.kill(signal);
    }
  }
};

for (const item of processes) {
  const child = spawn(item.command, item.args, {
    cwd: item.cwd,
    shell: false,
    env: childEnv,
  });

  children.push(child);

  child.stdout.on('data', (chunk) => prefixOutput(item.name, process.stdout, chunk));
  child.stderr.on('data', (chunk) => prefixOutput(item.name, process.stderr, chunk));

  child.on('exit', (code, signal) => {
    if (!shuttingDown) {
      console.log(`[${item.name}] exited with ${signal || code}`);
      stopAll();
      process.exitCode = code || 1;
    }
  });
}

process.on('SIGINT', () => stopAll('SIGINT'));
process.on('SIGTERM', () => stopAll('SIGTERM'));

console.log('Started backend, worker, and frontend.');
console.log('Backend: http://localhost:3000');
console.log('Frontend: http://localhost:5173');
console.log('Press Ctrl+C to stop all services.');
