import chalk from 'chalk';
import { TorrentResult } from '../types';

(chalk as any).level = 1;

function makeClickable(url: string, text: string): string {
  return `\u001b]8;;${url}\u0007${text}\u001b]8;;\u0007`;
}

export function displayResults(results: TorrentResult[]): void {
  if (results.length === 0) {
    console.log(chalk.yellow('No results found.'));
    return;
  }

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
    
    const url = r.torrentUrl || r.magnet || '';
    const pageUrl = r.url || '';
    
    const clickableName = url ? makeClickable(url, name.padEnd(38)) : name.padEnd(38);
    const clickableLink = pageUrl ? makeClickable(pageUrl, chalk.green('✓')) : chalk.gray(' ');

    out(`│ ${num} │ ${clickableLink} │ ${clickableName} │ ${size} │ ${seeds} │ ${peers} │ ${source} │`);
  }

  out('├─────┼───┼────────────────────────────────────────┼────────┼───────┼───────┼────────┤');
  out('└─────┴───┴────────────────────────────────────────┴────────┴───────┴───────┴────────┘');
  out('');
  out(chalk.gray('Click name = open magnet/torrent | Click ✓ = open source page'));
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