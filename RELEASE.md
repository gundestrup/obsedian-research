# Release Process

This plugin uses automated quality checks and GitHub Actions for releases.

## 🚀 Quick Release (4 steps)

```bash
# 1. Add changelog entry
## [1.2.2] - 2026-03-12
### Added
- New feature
### Fixed  
- Bug fix

# 2. Run version bump (automated checks + updates)
npm version patch

# 3. Review staged changes
git status

# 4. Push to trigger release
git push && git push --tags
```

## 🔄 What Happens Automatically

### Step 2: `npm version` does everything:
1. ✅ **Pre-version Validation**: Changelog + Quality checks (before version update)
   - Lint + Unit Tests + Integration Tests + Build
   - Changelog validation for NEXT version
2. ✅ **Version Update**: npm updates package.json (only if validation passes)
3. ✅ **Version Sync**: Updates manifest.json and versions.json to match
4. ✅ **Git Staging**: Stages all version files
5. ✅ **Git Commit**: Creates commit with version bump
6. ✅ **Git Tag**: Creates and pushes tag (triggers GitHub Actions)

### Step 4: GitHub Actions creates release:
- 📦 Builds plugin
- 🏷️ Creates GitHub release
- 📎 Attaches main.js and manifest.json

## 📋 Pre-Release Requirements

**Must be done BEFORE `npm version`:**

### 1. Update CHANGELOG.md
```markdown
## [1.2.2] - 2026-03-12
### Added
- Feature description
### Fixed
- Bug fix description
```

### 2. Clean Working Directory
```bash
git status  # Should show "working tree clean"
```

## 🛡️ Automated Validation

**`npm version` will FAIL BEFORE updating versions if:**
- ❌ Lint errors found
- ❌ Unit tests fail (72 tests)
- ❌ Integration tests fail (5 suites)
- ❌ Build fails
- ❌ No changelog entry for the NEXT version
- ❌ Git working directory not clean

**🔒 Safety Guarantee:** If validation fails, NO version files are changed.

## 🚨 Troubleshooting

### If `npm version` fails:
1. **Check the error message** - It will tell you what failed
2. **Fix the issue** - Run the failing command manually:
   ```bash
   npm run lint           # For lint errors
   npm test               # For unit test errors
   npm run test:integration # For integration test errors
   npm run build          # For build errors
   ```
3. **Add changelog entry** if missing
4. **Try again**: `npm version patch`

### If GitHub Actions fails:
- Check the Actions tab on GitHub
- Usually due to build issues or network problems

## 📦 Release Files

**Automatically attached to GitHub release:**
- `main.js` - Compiled plugin
- `manifest.json` - Plugin metadata
- `styles.css` - Styles (if exists)

## 🎯 Version Commands

```bash
npm version patch   # 1.2.1 → 1.2.2 (bug fixes)
npm version minor   # 1.2.1 → 1.3.0 (new features)  
npm version major   # 1.2.1 → 2.0.0 (breaking changes)
```
