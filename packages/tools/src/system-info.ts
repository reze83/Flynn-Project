/**
 * System information tool
 */

import { arch, homedir, hostname, platform, release } from "node:os";
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

const outputSchema = z.object({
  platform: z.string(),
  arch: z.string(),
  release: z.string(),
  hostname: z.string(),
  homeDir: z.string(),
  nodeVersion: z.string(),
  isWSL: z.boolean(),
});

export const systemInfoTool = createTool({
  id: "system-info",
  description: "Get information about the system environment",
  inputSchema: z.object({}),
  outputSchema,
  execute: async () => {
    const rel = release();
    const isWSL = rel.toLowerCase().includes("wsl") || rel.toLowerCase().includes("microsoft");

    return {
      platform: platform(),
      arch: arch(),
      release: rel,
      hostname: hostname(),
      homeDir: homedir(),
      nodeVersion: process.version,
      isWSL,
    };
  },
});
