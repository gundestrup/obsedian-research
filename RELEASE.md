# Release Process

This plugin uses GitHub Actions to automatically build and attach files to releases.

## How to Create a New Release

### Option 1: Automated Release (Recommended)

1. **Update version in package.json:**
   ```bash
   npm version patch  # for bug fixes (1.0.0 -> 1.0.1)
   npm version minor  # for new features (1.0.0 -> 1.1.0)
   npm version major  # for breaking changes (1.0.0 -> 2.0.0)
   ```

2. **Push the tag:**
   ```bash
   git push
   git push --tags
   ```

3. **GitHub Actions will automatically:**
   - Build the plugin
   - Create a GitHub release
   - Attach `main.js` and `manifest.json`

### Option 2: Manual Release

1. **Build the plugin:**
   ```bash
   npm run build
   ```

2. **Create and push tag:**
   ```bash
   git tag v1.0.1
   git push origin v1.0.1
   ```

3. **Go to GitHub:**
   - Navigate to: https://github.com/gundestrup/obsedian-research/releases
   - Click "Create a new release"
   - Select the tag you just created
   - GitHub Actions will automatically attach the files

## What Gets Released

The following files are automatically attached to each release:
- `main.js` - The compiled plugin
- `manifest.json` - Plugin metadata
- `styles.css` - Styles (if exists)

## Version Bumping

The `version-bump.mjs` script automatically:
- Updates `manifest.json` version
- Updates `versions.json` with compatibility info
- Commits the changes

This runs automatically when you use `npm version`.
