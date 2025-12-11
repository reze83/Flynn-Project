import { describe, expect, it } from "vitest";
import { systemInfoTool } from "../src/system-info.js";

describe("systemInfoTool", () => {
  it("should be defined", () => {
    expect(systemInfoTool).toBeDefined();
    expect(systemInfoTool.id).toBe("system-info");
  });

  it("should return system information", async () => {
    const result = await systemInfoTool.execute({});

    expect(result).toHaveProperty("platform");
    expect(result).toHaveProperty("arch");
    expect(result).toHaveProperty("release");
    expect(result).toHaveProperty("hostname");
    expect(result).toHaveProperty("homeDir");
    expect(result).toHaveProperty("nodeVersion");
    expect(result).toHaveProperty("isWSL");
  });

  it("should return valid types", async () => {
    const result = await systemInfoTool.execute({});

    expect(typeof result.platform).toBe("string");
    expect(typeof result.arch).toBe("string");
    expect(typeof result.nodeVersion).toBe("string");
    expect(typeof result.isWSL).toBe("boolean");
  });
});
