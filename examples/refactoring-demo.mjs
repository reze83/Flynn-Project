#!/usr/bin/env node
import { initializeMcpRegistry } from "./packages/tools/dist/mcp-registry.js";
import { RefactoringLoop } from "./packages/tools/dist/refactoring-loop.js";

async function demo() {
  console.log("\n╔═══════════════════════════════════════════════════════╗");
  console.log("║       Flynn Refactoring Loop - Live Demo             ║");
  console.log("╚═══════════════════════════════════════════════════════╝\n");

  console.log("📦 Initializing MCP Registry...");
  await initializeMcpRegistry([
    "mcp__flynn__file-ops",
    "mcp__flynn__git-ops",
    "mcp__serena__read_file",
    "mcp__mem0__add_memory",
  ]);
  console.log("✅ Registry initialized\n");

  console.log("🔄 Running Refactoring Loop...\n");

  const loop = new RefactoringLoop();
  const result = await loop.run({
    maxIterations: 2,
    autoFix: false,
    minSeverity: "medium",
  });

  console.log("═══════════════════════════════════════════════════════\n");
  console.log("📊 FINAL METRICS:\n");
  console.log(`  🏥 Health Score:       ${result.finalMetrics.overallHealth}%`);
  console.log(`  🤖 Total Agents:       ${result.finalMetrics.totalAgents}`);
  console.log(`  🔧 MCP Tools:          ${result.finalMetrics.totalMcpTools}`);
  console.log(`  ❓ Uncategorized:      ${result.finalMetrics.uncategorizedTools}`);
  console.log(
    `  📈 Pattern Coverage:   ${result.finalMetrics.categoryPatternCoverage.toFixed(1)}%`,
  );
  console.log();
  console.log("═══════════════════════════════════════════════════════\n");
  console.log("📝 SUMMARY:\n");
  console.log(
    result.summary
      .split("\n")
      .map((line) => `  ${line}`)
      .join("\n"),
  );
  console.log("\n✨ Refactoring Loop completed successfully!\n");
}

demo().catch(console.error);
