import { describe, expect, it } from "vitest";
import {
  detectGit,
  detectNode,
  detectPackageManagers,
  detectPython,
  detectWSL,
} from "../src/detector/index.js";

describe("detectors", () => {
  describe("detectWSL", () => {
    it("should return WSL detection result", async () => {
      const result = await detectWSL();
      expect(result).toHaveProperty("isWSL");
      expect(typeof result.isWSL).toBe("boolean");
    });
  });

  describe("detectNode", () => {
    it("should detect Node.js", async () => {
      const result = detectNode();
      expect(result).toHaveProperty("success");
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty("installed");
      expect(result.data?.installed).toBe(true);
    });

    it("should report if meets minimum version", async () => {
      const result = detectNode();
      expect(result.data).toHaveProperty("meetsMinimum");
      expect(typeof result.data?.meetsMinimum).toBe("boolean");
    });
  });

  describe("detectGit", () => {
    it("should detect Git", async () => {
      const result = detectGit();
      expect(result).toHaveProperty("success");
      expect(result.data).toHaveProperty("installed");
    });
  });

  describe("detectPackageManagers", () => {
    it("should return package manager detection", async () => {
      const result = await detectPackageManagers();
      expect(result).toHaveProperty("pnpm");
      expect(result).toHaveProperty("npm");
      expect(result).toHaveProperty("uv");
    });
  });
});
