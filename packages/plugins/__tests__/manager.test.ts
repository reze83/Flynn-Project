/**
 * Plugin Manager Tests
 */

import { beforeEach, describe, expect, it } from "vitest";
import { PluginManager, createPluginManager } from "../src/manager.js";
import type { FlynnPlugin, PluginInfo } from "../src/types.js";

describe("PluginManager", () => {
  let manager: PluginManager;

  beforeEach(() => {
    manager = createPluginManager({
      flynnVersion: "1.0.0",
      searchDirs: [], // Don't auto-discover
    });
  });

  describe("initialization", () => {
    it("should create a plugin manager", () => {
      expect(manager).toBeInstanceOf(PluginManager);
    });

    it("should have empty plugin list initially", () => {
      const plugins = manager.listPlugins();
      expect(plugins).toEqual([]);
    });

    it("should have empty registry initially", () => {
      expect(manager.getAgents()).toEqual([]);
      expect(manager.getSkills()).toEqual([]);
      expect(manager.getWorkflows()).toEqual([]);
      expect(manager.getHooks()).toEqual([]);
    });
  });

  describe("plugin loading", () => {
    it("should return null for non-existent plugin", async () => {
      const result = await manager.loadPlugin("/non/existent/path");
      expect(result).toBeNull();
    });

    it("should return null for invalid plugin directory", async () => {
      const result = await manager.loadPlugin("/tmp");
      expect(result).toBeNull();
    });
  });

  describe("plugin unloading", () => {
    it("should return false for non-loaded plugin", async () => {
      const result = await manager.unloadPlugin("non-existent");
      expect(result).toBe(false);
    });
  });

  describe("plugin info", () => {
    it("should return null for non-loaded plugin", () => {
      const info = manager.getPluginInfo("non-existent");
      expect(info).toBeNull();
    });

    it("should return undefined for non-loaded plugin", () => {
      const plugin = manager.getPlugin("non-existent");
      expect(plugin).toBeUndefined();
    });
  });

  describe("event handling", () => {
    it("should allow subscribing to events", () => {
      const handler = () => {};
      expect(() => manager.on("plugin:loaded", handler)).not.toThrow();
    });

    it("should allow unsubscribing from events", () => {
      const handler = () => {};
      manager.on("plugin:loaded", handler);
      expect(() => manager.off("plugin:loaded", handler)).not.toThrow();
    });
  });
});

describe("createPluginManager", () => {
  it("should create a plugin manager with default options", () => {
    const manager = createPluginManager();
    expect(manager).toBeInstanceOf(PluginManager);
  });

  it("should create a plugin manager with custom options", () => {
    const manager = createPluginManager({
      flynnVersion: "2.0.0",
      searchDirs: ["/custom/path"],
    });
    expect(manager).toBeInstanceOf(PluginManager);
  });
});
