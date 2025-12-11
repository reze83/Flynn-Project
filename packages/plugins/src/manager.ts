/**
 * Flynn Plugin System - Plugin Manager
 *
 * Manages plugin lifecycle: discovery, loading, initialization, and unloading.
 */

import { existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { createLogger } from "@flynn/core";
import { type PluginRegistry, createPluginContext, createRegistry } from "./context.js";
import { discoverPlugins, getDefaultSearchDirs, loadPlugin, validateManifest } from "./loader.js";
import type {
  FlynnPlugin,
  PluginEvent,
  PluginEventHandler,
  PluginEventType,
  PluginInfo,
  PluginLoaderOptions,
  PluginManifest,
} from "./types.js";

const logger = createLogger("plugins");

/**
 * Loaded plugin state
 */
interface LoadedPlugin {
  plugin: FlynnPlugin;
  manifest: PluginManifest;
  path: string;
  initialized: boolean;
  enabled: boolean;
}

/**
 * Plugin Manager
 *
 * Central manager for all Flynn plugins.
 */
export class PluginManager {
  private plugins = new Map<string, LoadedPlugin>();
  private registry: PluginRegistry;
  private eventHandlers = new Map<PluginEventType, Set<PluginEventHandler>>();
  private flynnVersion: string;
  private searchDirs: string[];
  private dataBaseDir: string;

  constructor(options: PluginLoaderOptions = {}) {
    this.flynnVersion = options.flynnVersion || "1.0.0";
    this.searchDirs = options.searchDirs || getDefaultSearchDirs(process.cwd());
    this.registry = createRegistry();
    this.dataBaseDir = join(homedir(), ".flynn", "plugin-data");

    // Ensure data directory exists
    if (!existsSync(this.dataBaseDir)) {
      mkdirSync(this.dataBaseDir, { recursive: true });
    }

    // Auto-load plugins if enabled
    if (options.autoLoad) {
      this.discoverAndLoad().catch((err) => logger.error({ err }, "Failed to auto-load plugins"));
    }
  }

  /**
   * Discover and load all plugins from search directories
   */
  async discoverAndLoad(): Promise<PluginInfo[]> {
    const results: PluginInfo[] = [];

    for (const searchDir of this.searchDirs) {
      const pluginDirs = discoverPlugins(searchDir);

      for (const pluginDir of pluginDirs) {
        const info = await this.loadPlugin(pluginDir);
        if (info) {
          results.push(info);
        }
      }
    }

    return results;
  }

  /**
   * Load a plugin from a directory
   */
  async loadPlugin(pluginDir: string): Promise<PluginInfo | null> {
    const result = await loadPlugin(pluginDir);

    if (!result.success || !result.plugin || !result.manifest) {
      logger.error({ path: pluginDir, error: result.error }, "Failed to load plugin");
      this.emit("plugin:error", "unknown", { path: pluginDir, error: result.error });
      return null;
    }

    const { plugin, manifest, path } = result;

    // Validate version compatibility
    const validation = validateManifest(manifest, this.flynnVersion);
    if (!validation.valid) {
      logger.error({ pluginId: plugin.id, error: validation.error }, "Plugin incompatible");
      this.emit("plugin:error", plugin.id, { error: validation.error });
      return null;
    }

    // Check if already loaded
    if (this.plugins.has(plugin.id)) {
      logger.warn({ pluginId: plugin.id }, "Plugin already loaded, skipping");
      return this.getPluginInfo(plugin.id);
    }

    // Store plugin
    this.plugins.set(plugin.id, {
      plugin,
      manifest,
      path,
      initialized: false,
      enabled: true,
    });

    // Initialize plugin
    try {
      const context = createPluginContext({
        pluginId: plugin.id,
        flynnVersion: this.flynnVersion,
        dataDir: join(this.dataBaseDir, plugin.id),
        registry: this.registry,
      });

      await plugin.initialize(context);

      const loadedPlugin = this.plugins.get(plugin.id);
      if (loadedPlugin) {
        loadedPlugin.initialized = true;
      }
      this.emit("plugin:loaded", plugin.id, { path });

      logger.info(
        { pluginId: plugin.id, name: plugin.name, version: plugin.version },
        "Loaded plugin",
      );
    } catch (error) {
      logger.error({ pluginId: plugin.id, err: error }, "Failed to initialize plugin");
      this.plugins.delete(plugin.id);
      this.emit("plugin:error", plugin.id, { error: String(error) });
      return null;
    }

    return this.getPluginInfo(plugin.id);
  }

  /**
   * Unload a plugin
   */
  async unloadPlugin(pluginId: string): Promise<boolean> {
    const loaded = this.plugins.get(pluginId);
    if (!loaded) {
      return false;
    }

    try {
      // Call destroy if available
      if (loaded.plugin.destroy) {
        await loaded.plugin.destroy();
      }

      // Remove from registry
      this.removeFromRegistry(pluginId);

      // Remove from plugins
      this.plugins.delete(pluginId);

      this.emit("plugin:unloaded", pluginId, {});
      logger.info({ pluginId, name: loaded.plugin.name }, "Unloaded plugin");

      return true;
    } catch (error) {
      logger.error({ pluginId, err: error }, "Failed to unload plugin");
      this.emit("plugin:error", pluginId, { error: String(error) });
      return false;
    }
  }

  /**
   * Get plugin by ID
   */
  getPlugin(pluginId: string): FlynnPlugin | undefined {
    return this.plugins.get(pluginId)?.plugin;
  }

  /**
   * Get plugin info by ID
   */
  getPluginInfo(pluginId: string): PluginInfo | null {
    const loaded = this.plugins.get(pluginId);
    if (!loaded) return null;

    return {
      id: loaded.plugin.id,
      name: loaded.plugin.name,
      version: loaded.plugin.version,
      description: loaded.plugin.description,
      path: loaded.path,
      loaded: loaded.initialized,
      agents: loaded.plugin.agents?.map((a) => a.id) || [],
      skills: loaded.plugin.skills?.map((s) => s.id) || [],
      workflows: loaded.plugin.workflows?.map((w) => w.id) || [],
      hooks: loaded.plugin.hooks?.length || 0,
    };
  }

  /**
   * List all loaded plugins
   */
  listPlugins(): PluginInfo[] {
    const infos: PluginInfo[] = [];

    for (const pluginId of this.plugins.keys()) {
      const info = this.getPluginInfo(pluginId);
      if (info) {
        infos.push(info);
      }
    }

    return infos;
  }

  /**
   * Get the plugin registry
   */
  getRegistry(): PluginRegistry {
    return this.registry;
  }

  /**
   * Get all registered agents (including from plugins)
   */
  getAgents() {
    return Array.from(this.registry.agents.values());
  }

  /**
   * Get all registered skills (including from plugins)
   */
  getSkills() {
    return Array.from(this.registry.skills.values());
  }

  /**
   * Get all registered workflows (including from plugins)
   */
  getWorkflows() {
    return Array.from(this.registry.workflows.values());
  }

  /**
   * Get all registered hooks
   */
  getHooks() {
    return [...this.registry.hooks];
  }

  /**
   * Enable a plugin
   */
  async enablePlugin(pluginId: string): Promise<boolean> {
    const loaded = this.plugins.get(pluginId);
    if (!loaded) {
      return false;
    }

    if (loaded.enabled) {
      return true; // Already enabled
    }

    try {
      // Re-initialize if needed
      if (!loaded.initialized) {
        const context = createPluginContext({
          pluginId: loaded.plugin.id,
          flynnVersion: this.flynnVersion,
          dataDir: join(this.dataBaseDir, loaded.plugin.id),
          registry: this.registry,
        });
        await loaded.plugin.initialize(context);
        loaded.initialized = true;
      }

      loaded.enabled = true;
      this.emit("plugin:loaded", pluginId, { enabled: true });
      logger.info({ pluginId, name: loaded.plugin.name }, "Enabled plugin");
      return true;
    } catch (error) {
      logger.error({ pluginId, err: error }, "Failed to enable plugin");
      this.emit("plugin:error", pluginId, { error: String(error) });
      return false;
    }
  }

  /**
   * Disable a plugin (without unloading)
   */
  async disablePlugin(pluginId: string): Promise<boolean> {
    const loaded = this.plugins.get(pluginId);
    if (!loaded) {
      return false;
    }

    if (!loaded.enabled) {
      return true; // Already disabled
    }

    try {
      // Remove from registry but keep plugin loaded
      this.removeFromRegistry(pluginId);
      loaded.enabled = false;
      this.emit("plugin:unloaded", pluginId, { disabled: true });
      logger.info({ pluginId, name: loaded.plugin.name }, "Disabled plugin");
      return true;
    } catch (error) {
      logger.error({ pluginId, err: error }, "Failed to disable plugin");
      this.emit("plugin:error", pluginId, { error: String(error) });
      return false;
    }
  }

  /**
   * Check if plugin is enabled
   */
  isPluginEnabled(pluginId: string): boolean {
    return this.plugins.get(pluginId)?.enabled ?? false;
  }

  /**
   * Get disabled plugins
   */
  getDisabledPlugins(): PluginInfo[] {
    const infos: PluginInfo[] = [];

    for (const [pluginId, loaded] of this.plugins.entries()) {
      if (!loaded.enabled) {
        const info = this.getPluginInfo(pluginId);
        if (info) {
          infos.push(info);
        }
      }
    }

    return infos;
  }

  /**
   * Get enabled plugins
   */
  getEnabledPlugins(): PluginInfo[] {
    const infos: PluginInfo[] = [];

    for (const [pluginId, loaded] of this.plugins.entries()) {
      if (loaded.enabled) {
        const info = this.getPluginInfo(pluginId);
        if (info) {
          infos.push(info);
        }
      }
    }

    return infos;
  }

  /**
   * Subscribe to plugin events
   */
  on(event: PluginEventType, handler: PluginEventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)?.add(handler);
  }

  /**
   * Unsubscribe from plugin events
   */
  off(event: PluginEventType, handler: PluginEventHandler): void {
    this.eventHandlers.get(event)?.delete(handler);
  }

  /**
   * Emit a plugin event
   */
  private emit(type: PluginEventType, pluginId: string, data: unknown): void {
    const event: PluginEvent = {
      type,
      pluginId,
      data,
      timestamp: new Date(),
    };

    const handlers = this.eventHandlers.get(type);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(event);
        } catch (error) {
          logger.error({ eventType: type, err: error }, "Event handler error");
        }
      }
    }
  }

  /**
   * Remove plugin items from registry
   */
  private removeFromRegistry(pluginId: string): void {
    // Remove agents
    for (const [key] of this.registry.agents) {
      if (key.startsWith(`${pluginId}:`)) {
        this.registry.agents.delete(key);
      }
    }

    // Remove skills
    for (const [key] of this.registry.skills) {
      if (key.startsWith(`${pluginId}:`)) {
        this.registry.skills.delete(key);
      }
    }

    // Remove workflows
    for (const [key] of this.registry.workflows) {
      if (key.startsWith(`${pluginId}:`)) {
        this.registry.workflows.delete(key);
      }
    }

    // Note: Hooks don't have plugin prefixes, so we can't selectively remove them
    // In a real implementation, hooks would need to track their source plugin
  }
}

/**
 * Create a new plugin manager instance
 */
export function createPluginManager(options?: PluginLoaderOptions): PluginManager {
  return new PluginManager(options);
}
