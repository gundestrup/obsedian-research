# Code Review Findings & Suggestions

> Generated review of the current refactoring state for the PubMed Article Fetcher Obsidian plugin.
> DeepWiki: <https://deepwiki.com/gundestrup/obsedian-research>

## Overall assessment

The modularization, Vitest migration, and dependency-injection refactor are moving in the right direction. The code is much more testable and the architecture is cleaner than the original monolithic plugin.

**Update:** this section was re-verified by actually running `rm -rf node_modules package-lock.json && npm install`, `npx vitest run`, `npx eslint '**/*.ts'`, and `npm run build` against the current source, and by cross-checking `manifest.json`/release requirements against the official Obsidian developer docs and the canonical `obsidianmd/obsidian-sample-plugin` guidance. This corrected one earlier finding and surfaced new, confirmed issues (see below).

## What is good

- **Clean modular split** into `src/types.ts`, `src/utils.ts`, `src/api.ts`, `src/modals.ts`, `src/settings.ts`.
- **API testability** via injected `RequestFunction` in `src/api.ts`.
- **`main.ts` is now a coordinator** with `console.debug` and dead code removed.
- **`package.json` correctly migrated** from Mocha/Chai/Sinon/c8 to Vitest + `@vitest/coverage-v8`.
- **`vitest.config.ts`** is reasonable: node environment, globals enabled, v8 coverage, 80 % thresholds.
- **`tests/api.test.ts`** correctly uses Vitest matchers (`toBe`, `toBeNull`, `toHaveBeenCalledWith`, `rejects.toThrow`) and `vi.fn()` mocks.
- **AI documentation** (`AI_INSTRUCTIONS.md`, `CLAUDE.md`, `WINDSURF.md`, `DEVIN.md`) is well-structured, DRY, and links to the DeepWiki URL.
- **`styles.css`** replaces inline styles.
- **Modals use `Setting.setHeading()`** instead of `createEl('h2')`.

## Correction to a prior finding

### The "Chai assertions break Vitest" finding was WRONG

A previous version of this review claimed `.to.equal`, `.to.be.true`, `.to.be.null`, etc. in `tests/extraction.test.ts`, `tests/citation-formatting.test.ts`, and `tests/duplicate-detection.test.ts` would break under Vitest. **This is incorrect and has been verified false by actually running the suite:**

```text
✓ tests/citation-formatting.test.ts (13 tests)
✓ tests/duplicate-detection.test.ts (18 tests)
✓ tests/extraction.test.ts (41 tests)
✓ tests/api.test.ts (19 tests)
Test Files  4 passed (4)
     Tests  91 passed (91)
```

**Root cause of the mistake:** Vitest's `expect` is built directly on top of `chai` (see `packages/vitest/src/integrations/chai/index.ts` in the Vitest source, and Vitest's own docs: *"Vitest provides `chai` assertions by default and also `Jest` compatible assertions built on top of `chai`"*). Chai-style chains (`.to.equal()`, `.to.be.true`) and Jest-style matchers (`.toBe()`, `.toBeTruthy()`) are **both valid** in the same `expect()` call in Vitest. No migration of these three files is required for correctness.

**Remaining, non-blocking suggestion:** for consistency, consider standardizing all test files on one assertion style (Jest-style matchers, matching `tests/api.test.ts`) — but this is a style preference, not a bug.

## Critical issues (verified)

### 1. `npm run build` actually fails — `tests/setup.ts` breaks the TypeScript compile

Confirmed by running `npm run build` (`tsc -noEmit -skipLibCheck && node esbuild.config.mjs production`) against a freshly installed `node_modules`:

```text
tests/setup.ts(6,8): error TS1192: Module '\".../node_modules/@types/chai/index\"' has no default export.
tests/setup.ts(7,23): error TS2307: Cannot find module 'sinon-chai' or its corresponding type declarations.
```

`tsconfig.json` includes `**/*.ts`, so `tests/setup.ts` (still importing `chai` and `sinon-chai`, both removed from `package.json`) is compiled and **breaks the production build**, not just linting. This is the real release-blocking issue — not the assertion syntax. `tests/setup.ts` must be deleted (it is unused; no current test file imports from it).

### 2. `tests/test-utils.ts` is dead code masquerading as documentation

`tests/test-utils.ts` duplicates `extractPubMedId`/`extractPMCId`/etc. from `src/utils.ts`, but no current test file imports it — confirmed via search across `tests/*.test.ts`. It is only referenced by the stale `tests/README.md` example (`import { extractPubMedId } from './test-utils';`). It should be deleted along with `tests/setup.ts`; both are pre-refactor leftovers.

### 3. `package-lock.json` was stale and has now been regenerated

Before this verification pass, `package-lock.json` still declared `chai`, `mocha`, `sinon`, `c8`, `tsx`, etc., while `package.json` had already removed them. Running `rm -rf node_modules package-lock.json && npm install` fixed this and produced a consistent lockfile (420 packages, 0 vulnerabilities). **This must be committed** — do not leave the old lockfile in version control, since `npm ci` (used in CI) would otherwise fail or install the wrong dependency graph.

