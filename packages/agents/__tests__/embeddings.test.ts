import { describe, expect, it } from "vitest";
import {
  embed,
  embedMany,
  getEmbeddingConfig,
  getEmbeddingDimensions,
  validateEmbeddingConfig,
} from "../src/embeddings.js";

describe("embeddings", () => {
  describe("getEmbeddingDimensions", () => {
    it("returns 384 for transformers provider", () => {
      const dimensions = getEmbeddingDimensions();
      expect(dimensions).toBe(384);
    });

    it("returns a positive number", () => {
      const dimensions = getEmbeddingDimensions();
      expect(dimensions).toBeGreaterThan(0);
    });
  });

  describe("getEmbeddingConfig", () => {
    it("returns transformers provider config", () => {
      const config = getEmbeddingConfig();
      expect(config.provider).toBe("transformers");
      expect(config.model).toBe("Xenova/all-MiniLM-L6-v2");
      expect(config.dimensions).toBe(384);
    });
  });

  describe("validateEmbeddingConfig", () => {
    it("returns valid=true (no API key needed)", () => {
      const result = validateEmbeddingConfig();
      expect(result.valid).toBe(true);
    });

    it("returns transformers provider", () => {
      const result = validateEmbeddingConfig();
      expect(result.provider).toBe("transformers");
    });

    it("returns warnings as array", () => {
      const result = validateEmbeddingConfig();
      expect(Array.isArray(result.warnings)).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it("warns about first run download", () => {
      const result = validateEmbeddingConfig();
      expect(result.warnings.some((w) => w.includes("download"))).toBe(true);
    });
  });

  describe("embed and embedMany functions", () => {
    it("embed is a function", () => {
      expect(typeof embed).toBe("function");
    });

    it("embedMany is a function", () => {
      expect(typeof embedMany).toBe("function");
    });
  });

  describe("module exports", () => {
    it("exports all required functions", async () => {
      const module = await import("../src/embeddings.js");
      expect(module.embed).toBeDefined();
      expect(module.embedMany).toBeDefined();
      expect(module.getEmbeddingDimensions).toBeDefined();
      expect(module.getEmbeddingConfig).toBeDefined();
      expect(module.validateEmbeddingConfig).toBeDefined();
    });
  });
});
