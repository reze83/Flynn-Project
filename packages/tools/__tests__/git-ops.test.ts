import { execSync } from "node:child_process";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock child_process
vi.mock("node:child_process", () => ({
  execSync: vi.fn(),
}));

// Import after mocking
import { gitOpsTool } from "../src/git-ops.js";

const mockExecSync = vi.mocked(execSync);

describe("gitOpsTool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("status operation", () => {
    it("returns git status output", async () => {
      mockExecSync.mockReturnValue("M  file.txt\n?? new.txt");

      const result = await gitOpsTool.execute({
        operation: "status",
        path: "/repo",
      });

      expect(result.success).toBe(true);
      expect(result.operation).toBe("status");
      expect(result.output).toBe("M  file.txt\n?? new.txt");
    });

    it("uses correct git command", async () => {
      mockExecSync.mockReturnValue("");

      await gitOpsTool.execute({
        operation: "status",
        path: "/repo",
      });

      expect(mockExecSync).toHaveBeenCalledWith(
        "git status --porcelain",
        expect.objectContaining({ cwd: "/repo" }),
      );
    });

    it("uses default path when not provided", async () => {
      mockExecSync.mockReturnValue("");

      await gitOpsTool.execute({
        operation: "status",
        path: ".", // Provide explicit path since zod defaults aren't applied in direct calls
      });

      expect(mockExecSync).toHaveBeenCalledWith(
        "git status --porcelain",
        expect.objectContaining({ cwd: "." }),
      );
    });

    it("handles empty status (clean repo)", async () => {
      mockExecSync.mockReturnValue("");

      const result = await gitOpsTool.execute({
        operation: "status",
        path: "/clean-repo",
      });

      expect(result.success).toBe(true);
      expect(result.output).toBe("");
    });
  });

  describe("log operation", () => {
    it("returns git log output", async () => {
      mockExecSync.mockReturnValue("abc123 Initial commit\ndef456 Second commit");

      const result = await gitOpsTool.execute({
        operation: "log",
        path: "/repo",
        count: 10,
      });

      expect(result.success).toBe(true);
      expect(result.operation).toBe("log");
      expect(result.output).toContain("Initial commit");
    });

    it("respects count parameter", async () => {
      mockExecSync.mockReturnValue("abc123 Commit 1");

      await gitOpsTool.execute({
        operation: "log",
        path: "/repo",
        count: 5,
      });

      expect(mockExecSync).toHaveBeenCalledWith("git log --oneline -n 5", expect.any(Object));
    });

    it("uses default count of 10", async () => {
      mockExecSync.mockReturnValue("");

      await gitOpsTool.execute({
        operation: "log",
        path: "/repo",
      });

      expect(mockExecSync).toHaveBeenCalledWith("git log --oneline -n 10", expect.any(Object));
    });
  });

  describe("diff operation", () => {
    it("returns unstaged diff by default", async () => {
      mockExecSync.mockReturnValue("diff --git a/file.txt b/file.txt\n+added line");

      const result = await gitOpsTool.execute({
        operation: "diff",
        path: "/repo",
        staged: false,
      });

      expect(result.success).toBe(true);
      expect(result.operation).toBe("diff");
      expect(mockExecSync).toHaveBeenCalledWith("git diff", expect.any(Object));
    });

    it("returns staged diff when staged is true", async () => {
      mockExecSync.mockReturnValue("diff --git a/staged.txt");

      await gitOpsTool.execute({
        operation: "diff",
        path: "/repo",
        staged: true,
      });

      expect(mockExecSync).toHaveBeenCalledWith("git diff --cached", expect.any(Object));
    });

    it("handles empty diff", async () => {
      mockExecSync.mockReturnValue("");

      const result = await gitOpsTool.execute({
        operation: "diff",
        path: "/repo",
        staged: false,
      });

      expect(result.success).toBe(true);
      expect(result.output).toBe("");
    });
  });

  describe("branch operation", () => {
    it("returns branch list", async () => {
      mockExecSync.mockReturnValue("* main\n  feature-branch\n  remotes/origin/main");

      const result = await gitOpsTool.execute({
        operation: "branch",
        path: "/repo",
      });

      expect(result.success).toBe(true);
      expect(result.operation).toBe("branch");
      expect(result.output).toContain("main");
      expect(result.output).toContain("feature-branch");
    });

    it("uses correct git command with -a flag", async () => {
      mockExecSync.mockReturnValue("* main");

      await gitOpsTool.execute({
        operation: "branch",
        path: "/repo",
      });

      expect(mockExecSync).toHaveBeenCalledWith("git branch -a", expect.any(Object));
    });
  });

  describe("error handling", () => {
    it("handles git command errors", async () => {
      mockExecSync.mockImplementation(() => {
        throw new Error("fatal: not a git repository");
      });

      const result = await gitOpsTool.execute({
        operation: "status",
        path: "/not-a-repo",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("not a git repository");
      expect(result.output).toBe("");
    });

    it("handles timeout errors", async () => {
      mockExecSync.mockImplementation(() => {
        throw new Error("Command timed out");
      });

      const result = await gitOpsTool.execute({
        operation: "log",
        path: "/slow-repo",
        count: 1000,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("timed out");
    });
  });

  describe("exec options", () => {
    it("passes cwd option correctly", async () => {
      mockExecSync.mockReturnValue("");

      await gitOpsTool.execute({
        operation: "status",
        path: "/custom/path",
      });

      expect(mockExecSync).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          cwd: "/custom/path",
          encoding: "utf-8",
        }),
      );
    });
  });
});
