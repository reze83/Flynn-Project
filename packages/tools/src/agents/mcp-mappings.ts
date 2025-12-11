/**
 * MCP Tool Mappings - Centralized mapping of agents to MCP tools
 *
 * This module consolidates all MCP tool recommendations for agents.
 * It combines category-based and direct tool mappings into a single source of truth.
 *
 * @module mcp-mappings
 */

import type { McpToolCategory } from "../mcp-registry.js";

/**
 * Agent to MCP Tool Category Mapping
 * Maps agent IDs to relevant external MCP tool categories
 */
export const AGENT_MCP_CATEGORIES: Record<string, McpToolCategory[]> = {
  // Core agents
  coder: ["code-analysis", "code-editing", "documentation", "serena-meta", "codex-integration"],
  diagnostic: ["code-analysis", "search", "thinking", "serena-meta", "flynn-meta"],
  scaffolder: ["file-ops", "git", "github-repo"],
  installer: ["shell", "documentation"],
  refactor: ["code-analysis", "code-editing", "thinking"],
  release: ["git", "github-pr", "github-repo"],
  healer: ["search", "thinking", "flynn-meta"],

  // Specialized agents
  data: ["research", "search", "thinking", "file-ops"],
  security: ["code-analysis", "search", "research"],
  reviewer: ["code-analysis", "code-editing", "thinking", "git"],
  performance: ["code-analysis", "thinking", "flynn-meta"],
  "qa-tester": ["puppeteer", "search"],

  // Architecture agents
  "system-architect": [
    "documentation",
    "research",
    "thinking",
    "flynn-orchestration",
    "codex-integration",
  ],
  "database-architect": ["documentation", "research", "thinking"],
  "frontend-architect": ["documentation", "search", "code-analysis"],
  "api-designer": ["documentation", "search", "thinking", "codex-integration"],

  // Operations agents
  "devops-engineer": ["documentation", "search", "docker", "shell"],
  "terraform-expert": ["documentation", "search", "shell"],
  "kubernetes-operator": ["documentation", "search", "docker"],
  "incident-responder": ["search", "research", "thinking", "docker"],
  "github-manager": ["github-repo", "github-issues", "github-pr", "git"],
  "research-specialist": ["research", "search", "documentation", "thinking"],

  // Domain agents
  "migration-specialist": ["documentation", "search", "thinking", "code-analysis"],
  "test-architect": ["documentation", "code-analysis", "thinking"],
  "documentation-architect": ["documentation", "search", "research", "file-ops"],
  "ml-engineer": ["documentation", "research", "search", "thinking"],
  "data-engineer": ["documentation", "research", "thinking", "file-ops"],
  "mobile-developer": ["documentation", "code-analysis"],
  "blockchain-developer": ["documentation", "code-analysis", "search"],

  // Codex Integration
  orchestrator: ["codex-integration", "memory", "flynn-meta", "file-ops"],
};

/**
 * Direct MCP Tool Mappings
 * Maps agent IDs to specific MCP tool IDs
 * This provides fine-grained control over tool recommendations
 */
