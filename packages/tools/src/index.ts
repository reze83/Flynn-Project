/**
 * @flynn/tools - Mastra tools for Flynn agents
 *
 * This module exports all Flynn tools organized by category:
 * - Core Tools: Basic file, git, shell, and system operations
 * - Expert System: Agent routing, orchestration, and workflows
 * - Skills System: Progressive disclosure for token optimization
 * - Hooks System: Claude Code automation
 * - Codex Integration: OpenAI Codex delegation
 * - Caching & Performance: Caching and profiling utilities
 * - Analytics & Monitoring: Usage tracking and health checks
 * - Handoff Protocol: Multi-agent context handoff
 * - Anthropic Wrappers: Policy-enforced Anthropic tools
 */

// ============================================================================
// Core Tools
// ============================================================================

export { analyzeProjectTool } from "./project-analysis.js";
export { systemInfoTool } from "./system-info.js";
export { gitOpsTool } from "./git-ops.js";
export { fileOpsTool } from "./file-ops.js";
export { shellTool } from "./shell.js";
export { recordToolMetric, getMetrics, resetMetrics } from "./metrics.js";

// ============================================================================
// Expert System Tools
// ============================================================================

export { taskRouterTool } from "./task-router.js";
export { getAgentContextTool } from "./get-agent-context.js";
export { orchestrateTool } from "./orchestrate.js";
export { listWorkflowsTool, WORKFLOW_DEFINITIONS } from "./list-workflows.js";
export { healErrorTool } from "./heal-error.js";

// Agent contexts and types
export {
  AGENT_CONTEXTS,
  getAgentContext,
  getAgentIds,
  type AgentContext,
} from "./agent-contexts.js";

// Refactoring loop
export {
  validateDocumentation,
  createContext7Source,
  createExaSource,
  getRefactoringLoopWorkflow,
  formatRefactoringSuggestion,
  type RefactoringSuggestion,
  type DocumentationSource,
  type DocumentationVerificationResult,
  type RefactoringLoopState,
} from "./refactoring-loop.js";

// ============================================================================
// Skills System - Progressive Disclosure for Token Optimization
// ============================================================================

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

// ============================================================================
// Hooks System - Claude Code Automation
// ============================================================================

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

// ============================================================================
// Codex Integration
// ============================================================================

// Main Codex tool and types
export {
  codexDelegateTool,
  type OnChunkCallback,
  type OnProgressCallback,
  type ProgressInfo,
  type StreamingConfig,
  type ParsedCodexEvent,
} from "./codex-delegate.js";

export { codexMdGeneratorTool } from "./codex-md-generator.js";

// Task chunking for complex task decomposition
export {
  analyzeTaskComplexity,
  chunkTask,
  estimateTaskDuration,
  identifySubtasks,
  needsChunking,
  chunkTaskInputSchema,
  chunkTaskOutputSchema,
  type ComplexityLevel,
  type ComplexityAnalysis,
  type TaskChunk,
  type ChunkingResult,
  type ChunkerConfig,
} from "./task-chunker.js";

// ============================================================================
// Caching & Performance
// ============================================================================

export {
  SimpleCache,
  agentContextCache,
  skillCache,
  projectAnalysisCache,
  workflowCache,
  mcpToolCache,
  clearAllCaches,
  getAllCacheStats,
  cleanupAllCaches,
  generateCacheKey,
  type CacheStats,
} from "./cache.js";

export { performanceProfilerTool } from "./performance-profiler.js";

// ============================================================================
// Analytics & Monitoring
// ============================================================================

export { analyticsTool } from "./analytics.js";
export { healthCheckTool } from "./health-check.js";

// MCP Registry - Dynamic external MCP tool discovery
export {
  listMcpToolsTool,
  mcpRegistry,
  initializeMcpRegistry,
  type McpTool,
  type McpServer,
  type McpToolCategory,
} from "./mcp-registry.js";

// ============================================================================
// Handoff Protocol
// ============================================================================

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

// ============================================================================
// Anthropic Tool Wrappers with Flynn Policy Enforcement
// ============================================================================

export { flynnBashTool, createFlynnBashTool } from "./anthropic-bash-wrapper.js";
export { flynnTextEditorTools, createFlynnTextEditorTools } from "./anthropic-editor-wrapper.js";

// ============================================================================
// Shared Constants
// ============================================================================

export {
  TIMEOUTS,
  CACHE_DEFAULTS,
  MODEL_PRICING,
  ANALYTICS_DEFAULTS,
  ORCHESTRATION,
  FILE_LIMITS,
  HEALTH_THRESHOLDS,
  AGENT_DEFAULTS,
  SKILL_DEFAULTS,
  LOGGING,
  VERSION,
} from "./constants.js";
