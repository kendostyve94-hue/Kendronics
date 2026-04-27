import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

const envFiles = [resolve(process.cwd(), '.env'), resolve(process.cwd(), 'apps/api/.env')];

for (const filePath of envFiles) {
  if (!existsSync(filePath)) {
    continue;
  }

  const lines = readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
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
    const value = rawValue.replace(/^["']|["']$/g, '');

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}
