import { homedir } from 'os';
import { join } from 'path';
import { mkdirSync, existsSync, readFileSync, writeFileSync, copyFileSync } from 'fs';

const LEGACY_DIR = join(__dirname, '..');

export function getDataDir(): string {
  if (process.env.TOR_DL_DATA_DIR) return process.env.TOR_DL_DATA_DIR;
  const dir = join(homedir(), '.tor-dl');
  mkdirSync(dir, { recursive: true });
  return dir;
}

function migrateLegacyFile(name: string, target: string): void {
  if (existsSync(target)) return;
  const legacyPath = join(LEGACY_DIR, name);
  if (existsSync(legacyPath)) {
    try {
      copyFileSync(legacyPath, target);
    } catch {
      // ignore migration errors
    }
  }
}

export function getFilePath(name: string): string {
  const path = join(getDataDir(), name);
  migrateLegacyFile(name, path);
  return path;
}

export function loadJsonFile<T>(name: string, fallback: T): T {
  const path = getFilePath(name);
  if (existsSync(path)) {
    try {
      return JSON.parse(readFileSync(path, 'utf-8')) as T;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

export function saveJsonFile(name: string, data: unknown): string {
  const path = getFilePath(name);
  writeFileSync(path, JSON.stringify(data, null, 2));
  return path;
}
