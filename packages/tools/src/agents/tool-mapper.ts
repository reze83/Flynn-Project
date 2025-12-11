/**
 * Tool Mapper - Maps abstract tool names to concrete MCP tool IDs
 *
 * This module provides a single source of truth for mapping abstract tool
 * categories (e.g., "file-ops", "git-ops") to concrete MCP tool implementations.
 *
 * Benefits:
 * - DRY: Eliminates manual recommendedMcpTools maintenance in agent definitions
 * - Consistency: Ensures all agents use the same tool mappings
 * - Maintainability: Adding new MCP tools only requires updating this file
 */

/**
 * Maps abstract tool categories to concrete MCP tool IDs
 * Abstract tools are used in AgentContext.tools for high-level categorization
 * Concrete MCP tools are the actual callable tools available to agents
 */
export const TOOL_TO_MCP_MAPPING: Record<string, string[]> = {
  // File Operations
  "file-ops": [
    "mcp__flynn__file-ops",
    "mcp__serena__read_file",
    "mcp__serena__create_text_file",
    "mcp__serena__list_dir",
    "mcp__serena__find_file",
    "mcp__serena__replace_content",
  ],

  // Git Operations
  "git-ops": [
    "mcp__flynn__git-ops",
    "mcp__git__git_status",
    "mcp__git__git_diff",
    "mcp__git__git_log",
    "mcp__git__git_add",
    "mcp__git__git_commit",
    "mcp__git__git_push",
    "mcp__git__git_pull",
    "mcp__git__git_branch",
  ],

  // Project Analysis
  "project-analysis": [
    "mcp__flynn__analyze-project",
    "mcp__serena__get_symbols_overview",
    "mcp__serena__find_symbol",
    "mcp__serena__find_referencing_symbols",
    "mcp__serena__search_for_pattern",
  ],

  // Code Analysis (semantic)
  "code-analysis": [
    "mcp__serena__get_symbols_overview",
    "mcp__serena__find_symbol",
    "mcp__serena__find_referencing_symbols",
    "mcp__serena__replace_symbol_body",
    "mcp__serena__insert_after_symbol",
    "mcp__serena__insert_before_symbol",
    "mcp__serena__rename_symbol",
  ],

  // Shell Operations
  shell: ["mcp__flynn__shell", "mcp__serena__execute_shell_command"],

  // System Information
  "system-info": ["mcp__flynn__system-info"],

  // Documentation & Research
  documentation: [
    "mcp__context7__resolve-library-id",
    "mcp__context7__get-library-docs",
    "mcp__exa__web_search_exa",
    "mcp__exa__deep_search_exa",
    "mcp__exa__get_code_context_exa",
  ],

  // Thinking & Planning
  thinking: [
    "mcp__sequentialthinking-tools__sequentialthinking_tools",
    "mcp__serena__think_about_collected_information",
    "mcp__serena__think_about_task_adherence",
    "mcp__serena__think_about_whether_you_are_done",
  ],

  // Memory Management
  memory: [
    "mcp__mem0__add_memory",
    "mcp__mem0__search_memories",
    "mcp__mem0__get_memories",
    "mcp__mem0__update_memory",
    "mcp__mem0__delete_memory",
  ],

  // Docker Operations
  docker: [
    "mcp__docker__docker_container_list",
    "mcp__docker__docker_container_inspect",
    "mcp__docker__docker_container_start",
    "mcp__docker__docker_container_stop",
    "mcp__docker__docker_container_logs",
  ],

  // GitHub Operations
  github: [
    "mcp__github__create_issue",
    "mcp__github__create_pull_request",
    "mcp__github__get_file_contents",
    "mcp__github__list_issues",
    "mcp__github__search_code",
    "mcp__github__create_branch",
  ],

  // Browser Automation
  browser: [
    "mcp__puppeteer__puppeteer_navigate",
    "mcp__puppeteer__puppeteer_screenshot",
    "mcp__puppeteer__puppeteer_click",
    "mcp__puppeteer__puppeteer_fill",
  ],

  // Research Operations
  research: [
    "mcp__exa__web_search_exa",
    "mcp__exa__deep_researcher_start",
    "mcp__exa__deep_researcher_check",
    "mcp__exa__crawling_exa",
    "mcp__context7__resolve-library-id",
    "mcp__context7__get-library-docs",
  ],

  // Codex Delegation
  "codex-delegate": ["mcp__flynn__codex-delegate", "mcp__flynn__codex-md-generator"],

  // Memory Management (Mem0)
  mem0: [
    "mcp__mem0__add_memory",
    "mcp__mem0__search_memories",
    "mcp__mem0__get_memories",
    "mcp__mem0__update_memory",
    "mcp__mem0__delete_memory",
    "mcp__mem0__delete_all_memories",
    "mcp__mem0__list_entities",
    "mcp__mem0__get_memory",
    "mcp__mem0__delete_entities",
  ],

  // Error Healing
  "heal-error": ["mcp__flynn__heal-error"],

  // Flynn Data Tools (Python)
  "flynn-data_load_csv": [],
  "flynn-data_describe": [],
  "flynn-data_filter": [],
  "flynn-data_aggregate": [],
  "flynn-data_correlate": [],

  // Flynn ML Tools (Python)
  "flynn-ml_sentiment": [],
  "flynn-ml_summarize": [],
  "flynn-ml_classify": [],
  "flynn-ml_embeddings": [],
};

/**
 * Maps abstract tool categories to concrete MCP tool IDs
 *
 * @param abstractTools - Array of abstract tool names (e.g., ["file-ops", "git-ops"])
 * @returns Array of concrete MCP tool IDs, deduplicated
 *
 * @example
 * ```typescript
 * const mcpTools = mapToolsToMcp(["file-ops", "shell"]);
 * // Returns: ["mcp__flynn__file-ops", "mcp__serena__read_file", ...]
 * ```
 */
export function mapToolsToMcp(abstractTools: string[]): string[] {
  const mcpTools = abstractTools.flatMap((tool) => TOOL_TO_MCP_MAPPING[tool] || []);
  // Deduplicate
  return [...new Set(mcpTools)];
}

/**
 * Validates that all abstract tools have MCP mappings
 *
 * @param abstractTools - Array of abstract tool names
 * @returns Object with validation result
 */
export function validateToolMappings(abstractTools: string[]): {
  valid: boolean;
  unmappedTools: string[];
} {
  const unmappedTools = abstractTools.filter((tool) => !TOOL_TO_MCP_MAPPING[tool]);
  return {
    valid: unmappedTools.length === 0,
    unmappedTools,
  };
}

/**
 * Gets all available abstract tool categories
 */
export function getAvailableToolCategories(): string[] {
  return Object.keys(TOOL_TO_MCP_MAPPING);
}
