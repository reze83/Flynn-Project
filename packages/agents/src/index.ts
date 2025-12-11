/**
 * Flynn Agents Package
 *
 * NOTE: Agent execution has moved to Claude Code.
 * This package now exports:
 * - Workflows (LLM-free multi-step operations)
 * - RAG utilities (for future use)
 */

// Workflows (LLM-free, can still be used)
export { analysisWorkflow, bootstrapWorkflow } from "./workflows/index.js";

// RAG (Retrieval-Augmented Generation)
export {
  initializeRag,
  indexDocuments,
  searchKnowledge,
  deleteDocuments,
  clearIndex,
  getRagStatus,
  type RagConfig,
  type SearchResult,
  type DocumentChunk,
} from "./rag.js";

// Embeddings (local Hugging Face Transformers.js - no API key required)
export {
  embed,
  embedMany,
  getEmbeddingDimensions,
  getEmbeddingConfig,
  validateEmbeddingConfig,
} from "./embeddings.js";
