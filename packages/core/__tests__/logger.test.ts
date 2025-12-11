import { describe, expect, it } from "vitest";
import { createLogger, logger } from "../src/logger.js";

describe("logger", () => {
  describe("logger instance", () => {
    it("should be defined", () => {
      expect(logger).toBeDefined();
    });

    it("should have standard log methods", () => {
      expect(typeof logger.info).toBe("function");
      expect(typeof logger.error).toBe("function");
      expect(typeof logger.warn).toBe("function");
      expect(typeof logger.debug).toBe("function");
    });
  });

  describe("createLogger", () => {
    it("should create a child logger with module name", () => {
      const childLogger = createLogger("test-module");
      expect(childLogger).toBeDefined();
      expect(typeof childLogger.info).toBe("function");
    });

    it("should create a child logger with additional context", () => {
      const childLogger = createLogger("test-module", { requestId: "123" });
      expect(childLogger).toBeDefined();
    });
  });
});
