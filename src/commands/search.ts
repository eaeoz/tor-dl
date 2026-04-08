import ora from 'ora';
import { SearchOptions, TorrentResult } from '../types';
import { getEnabledSources } from '../sources/registry';
import { filterByCategory, filterBySize, filterBySeeds, sortResults } from '../filters';
import { displayResults, displayError } from '../cli/display';
import { cacheResults } from '../download/engine';

export async function searchCommand(options: SearchOptions): Promise<void> {
  const spinner = ora('Searching torrent sources...').start();
  
  let sources = getEnabledSources();
  
  if (options.sources && options.sources.length > 0) {
    const requested = options.sources.map(s => s.toLowerCase());
    sources = sources.filter(s => requested.includes(s.name.toLowerCase()));
  }
  
  const allResults: TorrentResult[] = [];
  
  for (const source of sources) {
    try {
      spinner.text = `Searching ${source.name}...`;
      const results = await source.search(options.query, options.category);
      allResults.push(...results);
    } catch (error) {
      spinner.warn(`Failed to search ${source.name}`);
    }
  }
  
  spinner.succeed(`Search complete. Found ${allResults.length} results.`);
  
  let filtered = filterByCategory(allResults, options.category || 'all');
  
  if (options.minSeeds && options.minSeeds > 0) {
    filtered = filterBySeeds(filtered, options.minSeeds);
  }
  
  if (options.minSize || options.maxSize) {
    filtered = filterBySize(filtered, options.minSize, options.maxSize);
  }
  
  filtered = sortResults(filtered, options.sortBy || 'seeds', options.order || 'desc');
  
  if (options.limit && options.limit > 0) {
    filtered = filtered.slice(0, options.limit);
  }
  
  filtered = filtered.map((r, i) => ({ ...r, num: i + 1 }));
  
  cacheResults(filtered);
  
  displayResults(filtered);
}