# tor-dl

A CLI torrent search tool. Search across multiple sources, open .torrent in browser, or copy magnet links to clipboard.

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

# Copy magnet link to clipboard
tor-dl o 3

# Show version
tor-dl --version
```

## Commands

### search <query>
Search for torrents across multiple sources.

```bash
tor-dl search <query> [options]
```

**Options:**

| Flag | Description | Example |
|------|-------------|---------|
| `-c, --cat <category>` | Category to filter results | `all`, `movie`, `tv`, `anime`, `music`, `games`, `apps` |
| `-s, --min-seeds <number>` | Minimum number of seeders | `100` |
| `--max-seeds <number>` | Maximum number of seeders | `1000` |
| `--min-size <size>` | Minimum file size | `500MB`, `1GB`, `2GB` |
| `--max-size <size>` | Maximum file size | `5GB`, `10GB` |
| `-o, --sort <field>` | Sort results by field | `seeds`, `size`, `date` |
| `--order <order>` | Sort order | `asc` (low to high), `desc` (high to low) |
| `-l, --limit <number>` | Maximum results to return | `10`, `50`, `100` |
| `--sources <sources>` | Sources to search (comma-separated) | `yts,thepiratebay,nyaa` |

**Available Categories:**
- `all` - Search all categories
- `movie` - Movies
- `tv` - TV shows
- `anime` - Anime (mainly Nyaa)
- `music` - Music
- `games` - Games
- `apps` - Applications

**Available Sources:**
- `yts` - YTS (Movies only)
- `eztv` - EZTV (TV shows)
- `thepiratebay` - The Pirate Bay (All categories)
- `nyaa` - Nyaa.si (Anime, Software)

**Examples:**

```bash
# Basic search
tor-dl search "Blade Runner 2049"

# Search movies with minimum seeds
tor-dl search "movie" --cat movie --min-seeds 100

# Search with size limits
tor-dl search "linux" --min-size 500MB --max-size 2GB

# Search specific sources only
tor-dl search "game" --sources yts,thepiratebay

# Sort by size (smallest first)
tor-dl search "documentary" --sort size --order asc

# Limit results to top 10
tor-dl search "podcast" -l 10
```

### o <number>
Copy .torrent URL or magnet link to clipboard for the selected result number.

```bash
tor-dl o <number>
```

After running a search, enter the result number to copy the link to your clipboard.

**Example:**
```bash
tor-dl search "python tutorial"
# Results displayed...
tor-dl o 5
# Magnet link copied to clipboard!
```

### open <number>
Same as `o` command - opens .torrent in browser or copies magnet link.

```bash
tor-dl open <number>
```

### Options

| Flag | Description |
|------|-------------|
| `-v, --version` | Show version number |
| `-h, --help` | Show help information |

## Supported Sources

| Source | Categories | Description |
|--------|------------|-------------|
| YTS | movie | Movie torrents with direct .torrent download |
| The Pirate Bay | all | General torrent search |
| Nyaa | anime, tv | Anime and Japanese media |
| EZTV | tv | TV show torrents |

## Size Format

Size can be specified in various formats:
- `KB` - Kilobytes
- `MB` - Megabytes
- `GB` - Gigabytes
- `TB` - Terabytes

Examples: `500MB`, `1.5GB`, `2GB`

## Requirements

- Node.js >= 18.0.0
- npm

## License

MIT License

## Disclaimer

This tool is for educational purposes. Always respect copyright laws and the terms of service of torrent sites.