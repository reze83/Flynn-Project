/**
 * Refactoring Loop Tests
 */

import { describe, expect, it } from "vitest";
import {
  type DocumentationSource,
  type RefactoringSuggestion,
  createContext7Source,
  createExaSource,
  formatRefactoringSuggestion,
  validateDocumentation,
} from "../src/refactoring-loop.js";

describe("Refactoring Loop", () => {
  describe("validateDocumentation", () => {
    it("should reject suggestions without documentation sources", () => {
      const suggestion: RefactoringSuggestion = {
        target: "UserService",
        description: "Extract interface",
        pattern: "Interface Segregation",
        rationale: "Better separation of concerns",
        before: "class UserService {}",
        after: "interface IUserService {}",
        sources: [], // ❌ Empty
        impact: "medium",
        breaking: false,
      };

      const result = validateDocumentation(suggestion);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain("VERPFLICHTUNG VERLETZT");
      expect(result.errors[0]).toContain("Context7 oder Exa");
    });

    it("should accept suggestions with Context7 source", () => {
      const suggestion: RefactoringSuggestion = {
        target: "UserService",
        description: "Extract interface",
        pattern: "Interface Segregation",
        rationale: "According to SOLID principles documentation",
        before: "class UserService {}",
        after: "interface IUserService {}",
        sources: [
          {
            tool: "context7",
            library: "/refactoringguru/design-patterns-typescript",
            reputation: "High",
            benchmarkScore: 74.1,
            url: "https://refactoring.guru/...",
          },
        ],
        impact: "medium",
        breaking: false,
      };

      const result = validateDocumentation(suggestion);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should accept suggestions with Exa source", () => {
      const suggestion: RefactoringSuggestion = {
        target: "UserService",
        description: "Apply Factory Pattern",
        pattern: "Factory Pattern",
        rationale: "Based on TypeScript best practices from Exa research",
        before: "const user = new User();",
        after: "const user = UserFactory.create();",
        sources: [
          {
            tool: "exa",
            library: "TypeScript factory pattern best practices",
            url: "https://medium.com/...",
          },
        ],
        impact: "medium",
        breaking: false,
      };

      const result = validateDocumentation(suggestion);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should warn if source is missing URL", () => {
      const suggestion: RefactoringSuggestion = {
        target: "UserService",
        description: "Refactor",
        pattern: "Some Pattern",
        rationale: "Good reasons here with at least 20 characters",
        before: "before",
        after: "after",
        sources: [
          {
            tool: "context7",
            library: "/some/library",
            // ⚠️ Missing URL
          },
        ],
        impact: "low",
        breaking: false,
      };

      const result = validateDocumentation(suggestion);

      expect(result.valid).toBe(true);
      expect(result.warnings.some((w) => w.includes("Kein URL"))).toBe(true);
    });

    it("should reject if pattern is missing", () => {
      const suggestion: RefactoringSuggestion = {
        target: "UserService",
        description: "Refactor",
        pattern: "", // ❌ Empty
        rationale: "Some rationale",
        before: "before",
        after: "after",
        sources: [
          {
            tool: "context7",
            library: "/some/library",
            url: "https://example.com",
          },
        ],
        impact: "low",
        breaking: false,
      };

      const result = validateDocumentation(suggestion);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("Pattern-Name"))).toBe(true);
    });

    it("should warn if rationale is too short", () => {
      const suggestion: RefactoringSuggestion = {
        target: "UserService",
        description: "Refactor",
        pattern: "Some Pattern",
        rationale: "Short", // ⚠️ Too short
        before: "before",
        after: "after",
        sources: [
          {
            tool: "context7",
            library: "/some/library",
            url: "https://example.com",
          },
        ],
        impact: "low",
        breaking: false,
      };

      const result = validateDocumentation(suggestion);

      expect(result.valid).toBe(true);
      expect(result.warnings.some((w) => w.includes("Begründung zu kurz"))).toBe(true);
    });

    it("should validate source has library name", () => {
      const suggestion: RefactoringSuggestion = {
        target: "Test",
        description: "Test",
        pattern: "Test Pattern",
        rationale: "Long enough rationale here",
        before: "before",
        after: "after",
        sources: [
          {
            tool: "context7",
            library: "", // ❌ Empty
            url: "https://example.com",
          },
        ],
        impact: "low",
        breaking: false,
      };

      const result = validateDocumentation(suggestion);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("Library-Name"))).toBe(true);
    });
  });

  describe("createContext7Source", () => {
    it("should create a Context7 source", () => {
      const source = createContext7Source("/refactoringguru/design-patterns-typescript", {
        reputation: "High",
        benchmarkScore: 74.1,
        codeSnippets: 37,
        url: "https://refactoring.guru",
      });

      expect(source).toEqual({
        tool: "context7",
        library: "/refactoringguru/design-patterns-typescript",
        reputation: "High",
        benchmarkScore: 74.1,
        codeSnippets: 37,
        url: "https://refactoring.guru",
      });
    });

    it("should create a minimal Context7 source", () => {
      const source = createContext7Source("/some/library");

      expect(source).toEqual({
        tool: "context7",
        library: "/some/library",
      });
    });
  });

  describe("createExaSource", () => {
    it("should create an Exa source", () => {
      const source = createExaSource(
        "TypeScript factory pattern",
        "https://medium.com/factory-pattern",
      );

      expect(source).toEqual({
        tool: "exa",
        library: "TypeScript factory pattern",
        url: "https://medium.com/factory-pattern",
      });
    });
  });

  describe("formatRefactoringSuggestion", () => {
    it("should format a suggestion with sources", () => {
      const suggestion: RefactoringSuggestion = {
        target: "UserService",
        description: "Extract interface for better testability",
        pattern: "Interface Segregation Principle",
        rationale: "According to SOLID principles, interfaces should be segregated",
        before: "class UserService { }",
        after: "interface IUserService { }\\nclass UserService implements IUserService { }",
        sources: [
          {
            tool: "context7",
            library: "/refactoringguru/design-patterns-typescript",
            reputation: "High",
            benchmarkScore: 74.1,
            url: "https://refactoring.guru",
          },
          {
            tool: "exa",
            library: "SOLID principles TypeScript",
            url: "https://example.com/solid",
          },
        ],
        impact: "medium",
        breaking: false,
      };

      const formatted = formatRefactoringSuggestion(suggestion);

      expect(formatted).toContain("## Refactoring: UserService");
      expect(formatted).toContain("**Pattern**: Interface Segregation Principle");
      expect(formatted).toContain("**Impact**: medium");
      expect(formatted).toContain("**Breaking**: ✅ No");
      expect(formatted).toContain("1. **context7**: /refactoringguru/design-patterns-typescript");
      expect(formatted).toContain("[Reputation: High]");
      expect(formatted).toContain("[Score: 74.1]");
      expect(formatted).toContain("2. **exa**: SOLID principles TypeScript");
      expect(formatted).toContain("### Vorher");
      expect(formatted).toContain("### Nachher");
    });

    it("should show breaking change warning", () => {
      const suggestion: RefactoringSuggestion = {
        target: "API",
        description: "Change endpoint",
        pattern: "API Versioning",
        rationale: "Breaking change for better structure",
        before: "GET /users",
        after: "GET /v2/users",
        sources: [createContext7Source("/some/api-guide")],
        impact: "high",
        breaking: true, // ⚠️ Breaking
      };

      const formatted = formatRefactoringSuggestion(suggestion);

      expect(formatted).toContain("**Breaking**: ⚠️ Yes");
    });
  });
});
