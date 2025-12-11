/**
 * Project analysis tool
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { extname, join } from "node:path";
import { createLogger, logAudit } from "@flynn/core";
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

const logger = createLogger("project-analysis");

const inputSchema = z.object({
  projectPath: z.string().describe("Path to the project directory"),
  maxDepth: z.number().default(3).describe("Maximum directory depth to scan"),
});

const outputSchema = z.object({
  name: z.string(),
  type: z.string(),
  files: z.number(),
  directories: z.number(),
  languages: z.array(z.string()),
  frameworks: z.array(z.string()),
  error: z.string().optional(),
});

export const analyzeProjectTool = createTool({
  id: "analyze-project",
  description: "Analyze project directory structure and provide insights",
  inputSchema,
  outputSchema,
  execute: async (inputData) => {
    // Mastra passes data in inputData.context
    const data = inputData as unknown as {
      context?: { projectPath?: string; maxDepth?: number };
      projectPath?: string;
      maxDepth?: number;
    };
    const projectPath = data?.context?.projectPath || data?.projectPath || "";
    const maxDepth = data?.context?.maxDepth ?? data?.maxDepth ?? 3;

    // Validate required input
    if (!projectPath || typeof projectPath !== "string") {
      return {
        name: "unknown",
        type: "unknown",
        files: 0,
        directories: 0,
        languages: [] as string[],
        frameworks: [] as string[],
        error: `Invalid projectPath: ${JSON.stringify(projectPath)}`,
      };
    }

    const projectName = projectPath.split("/").pop() || "unknown";

    // --- Caching support ---
    // Determine cache file location and helper functions for persistent caching.
    const CACHE_DIR = process.env.FLYNN_CACHE_DIR || ".flynn_cache";
    const CACHE_FILE = join(CACHE_DIR, "analyze-project.json");
    function loadCache(): Record<string, unknown> {
      try {
        if (existsSync(CACHE_FILE)) {
          return JSON.parse(readFileSync(CACHE_FILE, "utf8"));
        }
      } catch (error) {
        // Log parse errors for debugging visibility
        logger.debug({ cacheFile: CACHE_FILE, error }, "Failed to load cache");
      }
      return {};
    }
    function saveCache(cache: Record<string, unknown>): void {
      try {
        if (!existsSync(CACHE_DIR)) {
          mkdirSync(CACHE_DIR, { recursive: true });
        }
        writeFileSync(CACHE_FILE, JSON.stringify(cache));
      } catch (error) {
        // Log write errors for debugging visibility
        logger.debug({ cacheFile: CACHE_FILE, error }, "Failed to save cache");
      }
    }
    // Create a cache key based on project path and scan depth
    const cacheKey = `${projectPath}:${maxDepth}`;
    const existingCache = loadCache();
    if (Object.prototype.hasOwnProperty.call(existingCache, cacheKey)) {
      // Cached result found: log the cache hit and return the cached data
      logAudit("analyze-project-cache", { projectPath, maxDepth });
      const cached = existingCache[cacheKey] as {
        name: string;
        type: string;
        files: number;
        directories: number;
        languages: string[];
        frameworks: string[];
        error?: string;
      };
      return cached;
    }

    try {
      const stats = { files: 0, directories: 0 };
      const extensions = new Set<string>();
      const frameworks: string[] = [];

      // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: recursive scanning logic
      function scan(dir: string, depth: number) {
        if (depth > maxDepth) return;

        try {
          const entries = readdirSync(dir, { withFileTypes: true });

          for (const entry of entries) {
            if (entry.name.startsWith(".") || entry.name === "node_modules") continue;

            const fullPath = join(dir, entry.name);

            if (entry.isDirectory()) {
              stats.directories++;
              scan(fullPath, depth + 1);
            } else {
              stats.files++;
              const ext = extname(entry.name);
              if (ext) extensions.add(ext);

              // Detect frameworks
              if (entry.name === "package.json") frameworks.push("Node.js");
              if (entry.name === "pyproject.toml") frameworks.push("Python");
              if (entry.name === "Cargo.toml") frameworks.push("Rust");
            }
          }
        } catch {
          // Ignore permission errors for subdirectories
        }
      }

      scan(projectPath, 0);

      const languageMap: Record<string, string> = {
        ".ts": "TypeScript",
        ".tsx": "TypeScript",
        ".js": "JavaScript",
        ".jsx": "JavaScript",
        ".py": "Python",
        ".rs": "Rust",
        ".go": "Go",
      };

      const languages = [...extensions]
        .map((ext) => languageMap[ext])
        .filter((lang): lang is string => lang !== undefined);

      const result = {
        name: projectName,
        type: frameworks[0] ?? "unknown",
        files: stats.files,
        directories: stats.directories,
        languages: [...new Set(languages)],
        frameworks: [...new Set(frameworks)],
      };
      // Persist to cache and log the analysis event
      existingCache[cacheKey] = result;
      saveCache(existingCache);
      logAudit("analyze-project", {
        projectPath,
        maxDepth,
        files: stats.files,
        directories: stats.directories,
      });
      return result;
    } catch (error) {
      // Return a valid object even on error
      const errorResult = {
        name: projectName,
        type: "unknown",
        files: 0,
        directories: 0,
        languages: [] as string[],
        frameworks: [] as string[],
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
      // Log the error event and do not cache error results to avoid polluting the cache
      logAudit("analyze-project-error", { projectPath, maxDepth, error: errorResult.error });
      return errorResult;
    }
  },
});
