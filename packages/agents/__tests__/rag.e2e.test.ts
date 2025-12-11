/**
 * RAG End-to-End Tests
 * Tests the full RAG pipeline: init -> index -> search -> delete -> clear
 *
 * Note: These tests use a temporary database and local embeddings.
 * They will be skipped in CI environments to avoid downloading large model files.
 */

import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { validateEmbeddingConfig } from "../src/embeddings.js";
import {
  clearIndex,
  deleteDocuments,
  getRagStatus,
  indexDocuments,
  initializeRag,
  searchKnowledge,
} from "../src/rag.js";

// Skip tests in CI (would download large model files)
const skipTests = process.env.CI === "true";

describe.skipIf(skipTests)("RAG E2E", () => {
  let tempDir: string;
  const testIndexName = "test_documents";

  beforeAll(async () => {
    // Create temporary directory for test database
    tempDir = mkdtempSync(join(tmpdir(), "flynn-rag-test-"));

    // Initialize RAG with temporary database
    await initializeRag({
      dbPath: join(tempDir, "test-knowledge.db"),
      indexName: testIndexName,
    });
  }, 120000); // 2 minute timeout for model download

  afterAll(() => {
    // Cleanup temporary directory
    if (tempDir) {
      try {
        rmSync(tempDir, { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors
      }
    }
  });

  describe("initialization", () => {
    it("initializes successfully", async () => {
      const status = await getRagStatus();

      expect(status.initialized).toBe(true);
      expect(status.provider).toBe("transformers");
      expect(status.dimensions).toBe(384);
    });
  });

  describe("indexing", () => {
    it("indexes a single document", async () => {
      const result = await indexDocuments(
        [
          {
            id: "doc-1",
            text: "TypeScript is a typed superset of JavaScript.",
            metadata: { source: "test", category: "programming" },
          },
        ],
        testIndexName,
      );

      expect(result.indexed).toBe(1);
    }, 30000);

    it("indexes multiple documents", async () => {
      const result = await indexDocuments(
        [
          {
            id: "doc-2",
            text: "Python is great for data science and machine learning.",
            metadata: { source: "test", category: "programming" },
          },
          {
            id: "doc-3",
            text: "Rust provides memory safety without garbage collection.",
            metadata: { source: "test", category: "programming" },
          },
          {
            id: "doc-4",
            text: "Go was created at Google for concurrent programming.",
            metadata: { source: "test", category: "programming" },
          },
        ],
        testIndexName,
      );

      expect(result.indexed).toBe(3);
    }, 30000);

    it("handles empty array", async () => {
      const result = await indexDocuments([], testIndexName);

      expect(result.indexed).toBe(0);
    });
  });

  describe("searching", () => {
    it("finds relevant documents", async () => {
      const results = await searchKnowledge("What is TypeScript?", {
        indexName: testIndexName,
        topK: 3,
      });

      expect(results.length).toBeGreaterThan(0);
      expect(results[0]).toHaveProperty("id");
      expect(results[0]).toHaveProperty("text");
      expect(results[0]).toHaveProperty("score");
    }, 30000);

    it("returns documents with scores", async () => {
      const results = await searchKnowledge("machine learning", {
        indexName: testIndexName,
        topK: 5,
      });

      for (const result of results) {
        expect(typeof result.score).toBe("number");
        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(1);
      }
    }, 30000);

    it("respects topK limit", async () => {
      const results = await searchKnowledge("programming language", {
        indexName: testIndexName,
        topK: 2,
      });

      expect(results.length).toBeLessThanOrEqual(2);
    }, 30000);
  });

  describe("deletion", () => {
    it("deletes a document by id", async () => {
      // First, add a document to delete
      await indexDocuments(
        [
          {
            id: "delete-me",
            text: "This document will be deleted.",
          },
        ],
        testIndexName,
      );

      // Delete it
      const result = await deleteDocuments(["delete-me"], testIndexName);

      expect(result.deleted).toBe(1);
    }, 30000);

    it("handles empty array", async () => {
      const result = await deleteDocuments([], testIndexName);

      expect(result.deleted).toBe(0);
    });
  });

  describe("clearing", () => {
    it("clears all documents from index", async () => {
      // Clear the main test index
      await clearIndex(testIndexName);

      // Search should return no results
      const results = await searchKnowledge("TypeScript programming", {
        indexName: testIndexName,
        topK: 10,
      });

      expect(results.length).toBe(0);
    }, 30000);
  });
});

describe("RAG provider status", () => {
  it("reports transformers provider (no API key needed)", () => {
    const config = validateEmbeddingConfig();

    expect(config.valid).toBe(true);
    expect(config.provider).toBe("transformers");
  });
});
