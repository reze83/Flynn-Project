import { vol } from "memfs";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock node:fs with memfs
vi.mock("node:fs", async () => {
  const memfs = await import("memfs");
  return memfs.fs;
});

// Import after mocking
import { analyzeProjectTool } from "../src/project-analysis.js";

describe("analyzeProjectTool", () => {
  beforeEach(() => {
    vol.reset();
  });

  describe("basic analysis", () => {
    it("returns project name from path", async () => {
      vol.fromJSON({
        "/projects/my-app/index.js": "console.log('hello')",
      });

      const result = await analyzeProjectTool.execute({
        projectPath: "/projects/my-app",
        maxDepth: 3,
      });

      expect(result.name).toBe("my-app");
    });

    it("counts files correctly", async () => {
      vol.fromJSON({
        "/project/file1.js": "a",
        "/project/file2.js": "b",
        "/project/file3.ts": "c",
      });

      const result = await analyzeProjectTool.execute({
        projectPath: "/project",
        maxDepth: 3,
      });

      expect(result.files).toBe(3);
    });

    it("counts directories correctly", async () => {
      vol.fromJSON({
        "/project/src/index.js": "a",
        "/project/src/utils/helper.js": "b",
        "/project/tests/test.js": "c",
      });

      const result = await analyzeProjectTool.execute({
        projectPath: "/project",
        maxDepth: 3,
      });

      expect(result.directories).toBeGreaterThanOrEqual(2);
    });
  });

  describe("language detection", () => {
    it("detects TypeScript from .ts files", async () => {
      vol.fromJSON({
        "/project/src/index.ts": "export const x = 1",
        "/project/src/utils.ts": "export const y = 2",
      });

      const result = await analyzeProjectTool.execute({
        projectPath: "/project",
        maxDepth: 3,
      });

      expect(result.languages).toContain("TypeScript");
    });

    it("detects TypeScript from .tsx files", async () => {
      vol.fromJSON({
        "/project/App.tsx": "export const App = () => <div />",
      });

      const result = await analyzeProjectTool.execute({
        projectPath: "/project",
        maxDepth: 3,
      });

      expect(result.languages).toContain("TypeScript");
    });

    it("detects JavaScript from .js files", async () => {
      vol.fromJSON({
        "/project/index.js": "module.exports = {}",
      });

      const result = await analyzeProjectTool.execute({
        projectPath: "/project",
        maxDepth: 3,
      });

      expect(result.languages).toContain("JavaScript");
    });

    it("detects Python from .py files", async () => {
      vol.fromJSON({
        "/project/main.py": "print('hello')",
      });

      const result = await analyzeProjectTool.execute({
        projectPath: "/project",
        maxDepth: 3,
      });

      expect(result.languages).toContain("Python");
    });

    it("detects Rust from .rs files", async () => {
      vol.fromJSON({
        "/project/src/main.rs": "fn main() {}",
      });

      const result = await analyzeProjectTool.execute({
        projectPath: "/project",
        maxDepth: 3,
      });

      expect(result.languages).toContain("Rust");
    });

    it("detects Go from .go files", async () => {
      vol.fromJSON({
        "/project/main.go": "package main",
      });

      const result = await analyzeProjectTool.execute({
        projectPath: "/project",
        maxDepth: 3,
      });

      expect(result.languages).toContain("Go");
    });

    it("detects multiple languages", async () => {
      vol.fromJSON({
        "/project/index.ts": "typescript",
        "/project/script.py": "python",
        "/project/main.go": "go",
      });

      const result = await analyzeProjectTool.execute({
        projectPath: "/project",
        maxDepth: 3,
      });

      expect(result.languages).toContain("TypeScript");
      expect(result.languages).toContain("Python");
      expect(result.languages).toContain("Go");
    });

    it("removes duplicate languages", async () => {
      vol.fromJSON({
        "/project/a.ts": "a",
        "/project/b.ts": "b",
        "/project/c.tsx": "c",
      });

      const result = await analyzeProjectTool.execute({
        projectPath: "/project",
        maxDepth: 3,
      });

      // Should only have TypeScript once
      const tsCount = result.languages.filter((l) => l === "TypeScript").length;
      expect(tsCount).toBe(1);
    });
  });

  describe("framework detection", () => {
    it("detects Node.js from package.json", async () => {
      vol.fromJSON({
        "/project/package.json": '{"name": "test"}',
        "/project/index.js": "console.log('hi')",
      });

      const result = await analyzeProjectTool.execute({
        projectPath: "/project",
        maxDepth: 3,
      });

      expect(result.frameworks).toContain("Node.js");
    });

    it("detects Python from pyproject.toml", async () => {
      vol.fromJSON({
        "/project/pyproject.toml": "[tool.poetry]",
        "/project/main.py": "print('hi')",
      });

      const result = await analyzeProjectTool.execute({
        projectPath: "/project",
        maxDepth: 3,
      });

      expect(result.frameworks).toContain("Python");
    });

    it("detects Rust from Cargo.toml", async () => {
      vol.fromJSON({
        "/project/Cargo.toml": "[package]",
        "/project/src/main.rs": "fn main() {}",
      });

      const result = await analyzeProjectTool.execute({
        projectPath: "/project",
        maxDepth: 3,
      });

      expect(result.frameworks).toContain("Rust");
    });

    it("sets type based on first detected framework", async () => {
      vol.fromJSON({
        "/project/package.json": "{}",
        "/project/pyproject.toml": "[tool]",
      });

      const result = await analyzeProjectTool.execute({
        projectPath: "/project",
        maxDepth: 3,
      });

      // Type should be the first framework detected
      expect(["Node.js", "Python"]).toContain(result.type);
    });

    it("sets type to unknown when no frameworks detected", async () => {
      vol.fromJSON({
        "/project/readme.md": "# Project",
      });

      const result = await analyzeProjectTool.execute({
        projectPath: "/project",
        maxDepth: 3,
      });

      expect(result.type).toBe("unknown");
    });
  });

  describe("depth limiting", () => {
    it("respects maxDepth parameter", async () => {
      vol.fromJSON({
        "/project/level1/level2/level3/level4/deep.ts": "deep",
        "/project/level1/shallow.ts": "shallow",
      });

      const result = await analyzeProjectTool.execute({
        projectPath: "/project",
        maxDepth: 2,
      });

      // Should not count files beyond depth 2
      expect(result.files).toBeLessThan(2);
    });
  });

  describe("ignore patterns", () => {
    it("ignores node_modules", async () => {
      vol.fromJSON({
        "/project/index.js": "main",
        "/project/node_modules/pkg/index.js": "dep",
      });

      const result = await analyzeProjectTool.execute({
        projectPath: "/project",
        maxDepth: 10,
      });

      expect(result.files).toBe(1);
    });

    it("ignores hidden directories", async () => {
      vol.fromJSON({
        "/project/index.js": "main",
        "/project/.git/config": "git",
        "/project/.hidden/file.js": "hidden",
      });

      const result = await analyzeProjectTool.execute({
        projectPath: "/project",
        maxDepth: 10,
      });

      expect(result.files).toBe(1);
    });
  });

  describe("error handling", () => {
    it("handles non-existent paths gracefully", async () => {
      // memfs will throw on non-existent paths
      const result = await analyzeProjectTool.execute({
        projectPath: "/nonexistent",
        maxDepth: 3,
      });

      // Tool should handle error internally
      expect(result).toBeDefined();
    });
  });
});
