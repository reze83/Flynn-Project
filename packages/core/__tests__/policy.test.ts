import { describe, it, expect } from "vitest";
import { validateFunctionUsage } from "../src/policy";

describe("validateFunctionUsage", () => {
  it("detects usage of eval", () => {
    const code = 'const x = eval("2+2");';
    const result = validateFunctionUsage(code);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("eval");
  });
  it("allows safe code", () => {
    const code = 'const sum = 2 + 2;';
    const result = validateFunctionUsage(code);
    expect(result.allowed).toBe(true);
    expect(result.reason).toBeUndefined();
  });
});