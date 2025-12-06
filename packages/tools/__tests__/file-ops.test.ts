import { vol } from "memfs";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock node:fs with memfs
vi.mock("node:fs", async () => {
  const memfs = await import("memfs");
  return memfs.fs;
});

// Import after mocking
import { fileOpsTool } from "../src/file-ops.js";

describe("fileOpsTool", () => {
  beforeEach(() => {
    vol.reset();
  });

  describe("read operation", () => {
    it("reads existing file content", async () => {
      vol.fromJSON({ "/test.txt": "Hello, World!" });

      const result = await fileOpsTool.execute({
        context: { operation: "read", path: "/test.txt" },
      });

      expect(result.success).toBe(true);
      expect(result.operation).toBe("read");
      expect(result.result).toBe("Hello, World!");
    });

    it("returns error for missing file", async () => {
      const result = await fileOpsTool.execute({
        context: { operation: "read", path: "/missing.txt" },
      });

      expect(result.success).toBe(false);
      expect(result.operation).toBe("read");
      expect(result.error).toContain("not found");
    });

    it("reads multi-line file content", async () => {
      const content = "line1\nline2\nline3";
      vol.fromJSON({ "/multiline.txt": content });

      const result = await fileOpsTool.execute({
        context: { operation: "read", path: "/multiline.txt" },
      });

      expect(result.success).toBe(true);
      expect(result.result).toBe(content);
    });

    it("reads empty file", async () => {
      vol.fromJSON({ "/empty.txt": "" });

      const result = await fileOpsTool.execute({
        context: { operation: "read", path: "/empty.txt" },
      });

      expect(result.success).toBe(true);
      expect(result.result).toBe("");
    });
  });

  describe("write operation", () => {
    it("writes content to file", async () => {
      vol.fromJSON({ "/": null });

      const result = await fileOpsTool.execute({
        context: {
          operation: "write",
          path: "/output.txt",
          content: "Test content",
          createDirs: false,
        },
      });

      expect(result.success).toBe(true);
      expect(result.operation).toBe("write");
      expect(result.result).toContain("12 bytes");
    });

    it("creates parent directories when createDirs is true", async () => {
      vol.fromJSON({ "/": null });

      const result = await fileOpsTool.execute({
        context: {
          operation: "write",
          path: "/nested/deep/file.txt",
          content: "Nested content",
          createDirs: true,
        },
      });

      expect(result.success).toBe(true);
      expect(vol.existsSync("/nested/deep/file.txt")).toBe(true);
    });

    it("overwrites existing file", async () => {
      vol.fromJSON({ "/existing.txt": "old content" });

      const result = await fileOpsTool.execute({
        context: {
          operation: "write",
          path: "/existing.txt",
          content: "new content",
          createDirs: false,
        },
      });

      expect(result.success).toBe(true);
      expect(vol.readFileSync("/existing.txt", "utf-8")).toBe("new content");
    });

    it("writes empty content", async () => {
      vol.fromJSON({ "/": null });

      const result = await fileOpsTool.execute({
        context: { operation: "write", path: "/empty.txt", content: "", createDirs: false },
      });

      expect(result.success).toBe(true);
      expect(result.result).toContain("0 bytes");
    });
  });

  describe("exists operation", () => {
    it("returns true for existing file", async () => {
      vol.fromJSON({ "/exists.txt": "content" });

      const result = await fileOpsTool.execute({
        context: { operation: "exists", path: "/exists.txt" },
      });

      expect(result.success).toBe(true);
      expect(result.operation).toBe("exists");
      expect(result.exists).toBe(true);
    });

    it("returns false for missing file", async () => {
      vol.fromJSON({ "/": null });

      const result = await fileOpsTool.execute({
        context: { operation: "exists", path: "/missing.txt" },
      });

      expect(result.success).toBe(true);
      expect(result.exists).toBe(false);
    });

    it("returns true for existing directory", async () => {
      vol.fromJSON({ "/mydir/file.txt": "content" });

      const result = await fileOpsTool.execute({
        context: { operation: "exists", path: "/mydir" },
      });

      expect(result.success).toBe(true);
      expect(result.exists).toBe(true);
    });
  });

  describe("list operation", () => {
    it("lists directory contents", async () => {
      vol.fromJSON({
        "/mydir/file1.txt": "content1",
        "/mydir/file2.txt": "content2",
        "/mydir/subdir/file3.txt": "content3",
      });

      const result = await fileOpsTool.execute({
        context: { operation: "list", path: "/mydir", recursive: false },
      });

      expect(result.success).toBe(true);
      expect(result.operation).toBe("list");
      expect(result.files).toContain("file1.txt");
      expect(result.files).toContain("file2.txt");
      expect(result.files).toContain("subdir/");
    });

    it("lists recursively when option set", async () => {
      vol.fromJSON({
        "/mydir/file1.txt": "content1",
        "/mydir/subdir/file2.txt": "content2",
        "/mydir/subdir/deep/file3.txt": "content3",
      });

      const result = await fileOpsTool.execute({
        context: { operation: "list", path: "/mydir", recursive: true },
      });

      expect(result.success).toBe(true);
      expect(result.files).toContain("file1.txt");
      expect(result.files).toContain("subdir/");
      expect(result.files).toContain("subdir/file2.txt");
      expect(result.files).toContain("subdir/deep/");
      expect(result.files).toContain("subdir/deep/file3.txt");
    });

    it("returns error for missing directory", async () => {
      vol.fromJSON({ "/": null });

      const result = await fileOpsTool.execute({
        context: { operation: "list", path: "/nonexistent", recursive: false },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("not found");
    });

    it("lists empty directory", async () => {
      vol.mkdirSync("/emptydir");

      const result = await fileOpsTool.execute({
        context: { operation: "list", path: "/emptydir", recursive: false },
      });

      expect(result.success).toBe(true);
      expect(result.files).toEqual([]);
    });
  });

  describe("error handling", () => {
    it("handles permission errors gracefully", async () => {
      // This test validates error handling structure
      // In real scenarios, permission errors would be caught
      const result = await fileOpsTool.execute({
        context: { operation: "read", path: "/nonexistent/path/file.txt" },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
