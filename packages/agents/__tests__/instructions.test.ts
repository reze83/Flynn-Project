import { describe, expect, it } from "vitest";
import {
  coderInstructions,
  dataInstructions,
  diagnosticInstructions,
  healerInstructions,
  installerInstructions,
  orchestratorInstructions,
  refactorInstructions,
  releaseInstructions,
  scaffolderInstructions,
} from "../src/instructions.js";

describe("agent instructions", () => {
  const instructions = {
    orchestrator: orchestratorInstructions,
    installer: installerInstructions,
    diagnostic: diagnosticInstructions,
    scaffolder: scaffolderInstructions,
    coder: coderInstructions,
    refactor: refactorInstructions,
    release: releaseInstructions,
    healer: healerInstructions,
    data: dataInstructions,
  };

  for (const [name, instruction] of Object.entries(instructions)) {
    describe(name, () => {
      it("should be a non-empty string", () => {
        expect(typeof instruction).toBe("string");
        expect(instruction.length).toBeGreaterThan(0);
      });

      it("should contain role/responsibilities section", () => {
        expect(instruction.toLowerCase()).toMatch(/role|responsibilities/);
      });

      it("should not have leading/trailing whitespace", () => {
        expect(instruction).toBe(instruction.trim());
      });
    });
  }

  describe("orchestrator", () => {
    it("should list all available agents", () => {
      expect(orchestratorInstructions).toContain("installer");
      expect(orchestratorInstructions).toContain("diagnostic");
      expect(orchestratorInstructions).toContain("scaffolder");
      expect(orchestratorInstructions).toContain("coder");
      expect(orchestratorInstructions).toContain("refactor");
      expect(orchestratorInstructions).toContain("release");
      expect(orchestratorInstructions).toContain("healer");
      expect(orchestratorInstructions).toContain("data");
    });

    it("should include routing rules", () => {
      expect(orchestratorInstructions).toContain("Routing Rules");
    });
  });

  describe("healer", () => {
    it("should mention retry limits", () => {
      expect(healerInstructions).toMatch(/3|three/i);
      expect(healerInstructions).toContain("retry");
    });

    it("should mention escalation", () => {
      expect(healerInstructions.toLowerCase()).toContain("escalate");
    });
  });
});