export const AGENT_MCP_TOOL_MAPPINGS: Record<string, string[]> = {
  // Core Agents
  coder: [
    // File Operations
    "mcp__flynn__file-ops",
    "mcp__serena__read_file",
    "mcp__serena__create_text_file",
    "mcp__serena__list_dir",
    "mcp__serena__find_file",
    // Code Analysis
    "mcp__serena__get_symbols_overview",
    "mcp__serena__find_symbol",
    "mcp__serena__find_referencing_symbols",
    "mcp__serena__replace_symbol_body",
    "mcp__serena__insert_after_symbol",
    "mcp__serena__insert_before_symbol",
    // Documentation
    "mcp__context7__get-library-docs",
    "mcp__exa__get_code_context_exa",
    // Shell
    "mcp__flynn__shell",
    "mcp__serena__execute_shell_command",
  ],

  diagnostic: [
    // Project Analysis
    "mcp__flynn__analyze-project",
    "mcp__serena__get_symbols_overview",
    "mcp__serena__find_symbol",
    "mcp__serena__search_for_pattern",
    // Search & Research
    "mcp__exa__web_search_exa",
    "mcp__exa__deep_search_exa",
    // Thinking
    "mcp__sequentialthinking-tools__sequentialthinking_tools",
    "mcp__serena__think_about_collected_information",
    "mcp__serena__think_about_task_adherence",
    // System Info
    "mcp__flynn__system-info",
  ],

  scaffolder: [
    // File Operations
    "mcp__flynn__file-ops",
    "mcp__serena__create_text_file",
    "mcp__serena__list_dir",
    // Git Operations
    "mcp__flynn__git-ops",
    "mcp__git__git_init",
    "mcp__git__git_add",
    "mcp__git__git_commit",
    // GitHub
    "mcp__github__create_repository",
    "mcp__github__create_branch",
  ],

  installer: [
    // Shell
    "mcp__flynn__shell",
    "mcp__serena__execute_shell_command",
    // System Info
    "mcp__flynn__system-info",
    // Documentation
    "mcp__context7__get-library-docs",
  ],

  refactor: [
    // Code Analysis
    "mcp__serena__get_symbols_overview",
    "mcp__serena__find_symbol",
    "mcp__serena__find_referencing_symbols",
    "mcp__serena__replace_symbol_body",
    "mcp__serena__rename_symbol",
    // Thinking
    "mcp__sequentialthinking-tools__sequentialthinking_tools",
    // Documentation
    "mcp__context7__get-library-docs",
    "mcp__exa__get_code_context_exa",
    // File Operations
    "mcp__flynn__file-ops",
  ],

  release: [
    // Git Operations
    "mcp__flynn__git-ops",
    "mcp__git__git_status",
    "mcp__git__git_log",
    "mcp__git__git_tag",
    "mcp__git__git_commit",
    "mcp__git__git_push",
    // GitHub PR
    "mcp__github__create_pull_request",
    "mcp__github__create_branch",
    // File Ops
    "mcp__flynn__file-ops",
  ],

  healer: [
    // Error Analysis
    "mcp__flynn__heal-error",
    // Search
    "mcp__exa__web_search_exa",
    // Thinking
    "mcp__sequentialthinking-tools__sequentialthinking_tools",
    // File Ops
    "mcp__flynn__file-ops",
    "mcp__serena__read_file",
  ],

  // Specialized Agents
  data: [
    // Research
    "mcp__exa__web_search_exa",
    "mcp__exa__deep_researcher_start",
    "mcp__exa__deep_researcher_check",
    // Thinking
    "mcp__sequentialthinking-tools__sequentialthinking_tools",
    // File Ops
    "mcp__flynn__file-ops",
    "mcp__serena__read_file",
  ],

  security: [
    // Code Analysis
    "mcp__serena__search_for_pattern",
    "mcp__serena__find_symbol",
    "mcp__serena__get_symbols_overview",
    // Research
    "mcp__exa__web_search_exa",
    "mcp__exa__deep_search_exa",
    // Documentation
    "mcp__context7__get-library-docs",
    // File Operations
    "mcp__flynn__file-ops",
  ],

  reviewer: [
    // Code Analysis
    "mcp__serena__get_symbols_overview",
    "mcp__serena__find_symbol",
    "mcp__serena__find_referencing_symbols",
    "mcp__serena__replace_symbol_body",
    // Git
    "mcp__flynn__git-ops",
    "mcp__git__git_diff",
    "mcp__git__git_status",
    // Thinking
    "mcp__sequentialthinking-tools__sequentialthinking_tools",
    // Documentation
    "mcp__context7__get-library-docs",
  ],

  performance: [
    // Code Analysis
    "mcp__serena__get_symbols_overview",
    "mcp__serena__find_symbol",
    "mcp__serena__search_for_pattern",
    // Thinking
    "mcp__sequentialthinking-tools__sequentialthinking_tools",
    // Flynn Meta
    "mcp__flynn__analyze-project",
    // Documentation
    "mcp__context7__get-library-docs",
    "mcp__exa__get_code_context_exa",
  ],

  "qa-tester": [
    // Puppeteer
    "mcp__puppeteer__puppeteer_navigate",
    "mcp__puppeteer__puppeteer_screenshot",
    "mcp__puppeteer__puppeteer_click",
    "mcp__puppeteer__puppeteer_fill",
    "mcp__puppeteer__puppeteer_select",
    "mcp__puppeteer__puppeteer_hover",
    "mcp__puppeteer__puppeteer_evaluate",
  ],

  // Architecture Agents
  "system-architect": [
    // Documentation
    "mcp__context7__get-library-docs",
    "mcp__exa__get_code_context_exa",
    // Research
    "mcp__exa__web_search_exa",
    "mcp__exa__deep_researcher_start",
    // Thinking
    "mcp__sequentialthinking-tools__sequentialthinking_tools",
    // Orchestration
    "mcp__flynn__orchestrate",
    "mcp__flynn__list-workflows",
    // Codex
    "mcp__flynn__codex-delegate",
  ],

  "database-architect": [
    // Documentation
    "mcp__context7__get-library-docs",
    // Research
    "mcp__exa__web_search_exa",
    "mcp__exa__deep_search_exa",
    // Thinking
    "mcp__sequentialthinking-tools__sequentialthinking_tools",
    // File Operations
    "mcp__flynn__file-ops",
  ],

  "frontend-architect": [
    // Documentation
    "mcp__context7__get-library-docs",
    "mcp__exa__get_code_context_exa",
    // Code Analysis
    "mcp__serena__get_symbols_overview",
    "mcp__serena__find_symbol",
    // Search
    "mcp__exa__web_search_exa",
    // File Operations
    "mcp__flynn__file-ops",
  ],

  "api-designer": [
    // Documentation
    "mcp__context7__get-library-docs",
    "mcp__exa__get_code_context_exa",
    // Search
    "mcp__exa__web_search_exa",
    // Thinking
    "mcp__sequentialthinking-tools__sequentialthinking_tools",
    // Codex
    "mcp__flynn__codex-delegate",
  ],

  // Operations Agents
  "devops-engineer": [
    // Documentation
    "mcp__context7__get-library-docs",
    // Docker
    "mcp__docker__docker_container_list",
    "mcp__docker__docker_container_inspect",
    "mcp__docker__docker_system_info",
    // Shell
    "mcp__flynn__shell",
    // Search
    "mcp__exa__web_search_exa",
  ],

  "terraform-expert": [
    // Documentation
    "mcp__context7__get-library-docs",
    // Shell
    "mcp__flynn__shell",
    // Search
    "mcp__exa__web_search_exa",
  ],

  "kubernetes-operator": [
    // Documentation
    "mcp__context7__get-library-docs",
    // Docker
    "mcp__docker__docker_container_list",
    "mcp__docker__docker_system_info",
    // Shell
    "mcp__flynn__shell",
    // Search
    "mcp__exa__web_search_exa",
  ],

  "incident-responder": [
    // Search & Research
    "mcp__exa__web_search_exa",
    "mcp__exa__deep_search_exa",
    // Thinking
    "mcp__sequentialthinking-tools__sequentialthinking_tools",
    // Docker
    "mcp__docker__docker_container_logs",
    "mcp__docker__docker_container_inspect",
    // Flynn Meta
    "mcp__flynn__heal-error",
    "mcp__flynn__system-info",
  ],

  "github-manager": [
    // GitHub Repos
    "mcp__github__create_repository",
    "mcp__github__fork_repository",
    "mcp__github__get_file_contents",
    "mcp__github__create_branch",
    // GitHub Issues
    "mcp__github__create_issue",
    "mcp__github__list_issues",
    "mcp__github__update_issue",
    "mcp__github__add_issue_comment",
    // GitHub PRs
    "mcp__github__create_pull_request",
    "mcp__github__list_pull_requests",
    "mcp__github__merge_pull_request",
    "mcp__github__create_pull_request_review",
    // Git
    "mcp__flynn__git-ops",
  ],

  "research-specialist": [
    // Research
    "mcp__exa__web_search_exa",
    "mcp__exa__deep_researcher_start",
    "mcp__exa__deep_researcher_check",
    "mcp__exa__crawling_exa",
    // Documentation
    "mcp__context7__get-library-docs",
    // Thinking
    "mcp__sequentialthinking-tools__sequentialthinking_tools",
    // File Operations
    "mcp__flynn__file-ops",
  ],

  // Domain Agents
  "migration-specialist": [
    // Documentation
    "mcp__context7__get-library-docs",
    "mcp__exa__get_code_context_exa",
    // Code Analysis
    "mcp__serena__get_symbols_overview",
    "mcp__serena__find_symbol",
    "mcp__serena__find_referencing_symbols",
    // Search
    "mcp__exa__web_search_exa",
    // Thinking
    "mcp__sequentialthinking-tools__sequentialthinking_tools",
    // File Operations
    "mcp__flynn__file-ops",
  ],

  "test-architect": [
    // Documentation
    "mcp__context7__get-library-docs",
    // Code Analysis
    "mcp__serena__get_symbols_overview",
    "mcp__serena__find_symbol",
    // Thinking
    "mcp__sequentialthinking-tools__sequentialthinking_tools",
    // File Operations
    "mcp__flynn__file-ops",
  ],

  "documentation-architect": [
    // Documentation
    "mcp__context7__get-library-docs",
    "mcp__exa__get_code_context_exa",
    // Research
    "mcp__exa__web_search_exa",
    "mcp__exa__deep_researcher_start",
    // File Ops
    "mcp__flynn__file-ops",
    "mcp__serena__create_text_file",
  ],

  "ml-engineer": [
    // Documentation
    "mcp__context7__get-library-docs",
    "mcp__exa__get_code_context_exa",
    // Research
    "mcp__exa__web_search_exa",
    "mcp__exa__deep_researcher_start",
    // Thinking
    "mcp__sequentialthinking-tools__sequentialthinking_tools",
    // File Operations
    "mcp__flynn__file-ops",
  ],

  "data-engineer": [
    // Documentation
    "mcp__context7__get-library-docs",
    // Research
    "mcp__exa__web_search_exa",
    // Thinking
    "mcp__sequentialthinking-tools__sequentialthinking_tools",
    // File Ops
    "mcp__flynn__file-ops",
    "mcp__serena__read_file",
  ],

  "mobile-developer": [
    // Documentation
    "mcp__context7__get-library-docs",
    "mcp__exa__get_code_context_exa",
    // Code Analysis
    "mcp__serena__get_symbols_overview",
    "mcp__serena__find_symbol",
    // File Operations
    "mcp__flynn__file-ops",
  ],

  "blockchain-developer": [
    // Documentation
    "mcp__context7__get-library-docs",
    "mcp__exa__get_code_context_exa",
    // Code Analysis
    "mcp__serena__get_symbols_overview",
    "mcp__serena__find_symbol",
    // Search
    "mcp__exa__web_search_exa",
    // File Operations
    "mcp__flynn__file-ops",
  ],

  // Codex Integration
  orchestrator: [
    // Codex Delegation
    "mcp__flynn__codex-delegate",
    "mcp__flynn__codex-md-generator",
    // Memory
    "mcp__mem0__add_memory",
    "mcp__mem0__get_memories",
    "mcp__mem0__search_memories",
    // Error Handling
    "mcp__flynn__heal-error",
    // File Ops
    "mcp__flynn__file-ops",
    "mcp__serena__read_file",
    // Project Analysis
    "mcp__flynn__analyze-project",
  ],
};

