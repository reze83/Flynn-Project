/**
 * CODEX.md Generator Tool
 *
 * Generates context-aware CODEX.md files for OpenAI Codex CLI.
 * Supports role-based templates and task-specific instructions.
 */

import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

// Role-based templates for CODEX.md
type CodexRole = "worker" | "peer" | "specialist";

interface CodexTemplate {
  role: CodexRole;
  description: string;
  baseInstructions: string;
  constraints: string[];
}

const ROLE_TEMPLATES: Record<CodexRole, CodexTemplate> = {
  worker: {
    role: "worker",
    description: "Executes tasks as directed with minimal decision-making",
    baseInstructions: `# Codex Worker Instructions

You are operating as a worker agent, executing specific tasks as directed.

## Role
- Execute tasks exactly as specified
- Follow established patterns in the codebase
- Ask for clarification if requirements are unclear
- Report completion status and any issues encountered

## Approach
1. Read and understand the task requirements
2. Analyze relevant existing code
3. Implement the solution following patterns
4. Verify the implementation works
5. Report results`,
    constraints: [
      "Do not refactor unrelated code",
      "Follow existing code style exactly",
      "Ask before making architectural decisions",
      "Keep changes minimal and focused",
    ],
  },
  peer: {
    role: "peer",
    description: "Collaborates as an equal partner in development",
    baseInstructions: `# Codex Peer Instructions

You are operating as a peer developer, collaborating on the implementation.

## Role
- Contribute ideas and solutions
- Make reasonable technical decisions
- Suggest improvements when appropriate
- Balance speed with code quality

## Approach
1. Understand the broader context
2. Consider multiple implementation approaches
3. Choose the best approach for the situation
4. Implement with attention to quality
5. Document decisions and rationale`,
    constraints: [
      "Explain significant decisions",
      "Keep code maintainable",
      "Consider edge cases",
      "Add tests for complex logic",
    ],
  },
  specialist: {
    role: "specialist",
    description: "Expert in a specific domain with authority to make decisions",
    baseInstructions: `# Codex Specialist Instructions

You are operating as a domain specialist with expertise and authority.

## Role
- Apply deep expertise in your domain
- Make authoritative technical decisions
- Optimize for best practices
- Guide implementation patterns

## Approach
1. Apply domain expertise to the problem
2. Identify optimal solutions
3. Implement with best practices
4. Consider performance and scalability
5. Document expert recommendations`,
    constraints: [
      "Apply industry best practices",
      "Consider long-term maintainability",
      "Document complex patterns",
      "Optimize for the domain requirements",
    ],
  },
};

// Project type detection
interface ProjectInfo {
  name: string;
  type: string;
  framework?: string;
  language: string;
  buildTool?: string;
  testFramework?: string;
  hasTypeScript: boolean;
  hasTests: boolean;
  hasDocker: boolean;
  hasCi: boolean;
}

/**
 * Detect Node.js framework from dependencies
 */
function detectNodeFramework(deps: Record<string, string>): string | undefined {
  if (deps.next) return "Next.js";
  if (deps.react) return "React";
  if (deps.vue) return "Vue";
  if (deps.express) return "Express";
  if (deps.fastify) return "Fastify";
  if (deps["@mastra/core"]) return "Mastra";
  return undefined;
}

/**
 * Detect Node.js build tool from dependencies and scripts
 */
function detectNodeBuildTool(
  deps: Record<string, string>,
  scripts?: Record<string, string>,
): string | undefined {
  if (scripts?.build?.includes("tsc")) return "tsc";
  if (deps.vite) return "vite";
  if (deps.webpack) return "webpack";
  if (deps.esbuild) return "esbuild";
  return undefined;
}

/**
 * Detect Node.js test framework from dependencies
 */
function detectNodeTestFramework(deps: Record<string, string>): string | undefined {
  if (deps.vitest) return "vitest";
  if (deps.jest) return "jest";
  if (deps.mocha) return "mocha";
  return undefined;
}

