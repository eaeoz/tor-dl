import WebTorrent from 'webtorrent';
import { DownloadProgress } from '../cli/progress';
import { TorrentResult, DownloadOptions } from '../types';
import axios from 'axios';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

const CACHE_FILE = join(process.cwd(), '.torrent-cache.json');

function saveCache(results: TorrentResult[]): void {
  try {
    writeFileSync(CACHE_FILE, JSON.stringify(results, null, 2));
  } catch (e) { /* ignore */ }
}

function loadCache(): TorrentResult[] {
  try {
    if (existsSync(CACHE_FILE)) {
      return JSON.parse(readFileSync(CACHE_FILE, 'utf-8'));
    }
  } catch (e) { /* ignore */ }
  return [];
}

let cachedResults: TorrentResult[] = [];

export function cacheResults(results: TorrentResult[]): void {
  cachedResults = results;
  saveCache(results);
}

export function getCachedResults(): TorrentResult[] {
  if (cachedResults.length === 0) {
    cachedResults = loadCache();
  }
  return cachedResults;
}

export async function downloadTorrent(
  result: TorrentResult,
  options: DownloadOptions = {}
): Promise<void> {
  const client = new WebTorrent();
  const progress = new DownloadProgress();
  const savePath = options.savePath || process.cwd();
  
  let torrentId: string;
  
  if (result.magnet && result.magnet.startsWith('magnet:')) {
    torrentId = result.magnet;
  } else if (result.url && result.url.includes('magnet:')) {
    torrentId = result.url;
  } else if (result.url && result.url.includes('nyaa.si')) {
    console.log('Fetching magnet link from Nyaa...');
    const magnet = await getMagnetFromResult(result);
    if (magnet) {
      torrentId = magnet;
    } else {
      throw new Error('Could not get magnet link from Nyaa page');
    }
  } else {
    console.log('Fetching torrent file...');
    const torrentUrl = await getTorrentUrl(result);
    if (torrentUrl) {
      const response = await axios.get(torrentUrl, { responseType: 'arraybuffer' });
      const tempFile = join(savePath, 'temp.torrent');
      writeFileSync(tempFile, response.data);
      torrentId = tempFile;
    } else {
      throw new Error('Could not get torrent URL');
    }
  }
  
  console.log(`\nDownloading: ${result.name}`);
  console.log(`Saving to: ${savePath}\n`);
  
  return new Promise((resolve, reject) => {
    console.log('Adding torrent to client...');
    console.log('Torrent ID:', torrentId.substring(0, 60) + '...');
    
    const torrent = client.add(torrentId, {
      path: savePath
    });
    
    torrent.on('warning', (warn) => {
      console.log('Torrent warning:', warn.message);
    });
    
    torrent.on('peer', (peer) => {
      console.log('New peer connected:', peer);
    });
    
    console.log('Torrent added, waiting for ready...');
    
    torrent.on('ready', () => {
      const total = torrent.length;
      console.log(`✓ Torrent ready! Total size: ${(total / (1024*1024)).toFixed(2)} MB`);
      console.log(`  Files: ${torrent.files.map(f => f.name).join(', ')}`);
      console.log(`  Info hash: ${torrent.infoHash}`);
      progress.start(total);
      
      torrent.on('download', (bytes: number) => {
        const percent = ((torrent.downloaded / total) * 100).toFixed(1);
        process.stdout.write(`\rDownloading: ${percent}% (${(torrent.downloaded/1024/1024).toFixed(1)} MB / ${(total/1024/1024).toFixed(1)} MB) - ${torrent.peers.length} peers   `);
        progress.update(torrent.downloaded, total);
      });
      
      torrent.on('done', () => {
        progress.stop();
        console.log('\n\n✓ Download complete!');
        console.log(`Downloaded to: ${savePath}`);
        client.destroy();
        resolve();
      });
    });
    
    torrent.on('error', (err: Error) => {
      console.error('\nDownload error:', err.message);
      client.destroy();
      reject(err);
    });
    
    setTimeout(() => {
      console.log('\n\nDebug:');
      console.log('  Downloaded:', torrent.downloaded);
      console.log('  Length:', torrent.length);
      console.log('  Peers:', torrent.peers?.length || 0);
      console.log('  Done:', torrent.done);
      
      if (torrent.downloaded > 0) {
        console.log('\nDownload in progress but taking long...');
        console.log(`Progress: ${(torrent.downloaded/torrent.length*100).toFixed(1)}%`);
      } else {
        console.log('\nNo progress after 60s - may be stuck or no peers');
      }
    }, 60000);
  });
}

async function getTorrentUrl(result: TorrentResult): Promise<string> {
  if (result.magnet && result.magnet.startsWith('magnet:')) {
    return result.magnet;
  }
  return result.url;
}

async function getMagnetFromResult(result: TorrentResult): Promise<string> {
  if (result.magnet) return result.magnet;
  if (!result.url) return '';
  
  try {
    const { data } = await axios.get(result.url, { timeout: 15000 });
    const cheerio = require('cheerio');
    const $ = cheerio.load(data);
    return $('a[href^="magnet:"]').attr('href') || '';
  } catch {
    return '';
  }
}

export async function downloadByNumber(
  number: number,
  savePath?: string
): Promise<void> {
  const results = getCachedResults();
  
  if (results.length === 0) {
    throw new Error('No search results. Run "tordl search" first.');
  }
  
  if (number < 1 || number > results.length) {
    throw new Error(`Invalid number. Choose between 1 and ${results.length}`);
  }
  
  const result = results[number - 1];
  await downloadTorrent(result, { savePath });
}