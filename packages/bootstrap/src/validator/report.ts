/**
 * Validation report generation
 */

import type { ValidationReport, ValidationResult } from "./types.js";

/**
 * Generate a validation report from results
 */
export function generateReport(results: ValidationResult[]): ValidationReport {
  const passed = results.filter((r) => r.valid).length;
  const failed = results.filter((r) => !r.valid).length;

  return {
    timestamp: new Date().toISOString(),
    results,
    allValid: failed === 0,
    summary: {
      passed,
      failed,
      total: results.length,
    },
  };
}

/**
 * Print validation report to console
 */
export function printReport(report: ValidationReport): void {
  const icon = (valid: boolean) => (valid ? "✓" : "✗");

  console.log("\n=== Flynn Validation Report ===");
  console.log(`Timestamp: ${report.timestamp}\n`);

  for (const result of report.results) {
    console.log(`  ${icon(result.valid)} ${result.component}: ${result.message}`);
    if (result.details) {
      console.log(`      ${result.details}`);
    }
  }

  console.log("");
  console.log(
    `Summary: ${report.summary.passed}/${report.summary.total} passed, ${report.summary.failed} failed`,
  );

  if (report.allValid) {
    console.log("\n✓ All validations passed - Flynn is ready!\n");
  } else {
    console.log("\n✗ Some validations failed - see above for details\n");
  }
}

/**
 * Export report as JSON
 */
export function exportReportJson(report: ValidationReport): string {
  return JSON.stringify(report, null, 2);
}