/**
 * Detect Node.js project information
 */
function detectNodeJsInfo(info: ProjectInfo, projectPath: string, files: string[]): void {
  info.type = "nodejs";
  info.language = "javascript";

  try {
    const pkgJson = JSON.parse(readFileSync(join(projectPath, "package.json"), "utf-8")) as {
      name?: string;
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
      scripts?: Record<string, string>;
    };

    info.name = pkgJson.name || info.name;

    const deps = {
      ...pkgJson.dependencies,
      ...pkgJson.devDependencies,
    };

    info.framework = detectNodeFramework(deps);
    info.hasTypeScript = !!deps.typescript || files.includes("tsconfig.json");
    if (info.hasTypeScript) info.language = "typescript";

    info.buildTool = detectNodeBuildTool(deps, pkgJson.scripts);
    info.testFramework = detectNodeTestFramework(deps);
    info.hasTests = !!info.testFramework;
  } catch {
    // Ignore parse errors
  }
}

/**
 * Detect Python project information
 */
function detectPythonInfo(info: ProjectInfo, projectPath: string, files: string[]): void {
  info.type = "python";
  info.language = "python";

  if (files.includes("pyproject.toml")) {
    try {
      const content = readFileSync(join(projectPath, "pyproject.toml"), "utf-8");
      if (content.includes("fastapi")) info.framework = "FastAPI";
      else if (content.includes("django")) info.framework = "Django";
      else if (content.includes("flask")) info.framework = "Flask";

      if (content.includes("pytest")) {
        info.testFramework = "pytest";
        info.hasTests = true;
      }
    } catch {
      // Ignore
    }
  }
}

/**
 * Detect Docker and CI configuration
 */
function detectDockerAndCi(info: ProjectInfo, projectPath: string, files: string[]): void {
  info.hasDocker =
    files.includes("dockerfile") ||
    files.includes("docker-compose.yml") ||
    files.includes("docker-compose.yaml");

  info.hasCi =
    files.includes(".github") || files.includes(".gitlab-ci.yml") || files.includes("jenkinsfile");

  const githubPath = join(projectPath, ".github", "workflows");
  if (existsSync(githubPath)) {
    info.hasCi = true;
  }
}

/**
 * Detect project information from directory
 */
function detectProjectInfo(projectPath: string): ProjectInfo {
  const info: ProjectInfo = {
    name: basename(projectPath),
    type: "unknown",
    language: "unknown",
    hasTypeScript: false,
    hasTests: false,
    hasDocker: false,
    hasCi: false,
  };

  const files = existsSync(projectPath) ? readdirSync(projectPath).map((f) => f.toLowerCase()) : [];

  // Detect project type and details
  if (files.includes("package.json")) {
    detectNodeJsInfo(info, projectPath, files);
  } else if (
    files.includes("pyproject.toml") ||
    files.includes("setup.py") ||
    files.includes("requirements.txt")
  ) {
    detectPythonInfo(info, projectPath, files);
  } else if (files.includes("cargo.toml")) {
    info.type = "rust";
    info.language = "rust";
    info.buildTool = "cargo";
    info.testFramework = "cargo test";
    info.hasTests = true;
  } else if (files.includes("go.mod")) {
    info.type = "go";
    info.language = "go";
    info.testFramework = "go test";
    info.hasTests = true;
  }

  detectDockerAndCi(info, projectPath, files);

  return info;
}

/**
 * Generate project-specific instructions
 */
