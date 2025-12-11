import { describe, expect, it } from "vitest";
import { type AgentStep, runWorkflow } from "../src/workflow-runner";

// Helper to build simple agent steps for testing
function makeSteps(ids: string[]): AgentStep[] {
  return ids.map((id, idx) => ({
    id,
    role: id,
    subtask: `task ${idx + 1}`,
    instructions: `do ${id}`,
    tools: [],
    workflow: [],
    constraints: [],
  }));
}

describe("runWorkflow", () => {
  it("executes steps sequentially in order", async () => {
    const steps = makeSteps(["a", "b", "c"]);
    const result = await runWorkflow(steps, "sequential", 2, async (step) => step.id);
    expect(result).toEqual(["a", "b", "c"]);
  });

  it("executes steps in parallel and preserves order of results", async () => {
    const steps = makeSteps(["x", "y", "z"]);
    const result = await runWorkflow(steps, "parallel", 2, async (step) => {
      // simulate variable async delays
      if (step.id === "x") await new Promise((res) => setTimeout(res, 50));
      if (step.id === "y") await new Promise((res) => setTimeout(res, 10));
      if (step.id === "z") await new Promise((res) => setTimeout(res, 5));
      return step.id;
    });
    // Even though tasks complete out of order, the result array preserves input order
    expect(result).toEqual(["x", "y", "z"]);
  });
});
