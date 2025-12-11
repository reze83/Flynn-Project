/**
 * Flynn Plugin System
 *
 * Extensible plugin architecture for Flynn.
 *
 * @example
 * ```typescript
 * import { createPluginManager, type FlynnPlugin } from '@flynn/plugins';
 *
 * // Create a plugin manager
 * const manager = createPluginManager({
 *   flynnVersion: '1.0.0',
 *   autoLoad: true,
 * });
 *
 * // List loaded plugins
 * const plugins = manager.listPlugins();
 *
 * // Load a plugin manually
 * await manager.loadPlugin('./my-plugin');
 *
 * // Create a plugin
 * const myPlugin: FlynnPlugin = {
 *   id: 'my-plugin',
 *   name: 'My Plugin',
 *   version: '1.0.0',
 *   async initialize(context) {
 *     context.registerAgent({
 *       id: 'custom-agent',
 *       name: 'Custom Agent',
 *       // ...
 *     });
 *   },
 * };
 * ```
 *
 * @packageDocumentation
 */

// Types
export type {
  FlynnPlugin,
  PluginManifest,
  PluginInfo,
  PluginContext,
  PluginLoaderOptions,
  PluginEvent,
  PluginEventType,
  PluginEventHandler,
  AgentDefinition,
  SkillDefinition,
  WorkflowDefinition,
  HookDefinition,
  Logger,
} from "./types.js";

// Schema
export { PluginManifestSchema } from "./types.js";

// Manager
export { PluginManager, createPluginManager } from "./manager.js";

// Context
export { createPluginContext, createRegistry, type PluginRegistry } from "./context.js";

// Loader
export {
  loadPlugin,
  loadManifest,
  validateManifest,
  discoverPlugins,
  getDefaultSearchDirs,
  type PluginLoadResult,
} from "./loader.js";

// Installer
export {
  installPlugin,
  uninstallPlugin,
  installFromNpm,
  installFromGit,
  installFromLocal,
  detectSourceType,
  getDefaultTargetDir,
  listInstalledPlugins,
  type InstallOptions,
  type InstallResult,
  type SourceType,
} from "./installer.js";
