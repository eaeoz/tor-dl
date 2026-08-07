import { readFileSync, existsSync } from 'fs';
import axios from 'axios';
import * as cheerio from 'cheerio';
import chalk from 'chalk';
import ora from 'ora';
import { FilterConfig, SearchOptions } from '../types';
import { loadFilters } from '../cli/parser';
import { getFilePath, loadJsonFile, saveJsonFile } from '../config';

interface UserConfig {
  letterboxd: {
    username: string;
  };
}

interface WatchlistCacheFile {
  username: string;
  movies: WatchlistMovie[];
}

function getUsersPath(): string {
  return getFilePath('users.json');
}

function loadUsers(): UserConfig {
  return loadJsonFile<UserConfig>('users.json', { letterboxd: { username: '' } });
}

export { loadUsers as loadUserConfig };

function saveUsers(config: UserConfig): void {
  saveJsonFile('users.json', config);
}

export async function setUserCommand(username: string): Promise<void> {
  const config = loadUsers();
  config.letterboxd.username = username;
  saveUsers(config);
  console.log(chalk.green(`Username set to: ${username}`));
}

export async function setFilterCommand(options: any): Promise<void> {
  const filters = loadFilters();
  
  if (options.cat) filters.category = options.cat;
  if (options.minSeeds !== undefined) filters.minSeeds = options.minSeeds;
  if (options.maxSeeds) filters.maxSeeds = options.maxSeeds;
  if (options.minSize) filters.minSize = options.minSize;
  if (options.maxSize) filters.maxSize = options.maxSize;
  if (options.sort) filters.sortBy = options.sort;
  if (options.order) filters.order = options.order;
  if (options.limit) filters.limit = options.limit;
  if (options.sources) {
    const srcArr = options.sources.split ? options.sources.split(/[,\s]+/) : options.sources;
    const cleaned = Array.isArray(srcArr) ? srcArr.map((s: string) => s.trim()).filter((s: string) => s) : srcArr;
    filters.sources = Array.isArray(cleaned) ? cleaned.join(',') : cleaned;
  }
  
  const filtersPath = getFilePath('filters.json');
  saveJsonFile('filters.json', filters);
  console.log(chalk.green('Filters updated:'));
  console.log(JSON.stringify(filters, null, 2));
}

interface WatchlistMovie {
  num: number;
  name: string;
  year: string;
  rating: string;
  url: string;
}

interface WatchlistFetchResult {
  movies: WatchlistMovie[];
  blocked: boolean;
  notFound: boolean;
}

function getWatchlistCachePath(): string {
  return getFilePath('.watchlist-cache.json');
}

function loadWatchlistCache(username: string): WatchlistMovie[] {
  const path = getWatchlistCachePath();
  if (existsSync(path)) {
    try {
      const cached = JSON.parse(readFileSync(path, 'utf-8')) as Partial<WatchlistCacheFile> | WatchlistMovie[];
      if (Array.isArray(cached)) return [];
      if (cached && cached.username === username && Array.isArray(cached.movies)) {
        return cached.movies;
      }
      return [];
    } catch {
      return [];
    }
  }
  return [];
}

function saveWatchlistCache(username: string, movies: WatchlistMovie[]): void {
  const cache: WatchlistCacheFile = { username, movies };
  saveJsonFile('.watchlist-cache.json', cache);
}

let watchlistCache: WatchlistMovie[] = [];

const LETTERBOXD_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1'
};

function isCloudflareChallenge(body: unknown): boolean {
  if (typeof body !== 'string') return false;
  return body.includes('challenges.cloudflare.com')
    || body.includes('Just a moment')
    || body.includes('cf_chl_')
    || body.includes('__cf_chl');
}

function parseMovieFullName(fullName: string): { name: string; year: string } {
  const yearMatch = fullName.match(/\((\d{4})\)\s*$/);
  const name = yearMatch ? fullName.replace(/\s*\(\d{4}\)\s*$/, '').trim() : fullName.trim();
  return { name, year: yearMatch ? yearMatch[1] : '' };
}

function addMovie(movies: WatchlistMovie[], seen: Set<string>, fullName: string, href: string): void {
  if (!fullName || !href || !href.includes('/film/')) return;
  if (seen.has(href)) return;
  seen.add(href);
  const { name, year } = parseMovieFullName(fullName);
  movies.push({
    num: movies.length + 1,
    name,
    year,
    rating: '',
    url: 'https://letterboxd.com' + href
  });
}