function generateProjectInstructions(info: ProjectInfo): string {
  const sections: string[] = [];

  sections.push(`## Project: ${info.name}`);
  sections.push(`- Type: ${info.type}`);
  sections.push(`- Language: ${info.language}`);

  if (info.framework) {
    sections.push(`- Framework: ${info.framework}`);
  }

  if (info.buildTool) {
    sections.push(`- Build: ${info.buildTool}`);
  }

  if (info.testFramework) {
    sections.push(`- Tests: ${info.testFramework}`);
  }

  sections.push("");
  sections.push("## Development Commands");

  // Language-specific commands
  if (info.type === "nodejs") {
    if (info.hasTypeScript) {
      sections.push("- Build: `pnpm build` or `npm run build`");
      sections.push("- Type check: `pnpm typecheck` or `tsc --noEmit`");
    }
    if (info.testFramework) {
      sections.push("- Test: `pnpm test` or `npm test`");
    }
    sections.push("- Install: `pnpm install` or `npm install`");
  } else if (info.type === "python") {
    sections.push("- Install: `pip install -e .` or `uv pip install -e .`");
    if (info.testFramework === "pytest") {
      sections.push("- Test: `pytest`");
    }
  } else if (info.type === "rust") {
    sections.push("- Build: `cargo build`");
    sections.push("- Test: `cargo test`");
    sections.push("- Run: `cargo run`");
  } else if (info.type === "go") {
    sections.push("- Build: `go build`");
    sections.push("- Test: `go test ./...`");
    sections.push("- Run: `go run .`");
  }

  return sections.join("\n");
}

/**
 * Generate task-specific instructions
 */
function generateTaskContext(taskDescription?: string, relevantFiles?: string[]): string {
  if (!taskDescription && (!relevantFiles || relevantFiles.length === 0)) {
    return "";
  }

  const sections: string[] = [];
  sections.push("## Current Task");

  if (taskDescription) {
    sections.push("");
    sections.push(taskDescription);
  }

  if (relevantFiles && relevantFiles.length > 0) {
    sections.push("");
    sections.push("### Relevant Files");
    for (const file of relevantFiles) {
      sections.push(`- \`${file}\``);
    }
  }

  return sections.join("\n");
}

// Input schema
const inputSchema = z.object({
  operation: z.enum(["generate", "preview", "analyze"]).describe("Operation to perform"),
  projectPath: z.string().describe("Path to the project directory"),
  outputPath: z
    .string()
    .optional()
    .describe("Output path for CODEX.md (default: projectPath/CODEX.md)"),
  role: z
    .enum(["worker", "peer", "specialist"])
    .optional()
    .default("worker")
    .describe("Role template to use"),
  taskDescription: z.string().optional().describe("Current task description"),
  relevantFiles: z.array(z.string()).optional().describe("Files relevant to the task"),
  customInstructions: z.string().optional().describe("Additional custom instructions"),
  includeProjectInfo: z
    .boolean()
    .optional()
    .default(true)
    .describe("Include auto-detected project info"),
});

// Output schema
const outputSchema = z.object({
  success: z.boolean(),
  operation: z.string(),
  outputPath: z.string().optional(),
  content: z.string().optional(),
  projectInfo: z
    .object({
      name: z.string(),
      type: z.string(),
      language: z.string(),
      framework: z.string().optional(),
      buildTool: z.string().optional(),
      testFramework: z.string().optional(),
    })
    .optional(),
  error: z.string().optional(),
});

type CodexMdInput = z.infer<typeof inputSchema>;
type CodexMdOutput = z.infer<typeof outputSchema>;

/**
 * Normalize input data from different formats
 */
function normalizeCodexMdInput(inputData: unknown): CodexMdInput {
  const hasContext = inputData && typeof inputData === "object" && "context" in inputData;
  return (
    hasContext ? (inputData as { context: CodexMdInput }).context : inputData
  ) as CodexMdInput;
}

/**
 * Generate code style guidance for a language
 */
