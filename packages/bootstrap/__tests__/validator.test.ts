import { describe, expect, it } from "vitest";
import { exportReportJson, generateReport } from "../src/validator/report.js";
import type { ValidationResult } from "../src/validator/types.js";

describe("validator", () => {
  describe("generateReport", () => {
    it("should generate report with all passed", () => {
      const results: ValidationResult[] = [
        { component: "test1", valid: true, message: "OK" },
        { component: "test2", valid: true, message: "OK" },
      ];

      const report = generateReport(results);

      expect(report.allValid).toBe(true);
      expect(report.summary.passed).toBe(2);
      expect(report.summary.failed).toBe(0);
      expect(report.summary.total).toBe(2);
    });

    it("should generate report with failures", () => {
      const results: ValidationResult[] = [
        { component: "test1", valid: true, message: "OK" },
        { component: "test2", valid: false, message: "Failed", details: "Some error" },
      ];

      const report = generateReport(results);

      expect(report.allValid).toBe(false);
      expect(report.summary.passed).toBe(1);
      expect(report.summary.failed).toBe(1);
    });

    it("should include timestamp", () => {
      const results: ValidationResult[] = [];
      const report = generateReport(results);

      expect(report.timestamp).toBeDefined();
      expect(typeof report.timestamp).toBe("string");
    });
  });

  describe("exportReportJson", () => {
    it("should export valid JSON", () => {
      const results: ValidationResult[] = [{ component: "test", valid: true, message: "OK" }];
      const report = generateReport(results);
      const json = exportReportJson(report);

      expect(() => JSON.parse(json)).not.toThrow();
    });
  });
});
