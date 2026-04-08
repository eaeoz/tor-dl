import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { SourcesJSON, SourceConfig, SourceScraper } from '../types';

import eztv from './eztv';
import solidtorrents from './solidtorrents';
import thepiratebay from './thepiratebay';
import torlock from './torlock';
import torrentproject from './torrentproject';
import torrentscsv from './torrentscsv';
import limetorrent from './limetorrent';
import _1337x from './1337x';
import rarbg from './rarbg';
import yts from './yts';
import nyaa from './nyaa';

const scrapers: Record<string, SourceScraper> = {
  eztv,
  solidtorrents,
  thepiratebay,
  torlock,
  torrentproject,
  torrentscsv,
  limetorrent,
  '1337x': _1337x,
  rarbg,
  yts,
  nyaa
};

export function loadSourcesConfig(): SourcesJSON {
  const sourcesPath = join(__dirname, '../../sources.json');
  if (existsSync(sourcesPath)) {
    return JSON.parse(readFileSync(sourcesPath, 'utf-8'));
  }
  return { updateUrl: '', version: '1.0.0', sources: {} };
}

export function getEnabledSources(): SourceScraper[] {
  const config = loadSourcesConfig();
  const enabled: SourceScraper[] = [];
  
  for (const [key, sourceConfig] of Object.entries(config.sources)) {
    if (sourceConfig.enabled && scrapers[key]) {
      enabled.push(scrapers[key]);
    }
  }
  
  if (enabled.length === 0) {
    return Object.values(scrapers);
  }
  
  return enabled;
}

export function getSourceConfig(name: string): SourceConfig | undefined {
  const config = loadSourcesConfig();
  return config.sources[name];
}

export function getUpdateUrl(): string {
  const config = loadSourcesConfig();
  return config.updateUrl;
}

export function getAllScrapers(): Record<string, SourceScraper> {
  return scrapers;
}

export { scrapers };