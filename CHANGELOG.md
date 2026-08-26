# Changelog

## [Unreleased]

### Changed
- **AI_INSTRUCTIONS.md → AGENTS.md**: Renamed to follow the agents.md open convention. AGENTS.md is now the single source of truth for all coding agents. `CLAUDE.md`, `DEVIN.md`, and `WINDSURF.md` updated to point to `AGENTS.md`.

## [1.4.0] - 2026-07-24

### Changed
- **Declarative settings API**: Migrated `settings.ts` from deprecated `display()` to `getSettingDefinitions()` (Obsidian 1.13+), enabling settings search
- **Dependency upgrades**: Updated all devDependencies to latest compatible versions
  - `@types/node` 22 → 26
  - `@typescript-eslint/eslint-plugin` and `parser` 8.57 → 8.65
  - `vitest` and `@vitest/coverage-v8` 3 → 4
  - `eslint` 9 → 10
  - `eslint-plugin-obsidianmd` 0.1 → 0.4
- **ESLint config**: Configured `obsidianmd/ui/sentence-case` rule with acronyms (NCBI, DOI, PMC, API, URL, ID) and ignore words (PubMed, Obsidian)
- **modals.ts**: Replaced `createEl('div', ...)` with `createDiv(...)` per new `obsidianmd/prefer-create-el` rule
- **AI_INSTRUCTIONS.md**: Updated URL formatting and code block language tags

### Fixed
- **Lint warnings**: Removed all `eslint-disable` comments for `obsidianmd/ui/sentence-case` (no longer needed with proper rule config)
- **Settings search**: Plugin settings now appear in Obsidian's global settings search

## [1.3.0] - 2026-07-23

### Added

- **Edge-case tests**: 30+ tests for identifier extraction (trailing punctuation, mixed casing, malformed URLs, false-positive hostnames), API responses (encoded params, malformed bodies, PMC non-200), and URL replacement (Markdown links, fragments/query strings, code blocks, repeated IDs)
- **Replacement test suite**: New `tests/replacement.test.ts` covering all URL replacement helpers
- **PluginSettingsHolder interface**: Reduced coupling between `settings.ts` and `main.ts` via interface in `types.ts`

### Changed

- **Migrated from Mocha/Chai to Vitest 3**: All tests now use Vitest with `vi.fn()` mocks
- **Build separation**: Created `tsconfig.build.json` to exclude test files from production `tsc` type-checking
- **Replaced `builtin-modules`**: Now uses Node's built-in `module.builtinModules` in `esbuild.config.mjs`
- **Updated `esbuild`**: Bumped from 0.25.0 to 0.28.0
- **Pinned `obsidian`**: Locked to 1.13.1 matching `minAppVersion`
- **Case-insensitive extraction**: `extractPubMedId`, `extractPMCId`, and `extractDOI` now handle mixed-case URLs
- **DOI cleaning**: `parsePubMedResult` now applies `cleanDOI()` to top-level `result.doi` and `result.elocationid`
- **DOI trailing period**: `extractDOI` now strips trailing periods from extracted DOIs

### Fixed

- **`findPubMedIdFromPMC`**: Normalized URL construction with `URLSearchParams` and added HTTP status checking
- **`styles.css` release asset**: Added to GitHub Actions release workflow
- **`manifest.json`**: Removed empty `fundingUrl`, updated `minAppVersion` to 1.13.1
- **`version-bump.mjs`**: Removed obsolete `test:integration` call
- **Mock type safety**: `mockRequest()` now uses `MockedFunction<RequestFunction>` with typed call inspection

### Removed

- **Legacy Mocha files**: Deleted `tests/setup.ts`, `tests/test-utils.ts`, `.mocharc.json`, `run-tests.js`, `test-doi.js`, `test-pmc.js`, `test-pmid.js`, `test-duplicate-prevention.js`, `test-enhanced-detection.js`
- **`mockRequestSequence()`**: Removed unused helper from `tests/api.test.ts`
- **`builtin-modules`**: Removed deprecated dependency

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
