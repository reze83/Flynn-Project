/**
 * Agent Factory - Centralized agent step creation and validation
 *
 * This module provides functions for creating agent steps with
 * consistent hydration logic. It consolidates previously scattered logic
 * from orchestrate.ts, index.ts, and mcp-mappings.ts.
 *
 * Benefits:
 * - Single responsibility: Agent creation logic in one place
 * - Testability: Easy to unit test factory functions
 * - Consistency: All agents created through same pipeline
 * - Validation: Runtime checks for agent context integrity
 *
 * Refactored from class-based pattern to module functions per:
 * - TypeScript Handbook best practices
 * - Biome noStaticOnlyClass rule (biomejs.dev/linter/rules/no-static-only-class)
 */

import { createLogger } from "@flynn/core";
import { mapToolsToMcp, validateToolMappings } from "./tool-mapper.js";
import type { AgentContext } from "./types.js";

const logger = createLogger("agent-factory");

/**
 * Agent step structure returned by orchestrate tool
 */
export interface AgentStep {
  id: string;
  role: string;
  subtask: string;
  instructions: string;
  tools: string[];
  workflow: string[];
  constraints: string[];
  recommendedMcpTools?: string[];
}

/**
 * Options for customizing agent step creation
 */
export interface AgentStepOptions {
  /**
   * Override the default step index
   */
  stepIndex?: number;
  /**
   * Additional constraints to inject
   */
  additionalConstraints?: string[];
  /**
   * Override the subtask description
   */
  customSubtask?: string;
}

/**
 * Validation result for agent context
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Global constraints that apply to specific agent types
 * These are injected based on agent role
 */
const DOCUMENTATION_REQUIREMENT = `

## WICHTIG: Dokumentations-Pflicht bei Vorschlägen
Bei JEDEM Optimierungs- oder Verbesserungsvorschlag:
1. **Zuerst** offizielle Dokumentation der betroffenen Technologie abrufen
2. Verwende Context7 (mcp__context7__get-library-docs) oder Exa (mcp__exa__get_code_context_exa)
3. Dokumentations-Link und Version im Vorschlag angeben
4. **Keine Empfehlungen ohne aktuelle, offizielle Quellen**
`;

/**
 * Agents that make optimization/improvement suggestions
 * These agents get the documentation requirement injected
 */
const OPTIMIZATION_AGENTS = ["refactor", "performance", "reviewer", "security", "coder"];

/**
 * Injects global constraints based on agent role
 *
 * @param context - The agent context
 * @returns Agent context with injected constraints
 */
function injectGlobalConstraints(context: AgentContext): AgentContext {
  // Inject documentation requirement for optimization agents
  if (OPTIMIZATION_AGENTS.includes(context.id)) {
    return {
      ...context,
      instructions: context.instructions + DOCUMENTATION_REQUIREMENT,
      constraints: [
        ...context.constraints,
        "Keine Optimierungsvorschläge ohne Dokumentations-Referenz",
      ],
    };
  }

  return context;
}

/**
 * Creates an agent step from an agent context
 *
 * @param context - The agent context definition
 * @param stepIndex - The step index in the workflow (1-based)
 * @param options - Optional customization options
 * @returns A fully hydrated agent step
 */
export function createAgentStep(
  context: AgentContext,
  stepIndex: number,
  options: AgentStepOptions = {},
): AgentStep {
  const { additionalConstraints = [], customSubtask } = options;

  // Apply global constraints based on agent role
  const enhancedContext = injectGlobalConstraints(context);

  // Map abstract tools to concrete MCP tools
  const mcpTools = mapToolsToMcp(enhancedContext.tools);

  // Build the agent step
  return {
    id: `${context.id}-${stepIndex}`,
    role: context.id,
    subtask: customSubtask || `Step ${stepIndex}: ${context.description}`,
    instructions: enhancedContext.instructions,
    tools: enhancedContext.tools,
    workflow: enhancedContext.workflow,
    constraints: [...enhancedContext.constraints, ...additionalConstraints],
    recommendedMcpTools: mcpTools,
  };
}

/**
 * Creates multiple agent steps from an array of agent IDs
 *
 * @param agentIds - Array of agent role IDs
 * @param agentContexts - Registry of agent contexts
 * @returns Array of agent steps
 */
export function createAgentSteps(
  agentIds: string[],
  agentContexts: Record<string, AgentContext>,
): AgentStep[] {
  return agentIds.map((agentId, idx) => {
    const context = agentContexts[agentId];
    if (!context) {
      // Fallback to coder if agent not found
      const coderContext = agentContexts.coder;
      if (!coderContext) {
        throw new Error("Critical: Coder agent context is missing");
      }
      logger.warn({ agentId }, "Agent not found, falling back to coder");
      return createAgentStep(coderContext, idx + 1);
    }
    return createAgentStep(context, idx + 1);
  });
}

/**
 * Validates an agent context for correctness
 *
 * @param context - The agent context to validate
 * @returns Validation result with errors and warnings
 */
export function validateAgentContext(context: AgentContext): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!context.id) errors.push("Agent context missing required field: id");
  if (!context.name) errors.push("Agent context missing required field: name");
  if (!context.description) errors.push("Agent context missing required field: description");
  if (!context.instructions) errors.push("Agent context missing required field: instructions");

  // Tools validation
  if (!context.tools || context.tools.length === 0) {
    warnings.push(`Agent '${context.id}' has no tools defined`);
  } else {
    const toolValidation = validateToolMappings(context.tools);
    if (!toolValidation.valid) {
      errors.push(
        `Agent '${context.id}' has unmapped tools: ${toolValidation.unmappedTools.join(", ")}`,
      );
    }
  }

  // Workflow validation
  if (!context.workflow || context.workflow.length === 0) {
    warnings.push(`Agent '${context.id}' has no workflow steps defined`);
  }

  // Constraints validation
  if (!context.constraints || context.constraints.length === 0) {
    warnings.push(`Agent '${context.id}' has no constraints defined`);
  }

  // Token estimates
  if (context.tier1TokenEstimate <= 0) {
    warnings.push(`Agent '${context.id}' has invalid tier1TokenEstimate`);
  }
  if (context.tier2TokenEstimate <= 0) {
    warnings.push(`Agent '${context.id}' has invalid tier2TokenEstimate`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates all agent contexts in a registry
 *
 * @param agentContexts - Registry of agent contexts
 * @returns Overall validation result
 */
export function validateAgentRegistry(
  agentContexts: Record<string, AgentContext>,
): ValidationResult {
  const allErrors: string[] = [];
  const allWarnings: string[] = [];

  for (const [id, context] of Object.entries(agentContexts)) {
    const result = validateAgentContext(context);
    allErrors.push(...result.errors);
    allWarnings.push(...result.warnings);

    // Check for ID mismatch
    if (context.id !== id) {
      allErrors.push(`Agent registry key '${id}' does not match context.id '${context.id}'`);
    }
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
  };
}

/**
 * @deprecated Use individual exported functions instead.
 * This namespace provides backward compatibility during migration.
 */
export const AgentFactory = {
  createAgentStep,
  createAgentSteps,
  validateAgentContext,
  validateAgentRegistry,
};
