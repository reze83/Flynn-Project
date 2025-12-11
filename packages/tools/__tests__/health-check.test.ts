/**
 * Health Check Tool Tests
 */

import * as childProcess from "node:child_process";
import * as fs from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { healthCheckTool } from "../src/health-check.js";

// Mock child_process.execSync
vi.mock("node:child_process", async () => {
  const actual = await vi.importActual("node:child_process");
  return {
    ...actual,
    execSync: vi.fn(),
  };
});

describe("health-check tool", () => {
  const originalCwd = process.cwd();

  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock implementations
    vi.mocked(childProcess.execSync).mockImplementation((cmd: string) => {
      if (cmd === "node --version") return "v20.10.0\n";
      if (cmd === "pnpm --version") return "9.1.0\n";
      if (cmd === "python3 --version") return "Python 3.11.0\n";
      if (cmd === "git --version") return "git version 2.40.0\n";
      throw new Error("Command not found");
    });
  });

  afterEach(() => {
    process.chdir(originalCwd);
  });

  describe("environment checks", () => {
    it("detects Node.js version", async () => {
      const result = await healthCheckTool.execute({
        context: { checks: ["environment"] },
      });

      expect(result.checks.some((c) => c.name === "Node.js")).toBe(true);
      const nodeCheck = result.checks.find((c) => c.name === "Node.js");
      expect(nodeCheck?.status).toBe("pass");
    });

    it("detects pnpm version", async () => {
      const result = await healthCheckTool.execute({
        context: { checks: ["environment"] },
      });

      const pnpmCheck = result.checks.find((c) => c.name === "pnpm");
      expect(pnpmCheck?.status).toBe("pass");
    });

    it("detects Python (optional)", async () => {
      const result = await healthCheckTool.execute({
        context: { checks: ["environment"] },
      });

      const pythonCheck = result.checks.find((c) => c.name === "Python");
      expect(pythonCheck).toBeDefined();
    });

    it("detects Git", async () => {
      const result = await healthCheckTool.execute({
        context: { checks: ["environment"] },
      });

      const gitCheck = result.checks.find((c) => c.name === "Git");
      expect(gitCheck?.status).toBe("pass");
    });

    it("includes OS info", async () => {
      const result = await healthCheckTool.execute({
        context: { checks: ["environment"] },
      });

      const osCheck = result.checks.find((c) => c.name === "Operating System");
      expect(osCheck?.status).toBe("pass");
      expect(osCheck?.details).toHaveProperty("platform");
    });
  });

  describe("dependency checks", () => {
    it("checks package.json exists", async () => {
      const result = await healthCheckTool.execute({
        context: { checks: ["dependencies"], projectPath: process.cwd() },
      });

      const pkgCheck = result.checks.find((c) => c.name === "package.json");
      expect(pkgCheck).toBeDefined();
    });

    it("checks node_modules exists", async () => {
      const result = await healthCheckTool.execute({
        context: { checks: ["dependencies"], projectPath: process.cwd() },
      });

      const modulesCheck = result.checks.find((c) => c.name === "node_modules");
      expect(modulesCheck).toBeDefined();
    });

    it("checks lock file exists", async () => {
      const result = await healthCheckTool.execute({
        context: { checks: ["dependencies"], projectPath: process.cwd() },
      });

      const lockCheck = result.checks.find((c) => c.name === "Lock file");
      expect(lockCheck).toBeDefined();
    });
  });

  describe("configuration checks", () => {
    it("checks tsconfig.json", async () => {
      const result = await healthCheckTool.execute({
        context: { checks: ["configuration"], projectPath: process.cwd() },
      });

      const tsconfigCheck = result.checks.find((c) => c.name === "tsconfig.json");
      expect(tsconfigCheck).toBeDefined();
    });

    it("checks linter config", async () => {
      const result = await healthCheckTool.execute({
        context: { checks: ["configuration"], projectPath: process.cwd() },
      });

      const linterCheck = result.checks.find((c) => c.name === "Linter");
      expect(linterCheck).toBeDefined();
    });

    it("checks .gitignore", async () => {
      const result = await healthCheckTool.execute({
        context: { checks: ["configuration"], projectPath: process.cwd() },
      });

      const gitignoreCheck = result.checks.find((c) => c.name === ".gitignore");
      expect(gitignoreCheck).toBeDefined();
    });
  });

  describe("MCP checks", () => {
    it("checks MCP server status", async () => {
      const result = await healthCheckTool.execute({
        context: { checks: ["mcp"] },
      });

      const mcpCheck = result.checks.find((c) => c.name === "MCP Server");
      expect(mcpCheck?.status).toBe("pass");
    });
  });

  describe("all checks", () => {
    it("runs all checks when checks is 'all'", async () => {
      const result = await healthCheckTool.execute({
        context: { checks: ["all"], projectPath: process.cwd() },
      });

      // Should have checks from all categories
      expect(result.checks.some((c) => c.name === "Node.js")).toBe(true);
      expect(result.checks.some((c) => c.name === "package.json")).toBe(true);
      expect(result.checks.some((c) => c.name === "tsconfig.json")).toBe(true);
      expect(result.checks.some((c) => c.name === "MCP Server")).toBe(true);
    });
  });

  describe("summary", () => {
    it("calculates summary correctly", async () => {
      const result = await healthCheckTool.execute({
        context: { checks: ["environment"] },
      });

      const total = result.summary.passed + result.summary.failed + result.summary.warnings;
      expect(total).toBe(result.checks.length);
    });

    it("healthy is true when no failures", async () => {
      const result = await healthCheckTool.execute({
        context: { checks: ["environment"] },
      });

      expect(result.healthy).toBe(result.summary.failed === 0);
    });

    it("includes timestamp", async () => {
      const result = await healthCheckTool.execute({
        context: { checks: ["environment"] },
      });

      expect(result.timestamp).toBeDefined();
      expect(new Date(result.timestamp).getTime()).not.toBeNaN();
    });
  });

  describe("recommendations", () => {
    it("provides recommendations for failures", async () => {
      // Mock Node.js as old version
      vi.mocked(childProcess.execSync).mockImplementation((cmd: string) => {
        if (cmd === "node --version") return "v16.0.0\n";
        throw new Error("Command not found");
      });

      const result = await healthCheckTool.execute({
        context: { checks: ["environment"] },
      });

      const nodeCheck = result.checks.find((c) => c.name === "Node.js");
      expect(nodeCheck?.status).toBe("fail");
      expect(result.recommendations.some((r) => r.includes("Node.js"))).toBe(true);
    });
  });
});
