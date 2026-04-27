import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const command = process.argv[2];
const allowedCommands = new Set(['generate', 'migrate', 'deploy', 'validate']);

if (!allowedCommands.has(command)) {
  console.error('Usage: node scripts/prisma-api.mjs <generate|migrate|deploy|validate>');
  process.exit(1);
}

const env = { ...process.env };
env.NODE_OPTIONS = env.NODE_OPTIONS?.includes('--max-old-space-size')
  ? env.NODE_OPTIONS
  : `${env.NODE_OPTIONS ?? ''} --max-old-space-size=4096`.trim();
const envPath = resolve(process.cwd(), 'apps/api/.env');

if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    env[key] ??= rawValue.replace(/^["']|["']$/g, '');
  }
}

const executable = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const prismaArgsByCommand = {
  generate: ['prisma', 'generate', '--schema', 'apps/api/prisma/schema.prisma'],
  migrate: ['prisma', 'migrate', 'dev', '--schema', 'apps/api/prisma/schema.prisma'],
  deploy: ['prisma', 'migrate', 'deploy', '--schema', 'apps/api/prisma/schema.prisma'],
  validate: ['prisma', 'validate', '--schema', 'apps/api/prisma/schema.prisma'],
};

const result = spawnSync(executable, prismaArgsByCommand[command], {
  stdio: 'inherit',
  env,
  shell: process.platform === 'win32',
});

if (result.error) {
  console.error(result.error.message);
}

process.exit(result.status ?? 1);
