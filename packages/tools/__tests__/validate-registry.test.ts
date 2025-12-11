/**
 * Debugging test to see which agents have validation issues
 */

import { describe, it } from "vitest";
import { AgentFactory } from "../src/agents/agent-factory.js";
import { AGENT_CONTEXTS } from "../src/agents/index.js";

describe("Debug Agent Registry", () => {
  it("should list validation errors for each agent", () => {
    const result = AgentFactory.validateAgentRegistry(AGENT_CONTEXTS);

    console.log("\n=== Agent Registry Validation ===");
    console.log(`Valid: ${result.valid}`);
    console.log(`\nErrors (${result.errors.length}):`);
    for (const error of result.errors) {
      console.log(`  - ${error}`);
    }
    console.log(`\nWarnings (${result.warnings.length}):`);
    for (const warning of result.warnings) {
      console.log(`  - ${warning}`);
    }
  });
});
