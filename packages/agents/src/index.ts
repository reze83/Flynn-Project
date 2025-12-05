/**
 * @flynn/agents - Mastra agents for Flynn orchestrator
 */

// Main orchestrator
export { orchestrator, generateResponse, streamResponse, networkResponse } from "./orchestrator.js";

// Sub-agents (default instances)
export { installer } from "./installer.js";
export { diagnostic } from "./diagnostic.js";
export { scaffolder } from "./scaffolder.js";
export { coder } from "./coder.js";
export { refactor } from "./refactor.js";
export { release } from "./release.js";
export { healer } from "./healer.js";
export { data } from "./data.js";

// Agent factories (for dynamic model selection)
export { createInstaller } from "./installer.js";
export { createDiagnostic } from "./diagnostic.js";
export { createScaffolder } from "./scaffolder.js";
export { createCoder } from "./coder.js";
export { createRefactor } from "./refactor.js";
export { createRelease } from "./release.js";
export { createHealer } from "./healer.js";
export { createData } from "./data.js";

// Instructions
export * from "./instructions.js";

// Workflows
export { analysisWorkflow, bootstrapWorkflow } from "./workflows/index.js";