function displayMovies(movies: WatchlistMovie[]): void {
  console.log(chalk.gray('\n--- Watchlist ---'));
  movies.forEach(m => {
    const ratingStr = m.rating ? ` ${m.rating}` : '';
    const yearStr = m.year ? `(${m.year})` : '';
    console.log(chalk.cyan(`${m.num}. `) + chalk.white(m.name) + chalk.gray(` ${yearStr}${ratingStr}`));
  });
  console.log(chalk.gray('----------------\n'));
  console.log(chalk.gray('Use: tor-dl find <number> to search and download'));
}

async function fetchWatchlistViaHttp(username: string): Promise<WatchlistFetchResult> {
  const profileUrl = `https://letterboxd.com/${username}/`;
  const response = await axios.get(profileUrl, { headers: LETTERBOXD_HEADERS, timeout: 30000, validateStatus: () => true });

  if (response.status === 403 || isCloudflareChallenge(response.data)) return { movies: [], blocked: true, notFound: false };
  if (!response.data) return { movies: [], blocked: false, notFound: false };

  const $ = cheerio.load(response.data);
  const movies: WatchlistMovie[] = [];
  const seen = new Set<string>();

  $('[data-item-name]').each((_i, elem) => {
    const el = $(elem);
    addMovie(movies, seen, el.attr('data-item-name') || '', el.attr('data-item-link') || '');
  });

  if (movies.length === 0) {
    $('a[href*="/film/"][title]').each((_i, elem) => {
      const el = $(elem);
      const name = el.attr('title') || '';
      const href = el.attr('href') || '';
      if (name && name.length > 1 && name.length < 200) {
        addMovie(movies, seen, name, href);
      }
    });
  }

  if (movies.length === 0) {
    $('a[href*="/film/"]').each((_i, elem) => {
      const el = $(elem);
      const href = el.attr('href') || '';
      let name = el.text().trim();
      name = name.replace(/\s+/g, ' ').replace(/^\d+\.\s*/, '').trim();
      if (name && name.length > 1 && name.length < 200) {
        const { name: cleanName, year } = parseMovieFullName(name);
        addMovie(movies, seen, year ? `${cleanName} (${year})` : cleanName, href);
      }
    });
  }

  const watchlistUrl = `https://letterboxd.com/${username}/watchlist/`;
  const watchlistResponse = await axios.get(watchlistUrl, { headers: LETTERBOXD_HEADERS, timeout: 30000, validateStatus: () => true });

  if (watchlistResponse.status !== 403 && !isCloudflareChallenge(watchlistResponse.data) && watchlistResponse.data) {
    const cleanHtml = watchlistResponse.data.replace(/<script\b[^<]*(?:<[^<]*)<\/?script>/gi, '');
    const $wl = cheerio.load(cleanHtml);

    $wl('[data-item-name]').each((_i, elem) => {
      const el = $wl(elem);
      addMovie(movies, seen, el.attr('data-item-name') || '', el.attr('data-item-link') || '');
    });

    if (movies.length <= 5) {
      $wl('a[href*="/film/"]').each((_i, elem) => {
        const el = $wl(elem);
        const href = el.attr('href') || '';
        let name = el.text().trim().replace(/\s*\(\d{4}\)\s*$/, '').replace(/\s+/g, ' ').trim();
        if (href.includes('/film/') && name && name.length > 1 && name.length < 200) {
          addMovie(movies, seen, name, href);
        }
      });
    }
  }

  return { movies, blocked: false, notFound: false };
}

async function fetchWatchlistViaBrowser(username: string): Promise<WatchlistFetchResult | null> {
  let playwright: any;
  try {
    playwright = await import('playwright');
  } catch {
    console.log(chalk.yellow('Playwright is not installed. Run: npm install && tor-dl setup'));
    return null;
  }

  let browser: any;
  try {
    browser = await playwright.chromium.launch({ headless: true });
  } catch (error: any) {
    console.log(chalk.yellow('Headless Chromium not found. Run: tor-dl setup'));
    return null;
  }

  try {
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      locale: 'en-GB'
    });
    const page = await context.newPage();
    page.setDefaultTimeout(45000);

    const movies: WatchlistMovie[] = [];
    const seen = new Set<string>();
    let url = `https://letterboxd.com/${username}/watchlist/`;

    for (let pageNum = 1; pageNum <= 100; pageNum++) {
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      } catch (error: any) {
        continue;
      }

      try {
        await page.waitForSelector('[data-item-name]', { timeout: 45000 });
      } catch {
        await page.waitForTimeout(1500);
      }

      const items: { name: string; link: string }[] = await page.evaluate(((): { name: string; link: string }[] => {
        const win = globalThis as any;
        const out: { name: string; link: string }[] = [];
        win.document.querySelectorAll('[data-item-name]').forEach((el: any) => {
          const name = el.getAttribute('data-item-name') || '';
          let link = el.getAttribute('data-item-link') || '';
          if (!link) {
            const a = el.closest('a') || el.querySelector('a[href*="/film/"]');
            if (a) link = a.getAttribute('href') || '';
          }
          if (name && link) out.push({ name, link });
        });
        return out;
      }) as any);

      let added = 0;
      for (const item of items) {
        const before = movies.length;
        addMovie(movies, seen, item.name, item.link);
        if (movies.length > before) added++;
      }

      const nextHref = await page.evaluate(((): string | null => {
        const win = globalThis as any;
        const a = win.document.querySelector('.paginate-nextprev a.next');
        return a ? a.getAttribute('href') : null;
      }) as any);

      if (!nextHref || added === 0) break;
      url = 'https://letterboxd.com' + nextHref;
    }

    if (movies.length === 0) {
      const content = await page.content();
      if (isCloudflareChallenge(content)) return { movies: [], blocked: true, notFound: false };
    }

    const title = await page.title();
    const notFound = /not found/i.test(title) && title.includes('Letterboxd');

    return { movies, blocked: false, notFound };
  } finally {
    await browser.close().catch(() => {});
  }
}

