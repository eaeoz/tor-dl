import { Command } from 'commander';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { FilterConfig, SearchOptions } from '../types';

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
    .description('CLI torrent search and download tool')
    .version('1.0.0')
    .hook('preAction', (thisCommand) => {
      if (thisCommand.name() === 'update') {
        return;
      }
    });

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

  program
    .command('download <number>')
    .description('Download a torrent by number from previous search')
    .option('-p, --path <path>', 'Download path')
    .action(async (number: string, options) => {
      const { downloadCommand } = await import('../commands/download');
      await downloadCommand(parseInt(number), options.path);
    });

  program
    .command('update')
    .description('Update sources from remote config')
    .alias('u')
    .action(async () => {
      const { updateCommand } = await import('../commands/update');
      await updateCommand();
    });

  program
    .argument('<number>', 'Torrent number to download')
    .action(async (number: string) => {
      const { downloadCommand } = await import('../commands/download');
      await downloadCommand(parseInt(number));
    });

  program.on('command:*', () => {
    console.error('Invalid command: %s\nSee --help for a list of available commands.', program.args[0]);
    process.exit(1);
  });

  return program;
}