/**
 * Get recommended MCP tools for an agent
 * Returns a deduplicated list of MCP tool IDs
 *
 * @deprecated Use AgentFactory.createAgentStep() which automatically maps tools via tool-mapper.ts
 * This function is kept for backwards compatibility
 *
 * @param agentId - The agent identifier
 * @returns Array of MCP tool IDs
 */
export function getRecommendedMcpTools(agentId: string): string[] {
  const tools = AGENT_MCP_TOOL_MAPPINGS[agentId] || [];
  // Deduplicate and return
  return [...new Set(tools)];
}

/**
 * Get MCP categories for an agent
 * Useful for dynamic tool discovery from the MCP registry
 *
 * @param agentId - The agent identifier
 * @returns Array of MCP tool categories
 */
export function getAgentMcpCategories(agentId: string): McpToolCategory[] {
  return AGENT_MCP_CATEGORIES[agentId] || [];
}

/**
 * Check if an agent has MCP tool recommendations
 *
 * @param agentId - The agent identifier
 * @returns True if the agent has MCP tool recommendations
 */
export function hasRecommendedMcpTools(agentId: string): boolean {
  return (AGENT_MCP_TOOL_MAPPINGS[agentId]?.length || 0) > 0;
}

/**
 * Get all agent IDs that have MCP tool recommendations
 *
 * @returns Array of agent IDs
 */
export function getAgentsWithMcpTools(): string[] {
  return Object.keys(AGENT_MCP_TOOL_MAPPINGS);
}