### 4. New: type-unsafe test helper causes real ESLint errors

`npx eslint '**/*.ts'` reports (after the lockfile fix, independent of `tests/setup.ts`):

```text
tests/api.test.ts
  118:4  error  Unsafe assignment of an `any` value  @typescript-eslint/no-unsafe-assignment
  140:4  error  Unsafe assignment of an `any` value  @typescript-eslint/no-unsafe-assignment
```

Cause: `mockRequest()` in `tests/api.test.ts` returns `vi.fn().mockResolvedValue(response)` typed as the plain `RequestFunction` type, discarding the `Mock` type. When `expect(requestFn).toHaveBeenCalledWith({ url: expect.stringContaining(...) })` is called, TypeScript can no longer resolve `toHaveBeenCalledWith` against a mock-aware type, and the assertion payload resolves to `any`. Fix by typing the helper's return as `Mock<RequestFunction>` (or `MockedFunction<RequestFunction>`) instead of widening to `RequestFunction`, e.g.:

```ts
import type { Mock } from 'vitest';

function mockRequest(response: RequestUrlResponse): Mock<RequestFunction> {
	return vi.fn().mockResolvedValue(response);
}
```

## Best-practice / currency issues

### `manifest.json` — confirmed against official Obsidian docs

Per the official [Submission requirements for plugins](https://docs.obsidian.md/Plugins/Releasing/Submission+requirements+for+plugins) and [Manifest reference](https://docs.obsidian.md/Reference/Manifest):

- **`fundingUrl: ""`** — confirmed wrong. Official guidance: *"If you don't accept donations, remove `fundingUrl` from your manifest."* An empty string is not the same as omitting the key and should be deleted, not left blank.
- **`minAppVersion: "0.15.0"`** — official guidance: *"should be set to the minimum required version of the Obsidian app that your plugin is compatible with. If you don't know what an appropriate version number is, use the latest stable build number."* `0.15.0` (released 2022) predates APIs the plugin may rely on (e.g. `Setting.setHeading()`, a newer addition). Determine the true minimum from the APIs actually used, then update `manifest.json` and `versions.json` together — don't guess a round number like `1.0.0` without checking.
- **`isDesktopOnly: false`** is correct and consistent — the plugin only uses `requestUrl`, `Notice`, `Modal`, `Setting`, and vault APIs, none of which are Node/Electron-only.
- **`id: "pubmed-fetcher"`** is compliant (lowercase + hyphens, doesn't end in "plugin", doesn't contain "obsidian").
- **`description`** is compliant: action-oriented, ends with a period, under 250 characters, no emoji.

### `.gitignore` and `main.js` policy — corrected

A previous version of this review called this "a policy choice, either is valid." That was too lenient. The canonical `obsidianmd/obsidian-sample-plugin` [`AGENTS.md`](https://github.com/obsidianmd/obsidian-sample-plugin/blob/master/AGENTS.md) is explicit: *"Do not commit build artifacts: Never commit `node_modules/`, `main.js`, or other generated files to version control."* This is current, authoritative guidance from the Obsidian team's own plugin template, not just a style preference.

`main.js` **is** currently tracked in this repo (`git ls-files` confirms it). It should be removed from git and the `.gitignore` exception (`!main.js`) should be dropped, since CI already builds and uploads it as a release asset — which is the correct approach per the official [Release your plugin with GitHub Actions](https://docs.obsidian.md/Plugins/Releasing/Release+your+plugin+with+GitHub+Actions) guide.

### Legacy files remaining
These should be removed after the Vitest migration:
- `.mocharc.json`
- `tests/setup.ts`
- `tests/test-utils.ts`
- `run-tests.js`
- `test-doi.js`, `test-pmc.js`, `test-pmid.js`, `test-duplicate-prevention.js`, `test-enhanced-detection.js`

### Documentation out of sync
- `README.md` lists old command names (`"PubMed Article Fetcher Note"`, `"Link All"`, `"Link Global"`) and mentions integration tests / 72 tests / Mocha-era coverage. It needs to match the current `main.ts` command IDs and Vitest setup.
- `TESTING.md` references `npm run test:integration` (removed) and shows an `import { expect } from './setup'` example from the Mocha/Chai era.

### CI workflow
`.github/workflows/release.yml` runs `npm run build` directly and does **not** run lint or tests. It should run:

```yaml
- run: npm run lint
- run: npm test
- run: npm run build
```

Using `npm run release` is also possible, but separate CI steps provide clearer failure reporting.

### Release and versioning consistency

`package.json` no longer defines `test:integration`, but `version-bump.mjs` still invokes `npm run test:integration`. Consequently, `npm version patch` will fail after the unit tests unless the version script is updated or an intentionally maintained integration-test command is restored.

`RELEASE.md` also documents integration tests that are no longer part of the package scripts.

### Missing `styles.css` release asset — confirmed against official guidance

The release workflow (`.github/workflows/release.yml`) uploads only `main.js` and `manifest.json`. The official Obsidian [Release your plugin with GitHub Actions](https://docs.obsidian.md/Plugins/Releasing/Release+your+plugin+with+GitHub+Actions) guide and the `obsidian-sample-plugin` `README.md` both explicitly require uploading `main.js`, `manifest.json`, **and** `styles.css` as separate release assets when a stylesheet exists. Since the plugin now uses CSS classes from `styles.css` (see `src/modals.ts`), omitting it from the release means users who install from the GitHub release will have unstyled modals. Add `styles.css` to the `files:` list in `release.yml`.

### Dependency choices
- `package-lock.json` still describes the former Mocha/Chai dependency graph and must be regenerated before CI can use `npm ci` reliably.
- `esbuild` is pinned to `"0.25.0"`. The previous `package.json` had `"0.27.3"`, so this is an older version. Verify compatibility and update deliberately rather than downgrading accidentally.
- `builtin-modules` is flagged by module-replacement lint as deprecated. Consider replacing it with a maintained Node built-in module source or a deliberately maintained static list in `esbuild.config.mjs`.
- Do not use `"latest"` for the `obsidian` development dependency in a reproducible release project. Pin a known compatible Obsidian API version or use a deliberate update policy, then regenerate the lockfile.

## Minor code-quality notes

- `src/api.ts` `findPubMedIdFromPMC` uses raw string URL concatenation, while `findPubMedIdFromDOI` and `fetchPubMedApiData` use `URLSearchParams`. Make URL construction consistent.
- `findPubMedIdFromPMC` does not check the HTTP status before parsing the response. Its behavior should be made consistent with the other API functions and covered by tests.
- `parsePubMedResult` cleans DOI values from `articleids` but does not clean top-level `result.doi` or `result.elocationid` with `cleanDOI`.
- `tests/api.test.ts` defines `mockRequestSequence()` but never uses it — remove the unused helper or add a test that needs multiple responses.
- API tests should cover encoded DOI/API-key parameters, malformed response bodies, and PMC non-200 responses.
- Identifier extraction should have edge-case tests for trailing punctuation, mixed casing, malformed URLs, and false-positive hostnames.
- Replacement helpers should be tested against Markdown links, URL fragments/query strings, code blocks, and repeated identifiers.
- `src/settings.ts` imports `type PubMedFetcherPlugin` from `../main`. This is erased at runtime and is not a runtime circular dependency, but a small interface in `src/types.ts` would reduce coupling.

## Recommended completion order (updated after live verification)

### P0 — Release and verification blockers (confirmed by running the actual toolchain)

1. Commit the regenerated `package-lock.json` (already fixed locally via `npm install`; verified 0 vulnerabilities, Vitest present, Mocha/Chai/Sinon/c8 gone).
2. Delete `tests/setup.ts` — it currently **breaks `npm run build`** with real `tsc` errors (`TS1192`, `TS2307`), not just lint warnings.
3. Delete `tests/test-utils.ts` — confirmed dead code, unused by any current test.
4. Fix `mockRequest()` in `tests/api.test.ts` to preserve the `Mock` type, resolving the 2 confirmed `@typescript-eslint/no-unsafe-assignment` errors.
5. Update `version-bump.mjs` so it no longer invokes the removed `test:integration`, or restore a deliberately maintained integration-test command.
6. Add `styles.css` to the GitHub release asset list in `release.yml`.
7. Remove `main.js` from git tracking and drop the `!main.js` exception in `.gitignore` (per official `obsidian-sample-plugin` guidance — CI already builds and uploads it correctly).
8. Re-run `npm run lint`, `npm test`, and `npm run build` to confirm a fully clean pipeline.

### P1 — Correctness and maintainability

1. Update `README.md`, `TESTING.md`, `tests/README.md`, and `RELEASE.md` to reflect Vitest, the current scripts, and removal of the Mocha-era files.
2. Remove `.mocharc.json`.
3. Either remove or explicitly maintain the legacy `test-*.js` integration scripts with a documented command.
4. Normalize API URL construction and add HTTP status handling to `findPubMedIdFromPMC`.
5. Add edge-case tests for identifier extraction, API responses, and URL replacement.
6. Remove `mockRequestSequence()` or add a test that uses it.

### P2 — Policy and current-platform decisions

1. Determine the true supported Obsidian minimum version from the APIs actually used (e.g. `Setting.setHeading()`) rather than leaving the outdated `0.15.0` or guessing `1.0.0`.
2. Remove the empty `fundingUrl` field entirely per official Obsidian submission requirements.
3. Keep `manifest.json` and `versions.json` synchronized.
4. Replace the `obsidian: "latest"` dependency with a deliberate versioning policy, then regenerate the lockfile again if it changes.
5. Revisit `esbuild` version and the deprecated `builtin-modules` package.
6. Keep AI documentation aligned with the actual tool-specific file locations.
