/**
 * Validator module - aggregates all validators
 */

import type { ValidationResult, ValidationReport, Validator } from "./types.js";
import { postInstallValidators } from "./post-install.js";
import { healthValidators } from "./health.js";
import { generateReport, printReport, exportReportJson } from "./report.js";

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
    case "all":
    default:
      report = await validateAll();
      break;
  }

  printReport(report);
  return report;
}
