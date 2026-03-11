# Changelog

All notable changes to the PubMed Article Fetcher plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.1] - 2026-03-11

### Fixed
- **Performance Issue with Already Cited Articles**
  - Fixed plugin making unnecessary API calls for articles already in citation format
  - Added quick pattern checks before API calls to skip already cited URLs
  - Resolved issue where 5 API calls were made when only 1 was needed
  - Eliminated "429 Too Many Requests" errors caused by excessive API calls

### Improved
- **API Call Optimization**
  - Implemented two-layer detection system: quick check (no API) + full check (API if needed)
  - Added PubMed link pattern matching to skip already cited articles before fetching
  - Added PMC link pattern matching to skip already cited articles before fetching  
  - Added DOI link pattern matching to skip already cited articles before fetching
  - Reduces API calls by up to 80% for notes with existing citations

- **Enhanced Debugging and User Feedback**
  - Added detailed console logging for PMC processing workflow
  - Improved error visibility with step-by-step processing information
  - Better tracking of PubMed ID conversions and article metadata retrieval
  - Clear indication of which URLs are processed vs skipped
  - Enhanced duplicate detection feedback for troubleshooting

- **Rate Limiting Prevention**
  - Added 350ms delays between API calls to respect NCBI rate limits
  - Applied delays to both note-level and vault-wide processing
  - Prevents CORS errors and failed fetches during batch operations
  - Ensures reliable operation even without NCBI API key

### Changed
- **Processing Logic**
  - Moved duplicate detection checks before API calls for all URL types
  - Updated both `fetchAllArticlesInNote` and `fetchAllArticlesInVault` methods
  - Maintained backward compatibility while improving performance
  - Preserved all existing functionality while reducing unnecessary API calls

## [1.1.0] - 2026-03-11

### Added
- **PMC (PubMed Central) Support**
  - Full PMC URL parsing and processing (`https://pmc.ncbi.nlm.nih.gov/articles/PMC6792392/`)
  - Automatic PMC to PubMed ID conversion via NCBI API
  - PMC ID extraction from PubMed API responses
  - PMC icon (📄) in citation formatting for full-text access
  - Support for both PMC URL formats: with and without `/articles/` path

- **Comprehensive Test Suite**
  - Individual test files for PMC (`test-pmc.js`), DOI (`test-doi.js`), and PubMed (`test-pmid.js`) functionality
  - URL specificity testing to ensure only academic URLs are processed
  - Mixed content processing tests with invalid URL handling
  - API integration tests for NCBI E-utilities and CrossRef APIs
  - Test runner (`run-tests.js`) for automated testing
  - Complete test documentation (`TEST_README.md`)

- **Enhanced Batch Processing**
  - "Link All" command now processes URLs in-place instead of inserting at cursor
  - Support for mixed URL types in single note processing
  - Improved error handling for invalid URLs during batch operations
  - Better progress reporting and user feedback

- **Duplicate Citation Prevention**
  - Intelligent detection of already cited articles to prevent re-processing
  - Skips URLs that have already been converted to citation format
  - Works across all citation types: PubMed, PMC, and DOI
  - Prevents duplicate API calls and maintains clean note content
  - Comprehensive test coverage for duplicate detection scenarios
  - Enhanced detection for incomplete citations (missing links) using title/year matching

### Fixed
- **PMC URL Processing Bug**
  - Fixed issue where PMC URLs were identified but not replaced in "Link All" command
  - Resolved `RegExp.test()` interfering with `RegExp.replace()` operations
  - Corrected PMC ID extraction regex patterns to include `https://` prefix

- **PMC to PubMed Conversion Bug**
  - Fixed incorrect PMC-to-PubMed conversion that was returning wrong PubMed IDs
  - Updated search method to use `[pmcid]` field instead of `[pmc]` for accurate results
  - Resolved issue where PMC6792392 was incorrectly mapped to PubMed ID 6792392 instead of 30321896
  - Ensures correct article metadata and citation generation for PMC links

### Improved
- **TypeScript and Code Quality**
  - Eliminated all code duplication through refactoring
  - Added centralized `ArticleInfo` interface for type safety
  - Consolidated duplicate fetch methods (`fetchByDOI`, `fetchByPubMedId`)
  - Standardized error handling with `handleError()` helper method
  - Fixed TypeScript compilation to pass with zero errors

### Changed
- **Major Code Refactoring**
  - Extracted shared `fetchPubMedApiData()` method to eliminate duplication
  - Created `parsePubMedResult()` for consistent API response parsing
  - Consolidated citation formatting into single `formatCitation()` method
  - Reduced codebase by 277 lines (23% reduction) while improving maintainability
  - Added class-level constants for URL regex patterns

- **Improved URL Handling**
  - Enhanced URL specificity to only match exact academic URL patterns
  - Added comprehensive invalid URL rejection (arXiv, Google Scholar, etc.)
  - Better mixed content processing with accurate URL type detection
  - Robust error handling for malformed or unsupported URLs

### Improved
- **Error Handling and User Experience**
  - Graceful handling of invalid URLs with informative error messages
  - Better progress notifications during batch operations
  - Improved debugging capabilities with detailed error logging
  - More resilient API error handling with fallback behaviors
  - Smart duplicate prevention to avoid re-processing already cited articles
  - Cleaner note content by preventing duplicate citations

- **Code Architecture**
  - Better separation of concerns with dedicated helper methods
  - Improved testability with modular function design
  - Enhanced maintainability through reduced duplication
  - Consistent error handling patterns across all methods

### Security
- **Input Validation**
  - Strict URL pattern matching prevents processing of unintended links
  - Comprehensive validation of PubMed, PMC, and DOI formats
  - Protection against malformed input and potential injection attacks

### Documentation
- **Test Documentation**
  - Complete test suite documentation with usage examples
  - URL specificity testing guidelines
  - API integration testing procedures
  - Debugging and troubleshooting guides

## [1.0.2] - 2026-03-11

### Fixed
- Fixed DOI link formatting issue where "doi: " prefix was included in URLs
- Added cleanDOI helper function to properly extract DOI values from PubMed API
- Fixed TypeScript compilation errors for null safety

### Changed
- Replaced inline SVG with Unicode emoji icons for better Obsidian compatibility
- Updated to ESummary API version 2.0 for improved article data extraction
- Icons now work in both edit and reading modes (📚 for PubMed, 🔗 for DOI)

### Improved
- Better DOI extraction from PubMed API articleids array
- Cleaner markdown output without HTML rendering issues
- Enhanced cross-platform compatibility with Unicode symbols

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

[1.1.1]: https://github.com/gundestrup/obsedian-research/releases/tag/v1.1.1
[1.1.0]: https://github.com/gundestrup/obsedian-research/releases/tag/v1.1.0
[1.0.2]: https://github.com/gundestrup/obsedian-research/releases/tag/v1.0.2
[1.0.1]: https://github.com/gundestrup/obsedian-research/releases/tag/v1.0.1
[1.0.0]: https://github.com/gundestrup/obsedian-research/releases/tag/v1.0.0
