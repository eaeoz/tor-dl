# tor-dl

<p align="center">
  <img src="https://img.shields.io/npm/v/tor-dl" alt="npm version">
  <img src="https://img.shields.io/node-version/tor-dl" alt="node version">
  <img src="https://img.shields.io/github/license/tor-dl" alt="license">
</p>

> A CLI torrent search tool. Search across multiple sources, open .torrent in browser, or copy magnet links to your clipboard.

## Features

- 🔍 **Multi-Source Search** - Search across multiple torrent sources simultaneously
- 🎯 **Smart Filters** - Filter by category, seeders, size
- ⬇️ **Open in Browser** - Open .torrent files directly in your browser
- 📋 **Copy Magnet** - Copy magnet links to clipboard for use with your torrent client

## Installation

```bash
git clone https://github.com/eaeoz/tor-dl.git
cd tor-dl
npm install
npm run build
```

## Quick Start

```bash
# Search for torrents
tor-dl search "movie title"

# Open .torrent in browser or copy magnet link
tor-dl o 3
```

## Usage

### Search Command

```bash
tor-dl search <query> [options]
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
| `--sources <sources>` | Sources: yts, thepiratebay, nyaa, etc. | all enabled |

**Examples:**

```bash
# Basic search
tor-dl search "Blade Runner 2049"

# Filter by seeds and size
tor-dl search "game of thrones" --cat tv --min-seeds 100 --min-size 500MB

# Search specific source
tor-dl search "movie" --sources yts,thepiratebay
```

### Open Command

```bash
tor-dl o <number>
```

Opens .torrent file in browser, or copies magnet link to clipboard.

## Supported Sources

- YTS (Movies)
- The Pirate Bay
- Nyaa (Anime)
- EZTV (TV)
- And more...

## Requirements

- Node.js >= 18.0.0

## License

MIT License - See [LICENSE](LICENSE) for details.

## Disclaimer

This tool is for educational purposes. Always respect copyright laws and the terms of service of torrent sites.