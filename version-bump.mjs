import { readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";

console.log("🚀 Starting release preparation...");

// Check if this is preversion or version script
const isPreversion = process.argv.includes("--preversion");

if (isPreversion) {
    console.log("\n📋 Pre-version validation...");
    
    // Step 1: Determine which version type is being bumped
    // We need to check the npm_config_argv to know if it's patch/minor/major
    // For now, we'll validate that ANY upcoming version has a changelog entry
    const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
    const currentVersion = packageJson.version;
    
    console.log(`  Current version: ${currentVersion}`);
    console.log(`  Checking for changelog entry for upcoming version...`);
    
    // Read changelog and look for any version greater than current
    const changelog = readFileSync("CHANGELOG.md", "utf8");
    
    // Extract all version entries from changelog
    const versionMatches = changelog.match(/## \[(\d+\.\d+\.\d+)\]/g);
    if (!versionMatches || versionMatches.length === 0) {
        console.error(`❌ ERROR: No version entries found in CHANGELOG.md`);
        console.error(`Please add a changelog entry for the new version.`);
        console.error(`\nExample entry:`);
        console.error(`## [X.Y.Z] - ${new Date().toISOString().split('T')[0]}`);
        console.error(`### Added`);
        console.error(`- New feature description`);
        process.exit(1);
    }
    
    // Get the latest version from changelog
    const changelogVersions = versionMatches.map(m => m.match(/\[(\d+\.\d+\.\d+)\]/)[1]);
    const latestChangelogVersion = changelogVersions[0]; // First one should be latest
    
    // Compare versions
    const current = currentVersion.split('.').map(Number);
    const latest = latestChangelogVersion.split('.').map(Number);
    
    const isNewer = latest[0] > current[0] || 
                    (latest[0] === current[0] && latest[1] > current[1]) ||
                    (latest[0] === current[0] && latest[1] === current[1] && latest[2] > current[2]);
    
    if (!isNewer) {
        console.error(`❌ ERROR: No changelog entry found for a version newer than ${currentVersion}`);
        console.error(`Latest changelog version: ${latestChangelogVersion}`);
        console.error(`\nPlease add a changelog entry for the new version.`);
        console.error(`\nExample entry:`);
        console.error(`## [X.Y.Z] - ${new Date().toISOString().split('T')[0]}`);
        console.error(`### Added`);
        console.error(`- New feature description`);
        console.error(`### Fixed`);
        console.error(`- Bug fix description`);
        process.exit(1);
    }
    
    console.log(`  ✅ Found changelog entry for v${latestChangelogVersion}`);
    
    // Step 2: Run quality checks
    console.log("\n📋 Running quality checks...");
    try {
        console.log("  🔍 Running lint...");
        execSync("npm run lint", { stdio: "inherit" });
        console.log("  ✅ Lint passed");
        
        console.log("  🧪 Running unit tests...");
        execSync("npm test", { stdio: "inherit" });
        console.log("  ✅ Unit tests passed");
        
        console.log("  🌐 Running integration tests...");
        execSync("npm run test:integration", { stdio: "inherit" });
        console.log("  ✅ Integration tests passed");
        
        console.log("  🔨 Building plugin...");
        execSync("npm run build", { stdio: "inherit" });
        console.log("  ✅ Build successful");
    } catch (error) {
        console.error("\n❌ ERROR: Quality checks failed!");
        console.error("Please fix the above issues before releasing.");
        process.exit(1);
    }
    
    console.log("\n✅ Pre-version validation passed!");
    console.log("   npm will now update the version...");
    
} else {
    // This is the version script (runs after npm updates package.json)
    
    // Get the new version from package.json (npm has already updated it)
    const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
    const targetVersion = packageJson.version;
    
    console.log(`\n📋 Updating version files to v${targetVersion}...`);
    
    // Validate that changelog has this exact version
    const changelog = readFileSync("CHANGELOG.md", "utf8");
    const escapedVersion = targetVersion.replace(/\./g, "\\.");
    const versionPattern = new RegExp(`## \\[${escapedVersion}\\]`, "i");
    
    if (!versionPattern.test(changelog)) {
        console.error(`\n❌ ERROR: Changelog entry for v${targetVersion} not found!`);
        console.error(`The version was bumped to ${targetVersion} but changelog doesn't have this exact version.`);
        console.error(`\nPlease update CHANGELOG.md to include:`);
        console.error(`## [${targetVersion}] - ${new Date().toISOString().split('T')[0]}`);
        process.exit(1);
    }
    
    // Update manifest.json and versions.json
    let manifest = JSON.parse(readFileSync("manifest.json", "utf8"));
    const { minAppVersion } = manifest;
    manifest.version = targetVersion;
    writeFileSync("manifest.json", JSON.stringify(manifest, null, "\t"));
    console.log(`  ✅ Updated manifest.json to v${targetVersion}`);
    
    let versions = JSON.parse(readFileSync("versions.json", "utf8"));
    versions[targetVersion] = minAppVersion;
    writeFileSync("versions.json", JSON.stringify(versions, null, "\t"));
    console.log(`  ✅ Updated versions.json with v${targetVersion}`);
    
    // Stage the updated files
    execSync("git add manifest.json versions.json", { stdio: "inherit" });
    
    console.log(`\n🎉 Version v${targetVersion} updated successfully!`);
}
