/**
 * Project analysis tool
 */

import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { readdirSync } from "node:fs";
import { join, extname } from "node:path";

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
});

export const analyzeProjectTool = createTool({
  id: "analyze-project",
  description: "Analyze project directory structure and provide insights",
  inputSchema,
  outputSchema,
  execute: async (inputData) => {
    const { projectPath, maxDepth } = inputData;

    const stats = { files: 0, directories: 0 };
    const extensions = new Set<string>();
    const frameworks: string[] = [];

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
        // Ignore permission errors
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

    return {
      name: projectPath.split("/").pop() || "unknown",
      type: frameworks.length > 0 ? frameworks[0] : "unknown",
      files: stats.files,
      directories: stats.directories,
      languages: [...new Set(languages)],
      frameworks: [...new Set(frameworks)],
    };
  },
});
