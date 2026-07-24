# AI Instructions — PubMed Article Fetcher Obsidian Plugin

> **Canonical AI/LLM context file.** All AI assistant config files (`CLAUDE.md`, `.windsurf/rules`, `.devin/workflows`) link here.
>
> **DeepWiki:** <https://deepwiki.com/gundestrup/obsedian-research>

## Project overview

Obsidian plugin that fetches academic article metadata from **PubMed**, **PMC**, and **DOI** identifiers. Users can create new notes from article data, insert citations into existing notes, and batch-update all article links in a note or across the vault.

- **Plugin ID:** `pubmed-fetcher`
- **Author:** Svend Gundestrup
- **License:** AGPL-3.0
- **Repo:** <https://github.com/gundestrup/obsedian-research>
- **DeepWiki:** <https://deepwiki.com/gundestrup/obsedian-research>

## Tech stack

| Layer | Technology |
|---|---|
| Language | TypeScript (strict mode, ES6 target) |
| Bundler | esbuild (CJS output, `main.ts` → `main.js`) |
| Linter | ESLint 9 flat config + `eslint-plugin-obsidianmd` |
| Tests | Vitest 3 + `@vitest/coverage-v8` |
| Platform | Obsidian plugin API (`obsidian` npm package) |
| Node | ≥ 20 (CI uses Node 20) |

## Project structure

```typescript
main.ts                  # Plugin entry point — PubMedFetcherPlugin class
src/
  types.ts               # Shared interfaces, types, DEFAULT_SETTINGS
  utils.ts               # Pure functions: ID extraction, DOI cleaning, citation formatting, duplicate detection
  api.ts                 # API calls with dependency injection (PubMed E-utilities, CrossRef)
  modals.ts              # FolderSelectionModal, ArticleInputModal
  settings.ts            # PubMedFetcherSettingTab
styles.css               # Modal and button styles (loaded by Obsidian)
tests/
  extraction.test.ts      # Unit tests for ID/URL extraction
  citation-formatting.test.ts  # Unit tests for formatCitation()
  duplicate-detection.test.ts  # Unit tests for isAlreadyCited()
  api.test.ts             # Unit tests for API functions with mocked requestUrl
manifest.json            # Obsidian plugin manifest
esbuild.config.mjs       # Build config
eslint.config.mjs        # ESLint flat config
vitest.config.ts         # Vitest config with v8 coverage
tsconfig.json            # TypeScript strict config
```

## Architecture

### Module dependency graph

```typescript
main.ts
  ├── src/types.ts        (types only, no runtime deps)
  ├── src/utils.ts        (pure functions, imports types only)
  ├── src/api.ts           (imports types + utils, uses dependency-injected requestFn)
  ├── src/modals.ts        (imports obsidian API only)
  └── src/settings.ts     (imports obsidian API + main plugin type)
```

### Key design patterns

- **Dependency injection for API calls:** All API functions in `src/api.ts` accept a `RequestFunction` parameter (`(params: { url: string }) => Promise<RequestUrlResponse>`) instead of calling `requestUrl` directly. This enables unit testing with `vi.fn()` mocks.
- **Pure functions in utils:** `src/utils.ts` contains only pure functions with no side effects — fully testable without mocking.
- **Settings via Obsidian's loadData/saveData:** Plugin settings are persisted through Obsidian's built-in data persistence.

## Commands

```bash
npm run dev          # Start esbuild in watch mode
npm run build        # Type-check (tsc --noEmit) + esbuild production bundle
npm run lint         # ESLint on all .ts files
npm test             # Run vitest once
npm run test:watch   # Run vitest in watch mode
npm run test:coverage # Run vitest with v8 coverage report
npm run release      # lint + test + build (used before version bump)
```

## APIs used

### NCBI E-utilities (PubMed)

- **ESummary:** `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi` — fetch article metadata by PubMed ID
- **ESearch:** `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi` — find PubMed ID from PMC ID or DOI
- Optional API key for higher rate limits (configurable in settings)

### CrossRef

- `https://api.crossref.org/works/{doi}` — fetch article metadata by DOI when no PubMed ID is available

## ESLint rules of note

- `eslint-plugin-obsidianmd` recommended config enforces Obsidian-specific best practices
- `obsidianmd/ui/sentence-case` — UI text must be sentence case. Proper nouns (PubMed, DOI, PMC, NCBI) require `// eslint-disable-next-line obsidianmd/ui/sentence-case -- <reason>` on the line above the violation
- `@typescript-eslint/no-unused-vars` — error level (args excluded)
- Test files relax unused vars and unused expressions

## Testing guidelines

- **Unit tests** live in `tests/` and import directly from `src/` modules (not duplicated code)
- **API tests** use `vi.fn()` to mock `RequestFunction` — no real network calls
- **Coverage target:** 80% statements, branches, functions, lines
- Run `npm test` to verify all tests pass before submitting changes
- When adding new utility functions, add corresponding tests in the appropriate test file
- When adding new API functions, add tests in `tests/api.test.ts` with mocked responses

## Code style

- **No `console.debug`** — use `console.error` for errors only
- **No `createEl('h2')`** — use `Setting.setHeading()` instead (Obsidian best practice)
- **No inline styles** — use `styles.css` with CSS classes
- **No dead code** — remove unused methods and functions
- **Strict TypeScript** — all strict flags enabled in `tsconfig.json`
- **Tab indentation** — the project uses tabs, not spaces

## Obsidian plugin best practices

- `main.js` should **not** be committed to git (it's a build artifact)
- `manifest.json` must have `fundingUrl` as a non-empty string or omitted entirely
- `minAppVersion` should target a reasonably current Obsidian version
- Plugin settings should use `loadData()`/`saveData()` for persistence
- Use `Setting` component for all settings UI, not raw HTML

## CI/CD

GitHub Actions workflow (`.github/workflows/release.yml`) triggers on tag push:

1. Checkout code
2. Setup Node.js 20
3. `npm ci`
4. `npm run build`
5. Upload `main.js`, `manifest.json`, and `styles.css` as GitHub release assets

## Build configuration

- `tsconfig.json` — IDE and lint config, includes `**/*.ts` (covers test files)
- `tsconfig.build.json` — production build config, extends `tsconfig.json` with `include: ["main.ts", "src/**/*.ts"]` (excludes tests)
- `npm run build` runs `tsc -p tsconfig.build.json -noEmit -skipLibCheck` then `esbuild.config.mjs production`
- `esbuild.config.mjs` uses Node's built-in `module.builtinModules` (no external `builtin-modules` package)
- `src/settings.ts` imports `PluginSettingsHolder` from `src/types.ts` instead of the full plugin class from `main.ts`
