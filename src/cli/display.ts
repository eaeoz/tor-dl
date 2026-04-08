import chalk from 'chalk';
import { TorrentResult } from '../types';
import { exec } from 'child_process';

(chalk as any).level = 1;

function openUrl(url: string): void {
  const cmd = process.platform === 'win32' ? `start "" "${url}"` : 
              process.platform === 'darwin' ? `open "${url}"` : 
              `xdg-open "${url}"`;
  exec(cmd, (err) => {
    if (err) console.error(chalk.red('Failed to open URL: ' + err.message));
  });
}

export function displayResults(results: TorrentResult[], onOpenBrowser?: (url: string) => void): void {
  if (results.length === 0) {
    console.log(chalk.yellow('No results found.'));
    return;
  }

  console.log(chalk.gray('\nTip: Type "o <number>" to open .torrent in browser, or just the number to download.\n'));

  const out = (s: string) => process.stdout.write(s + '\n');

  out('\n' + [
    '┌─────┬───┬────────────────────────────────────────┬────────┬───────┬───────┬────────┐',
    '│ Num │ L │ Name                                   │ Size   │ Seeds │ Leech │ Source │',
    '├─────┼───┼────────────────────────────────────────┼────────┼───────┼───────┼────────┤'
  ].join('\n'));

  for (const r of results) {
    const name = r.name.length > 38 ? r.name.substring(0, 35) + '...' : r.name;
    const size = r.size ? r.size.slice(0, 6).padEnd(6) : 'N/A   ';
    const seeds = r.seeds > 100 ? chalk.green(r.seeds.toString().padStart(5)) : r.seeds > 50 ? chalk.yellow(r.seeds.toString().padStart(5)) : r.seeds.toString().padStart(5);
    const peers = r.peers > 50 ? chalk.cyan(r.peers.toString().padStart(5)) : r.peers.toString().padStart(5);
    const source = (r.source || 'unknown').slice(0, 6).padEnd(6);
    const num = chalk.cyan(r.num.toString().padStart(3));
    const link = r.torrentUrl ? chalk.cyan('⬇') : ' ';

    out(`│ ${num} │ ${link} │ ${name.padEnd(38)} │ ${size} │ ${seeds} │ ${peers} │ ${source} │`);
  }

  out('├─────┼───┼────────────────────────────────────────┼────────┼───────┼───────┼────────┤');
  out('└─────┴───┴────────────────────────────────────────┴────────┴───────┴───────┴────────┘');
  out('');
  out(chalk.gray('Commands: tor-dl <number> = download, tor-dl o <number> = open in browser'));
}

export function displayResultDetails(result: TorrentResult): void {
  console.log(chalk.bold('\n--- Torrent Details ---'));
  console.log(chalk.white('Name:    ') + result.name);
  console.log(chalk.white('Size:    ') + result.size);
  console.log(chalk.white('Seeds:   ') + chalk.green(result.seeds.toString()));
  console.log(chalk.white('Peers:   ') + result.peers.toString());
  console.log(chalk.white('Source:  ') + result.source);
  console.log(chalk.white('URL:     ') + result.url);
  if (result.magnet) {
    console.log(chalk.white('Magnet:  ') + chalk.cyan(result.magnet.substring(0, 60) + '...'));
  }
  console.log(chalk.bold('----------------------\n'));
}

export function displayError(message: string): void {
  console.error(chalk.red('Error: ') + message);
}

export function displaySuccess(message: string): void {
  console.log(chalk.green('✓ ') + message);
}

export function displayInfo(message: string): void {
  console.log(chalk.blue('ℹ ') + message);
}