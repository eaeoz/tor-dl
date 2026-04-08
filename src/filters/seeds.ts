import { TorrentResult } from '../types';

export function filterBySeeds(results: TorrentResult[], minSeeds: number = 0): TorrentResult[] {
  return results.filter(r => r.seeds >= minSeeds);
}