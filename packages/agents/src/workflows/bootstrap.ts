/**
 * Bootstrap Workflow
 *
 * Multi-step workflow for environment setup and validation.
 */

import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";

/**
 * Step 1: Detect environment
 */
const detectStep = createStep({
  id: "detect",
  inputSchema: z.object({
    verbose: z.boolean().default(false).describe("Enable verbose output"),
  }),
  outputSchema: z.object({
    platform: z.string(),
    wsl: z.boolean(),
    node: z.object({
      installed: z.boolean(),
      version: z.string().optional(),
    }),
    python: z.object({
      installed: z.boolean(),
      version: z.string().optional(),
    }),
    packageManagers: z.array(z.string()),
  }),
  execute: async ({ inputData: _inputData }) => {
    // Detection logic - simplified for workflow structure
    const platform = process.platform;
    const wsl = !!process.env.WSL_DISTRO_NAME;

    return {
      platform,
      wsl,
      node: {
        installed: true,
        version: process.version,
      },
      python: {
        installed: false,
        version: undefined,
      },
      packageManagers: ["npm"],
    };
  },
});

/**
 * Step 2: Install missing dependencies
 */
const installStep = createStep({
  id: "install",
  inputSchema: z.object({
    platform: z.string(),
    wsl: z.boolean(),
    node: z.object({
      installed: z.boolean(),
      version: z.string().optional(),
    }),
    python: z.object({
      installed: z.boolean(),
      version: z.string().optional(),
    }),
    packageManagers: z.array(z.string()),
  }),
  outputSchema: z.object({
    installed: z.array(z.string()),
    skipped: z.array(z.string()),
    failed: z.array(z.string()),
  }),
  execute: async ({ inputData }) => {
    const installed: string[] = [];
    const skipped: string[] = [];
    const failed: string[] = [];

    // Check what needs installation
    if (inputData.node.installed) {
      skipped.push("node");
    }

    if (inputData.packageManagers.includes("pnpm")) {
      skipped.push("pnpm");
    } else {
      // Would install pnpm here
      installed.push("pnpm");
    }

    if (inputData.python.installed) {
      skipped.push("python");
    }

    return { installed, skipped, failed };
  },
});

/**
 * Step 3: Validate installation
 */
const validateStep = createStep({
  id: "validate",
  inputSchema: z.object({
    installed: z.array(z.string()),
    skipped: z.array(z.string()),
    failed: z.array(z.string()),
  }),
  outputSchema: z.object({
    valid: z.boolean(),
    report: z.object({
      passed: z.number(),
      failed: z.number(),
      warnings: z.array(z.string()),
    }),
  }),
  execute: async ({ inputData }) => {
    const hasFailed = inputData.failed.length > 0;

    return {
      valid: !hasFailed,
      report: {
        passed: inputData.installed.length + inputData.skipped.length,
        failed: inputData.failed.length,
        warnings: hasFailed ? inputData.failed.map((f: string) => `Failed to install: ${f}`) : [],
      },
    };
  },
});

/**
 * Bootstrap Workflow
 *
 * Detects environment, installs missing dependencies, and validates setup.
 */
export const bootstrapWorkflow = createWorkflow({
  id: "bootstrap",
  description: "Detect environment, install dependencies, and validate setup",
  inputSchema: z.object({
    verbose: z.boolean().default(false).describe("Enable verbose output"),
  }),
  outputSchema: z.object({
    valid: z.boolean(),
    report: z.object({
      passed: z.number(),
      failed: z.number(),
      warnings: z.array(z.string()),
    }),
  }),
})
  .then(detectStep)
  .then(installStep)
  .then(validateStep)
  .commit();
