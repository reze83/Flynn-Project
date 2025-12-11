/**
 * Flynn Plugin System - Plugin Loader
 *
 * Handles dynamic loading of plugins from various sources.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createLogger } from "@flynn/core";
import { type FlynnPlugin, type PluginManifest, PluginManifestSchema } from "./types.js";

const logger = createLogger("plugins");

/**
 * Plugin load result
 */
export interface PluginLoadResult {
  success: boolean;
  plugin?: FlynnPlugin;
  manifest?: PluginManifest;
  path: string;
  error?: string;
}

/**
 * Load a plugin manifest from a directory
 */
export function loadManifest(pluginDir: string): PluginManifest | null {
  const manifestPath = join(pluginDir, "plugin.json");

  if (!existsSync(manifestPath)) {
    // Try package.json with flynn field
    const packagePath = join(pluginDir, "package.json");
    if (existsSync(packagePath)) {
      try {
        const packageJson = JSON.parse(readFileSync(packagePath, "utf-8"));
        if (packageJson.flynn) {
          const manifest = {
            id: packageJson.name?.replace(/^@flynn-plugin\//, "") || "unknown",
            name: packageJson.name || "Unknown Plugin",
            version: packageJson.version || "0.0.0",
            description: packageJson.description,
            main: packageJson.main || "./dist/index.js",
            flynn: packageJson.flynn,
          };
          return PluginManifestSchema.parse(manifest);
        }
      } catch {
        return null;
      }
    }
    return null;
  }

  try {
    const manifestContent = readFileSync(manifestPath, "utf-8");
    const manifest = JSON.parse(manifestContent);
    return PluginManifestSchema.parse(manifest);
  } catch (error) {
    logger.error({ manifestPath, err: error }, "Failed to parse plugin manifest");
    return null;
  }
}

/**
 * Validate plugin manifest against Flynn version
 */
export function validateManifest(
  manifest: PluginManifest,
  flynnVersion: string,
): { valid: boolean; error?: string } {
  // Parse versions
  const [reqMajor = 0, reqMinor = 0] = manifest.flynn.minVersion.split(".").map(Number);
  const [curMajor = 0, curMinor = 0] = flynnVersion.split(".").map(Number);

  // Check major version compatibility
  if (reqMajor > curMajor) {
    return {
      valid: false,
      error: `Plugin requires Flynn ${manifest.flynn.minVersion}, but current version is ${flynnVersion}`,
    };
  }

  // Check minor version if major matches
  if (reqMajor === curMajor && reqMinor > curMinor) {
    return {
      valid: false,
      error: `Plugin requires Flynn ${manifest.flynn.minVersion}, but current version is ${flynnVersion}`,
    };
  }

  return { valid: true };
}

/**
 * Load a plugin from a directory
 */
export async function loadPlugin(pluginDir: string): Promise<PluginLoadResult> {
  const absolutePath = resolve(pluginDir);

  // Load manifest
  const manifest = loadManifest(absolutePath);
  if (!manifest) {
    return {
      success: false,
      path: absolutePath,
      error: "No valid plugin.json or package.json with flynn field found",
    };
  }

  // Resolve entry point
  const entryPoint = join(absolutePath, manifest.main);
  if (!existsSync(entryPoint)) {
    return {
      success: false,
      path: absolutePath,
      manifest,
      error: `Entry point not found: ${entryPoint}`,
    };
  }

  try {
    // Dynamic import the plugin module
    const moduleUrl = pathToFileURL(entryPoint).href;
    const module = await import(moduleUrl);

    // Get the default export or named plugin export
    const plugin: FlynnPlugin = module.default || module.plugin;

    if (!plugin) {
      return {
        success: false,
        path: absolutePath,
        manifest,
        error: "Plugin module must export a default or named 'plugin' export",
      };
    }

    // Validate plugin has required properties
    if (!plugin.id || !plugin.name || !plugin.version || !plugin.initialize) {
      return {
        success: false,
        path: absolutePath,
        manifest,
        error: "Plugin must have id, name, version, and initialize function",
      };
    }

    return {
      success: true,
      plugin,
      manifest,
      path: absolutePath,
    };
  } catch (error) {
    return {
      success: false,
      path: absolutePath,
      manifest,
      error: `Failed to load plugin: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Discover plugins in a directory
 */
export function discoverPlugins(searchDir: string): string[] {
  if (!existsSync(searchDir)) {
    return [];
  }

  const plugins: string[] = [];

  try {
    const entries = readdirSync(searchDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const pluginDir = join(searchDir, entry.name);

      // Check for plugin.json or package.json with flynn field
      if (
        existsSync(join(pluginDir, "plugin.json")) ||
        existsSync(join(pluginDir, "package.json"))
      ) {
        const manifest = loadManifest(pluginDir);
        if (manifest) {
          plugins.push(pluginDir);
        }
      }
    }
  } catch (error) {
    logger.error({ searchDir, err: error }, "Failed to discover plugins");
  }

  return plugins;
}

/**
 * Get default plugin search directories
 */
export function getDefaultSearchDirs(projectDir?: string): string[] {
  const dirs: string[] = [];

  // User plugins (~/.flynn/plugins)
  const homeDir = process.env.HOME || process.env.USERPROFILE;
  if (homeDir) {
    dirs.push(join(homeDir, ".flynn", "plugins"));
  }

  // Project plugins (./.flynn/plugins)
  if (projectDir) {
    dirs.push(join(projectDir, ".flynn", "plugins"));
  }

  // npm plugins (node_modules/@flynn-plugin)
  if (projectDir) {
    dirs.push(join(projectDir, "node_modules", "@flynn-plugin"));
  }

  return dirs;
}
