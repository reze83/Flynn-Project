/**
 * Flynn Plugin Installer
 *
 * Install plugins from various sources: npm, git, local paths.
 */

import { execSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { createLogger } from "@flynn/core";
import { loadManifest } from "./loader.js";

const logger = createLogger("plugins");

/**
 * SECURITY: Valid npm package name pattern
 * Allows: @scope/package, package-name, package@version
 * Blocks: shell metacharacters, path traversal, command injection
 */
const SAFE_PACKAGE_PATTERN =
  /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*(@[a-z0-9-._~^<>=]+)?$/i;

/**
 * SECURITY: Validate npm package name before shell execution
 * Prevents command injection via malicious package names
 */
function isValidPackageName(packageName: string): boolean {
  const clean = packageName.replace(/^npm:/, "");

  // Block shell metacharacters and dangerous patterns
  const dangerousPatterns = [
    /[;&|`$(){}[\]<>\\!#]/, // Shell metacharacters
    /\.\./, // Path traversal
    /\s/, // Whitespace (command separation)
    /^-/, // Flag injection
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(clean)) {
      return false;
    }
  }

  // Must match valid npm package pattern
  return SAFE_PACKAGE_PATTERN.test(clean);
}

/**
 * SECURITY: Validate git URL before shell execution
 */
function isValidGitUrl(url: string): boolean {
  // Block shell metacharacters
  const dangerousPatterns = [/[;&|`$(){}[\]<>\\!#]/, /\s/];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(url)) {
      return false;
    }
  }

  // Allow common git URL patterns
  const validGitPatterns = [
    /^https?:\/\/[a-z0-9.-]+\//i,
    /^git@[a-z0-9.-]+:/i,
    /^git\+https?:\/\//i,
    /^github:[a-z0-9-]+\/[a-z0-9-._]+$/i,
    /^gitlab:[a-z0-9-]+\/[a-z0-9-._]+$/i,
    /^bitbucket:[a-z0-9-]+\/[a-z0-9-._]+$/i,
  ];

  return validGitPatterns.some((pattern) => pattern.test(url));
}

/**
 * Installation options
 */
export interface InstallOptions {
  /** Target directory for installation (default: ~/.flynn/plugins) */
  targetDir?: string;
  /** Force overwrite existing installation */
  force?: boolean;
  /** npm registry URL */
  registry?: string;
}

/**
 * Installation result
 */
export interface InstallResult {
  /** Whether installation succeeded */
  success: boolean;
  /** Plugin ID if successful */
  pluginId?: string;
  /** Installation path */
  path?: string;
  /** Error message if failed */
  error?: string;
}

/**
 * Source types
 */
export type SourceType = "npm" | "git" | "local" | "unknown";

/**
 * Detect the source type from a source string
 */
export function detectSourceType(source: string): SourceType {
  // npm package: @scope/package or package-name
  if (source.startsWith("@") || /^[a-z0-9][a-z0-9-]*$/i.test(source)) {
    return "npm";
  }

  // npm package with explicit prefix
  if (source.startsWith("npm:")) {
    return "npm";
  }

  // git source: github:user/repo, git+https://, git@
  if (
    source.startsWith("github:") ||
    source.startsWith("gitlab:") ||
    source.startsWith("bitbucket:") ||
    source.startsWith("git+") ||
    source.startsWith("git@") ||
    source.includes("github.com") ||
    source.includes("gitlab.com")
  ) {
    return "git";
  }

  // local path: ., .., /, ~
  if (
    source.startsWith("./") ||
    source.startsWith("../") ||
    source.startsWith("/") ||
    source.startsWith("~") ||
    source.startsWith("file:")
  ) {
    return "local";
  }

  // Check if it's an existing local path
  const resolved = resolvePath(source);
  if (existsSync(resolved)) {
    return "local";
  }

  return "unknown";
}

/**
 * Resolve a path, expanding ~ to home directory
 */
function resolvePath(path: string): string {
  if (path.startsWith("~")) {
    return join(homedir(), path.slice(1));
  }
  if (path.startsWith("file:")) {
    return path.slice(5);
  }
  return resolve(path);
}

/**
 * Get default plugin installation directory
 */
export function getDefaultTargetDir(): string {
  return join(homedir(), ".flynn", "plugins");
}

/**
 * Resolve package directory path from node_modules
 */
function resolvePackageDir(cleanPackage: string, nodeModulesDir: string): string {
  if (cleanPackage.startsWith("@")) {
    const [scope, name] = cleanPackage.split("/");
    return join(nodeModulesDir, scope ?? "", name ?? "");
  }
  // Handle version specifier (package@version)
  const packageNameOnly = cleanPackage.split("@")[0] ?? cleanPackage;
  return join(nodeModulesDir, packageNameOnly);
}

/**
 * Handle existing installation - remove if force is true
 */
function handleExistingInstallation(finalDir: string, pluginId: string, force: boolean): void {
  if (!existsSync(finalDir)) {
    return;
  }
  if (!force) {
    throw new Error(`Plugin ${pluginId} already installed. Use --force to overwrite.`);
  }
  rmSync(finalDir, { recursive: true, force: true });
}

/**
 * Clean up temporary directory
 */
function cleanupTempDir(tempDir: string): void {
  if (existsSync(tempDir)) {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

/**
 * Install a plugin from npm
 */
export async function installFromNpm(
  packageName: string,
  options: InstallOptions = {},
): Promise<InstallResult> {
  const targetDir = options.targetDir || getDefaultTargetDir();
  const cleanPackage = packageName.replace(/^npm:/, "");

  // SECURITY: Validate package name before shell execution
  if (!isValidPackageName(cleanPackage)) {
    logger.warn({ packageName }, "Invalid package name rejected");
    return {
      success: false,
      error: `Invalid package name: ${cleanPackage}. Package names must be valid npm identifiers.`,
    };
  }

  const tempDir = join(targetDir, `.tmp-install-${Date.now()}`);

  try {
    mkdirSync(tempDir, { recursive: true });
    execSync("npm init -y", { cwd: tempDir, stdio: "pipe" });

    const registryArg = options.registry ? `--registry=${options.registry}` : "";
    execSync(`npm install ${cleanPackage} ${registryArg}`, {
      cwd: tempDir,
      stdio: "pipe",
    });

    const nodeModulesDir = join(tempDir, "node_modules");
    const packageDir = resolvePackageDir(cleanPackage, nodeModulesDir);

    if (!existsSync(packageDir)) {
      throw new Error(`Package directory not found: ${packageDir}`);
    }

    const manifest = await loadManifest(packageDir);
    if (!manifest) {
      throw new Error("No valid plugin.json or package.json with flynn field found");
    }

    const finalDir = join(targetDir, manifest.id);
    handleExistingInstallation(finalDir, manifest.id, options.force ?? false);

    cpSync(packageDir, finalDir, { recursive: true });
    cleanupTempDir(tempDir);

    return {
      success: true,
      pluginId: manifest.id,
      path: finalDir,
    };
  } catch (error) {
    cleanupTempDir(tempDir);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Normalize git URL from shorthand formats
 */
function normalizeGitUrl(repoUrl: string): string {
  if (repoUrl.startsWith("github:")) {
    return `https://github.com/${repoUrl.slice(7)}.git`;
  }
  if (repoUrl.startsWith("gitlab:")) {
    return `https://gitlab.com/${repoUrl.slice(7)}.git`;
  }
  if (repoUrl.startsWith("bitbucket:")) {
    return `https://bitbucket.org/${repoUrl.slice(10)}.git`;
  }
  return repoUrl;
}

/**
 * Install npm dependencies in a directory (silent failure)
 */
function installDependencies(dir: string): void {
  const packageJsonPath = join(dir, "package.json");
  if (!existsSync(packageJsonPath)) {
    return;
  }
  try {
    execSync("npm install --production", { cwd: dir, stdio: "pipe" });
  } catch {
    logger.warn({ dir }, "npm install failed, plugin may not work correctly");
  }
}

/**
 * Install a plugin from git
 */
export async function installFromGit(
  repoUrl: string,
  options: InstallOptions = {},
): Promise<InstallResult> {
  const targetDir = options.targetDir || getDefaultTargetDir();
  const gitUrl = normalizeGitUrl(repoUrl);

  // SECURITY: Validate git URL before shell execution
  if (!isValidGitUrl(gitUrl)) {
    logger.warn({ repoUrl }, "Invalid git URL rejected");
    return {
      success: false,
      error: `Invalid git URL: ${repoUrl}. Use https://, git@, or shorthand (github:user/repo).`,
    };
  }

  const tempDir = join(targetDir, `.tmp-clone-${Date.now()}`);

  try {
    mkdirSync(tempDir, { recursive: true });
    execSync(`git clone --depth 1 ${gitUrl} repo`, {
      cwd: tempDir,
      stdio: "pipe",
    });

    const repoDir = join(tempDir, "repo");

    const manifest = await loadManifest(repoDir);
    if (!manifest) {
      throw new Error("No valid plugin.json or package.json with flynn field found");
    }

    const finalDir = join(targetDir, manifest.id);
    handleExistingInstallation(finalDir, manifest.id, options.force ?? false);

    installDependencies(repoDir);

    // Remove .git directory
    const gitDir = join(repoDir, ".git");
    if (existsSync(gitDir)) {
      rmSync(gitDir, { recursive: true, force: true });
    }

    cpSync(repoDir, finalDir, { recursive: true });
    cleanupTempDir(tempDir);

    return {
      success: true,
      pluginId: manifest.id,
      path: finalDir,
    };
  } catch (error) {
    cleanupTempDir(tempDir);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Install a plugin from local path
 */
export async function installFromLocal(
  localPath: string,
  options: InstallOptions = {},
): Promise<InstallResult> {
  const targetDir = options.targetDir || getDefaultTargetDir();
  const sourcePath = resolvePath(localPath);

  try {
    if (!existsSync(sourcePath)) {
      throw new Error(`Source path does not exist: ${sourcePath}`);
    }

    const manifest = await loadManifest(sourcePath);
    if (!manifest) {
      throw new Error("No valid plugin.json or package.json with flynn field found");
    }

    const finalDir = join(targetDir, manifest.id);
    handleExistingInstallation(finalDir, manifest.id, options.force ?? false);

    mkdirSync(targetDir, { recursive: true });
    cpSync(sourcePath, finalDir, { recursive: true });

    return {
      success: true,
      pluginId: manifest.id,
      path: finalDir,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Install a plugin from any source
 */
export async function installPlugin(
  source: string,
  options: InstallOptions = {},
): Promise<InstallResult> {
  const sourceType = detectSourceType(source);

  switch (sourceType) {
    case "npm":
      return installFromNpm(source, options);
    case "git":
      return installFromGit(source, options);
    case "local":
      return installFromLocal(source, options);
    default:
      return {
        success: false,
        error: `Unknown source type for: ${source}. Use npm:, github:, or a local path.`,
      };
  }
}

/**
 * Uninstall a plugin
 */
export async function uninstallPlugin(pluginId: string, searchDirs?: string[]): Promise<boolean> {
  const dirs = searchDirs || [getDefaultTargetDir()];

  for (const dir of dirs) {
    const pluginDir = join(dir, pluginId);
    if (existsSync(pluginDir)) {
      try {
        rmSync(pluginDir, { recursive: true, force: true });
        return true;
      } catch (error) {
        logger.error({ pluginId, err: error }, "Failed to uninstall plugin");
        return false;
      }
    }
  }

  return false; // Plugin not found
}

/**
 * List installed plugins in a directory
 */
export function listInstalledPlugins(targetDir?: string): string[] {
  const dir = targetDir || getDefaultTargetDir();

  if (!existsSync(dir)) {
    return [];
  }

  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry) => entry.name);
}