function generateCodeStyleGuidance(language: string): string[] {
  const styles: string[] = [];

  if (language === "typescript" || language === "javascript") {
    styles.push("- Use consistent formatting (Prettier/Biome style)");
    styles.push("- Use meaningful variable names");
    styles.push("- Prefer const over let");
    styles.push("- Use async/await over .then()");
  } else if (language === "python") {
    styles.push("- Follow PEP 8 style guide");
    styles.push("- Use type hints");
    styles.push("- Use meaningful variable names");
    styles.push("- Prefer f-strings for formatting");
  } else if (language === "rust") {
    styles.push("- Follow Rust naming conventions");
    styles.push("- Use meaningful variable names");
    styles.push("- Handle errors properly with Result/Option");
    styles.push("- Run `cargo fmt` before completing");
  } else if (language === "go") {
    styles.push("- Follow Go conventions");
    styles.push("- Use gofmt formatting");
    styles.push("- Handle errors explicitly");
    styles.push("- Use meaningful names");
  }

  return styles;
}

/**
 * Build project info output
 */
function buildProjectInfoOutput(projectInfo: ProjectInfo) {
  return {
    name: projectInfo.name,
    type: projectInfo.type,
    language: projectInfo.language,
    framework: projectInfo.framework,
    buildTool: projectInfo.buildTool,
    testFramework: projectInfo.testFramework,
  };
}

/**
 * Generate CODEX.md content sections
 */
function generateCodexMdContent(
  role: CodexRole,
  projectInfo: ProjectInfo,
  includeProjectInfo: boolean,
  taskDescription?: string,
  relevantFiles?: string[],
  customInstructions?: string,
): string {
  const template = ROLE_TEMPLATES[role];
  const sections: string[] = [];

  sections.push(template.baseInstructions);
  sections.push("");

  if (includeProjectInfo) {
    sections.push(generateProjectInstructions(projectInfo));
    sections.push("");
  }

  const taskContext = generateTaskContext(taskDescription, relevantFiles);
  if (taskContext) {
    sections.push(taskContext);
    sections.push("");
  }

  sections.push("## Constraints");
  for (const constraint of template.constraints) {
    sections.push(`- ${constraint}`);
  }
  sections.push("");

  if (customInstructions) {
    sections.push("## Additional Instructions");
    sections.push("");
    sections.push(customInstructions);
    sections.push("");
  }

  sections.push("## Code Style");
  sections.push(...generateCodeStyleGuidance(projectInfo.language));

  return sections.join("\n");
}

export const codexMdGeneratorTool = createTool({
  id: "codex-md-generator",
  description:
    "Generate CODEX.md files for OpenAI Codex CLI with role-based templates, project detection, and task-specific context.",
  inputSchema,
  outputSchema,
  execute: async (inputData): Promise<CodexMdOutput> => {
    const input = normalizeCodexMdInput(inputData);

    const {
      operation,
      projectPath,
      outputPath,
      role = "worker",
      taskDescription,
      relevantFiles,
      customInstructions,
      includeProjectInfo = true,
    } = input;

    try {
      if (!existsSync(projectPath) || !statSync(projectPath).isDirectory()) {
        return {
          success: false,
          operation,
          error: `Project path not found or not a directory: ${projectPath}`,
        };
      }

      const projectInfo = detectProjectInfo(projectPath);

      if (operation === "analyze") {
        return {
          success: true,
          operation,
          projectInfo: buildProjectInfoOutput(projectInfo),
        };
      }

      if (operation === "preview" || operation === "generate") {
        const content = generateCodexMdContent(
          role as CodexRole,
          projectInfo,
          includeProjectInfo,
          taskDescription,
          relevantFiles,
          customInstructions,
        );

        if (operation === "preview") {
          return {
            success: true,
            operation,
            content,
            projectInfo: buildProjectInfoOutput(projectInfo),
          };
        }

        const finalOutputPath = outputPath || join(projectPath, "CODEX.md");
        writeFileSync(finalOutputPath, content, "utf-8");

        return {
          success: true,
          operation,
          outputPath: finalOutputPath,
          content,
          projectInfo: buildProjectInfoOutput(projectInfo),
        };
      }

      return {
        success: false,
        operation,
        error: `Unknown operation: ${operation}`,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        operation,
        error: message,
      };
    }
  },
});
