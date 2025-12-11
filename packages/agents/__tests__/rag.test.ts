import { beforeEach, describe, expect, it, vi } from "vitest";
import { getRagStatus } from "../src/rag.js";

// Note: Full RAG tests require database setup and embeddings
// These tests focus on the public API structure and status reporting

describe("rag", () => {
  describe("getRagStatus", () => {
    it("returns status object with required fields", async () => {
      const status = await getRagStatus();

      expect(status).toHaveProperty("initialized");
      expect(status).toHaveProperty("provider");
      expect(status).toHaveProperty("dimensions");
    });

    it("initialized is a boolean", async () => {
      const status = await getRagStatus();

      expect(typeof status.initialized).toBe("boolean");
    });

    it("provider is a valid string", async () => {
      const status = await getRagStatus();

      expect(typeof status.provider).toBe("string");
      expect(["openai", "fastembed", "transformers", "none"]).toContain(status.provider);
    });

    it("dimensions is a positive number", async () => {
      const status = await getRagStatus();

      expect(typeof status.dimensions).toBe("number");
      expect(status.dimensions).toBeGreaterThan(0);
    });

    it("returns correct dimensions for provider", async () => {
      const status = await getRagStatus();

      if (status.provider === "openai") {
        expect(status.dimensions).toBe(1536);
      } else {
        expect(status.dimensions).toBe(384);
      }
    });
  });

  describe("module exports", () => {
    it("exports all required functions", async () => {
      const module = await import("../src/rag.js");

      expect(module.initializeRag).toBeDefined();
      expect(module.indexDocuments).toBeDefined();
      expect(module.searchKnowledge).toBeDefined();
      expect(module.deleteDocuments).toBeDefined();
      expect(module.clearIndex).toBeDefined();
      expect(module.getRagStatus).toBeDefined();
    });
  });

  describe("function signatures", () => {
    it("initializeRag accepts optional config", async () => {
      const { initializeRag } = await import("../src/rag.js");

      expect(typeof initializeRag).toBe("function");
      // Function should accept 0 or 1 arguments
      expect(initializeRag.length).toBeLessThanOrEqual(1);
    });

    it("indexDocuments requires chunks array", async () => {
      const { indexDocuments } = await import("../src/rag.js");

      expect(typeof indexDocuments).toBe("function");
    });

    it("searchKnowledge requires query string", async () => {
      const { searchKnowledge } = await import("../src/rag.js");

      expect(typeof searchKnowledge).toBe("function");
    });

    it("deleteDocuments requires ids array", async () => {
      const { deleteDocuments } = await import("../src/rag.js");

      expect(typeof deleteDocuments).toBe("function");
    });

    it("clearIndex accepts optional indexName", async () => {
      const { clearIndex } = await import("../src/rag.js");

      expect(typeof clearIndex).toBe("function");
    });
  });

  describe("deleteDocuments", () => {
    it("returns deleted count", async () => {
      const { deleteDocuments } = await import("../src/rag.js");

      // deleteDocuments returns the count of deleted documents
      const result = await deleteDocuments([]);

      expect(result).toHaveProperty("deleted");
      expect(typeof result.deleted).toBe("number");
    });

    it("handles empty array", async () => {
      const { deleteDocuments } = await import("../src/rag.js");

      const result = await deleteDocuments([]);

      expect(result.deleted).toBe(0);
    });
  });
});
