import { describe, expect, it } from "vitest";
import { shellTool } from "../src/shell.js";

describe("shellTool", () => {
  it("should be defined", () => {
    expect(shellTool).toBeDefined();
    expect(shellTool.id).toBe("shell");
  });

  it("should execute allowed commands", async () => {
    const result = await shellTool.execute({
      command: "echo test",
      timeout: 5000,
      allowUnsafe: false,
    });

    expect(result.success).toBe(true);
    expect(result.stdout).toBe("test");
  });

  it("should block dangerous commands", async () => {
    const result = await shellTool.execute({
      command: "rm -rf /",
      timeout: 5000,
      allowUnsafe: false,
    });

    expect(result.success).toBe(false);
    expect(result.blocked).toBe(true);
  });

  it("should block sudo commands", async () => {
    const result = await shellTool.execute({
      command: "sudo apt install foo",
      timeout: 5000,
      allowUnsafe: false,
    });

    expect(result.success).toBe(false);
    expect(result.blocked).toBe(true);
  });

  it("should allow git commands", async () => {
    const result = await shellTool.execute({
      command: "git --version",
      timeout: 5000,
      allowUnsafe: false,
    });

    expect(result.success).toBe(true);
    expect(result.stdout).toContain("git");
  });
});
