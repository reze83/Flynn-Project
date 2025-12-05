import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getDataDir, getConfigDir, getCacheDir, getMemoryDbPath } from "../src/paths.js";
import { homedir } from "node:os";
import { join } from "node:path";

describe("paths", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset env vars
    delete process.env.XDG_DATA_HOME;
    delete process.env.XDG_CONFIG_HOME;
    delete process.env.XDG_CACHE_HOME;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe("getDataDir", () => {
    it("should use XDG_DATA_HOME if set", () => {
      process.env.XDG_DATA_HOME = "/custom/data";
      expect(getDataDir()).toBe("/custom/data/flynn");
    });

    it("should fall back to ~/.local/share if XDG_DATA_HOME not set", () => {
      const expected = join(homedir(), ".local", "share", "flynn");
      expect(getDataDir()).toBe(expected);
    });
  });

  describe("getConfigDir", () => {
    it("should use XDG_CONFIG_HOME if set", () => {
      process.env.XDG_CONFIG_HOME = "/custom/config";
      expect(getConfigDir()).toBe("/custom/config/flynn");
    });

    it("should fall back to ~/.config if XDG_CONFIG_HOME not set", () => {
      const expected = join(homedir(), ".config", "flynn");
      expect(getConfigDir()).toBe(expected);
    });
  });

  describe("getCacheDir", () => {
    it("should use XDG_CACHE_HOME if set", () => {
      process.env.XDG_CACHE_HOME = "/custom/cache";
      expect(getCacheDir()).toBe("/custom/cache/flynn");
    });

    it("should fall back to ~/.cache if XDG_CACHE_HOME not set", () => {
      const expected = join(homedir(), ".cache", "flynn");
      expect(getCacheDir()).toBe(expected);
    });
  });

  describe("getMemoryDbPath", () => {
    it("should return path in data directory", () => {
      process.env.XDG_DATA_HOME = "/custom/data";
      expect(getMemoryDbPath()).toBe("/custom/data/flynn/memory.db");
    });
  });
});
