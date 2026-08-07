import { spawn } from 'child_process';
import { join, dirname } from 'path';
import chalk from 'chalk';

function runPlaywrightCli(cli: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [cli, ...args], { stdio: 'inherit' });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`command exited with code ${code}`));
    });
  });
}

function resolvePlaywrightCli(): string | null {
  try {
    const pkgPath = require.resolve('playwright/package.json');
    return join(dirname(pkgPath), 'cli.js');
  } catch {
    return null;
  }
}

export async function setupCommand(_options: unknown): Promise<void> {
  const cli = resolvePlaywrightCli();

  if (!cli) {
    console.log(chalk.red('Playwright is not installed. Run: npm install'));
    return;
  }

  console.log(chalk.cyan('Installing headless Chromium for Letterboxd watchlist fetching...'));
  console.log(chalk.gray('This downloads ~270 MB once. On Linux, system libraries may also be needed.'));

  try {
    await runPlaywrightCli(cli, ['install', 'chromium-headless-shell']);
  } catch (error: any) {
    console.log(chalk.red(`Failed to install headless Chromium: ${error.message}`));
    return;
  }

  if (process.platform === 'linux') {
    console.log(chalk.cyan('Checking Linux system dependencies...'));
    try {
      await runPlaywrightCli(cli, ['install-deps', 'chromium-headless-shell']);
    } catch (error: any) {
      console.log(chalk.yellow(`Could not install system dependencies automatically: ${error.message}`));
      console.log(chalk.gray('If Chromium fails to launch, run with sudo: sudo npx playwright install-deps chromium-headless-shell'));
    }
  }

  const cacheDir = process.platform === 'win32'
    ? `${process.env.LOCALAPPDATA || '%LOCALAPPDATA%'}\\ms-playwright`
    : '~/.cache/ms-playwright';

  console.log(chalk.green('Headless Chromium installed.'));
  console.log(chalk.gray(`Stored in: ${cacheDir}`));
  console.log(chalk.green('Now run: tor-dl list'));
}
