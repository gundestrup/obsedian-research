import { readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";

console.log("🚀 Starting release preparation...");

// Step 1: Run lint and tests first
console.log("\n📋 Step 1: Running quality checks...");
try {
    console.log("  🔍 Running lint...");
    execSync("npm run lint", { stdio: "pipe" });
    console.log("  ✅ Lint passed");
    
    console.log("  🧪 Running unit tests...");
    execSync("npm test", { stdio: "pipe" });
    console.log("  ✅ Unit tests passed");
    
    console.log("  🌐 Running integration tests...");
    execSync("npm run test:integration", { stdio: "pipe" });
    console.log("  ✅ Integration tests passed");
    
    console.log("  🔨 Building plugin...");
    execSync("npm run build", { stdio: "pipe" });
    console.log("  ✅ Build successful");
} catch (error) {
    console.error("❌ ERROR: Quality checks failed!");
    console.error("Please fix the above issues before releasing.");
    process.exit(1);
}

// Step 2: Get the new version from package.json (npm has already updated it)
const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const targetVersion = packageJson.version;

console.log(`\n📋 Step 2: Preparing v${targetVersion} release...`);

// Step 3: Check if changelog has an entry for this version
const changelog = readFileSync("CHANGELOG.md", "utf8");
const versionPattern = new RegExp(`## \\[${targetVersion.replace(".", "\\.")}\\]`, "i");

if (!versionPattern.test(changelog)) {
    console.error(`❌ ERROR: No changelog entry found for version ${targetVersion}`);
    console.error(`Please add an entry for v${targetVersion} in CHANGELOG.md before releasing.`);
    console.error(`\nExample entry:`);
    console.error(`## [${targetVersion}] - ${new Date().toISOString().split('T')[0]}`);
    console.error(`### Added`);
    console.error(`- New feature description`);
    console.error(`### Fixed`);
    console.error(`- Bug fix description`);
    process.exit(1);
}

console.log(`✅ Changelog entry found for v${targetVersion}`);

// Step 4: Update manifest.json and versions.json
console.log("\n📋 Step 3: Updating version files...");
let manifest = JSON.parse(readFileSync("manifest.json", "utf8"));
const { minAppVersion } = manifest;
manifest.version = targetVersion;
writeFileSync("manifest.json", JSON.stringify(manifest, null, "\t"));
console.log(`  ✅ Updated manifest.json to v${targetVersion}`);

let versions = JSON.parse(readFileSync("versions.json", "utf8"));
versions[targetVersion] = minAppVersion;
writeFileSync("versions.json", JSON.stringify(versions, null, "\t"));
console.log(`  ✅ Updated versions.json with v${targetVersion}`);

// Step 5: Stage the updated files
console.log("\n📋 Step 4: Staging files...");
execSync("git add manifest.json versions.json", { stdio: "inherit" });

console.log(`\n🎉 Release v${targetVersion} prepared successfully!`);
console.log(`   - All quality checks passed`);
console.log(`   - Changelog entry verified`);
console.log(`   - Version files updated`);
console.log(`   - Files staged for commit`);
console.log(`\n📝 Next steps:`);
console.log(`   1. Review the staged changes: git status`);
console.log(`   2. Commit: git commit -m "release: v${targetVersion}"`);
console.log(`   3. Push: git push && git push --tags`);