export async function listCommand(_options: unknown): Promise<void> {
  const config = loadUsers();
  const username = config.letterboxd.username;

  if (!username) {
    console.log(chalk.red('No username set. Use: tor-dl setuser <username>'));
    return;
  }

  const spinner = ora(`Fetching watchlist for ${username}...`).start();

  let result: WatchlistFetchResult | null = null;
  let method = '';

  try {
    result = await fetchWatchlistViaHttp(username);
    if (result.movies.length > 0) method = 'http';
  } catch {
    result = null;
  }

  if (!result || result.movies.length === 0) {
    spinner.text = 'Cloudflare challenge detected, trying headless browser...';
    try {
      const browserResult = await fetchWatchlistViaBrowser(username);
      if (browserResult !== null) {
        result = browserResult;
        if (result.movies.length > 0) method = 'browser';
      }
    } catch (error: any) {
      result = null;
    }
  }

  const movies = result?.movies || null;
  const blocked = result?.blocked ?? true;
  const notFound = result?.notFound ?? false;

  if (!movies || movies.length === 0) {
    if (notFound) {
      spinner.fail(`User "${username}" not found on Letterboxd.`);
      console.log(chalk.gray('Check the username. Run: tor-dl user to see the current one, tor-dl setuser <username> to change it.'));
      return;
    }
    const cached = loadWatchlistCache(username);
    if (cached.length > 0) {
      spinner.warn('Live fetch blocked. Showing cached watchlist (may be stale).');
      displayMovies(cached);
      return;
    }
    if (blocked) {
      spinner.fail('Failed to fetch watchlist. Letterboxd is blocking automated requests.');
      console.log(chalk.gray('Run: tor-dl setup (install headless browser), then try again.'));
    } else {
      spinner.fail(`No movies found for ${username}. The watchlist may be empty.`);
    }
    console.log(chalk.gray('Or use: tor-dl search "movie name" to search directly.'));
    return;
  }

  watchlistCache = movies;
  saveWatchlistCache(username, movies);
  spinner.succeed(`Found ${movies.length} movies` + (method ? ` (via ${method})` : ''));

  displayMovies(movies);
}

export async function findCommand(number: number, options: any = {}): Promise<void> {
  let movie = watchlistCache.find(m => m.num === number);
  
  if (!movie) {
    const { username } = loadUsers().letterboxd;
    watchlistCache = loadWatchlistCache(username);
    movie = watchlistCache.find(m => m.num === number);
  }
  
  if (!movie) {
    console.log(chalk.red(`Movie #${number} not found. Run 'tor-dl list' first.`));
    return;
  }
  
  let searchQuery = movie.name;
  if (!options.noyear && movie.year) {
    searchQuery = `${movie.name} ${movie.year}`;
  }
  
  console.log(chalk.green(`Searching for: ${searchQuery}`));
  
  const filters = loadFilters();
  const searchOptions: SearchOptions = {
    query: searchQuery,
    category: filters.category,
    minSeeds: filters.minSeeds,
    maxSeeds: (filters as any).maxSeeds,
    minSize: filters.minSize,
    maxSize: filters.maxSize,
    sortBy: filters.sortBy,
    order: filters.order,
    limit: filters.limit,
    sources: (filters as any).sources ? (filters as any).sources.split(',') : undefined
  };
  
  const { searchCommand } = await import('./search');
  await searchCommand(searchOptions);
}