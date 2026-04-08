import axios from 'axios';
import { TorrentResult, SourceScraper } from '../types';
import { DEFAULT_HEADERS, TIMEOUT } from './httpClient';

export class TorrentsCsvScraper implements SourceScraper {
  name = 'torrentscsv';

  async search(query: string, category?: string): Promise<TorrentResult[]> {
    try {
      const url = `https://torrents-csv.ml/api/search?q=${encodeURIComponent(query)}`;
      const { data } = await axios.get(url, {
        headers: DEFAULT_HEADERS,
        timeout: TIMEOUT
      });
      
      const results: TorrentResult[] = [];
      const torrents = Array.isArray(data) ? data : data.torrents || [];
      
      for (const t of torrents.slice(0, 50)) {
        results.push({
          num: results.length + 1,
          name: t.name || t.title || 'Unknown',
          size: this.formatSize(t.length || t.size || 0),
          sizeBytes: t.length || t.size || 0,
          seeds: t.seeders || t.s || 0,
          peers: t.leechers || t.l || 0,
          source: 'torrents-csv',
          url: t.link || t.info_hash ? `magnet:?xt=urn:btih:${t.info_hash}` : '',
          magnet: t.link || t.magnet ? `magnet:?xt=urn:btih:${t.info_hash}` : '',
          hash: t.info_hash
        });
      }
      
      return results;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`torrents-csv search error: ${message}`);
      return [];
    }
  }

  async getTorrentUrl(result: TorrentResult): Promise<string> {
    return result.url;
  }

  async getMagnet(result: TorrentResult): Promise<string> {
    return result.magnet || `magnet:?xt=urn:btih:${result.hash}`;
  }

  private formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  }
}

export default new TorrentsCsvScraper();