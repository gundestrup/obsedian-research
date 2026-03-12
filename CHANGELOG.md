# Changelog

## [1.2.3] - 2026-03-12

### Fixed
- **Version Bump Script**: Now supports patch/minor/major version bumps (was only patch)
- **Regex Escaping**: Properly escape all dots in version numbers for changelog validation
- **Error Visibility**: Show full test output for easier debugging when checks fail
- **Exact Version Validation**: Validate exact version match after npm bump

### Improved
- **Version Comparison**: Semantic version comparison instead of hardcoded patch increment
- **Dual Validation**: Check for newer version in preversion, exact match in version script
- **Package Scripts**: Added missing preversion script for proper lifecycle

## [1.2.2] - 2026-03-12

### Fixed
- **Release Safety**: Implemented pre-version validation to prevent version inconsistency
- **Atomic Releases**: Tests now run BEFORE any version files are updated
- **Version Validation**: changelog validation happens before package.json changes

### Improved
- **Release Documentation**: Updated RELEASE.md to reflect new validation order
- **Error Prevention**: No more inconsistent version states when tests fail
- **Safety Guarantee**: Either all checks pass and versions update, or nothing changes

## [1.2.1] - 2026-03-12

### Added
- **Comprehensive Test Suite**: 72 unit tests + 5 integration test suites
- **Modern Tooling**: ESLint v10, c8 v11, sinon v21, TypeScript v5.9
- **Package Updates**: All safe dependencies updated to latest versions

### Improved
- **Documentation**: Streamlined README and CHANGELOG (KISS principle)
- **Code Quality**: Full linting coverage for all TypeScript files
- **Project Structure**: Cleaned up debugging artifacts and IDE files
- **Testing Protocol**: Complete pre-release checklist in RELEASE.md

### Changed
- **Test Organization**: Separated unit tests (fast) from integration tests (API calls)
- **Documentation**: Merged test docs into single TESTING.md file
- **Development Workflow**: Updated build, lint, and test scripts

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
