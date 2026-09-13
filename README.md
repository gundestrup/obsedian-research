# PubMed Article Fetcher Plugin for Obsidian

Fetch article metadata from PubMed, PMC, and DOI links automatically.

[![GitHub release](https://img.shields.io/github/v/release/gundestrup/obsidian-research)](https://github.com/gundestrup/obsidian-research/releases/latest)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](https://github.com/gundestrup/obsidian-research/blob/main/LICENSE)
[![CI](https://github.com/gundestrup/obsidian-research/actions/workflows/ci.yml/badge.svg)](https://github.com/gundestrup/obsidian-research/actions/workflows/ci.yml)
[![Release](https://github.com/gundestrup/obsidian-research/actions/workflows/release.yml/badge.svg)](https://github.com/gundestrup/obsidian-research/actions/workflows/release.yml)
[![codecov](https://codecov.io/gh/gundestrup/obsidian-research/graph/badge.svg)](https://app.codecov.io/gh/gundestrup/obsidian-research)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=gundestrup_obsedian-research&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=gundestrup_obsedian-research)
[![CodeFactor](https://www.codefactor.io/repository/github/gundestrup/obsidian-research/badge)](https://www.codefactor.io/repository/github/gundestrup/obsidian-research)
[![Semgrep](https://img.shields.io/badge/Semgrep-security%20scan-2c7a4b?logo=semgrep&logoColor=white)](https://semgrep.dev/)
[![CodeQL](https://img.shields.io/badge/CodeQL-enabled-2c7a4b?logo=github&logoColor=white)](https://github.com/gundestrup/obsidian-research/security/code-scanning)
[![Dependabot](https://img.shields.io/badge/Dependabot-enabled-025e8c?logo=dependabot&logoColor=white)](https://github.com/gundestrup/obsidian-research/security/dependabot)
[![Obsidian](https://img.shields.io/badge/Obsidian-%E2%89%A51.13.1-7c3aed?logo=obsidian&logoColor=white)](https://obsidian.md)
[![DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/gundestrup/obsidian-research)

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

- **Unit Tests**: 157 tests covering core functionality
- **Coverage**: URL extraction, formatting, duplicate detection, API parsing (80% threshold enforced in CI)

## API Sources

- **PubMed**: NCBI E-utilities
- **DOI**: Crossref API
- **PMC**: PubMed Central

**Network use**: This plugin sends requests to NCBI E-utilities (PubMed/PMC) and the Crossref API to fetch article metadata, only when you invoke its commands. No data is collected or shared beyond the article identifiers you provide.

## License

AGPL-3.0
