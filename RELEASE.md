# Release Process

This plugin uses GitHub Actions to automatically build and attach files to releases.

## Pre-Release Checklist

**Before every release:**

```bash
# 1. Run full test suite
npm run build
npm run lint
npm test
npm run test:integration

# 2. Update version
npm version patch  # or minor/major
```

All tests must pass before releasing.

## How to Create a New Release

### Automated Release (Recommended)

1. **Update version and test:**
   ```bash
   npm run build && npm run lint && npm test && npm run test:integration
   npm version patch  # or minor/major
   ```

2. **Push the tag:**
   ```bash
   git push && git push --tags
   ```

3. **GitHub Actions will automatically:**
   - Build the plugin
   - Create a GitHub release
   - Attach `main.js` and `manifest.json`

### Manual Release

1. **Build and test:**
   ```bash
   npm run build && npm run lint && npm test && npm run test:integration
   ```

2. **Create and push tag:**
   ```bash
   git tag v1.0.1 && git push origin v1.0.1
   ```

3. **Create release on GitHub** - Actions will attach files automatically.

## Release Files

- `main.js` - Compiled plugin
- `manifest.json` - Plugin metadata
- `styles.css` - Styles (if exists)

## Version Bumping

The `version-bump.mjs` script automatically updates:
- `manifest.json` version
- `versions.json` compatibility info
- Commits the changes

Runs automatically when you use `npm version`.
