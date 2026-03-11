# Changelog

All notable changes to the PubMed Article Fetcher plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2026-03-11

### Fixed
- Fixed SVG icon rendering issue by replacing file-based icons with inline SVG data URIs
- Icons now display correctly without requiring external files

### Changed
- Updated README documentation to reflect inline SVG implementation

## [1.0.0] - 2026-03-11

### Added
- Initial release of PubMed Article Fetcher plugin
- Fetch article metadata from PubMed ID or DOI
- Support for full URLs (PubMed and DOI links)
- Automatic DOI to PubMed ID conversion
- Automatic PubMed to DOI extraction
- Dual-link citation format with both PubMed and DOI links
- Article type extraction from APIs (Review, Article, etc.)
- Inline text replacement via context menu
- Command palette support for creating new notes
- Settings tab for NCBI API key configuration
- Inline SVG icons for PubMed (book) and DOI (link)
- AGPL-3.0 license

### Features
- **Input formats supported:**
  - PubMed ID: `38570095`
  - PubMed URL: `https://pubmed.ncbi.nlm.nih.gov/38570095/`
  - DOI: `10.1016/j.clinme.2024.100038`
  - DOI URL: `https://doi.org/10.1016/j.clinme.2024.100038`

- **Citation format:**
  - `[Icon] Type: [Title](PubMed link) - Year, Journal [DOI Icon](DOI link)`
  - Clickable title linking to PubMed
  - Clickable DOI icon linking to DOI URL
  - Article type displayed (Review, Article, etc.)

- **Two usage modes:**
  1. Command palette - Creates new note with article info
  2. Inline editor - Replaces selected text with formatted citation

[1.0.1]: https://github.com/gundestrup/obsedian-research/releases/tag/v1.0.1
[1.0.0]: https://github.com/gundestrup/obsedian-research/releases/tag/v1.0.0
