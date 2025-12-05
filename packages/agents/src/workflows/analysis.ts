/**
 * Analysis Workflow
 *
 * Multi-step workflow for project analysis.
 */

import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";

/**
 * Step 1: Gather project information
 */
const gatherStep = createStep({
  id: "gather",
  inputSchema: z.object({
    path: z.string().describe("Project path to analyze"),
    depth: z.number().default(2).describe("Analysis depth"),
  }),
  outputSchema: z.object({
    files: z.array(z.string()),
    stats: z.object({
      totalFiles: z.number(),
      totalDirs: z.number(),
    }),
    projectType: z.string().optional(),
  }),
  execute: async ({ inputData }) => {
    const { path, depth: _depth } = inputData;
    // Simplified gathering logic - will be enhanced with actual file scanning
    return {
      files: [`${path}/src`, `${path}/package.json`],
      stats: {
        totalFiles: 10,
        totalDirs: 3,
      },
      projectType: "typescript",
    };
  },
});

/**
 * Step 2: Analyze gathered information
 */
const analyzeStep = createStep({
  id: "analyze",
  inputSchema: z.object({
    files: z.array(z.string()),
    stats: z.object({
      totalFiles: z.number(),
      totalDirs: z.number(),
    }),
    projectType: z.string().optional(),
  }),
  outputSchema: z.object({
    insights: z.array(z.string()),
    recommendations: z.array(z.string()),
  }),
  execute: async ({ inputData }) => {
    const { files, stats, projectType } = inputData;
    return {
      insights: [
        `Found ${stats.totalFiles} files in ${stats.totalDirs} directories`,
        `Key paths: ${files.join(", ")}`,
        projectType ? `Project type: ${projectType}` : "Unknown project type",
      ],
      recommendations: ["Consider adding more documentation", "Review test coverage"],
    };
  },
});

/**
 * Analysis Workflow
 *
 * Analyzes a project path and provides insights and recommendations.
 */
export const analysisWorkflow = createWorkflow({
  id: "analysis",
  description: "Analyze a project path and provide insights and recommendations",
  inputSchema: z.object({
    path: z.string().describe("Project path to analyze"),
    depth: z.number().default(2).describe("Analysis depth"),
  }),
  outputSchema: z.object({
    insights: z.array(z.string()),
    recommendations: z.array(z.string()),
  }),
})
  .then(gatherStep)
  .then(analyzeStep)
  .commit();
