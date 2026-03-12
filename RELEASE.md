# Release Process

This plugin uses automated quality checks and GitHub Actions for releases.

## Pre-Release Checklist (Automated)

**The `npm version` command now automatically:**
1. ✅ Runs lint checks
2. ✅ Runs unit tests (72 tests)
3. ✅ Runs integration tests (5 test suites)
4. ✅ Builds the plugin
5. ✅ Validates changelog entry exists
6. ✅ Updates manifest.json and versions.json
7. ✅ Stages files for commit

## Manual Steps

### 1. Update Changelog
```bash
# Add entry for new version in CHANGELOG.md
## [1.2.2] - 2026-03-12
### Added
- New feature
### Fixed
- Bug fix
```

### 2. Update Version
```bash
npm version patch  # or minor/major
```

### 3. Review and Commit
```bash
git status
git commit -m "release: v1.2.2"
```

### 4. Push and Release
```bash
git push && git push --tags
```

## What Gets Released

- `main.js` - Compiled plugin
- `manifest.json` - Plugin metadata (auto-updated)
- `styles.css` - Styles (if exists)

## Automated Validation

The version bump will fail if:
- ❌ Lint errors found
- ❌ Unit tests fail
- ❌ Integration tests fail
- ❌ Build fails
- ❌ No changelog entry for the version

## Quick Release Commands

```bash
# For bug fixes
npm version patch

# For new features
npm version minor

# For breaking changes
npm version major
```
