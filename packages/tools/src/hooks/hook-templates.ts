/**
 * Hook Templates - Pre-defined Claude Code hook configurations
 *
 * Based on Claude Code hooks documentation:
 * - PreToolUse: Before tool execution (can block)
 * - PostToolUse: After tool execution
 * - Stop: When Claude finishes responding
 * - SessionStart: When session starts
 * - UserPromptSubmit: When user submits a prompt
 */

export type HookEvent =
  | "PreToolUse"
  | "PostToolUse"
  | "Stop"
  | "SessionStart"
  | "UserPromptSubmit"
  | "Notification";

export interface HookCommand {
  type: "command";
  command: string;
}

export interface HookConfig {
  matcher?: string;
  hooks: HookCommand[];
}

export interface HooksSettings {
  hooks: Partial<Record<HookEvent, HookConfig[]>>;
}

export interface HookTemplate {
  id: string;
  name: string;
  description: string;
  category: "formatting" | "security" | "testing" | "logging" | "workflow";
  events: HookEvent[];
  config: HooksSettings;
  customizable: {
    field: string;
    description: string;
    default: string;
  }[];
}

// =============================================================================
// HOOK TEMPLATES
// =============================================================================

export const HOOK_TEMPLATES: Record<string, HookTemplate> = {
  "auto-format-prettier": {
    id: "auto-format-prettier",
    name: "Auto-Format with Prettier",
    description: "Automatically format TypeScript/JavaScript files after edits using Prettier",
    category: "formatting",
    events: ["PostToolUse"],
    config: {
      hooks: {
        PostToolUse: [
          {
            matcher: "Edit|MultiEdit|Write",
            hooks: [
              {
                type: "command",
                command:
                  "jq -r '.tool_input.file_path' | { read file_path; if echo \"$file_path\" | grep -qE '\\.(ts|tsx|js|jsx|json|md)$'; then npx prettier --write \"$file_path\" 2>/dev/null; fi; }",
              },
            ],
          },
        ],
      },
    },
    customizable: [
      {
        field: "extensions",
        description: "File extensions to format",
        default: "ts|tsx|js|jsx|json|md",
      },
    ],
  },

  "auto-format-biome": {
    id: "auto-format-biome",
    name: "Auto-Format with Biome",
    description: "Automatically format and lint files after edits using Biome",
    category: "formatting",
    events: ["PostToolUse"],
    config: {
      hooks: {
        PostToolUse: [
          {
            matcher: "Edit|MultiEdit|Write",
            hooks: [
              {
                type: "command",
                command:
                  "jq -r '.tool_input.file_path' | { read file_path; if echo \"$file_path\" | grep -qE '\\.(ts|tsx|js|jsx|json)$'; then npx biome check --write \"$file_path\" 2>/dev/null; fi; }",
              },
            ],
          },
        ],
      },
    },
    customizable: [
      {
        field: "extensions",
        description: "File extensions to format",
        default: "ts|tsx|js|jsx|json",
      },
    ],
  },

  "auto-format-python": {
    id: "auto-format-python",
    name: "Auto-Format Python with Ruff",
    description: "Automatically format Python files after edits using Ruff",
    category: "formatting",
    events: ["PostToolUse"],
    config: {
      hooks: {
        PostToolUse: [
          {
            matcher: "Edit|MultiEdit|Write",
            hooks: [
              {
                type: "command",
                command:
                  'jq -r \'.tool_input.file_path\' | { read file_path; if echo "$file_path" | grep -qE \'\\.py$\'; then ruff format "$file_path" && ruff check --fix "$file_path" 2>/dev/null; fi; }',
              },
            ],
          },
        ],
      },
    },
    customizable: [],
  },

  "block-sensitive-files": {
    id: "block-sensitive-files",
    name: "Block Sensitive Files",
    description: "Prevent reading or modifying sensitive files like .env, secrets, and credentials",
    category: "security",
    events: ["PreToolUse"],
    config: {
      hooks: {
        PreToolUse: [
          {
            matcher: "Read|Edit|MultiEdit|Write",
            hooks: [
              {
                type: "command",
                command:
                  "python3 -c \"import json, sys; data=json.load(sys.stdin); path=data.get('tool_input',{}).get('file_path',''); patterns=['.env', 'secret', 'credential', '.pem', '.key', 'password']; sys.exit(2 if any(p in path.lower() for p in patterns) and not path.endswith('.env.example') else 0)\"",
              },
            ],
          },
        ],
      },
    },
    customizable: [
      {
        field: "patterns",
        description: "Patterns to block (comma-separated)",
        default: ".env,secret,credential,.pem,.key,password",
      },
    ],
  },

  "block-dangerous-commands": {
    id: "block-dangerous-commands",
    name: "Block Dangerous Commands",
    description: "Prevent execution of dangerous shell commands like rm -rf, sudo, etc.",
    category: "security",
    events: ["PreToolUse"],
    config: {
      hooks: {
        PreToolUse: [
          {
            matcher: "Bash",
            hooks: [
              {
                type: "command",
                command:
                  "python3 -c \"import json, sys, re; data=json.load(sys.stdin); cmd=data.get('tool_input',{}).get('command',''); dangerous=[r'rm\\s+.*-[a-z]*r[a-z]*f', r'sudo\\s+', r'chmod\\s+777', r'>(\\s*)/dev/sd', r'mkfs', r'dd\\s+if=', r':\\(\\)\\{.*\\};:']; sys.exit(2 if any(re.search(p, cmd) for p in dangerous) else 0)\"",
              },
            ],
          },
        ],
      },
    },
    customizable: [],
  },

  "run-tests-on-change": {
    id: "run-tests-on-change",
    name: "Run Tests on Change",
    description: "Automatically run related tests after code changes",
    category: "testing",
    events: ["PostToolUse"],
    config: {
      hooks: {
        PostToolUse: [
          {
            matcher: "Edit|MultiEdit|Write",
            hooks: [
              {
                type: "command",
                command:
                  'jq -r \'.tool_input.file_path\' | { read file_path; if echo "$file_path" | grep -qE \'\\.(ts|tsx|js|jsx)$\' && ! echo "$file_path" | grep -q \'\\.test\\.\'; then test_file="${file_path%.ts}.test.ts"; if [ -f "$test_file" ]; then npx vitest run "$test_file" --reporter=dot 2>/dev/null; fi; fi; }',
              },
            ],
          },
        ],
      },
    },
    customizable: [
      {
        field: "testRunner",
        description: "Test runner command",
        default: "npx vitest run",
      },
    ],
  },

  "tdd-enforcement": {
    id: "tdd-enforcement",
    name: "TDD Enforcement",
    description: "Ensure tests exist before allowing code changes (Test-Driven Development)",
    category: "testing",
    events: ["PreToolUse"],
    config: {
      hooks: {
        PreToolUse: [
          {
            matcher: "Edit|Write",
            hooks: [
              {
                type: "command",
                command:
                  'jq -r \'.tool_input.file_path\' | { read file_path; if echo "$file_path" | grep -qE \'src/.*\\.(ts|tsx)$\' && ! echo "$file_path" | grep -q \'\\.test\\.\'; then test_file=$(echo "$file_path" | sed "s/\\.ts$/.test.ts/"); if [ ! -f "$test_file" ]; then echo "TDD: Create test file first: $test_file" >&2; exit 2; fi; fi; exit 0; }',
              },
            ],
          },
        ],
      },
    },
    customizable: [
      {
        field: "srcPattern",
        description: "Source directory pattern",
        default: "src/",
      },
    ],
  },

  "session-logging": {
    id: "session-logging",
    name: "Session Logging",
    description: "Log all tool executions and prompts for audit trail",
    category: "logging",
    events: ["PreToolUse", "UserPromptSubmit"],
    config: {
      hooks: {
        PreToolUse: [
          {
            hooks: [
              {
                type: "command",
                command:
                  "jq -c '{timestamp: now | strftime(\"%Y-%m-%dT%H:%M:%S\"), tool: .tool_name, input: .tool_input}' >> ~/.claude/session-log.jsonl",
              },
            ],
          },
        ],
        UserPromptSubmit: [
          {
            hooks: [
              {
                type: "command",
                command:
                  'jq -c \'{timestamp: now | strftime("%Y-%m-%dT%H:%M:%S"), type: "prompt", content: .prompt}\' >> ~/.claude/session-log.jsonl',
              },
            ],
          },
        ],
      },
    },
    customizable: [
      {
        field: "logPath",
        description: "Log file path",
        default: "~/.claude/session-log.jsonl",
      },
    ],
  },

  "notification-on-stop": {
    id: "notification-on-stop",
    name: "Notification on Stop",
    description: "Send a notification when Claude finishes a task",
    category: "workflow",
    events: ["Stop"],
    config: {
      hooks: {
        Stop: [
          {
            hooks: [
              {
                type: "command",
                command:
                  'echo "Claude finished task" | terminal-notifier -title "Claude Code" -sound default 2>/dev/null || notify-send "Claude Code" "Task completed" 2>/dev/null || true',
              },
            ],
          },
        ],
      },
    },
    customizable: [
      {
        field: "message",
        description: "Notification message",
        default: "Claude finished task",
      },
    ],
  },

  "git-safe-commits": {
    id: "git-safe-commits",
    name: "Git Safe Commits",
    description: "Block dangerous git operations like force push and mass adds",
    category: "security",
    events: ["PreToolUse"],
    config: {
      hooks: {
        PreToolUse: [
          {
            matcher: "Bash",
            hooks: [
              {
                type: "command",
                command:
                  "python3 -c \"import json, sys, re; data=json.load(sys.stdin); cmd=data.get('tool_input',{}).get('command',''); dangerous=[r'git\\s+push.*--force', r'git\\s+push.*-f\\b', r'git\\s+add\\s+(-A|--all|\\.)', r'git\\s+checkout\\s+-f', r'git\\s+reset\\s+--hard']; sys.exit(2 if any(re.search(p, cmd) for p in dangerous) else 0)\"",
              },
            ],
          },
        ],
      },
    },
    customizable: [],
  },
};

/**
 * Get all available templates
 */
export function getAllTemplates(): HookTemplate[] {
  return Object.values(HOOK_TEMPLATES);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: HookTemplate["category"]): HookTemplate[] {
  return Object.values(HOOK_TEMPLATES).filter((t) => t.category === category);
}

/**
 * Get template by ID
 */
export function getTemplate(templateId: string): HookTemplate | undefined {
  return HOOK_TEMPLATES[templateId];
}

/**
 * Merge multiple hook configs into one
 */
export function mergeHookConfigs(configs: HooksSettings[]): HooksSettings {
  const merged: HooksSettings = { hooks: {} };

  for (const config of configs) {
    for (const [event, hookConfigs] of Object.entries(config.hooks)) {
      const eventKey = event as HookEvent;
      if (!merged.hooks[eventKey]) {
        merged.hooks[eventKey] = [];
      }
      merged.hooks[eventKey]?.push(...(hookConfigs || []));
    }
  }

  return merged;
}

/**
 * Get template categories
 */
export function getTemplateCategories(): HookTemplate["category"][] {
  return ["formatting", "security", "testing", "logging", "workflow"];
}
