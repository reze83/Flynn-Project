/**
 * @flynn/tools - Mastra tools for Flynn agents
 */

export { analyzeProjectTool } from "./project-analysis.js";
export { systemInfoTool } from "./system-info.js";
export { taskRouterTool } from "./task-router.js";
export { gitOpsTool } from "./git-ops.js";
export { fileOpsTool } from "./file-ops.js";
export { shellTool } from "./shell.js";
export { recordToolMetric, getMetrics, resetMetrics } from "./metrics.js";

// NEW exports - Expert System Tools
export { getAgentContextTool } from "./get-agent-context.js";
export { orchestrateTool } from "./orchestrate.js";
export { listWorkflowsTool, WORKFLOW_DEFINITIONS } from "./list-workflows.js";
export { healErrorTool } from "./heal-error.js";
export {
  AGENT_CONTEXTS,
  getAgentContext,
  getAgentIds,
  type AgentContext,
} from "./agent-contexts.js";

// Anthropic tool wrappers with Flynn policy enforcement
export { flynnBashTool, createFlynnBashTool } from "./anthropic-bash-wrapper.js";
export { flynnTextEditorTools, createFlynnTextEditorTools } from "./anthropic-editor-wrapper.js";

// Skills System - Progressive Disclosure for Token Optimization
export {
  getSkillTool,
  listSkillsTool,
  SKILL_REGISTRY,
  loadSkill,
  loadSkills,
  listAllSkills,
  autoLoadSkillForTask,
  calculateTokenSavings,
  type Skill,
  type SkillMetadata,
  type SkillCategory,
  type LoadTier,
  type LoadedSkill,
} from "./skills/index.js";

// Hooks System - Claude Code Automation
export {
  generateHooksTool,
  HOOK_TEMPLATES,
  getAllTemplates,
  getTemplate,
  mergeHookConfigs,
  type HookEvent,
  type HookTemplate,
  type HooksSettings,
} from "./hooks/index.js";

// Health Check Tool
export { healthCheckTool } from "./health-check.js";

// Analytics Tool - Usage Tracking
export { analyticsTool } from "./analytics.js";

// MCP Registry - Dynamic external MCP tool discovery
export {
  listMcpToolsTool,
  mcpRegistry,
  initializeMcpRegistry,
  type McpTool,
  type McpServer,
  type McpToolCategory,
} from "./mcp-registry.js";

// Codex Integration
export { codexDelegateTool } from "./codex-delegate.js";
export { codexMdGeneratorTool } from "./codex-md-generator.js";

// Performance profiling tool - allows measurement of function execution time
export { performanceProfilerTool } from "./performance-profiler.js";
export {
  HandoffFileSchema,
  createHandoffFile,
  addTask,
  updateTask,
  addDecision,
  addSharedNote,
  updateSessionStatus,
  parseHandoffFile,
  serializeHandoffFile,
  HANDOFF_VERSION,
  type HandoffFile,
  type HandoffTask,
  type HandoffSession,
  type HandoffMetadata,
  type HandoffMemory,
} from "./handoff-protocol.js";
