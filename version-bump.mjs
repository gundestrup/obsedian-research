import { readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";

console.log("🚀 Starting release preparation...");

// Check if this is preversion or version-bump script
const isPreversion = process.argv.includes("--preversion");

if (isPreversion) {
    console.log("\n📋 Pre-version validation...");
    
    // Step 1: Check if changelog has entry for NEXT version
    const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
    const currentVersion = packageJson.version;
    
    // Calculate next version (simple increment for validation)
    const versionParts = currentVersion.split('.');
    versionParts[2] = String(parseInt(versionParts[2]) + 1);
    const nextVersion = versionParts.join('.');
    
    const changelog = readFileSync("CHANGELOG.md", "utf8");
    const versionPattern = new RegExp(`## \\[${nextVersion.replace(".", "\\.")}\\]`, "i");
    
    if (!versionPattern.test(changelog)) {
        console.error(`❌ ERROR: No changelog entry found for upcoming version ${nextVersion}`);
        console.error(`Please add an entry for v${nextVersion} in CHANGELOG.md before releasing.`);
        console.error(`\nExample entry:`);
        console.error(`## [${nextVersion}] - ${new Date().toISOString().split('T')[0]}`);
        console.error(`### Added`);
        console.error(`- New feature description`);
        console.error(`### Fixed`);
        console.error(`- Bug fix description`);
        process.exit(1);
    }
    
    console.log(`✅ Changelog entry found for v${nextVersion}`);
    
    // Step 2: Run quality checks
    console.log("\n📋 Running quality checks...");
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
    
    console.log("\n✅ Pre-version validation passed!");
    console.log("   npm will now update the version and run version-bump script...");
    
} else {
    // This is the version-bump script (runs after npm updates package.json)
    
    // Get the new version from package.json (npm has already updated it)
    const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
    const targetVersion = packageJson.version;
    
    console.log(`\n📋 Updating version files to v${targetVersion}...`);
    
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
