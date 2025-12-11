/**
 * Plugin Loader Tests
 */

import { describe, expect, it } from "vitest";
import {
  discoverPlugins,
  getDefaultSearchDirs,
  loadManifest,
  validateManifest,
} from "../src/loader.js";
import type { PluginManifest } from "../src/types.js";

describe("loadManifest", () => {
  it("should return null for non-existent directory", () => {
    const manifest = loadManifest("/non/existent/path");
    expect(manifest).toBeNull();
  });

  it("should return null for directory without manifest", () => {
    const manifest = loadManifest("/tmp");
    expect(manifest).toBeNull();
  });
});

describe("validateManifest", () => {
  const validManifest: PluginManifest = {
    id: "test-plugin",
    name: "Test Plugin",
    version: "1.0.0",
    main: "./dist/index.js",
    flynn: {
      minVersion: "1.0.0",
    },
  };

  it("should validate compatible manifest", () => {
    const result = validateManifest(validManifest, "1.0.0");
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("should validate manifest with lower minVersion", () => {
    const manifest = { ...validManifest, flynn: { minVersion: "0.5.0" } };
    const result = validateManifest(manifest, "1.0.0");
    expect(result.valid).toBe(true);
  });

  it("should reject manifest with higher major version", () => {
    const manifest = { ...validManifest, flynn: { minVersion: "2.0.0" } };
    const result = validateManifest(manifest, "1.0.0");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("requires Flynn 2.0.0");
  });

  it("should reject manifest with higher minor version", () => {
    const manifest = { ...validManifest, flynn: { minVersion: "1.5.0" } };
    const result = validateManifest(manifest, "1.0.0");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("requires Flynn 1.5.0");
  });

  it("should accept same major with higher Flynn minor", () => {
    const manifest = { ...validManifest, flynn: { minVersion: "1.0.0" } };
    const result = validateManifest(manifest, "1.5.0");
    expect(result.valid).toBe(true);
  });
});

describe("discoverPlugins", () => {
  it("should return empty array for non-existent directory", () => {
    const plugins = discoverPlugins("/non/existent/path");
    expect(plugins).toEqual([]);
  });

  it("should return empty array for directory without plugins", () => {
    const plugins = discoverPlugins("/tmp");
    expect(plugins).toEqual([]);
  });
});

describe("getDefaultSearchDirs", () => {
  it("should return array of directories", () => {
    const dirs = getDefaultSearchDirs();
    expect(Array.isArray(dirs)).toBe(true);
  });

  it("should include user plugins directory", () => {
    const dirs = getDefaultSearchDirs();
    expect(dirs.some((d) => d.includes(".flynn/plugins"))).toBe(true);
  });

  it("should include project directories when provided", () => {
    const dirs = getDefaultSearchDirs("/my/project");
    expect(dirs.some((d) => d.includes("/my/project"))).toBe(true);
  });
});
