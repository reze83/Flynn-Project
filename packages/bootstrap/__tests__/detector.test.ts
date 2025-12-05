import { describe, it, expect } from "vitest";
import {
  detectWSL,
  detectNode,
  detectPython,
  detectGit,
  detectPackageManagers,
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
      const result = await detectNode();
      expect(result).toHaveProperty("installed");
      expect(result.installed).toBe(true);
      expect(result).toHaveProperty("version");
    });

    it("should report if meets minimum version", async () => {
      const result = await detectNode();
      expect(result).toHaveProperty("meetsMinimum");
      expect(typeof result.meetsMinimum).toBe("boolean");
    });
  });

  describe("detectGit", () => {
    it("should detect Git", async () => {
      const result = await detectGit();
      expect(result).toHaveProperty("installed");
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
