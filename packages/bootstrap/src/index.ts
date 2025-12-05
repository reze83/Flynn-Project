/**
 * @flynn/bootstrap - Self-installation and environment detection
 */

// Re-export all modules
export * from "./detector/index.js";
export * from "./installer/index.js";
export * from "./validator/index.js";

// Export main functions for programmatic use
export { detectEnvironment, printEnvironmentSummary } from "./detector/index.js";
export { runInstallers, printInstallResults } from "./installer/index.js";
export {
  runValidation,
  validateAll,
  validateInstallation,
  validateHealth,
} from "./validator/index.js";
