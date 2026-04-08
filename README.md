# tordl

<p align="center">
  <img src="https://img.shields.io/npm/v/tordl" alt="npm version">
  <img src="https://img.shields.io/node-version/tordl" alt="node version">
  <img src="https://img.shields.io/github/license/tordl" alt="license">
</p>

> A powerful CLI torrent search and download tool. Search across multiple torrent sources, filter results, and download directly to your current directory - all from the terminal.

## Features

- 🔍 **Multi-Source Search** - Search across 9 popular torrent sources simultaneously
- 🎯 **Smart Filters** - Filter by category, seeders, size with customizable defaults
- 📊 **Sort Options** - Sort by seeds, size, or date (ascending/descending)
- ⬇️ **Direct Downloads** - Download torrents directly using WebTorrent
- 📈 **Rich Progress** - Beautiful CLI progress bar with speed and ETA
- 🔄 **Easy Updates** - Update source configurations via `-u` flag
- ⚙️ **JSON Config** - Fully configurable via `filters.json` and `sources.json`

## Installation

```bash
# Clone the repository
git clone https://github.com/eaeoz/tordl.git
cd tordl

# Install dependencies
npm install

# Build the project
npm run build

# Link for global use (optional)
npm link
```

## Quick Start

```bash
# Search for torrents
tordl search "movie title"

# Download a specific result
tordl 3

# Update sources
tordl -u
```

## Supported Sources

| Source | Categories | Status |
|--------|------------|--------|
| 1337x | All | ✅ Enabled |
| EZTV | TV | ✅ Enabled |
| The Pirate Bay | All | ✅ Enabled |
| RarBG | Movie, TV | ✅ Enabled |
| Limetorrents | All | ✅ Enabled |
| TorLock | All | ✅ Enabled |
| TorrentProject | All | ✅ Enabled |
| SolidTorrents | All | ✅ Enabled |
| torrents-csv | All | ✅ Enabled |

## Usage

### Search Command

```bash
tordl search <query> [options]
```

**Options:**

| Flag | Description | Default |
|------|-------------|---------|
| `-c, --cat <category>` | Category: all, movie, tv | from filters.json |
| `-s, --min-seeds <number>` | Minimum seeders | from filters.json |
| `--min-size <size>` | Minimum size (e.g., 500MB, 1GB) | from filters.json |
| `--max-size <size>` | Maximum size (e.g., 5GB) | from filters.json |
| `-o, --sort <field>` | Sort by: seeds, size, date | seeds |
| `--order <order>` | Order: asc, desc | desc |
| `-l, --limit <number>` | Result limit | 50 |

**Examples:**

```bash
# Basic search (uses filters.json defaults)
tordl search "Blade Runner 2049"

# Search with custom filters
tordl search "game of thrones" --cat tv --min-seeds 100 --min-size 500MB

# Sort by size (ascending)
tordl search "movie" --sort size --order asc

# Limit results to top 10
tordl search "linux" -l 10
```

### Download Command

```bash
# Download by number (from previous search)
tordl <number>

# Or use explicit download command
tordl download <number> [options]
```

**Options:**

| Flag | Description |
|------|-------------|
| `-p, --path <path>` | Custom download path |

**Example:**

```bash
# Download result #3 from previous search
tordl 3
```

### Update Command

```bash
tordl update
# or
tordl -u
```

Updates source configurations from the remote URL specified in `sources.json`.

### Version

```bash
tordl --version
# or
tordl -v
```

## Configuration

### filters.json

Default search filters (can be overridden via CLI):

```json
{
  "category": "all",
  "minSeeds": 0,
  "minSize": "0",
  "maxSize": "50GB",
  "sortBy": "seeds",
  "order": "desc",
  "limit": 50
}
```

### sources.json

Source configurations with remote update URL:

```json
{
  "updateUrl": "https://raw.githubusercontent.com/eaeoz/tordl/main/sources.json",
  "version": "1.0.0",
  "sources": {
    "1337x": {
      "enabled": true,
      "name": "1337x",
      "baseUrl": "https://1337x.to",
      "searchUrl": "https://1337x.to/category-search",
      "categories": ["all", "movie", "tv", "music", "games", "apps"],
      "searchParam": "search",
      "hasMagnet": true
    }
  }
}
```

## CLI Output Example

```
┌─────┬─────────────────────────────────────────┬───────────┬────────┬──────────┐
│ Num │ Name                                    │ Size      │ Seeds  │ Source   │
├─────┼─────────────────────────────────────────┼───────────┼────────┼──────────┤
│   1 │ Blade.Runner.2049.2017.720p.BluRay     │ 1.2GB     │  5,000 │ 1337x    │
│   2 │ Blade.Runner.2049.2017.1080p.BluRay   │ 2.1GB     │  3,200 │ limetorrent │
│   3 │ Blade.Runner.2049.2017.4K.BluRay      │ 4.5GB     │  1,800 │ rarbg    │
└─────┴─────────────────────────────────────────┴───────────┴────────┴──────────┘

To download: tordl <number>
```

## Project Structure

```
tordl/
├── bin/
│   └── tordl.js          # CLI entry point
├── src/
│   ├── cli/
│   │   ├── parser.ts           # Commander.js CLI parser
│   │   ├── display.ts         # Terminal output formatting
│   │   └── progress.ts        # Download progress bar
│   ├── commands/
│   │   ├── search.ts          # Search command
│   │   ├── download.ts        # Download command
│   │   └── update.ts          # Update sources command
│   ├── sources/
│   │   ├── _1337x.ts          # 1337x scraper
│   │   ├── eztv.ts            # EZTV scraper
│   │   ├── limetorrent.ts     # Limetorrents scraper
│   │   ├── rarbg.ts           # RarBG scraper
│   │   └── ...                # More source scrapers
│   ├── filters/
│   │   ├── category.ts        # Category filter
│   │   ├── size.ts            # Size filter
│   │   ├── seeds.ts           # Seeds filter
│   │   └── sort.ts            # Sort functionality
│   ├── download/
│   │   └── engine.ts          # WebTorrent download engine
│   └── types.ts               # TypeScript interfaces
├── sources.json               # Source configurations
├── filters.json               # Default filters
└── package.json
```

## Requirements

- Node.js >= 18.0.0
- npm or yarn

## Tech Stack

- **TypeScript** - Type-safe code
- **Commander.js** - CLI argument parsing
- **Axios + Cheerio** - HTTP requests and HTML parsing
- **WebTorrent** - Torrent downloading
- **cli-progress** - Rich progress bars
- **Chalk** - Terminal colors
- **Ora** - Loading spinners

## License

MIT License - See [LICENSE](LICENSE) for details.

## Disclaimer

This tool is for educational purposes. Always respect copyright laws and the terms of service of torrent sites. Download only content you have the right to access.

---

<p align="center">Made with ❤️ for the CLI community</p>