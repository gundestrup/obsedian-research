import { readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";

// Get the new version from package.json (npm has already updated it)
const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const targetVersion = packageJson.version;

// Read minAppVersion from manifest.json and bump version to target version
let manifest = JSON.parse(readFileSync("manifest.json", "utf8"));
const { minAppVersion } = manifest;
manifest.version = targetVersion;
writeFileSync("manifest.json", JSON.stringify(manifest, null, "\t"));

// Update versions.json with target version and minAppVersion from manifest.json
let versions = JSON.parse(readFileSync("versions.json", "utf8"));
versions[targetVersion] = minAppVersion;
writeFileSync("versions.json", JSON.stringify(versions, null, "\t"));

// Stage the updated files
execSync("git add manifest.json versions.json", { stdio: "inherit" });
