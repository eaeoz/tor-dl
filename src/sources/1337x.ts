import axios from 'axios';
import * as cheerio from 'cheerio';
import { TorrentResult, SourceScraper } from '../types';
import { DEFAULT_HEADERS, TIMEOUT } from './httpClient';

export class _1337xScraper implements SourceScraper {
  name = '1337x';

  async search(query: string, category?: string): Promise<TorrentResult[]> {
    try {
      const catMap: Record<string, string> = { movie: 'Movies', tv: 'TV', music: 'Music', games: 'Games', apps: 'Applications' };
      const catParam = category && catMap[category] ? `/category-${catMap[category]}` : '';
      const url = `https://1337x.to${catParam}/search/${encodeURIComponent(query)}/1/`;
      
      const { data } = await axios.get(url, {
        headers: DEFAULT_HEADERS,
        timeout: TIMEOUT
      });
      
      const $ = cheerio.load(data);
      const results: TorrentResult[] = [];
      
      $('table.table-list tbody tr').each((i, el) => {
        const title = $(el).find('td.coll-1 a').last().text().trim() || $(el).find('td.coll-1').text().trim();
        const size = $(el).find('td.coll-4').text().trim();
        const seeds = parseInt($(el).find('td.coll-2').text().trim()) || 0;
        const peers = parseInt($(el).find('td.coll-3').text().trim()) || 0;
        const link = 'https://1337x.to' + ($(el).find('td.coll-1 a').last().attr('href') || '');
        
        if (title) {
          results.push({
            num: results.length + 1,
            name: title,
            size: size || 'Unknown',
            sizeBytes: this.parseSize(size),
            seeds,
            peers,
            source: '1337x',
            url: link,
            magnet: ''
          });
        }
      });
      
      return results;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`1337x search error: ${message}`);
      return [];
    }
  }

  async getTorrentUrl(result: TorrentResult): Promise<string> {
    try {
      const { data } = await axios.get(result.url, { headers: DEFAULT_HEADERS, timeout: TIMEOUT });
      const $ = cheerio.load(data);
      const torrentUrl = $('a[href$=".torrent"]').attr('href') || '';
      return torrentUrl || result.url;
    } catch {
      return result.url;
    }
  }

  async getMagnet(result: TorrentResult): Promise<string> {
    try {
      const { data } = await axios.get(result.url, { headers: DEFAULT_HEADERS, timeout: TIMEOUT });
      const $ = cheerio.load(data);
      return $('a[href^="magnet:"]').attr('href') || '';
    } catch {
      return '';
    }
  }

  private parseSize(size: string): number {
    if (!size) return 0;
    const match = size.toString().match(/([\d.]+)\s*(GB|MB|TB|KB)/i);
    if (!match) return 0;
    const value = parseFloat(match[1]);
    const unit = match[2].toUpperCase();
    const multipliers: Record<string, number> = { 'KB': 1024, 'MB': 1024**2, 'GB': 1024**3, 'TB': 1024**4 };
    return value * (multipliers[unit] || 1);
  }
}

export default new _1337xScraper();