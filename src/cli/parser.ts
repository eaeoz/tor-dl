import { Command } from 'commander';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { FilterConfig, SearchOptions } from '../types';

function getVersion(): string {
  try {
    const pkg = JSON.parse(readFileSync(join(__dirname, '../../package.json'), 'utf-8'));
    return pkg.version || '1.0.0';
  } catch {
    return '1.0.0';
  }
}

export function loadFilters(): FilterConfig {
  const filtersPath = join(process.cwd(), 'filters.json');
  if (existsSync(filtersPath)) {
    return JSON.parse(readFileSync(filtersPath, 'utf-8'));
  }
  return {
    category: 'all',
    minSeeds: 0,
    minSize: '0',
    maxSize: '50GB',
    sortBy: 'seeds',
    order: 'desc',
    limit: 50
  };
}

export function createParser(): Command {
  const program = new Command();
  
  program
    .name('tor-dl')
    .description('CLI torrent search tool - search, open in browser, copy magnet links')
    .version(getVersion(), '-v, --version');

  program
    .command('search <query>')
    .description('Search for torrents')
    .option('-c, --cat <category>', 'Category: all, movie, tv')
    .option('-s, --min-seeds <number>', 'Minimum seeds', parseInt)
    .option('--min-size <size>', 'Minimum size (e.g., 500MB, 1GB)')
    .option('--max-size <size>', 'Maximum size (e.g., 5GB)')
    .option('-o, --sort <sortBy>', 'Sort by: seeds, size, date')
    .option('--order <order>', 'Order: asc, desc')
    .option('-l, --limit <limit>', 'Result limit', parseInt)
    .option('--sources <sources>', 'Comma-separated source names')
    .action(async (query: string, options) => {
      const filters = loadFilters();
      
      const searchOptions: SearchOptions = {
        query,
        category: options.cat || filters.category,
        minSeeds: options.minSeeds ?? filters.minSeeds,
        minSize: options.minSize || filters.minSize,
        maxSize: options.maxSize || filters.maxSize,
        sortBy: (options.sort as 'seeds' | 'size' | 'date') || filters.sortBy,
        order: (options.order as 'asc' | 'desc') || filters.order,
        limit: options.limit || filters.limit,
        sources: options.sources ? options.sources.split(',') : undefined
      };

      const { searchCommand } = await import('../commands/search');
      await searchCommand(searchOptions);
    });

  const openCmd = program.command('open <number>', { hidden: true });
  openCmd.description('Open .torrent in browser or copy magnet to clipboard');
  openCmd.action(async (number: string) => {
    const { openInBrowser } = await import('../commands/download');
    await openInBrowser(parseInt(number));
  });

  const oCmd = program.command('o <number>');
  oCmd.description('Open .torrent in browser or copy magnet to clipboard');
  oCmd.action(async (number: string) => {
    const { openInBrowser } = await import('../commands/download');
    await openInBrowser(parseInt(number));
  });

  program.on('command:*', () => {
    console.error('Invalid command: %s\nSee --help for a list of available commands.', program.args[0]);
    process.exit(1);
  });

  return program;
}