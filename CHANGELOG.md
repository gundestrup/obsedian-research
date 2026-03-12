# Changelog

## [1.1.1] - 2026-03-11

### Fixed
- **Performance**: Reduced API calls by 80% for already cited articles
- **Rate Limiting**: Added delays to prevent 429 errors
- **Duplicate Detection**: Skip already processed URLs

### Improved
- **Two-layer detection**: Quick check + API check only when needed
- **Debugging**: Better console logging and error messages
- **User Feedback**: Clear progress indicators

## [1.1.0] - 2026-03-11

### Added
- **PMC Support**: Full PubMed Central integration
- **Batch Processing**: "Link All" and "Link Global" commands
- **Duplicate Prevention**: Smart detection of existing citations
- **Test Suite**: 72 unit tests + integration tests

### Fixed
- **PMC URL Processing**: Corrected regex and API calls
- **PMC to PubMed Conversion**: Fixed ID mapping
- **Code Quality**: Eliminated duplication, added type safety

### Improved
- **Citation Format**: Added article types and icons
- **Error Handling**: Better validation and fallbacks
- **Architecture**: 23% code reduction, improved maintainability

## [1.0.2] - 2026-03-11

### Fixed
- **DOI Formatting**: Removed "doi: " prefix from URLs
- **TypeScript**: Fixed compilation errors
- **Icons**: Unicode emojis for better compatibility

## [1.0.1] - 2026-03-11

### Fixed
- **Icon Rendering**: Inline SVG data URIs

## [1.0.0] - 2026-03-11

### Added
- Initial release
- PubMed and DOI support
- Command palette and context menu
- NCBI API key settings
- AGPL-3.0 license
