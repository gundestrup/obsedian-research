# PubMed Article Fetcher Plugin for Obsidian

Fetch article metadata from PubMed, PMC, and DOI links automatically.

## Features

- **Multiple Input Formats**: PubMed ID, PMC ID, DOI, or their URLs
- **Smart Detection**: Automatically identifies input type
- **Rich Citations**: Title, journal, year, and clickable links
- **Duplicate Prevention**: Skips already cited articles
- **Batch Processing**: Update all links in notes or vault
- **Full Text Access**: PMC links provide free full text

## Quick Start

1. Install plugin and enable in Obsidian
2. Use any of these methods:

### Command Palette
- "Create new note with article info" - Create a new note with article metadata
- Enter ID/URL: `38570095` or `https://pubmed.ncbi.nlm.nih.gov/38570095/`

### Right-Click Menu
- Select text → "Update selected link only"
- Replaces selected text with a formatted citation

### Batch Processing
- "Update all links in current note" - Process the active note
- "Update all links in all notes" - Process the entire vault (enable in settings first)

## Supported Formats

| Type | Example | Result |
|------|---------|--------|
| PubMed ID | `38570095` | 📚 Review: [Title](link) - Year, Journal |
| PMC ID | `PMC6792392` | 📚 Article: [Title](link) - Year, Journal [📄](full-text) |
| DOI | `10.1016/j.clinme.2024.100038` | 🔗 Article: [Title](link) - Year, Journal |

## Settings

- **NCBI API Key**: Optional, for higher rate limits
- **Enable Global Update**: Safety toggle for vault-wide operations

## Development

```bash
npm install          # Install dependencies
npm run build        # Build plugin
npm test             # Run tests
npm run lint         # Check code quality
```

## Testing

- **Unit Tests**: 91 tests covering core functionality
- **Coverage**: URL extraction, formatting, duplicate detection, API parsing

## API Sources

- **PubMed**: NCBI E-utilities
- **DOI**: Crossref API
- **PMC**: PubMed Central

## License

AGPL-3.0
