# PubMed Article Fetcher Plugin for Obsidian

This Obsidian plugin allows you to fetch article metadata from PubMed ID or DOI links and automatically create notes with the article information.

## Features

- **Fetch by PubMed ID**: Enter a numeric PubMed ID (e.g., `38570095`)
- **Fetch by DOI**: Enter a DOI link (e.g., `10.1016/j.clinme.2024.100038`)
- **Automatic Detection**: The plugin automatically detects whether you've entered a PubMed ID or DOI
- **Rich Metadata**: Extracts article title, journal name, and year of publication
- **Note Creation**: Automatically creates a new note with the fetched information

## Installation

1. Clone this repository to your Obsidian plugins directory
2. Run `npm install` to install dependencies
3. Run `npm run build` to compile the plugin
4. Enable the plugin in Obsidian settings

## Usage

### Method 1: Command Palette (Creates New Note)

1. Open the command palette in Obsidian (Cmd/Ctrl + P)
2. Search for "Fetch Article from PubMed/DOI" and select it
3. Enter any of the following formats:
   - **PubMed ID**: `38570095`
   - **PubMed URL**: `https://pubmed.ncbi.nlm.nih.gov/38570095/`
   - **DOI**: `10.1016/j.clinme.2024.100038`
   - **DOI URL**: `https://doi.org/10.1016/j.clinme.2024.100038`
4. Press Enter or click "Fetch Article"
5. The plugin creates a new note with article information **including a clickable link**

### Method 2: Inline Text Replacement (While Writing)

1. **Type or paste** any supported format in your note:
   - PubMed ID: `38570095`
   - PubMed URL: `https://pubmed.ncbi.nlm.nih.gov/38570095/`
   - DOI: `10.1016/j.clinme.2024.100038`
   - DOI URL: `https://doi.org/10.1016/j.clinme.2024.100038`
2. **Select the text** with your cursor
3. **Right-click** and choose "Fetch Article Info" from the context menu
   - OR use Command Palette: "Fetch Article from Selected PubMed/DOI"
4. The selected text is **replaced** with a formatted citation with clickable link

**Example:**
- Type: `https://pubmed.ncbi.nlm.nih.gov/38570095/`
- Select and fetch
- Result: `📚 Review: [An introduction to neuropalliative care](https://pubmed.ncbi.nlm.nih.gov/38570095/) - 2024, Clin Med (Lond) [🔗](https://doi.org/10.1016/...)`

The citation includes:
- **📚 Book icon** for PubMed articles
- **Article Type** (Review, Article, etc.)
- **Clickable Title** linking to PubMed
- **🔗 Clickable link icon** linking to DOI URL
- **Year and Journal** name

## Settings

You can optionally add your NCBI API key in the plugin settings for higher rate limits:
1. Go to Settings > Community Plugins > PubMed Article Fetcher
2. Enter your NCBI API key (get one from https://www.ncbi.nlm.nih.gov/account/dev/)

## Development

- `npm run dev` - Start development mode with hot reloading
- `npm run build` - Build the plugin for production

## API Sources

- **PubMed**: Uses NCBI E-utilities API
- **DOI**: Uses Crossref API

## License

AGPL-3.0
