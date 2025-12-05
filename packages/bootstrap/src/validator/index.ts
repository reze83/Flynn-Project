/**
 * Validator module - aggregates all validators
 */

import { healthValidators } from "./health.js";
import { postInstallValidators } from "./post-install.js";
import { generateReport, printReport } from "./report.js";
import type { ValidationReport, ValidationResult, Validator } from "./types.js";

export * from "./types.js";
export * from "./post-install.js";
export * from "./health.js";
export * from "./report.js";

/**
 * Run post-installation validation
 */
export async function validateInstallation(): Promise<ValidationReport> {
  const results: ValidationResult[] = [];

  for (const validator of postInstallValidators) {
    const result = await validator.validate();
    results.push(result);
  }

  return generateReport(results);
}

/**
 * Run health checks
 */
export async function validateHealth(): Promise<ValidationReport> {
  const results: ValidationResult[] = [];

  for (const validator of healthValidators) {
    const result = await validator.validate();
    results.push(result);
  }

  return generateReport(results);
}

/**
 * Run all validations
 */
export async function validateAll(): Promise<ValidationReport> {
  const allValidators: Validator[] = [...postInstallValidators, ...healthValidators];
  const results: ValidationResult[] = [];

  for (const validator of allValidators) {
    const result = await validator.validate();
    results.push(result);
  }

  return generateReport(results);
}

/**
 * Run validation and print results
 */
export async function runValidation(
  type: "install" | "health" | "all" = "all",
): Promise<ValidationReport> {
  let report: ValidationReport;

  switch (type) {
    case "install":
      report = await validateInstallation();
      break;
    case "health":
      report = await validateHealth();
      break;
    default:
      report = await validateAll();
      break;
  }

  printReport(report);
  return report;
}
