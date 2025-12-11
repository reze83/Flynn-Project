/**
 * Refactoring Loop - Enforces documentation research for refactoring suggestions
 *
 * This module implements a mandatory documentation verification workflow
 * for all refactoring operations. It ensures that refactoring suggestions
 * are backed by official documentation from Context7 or Exa.
 *
 * **Verpflichtung (Obligation):**
 * Bei jedem Refactoring-Loop müssen Context7 und Exa Tools verwendet werden,
 * um Best Practices zu recherchieren und zu validieren.
 */

/**
 * Documentation source from Context7 or Exa
 */
export interface DocumentationSource {
  /** Tool used to fetch documentation */
  tool: "context7" | "exa";
  /** Library/resource identifier */
  library: string;
  /** Version (if applicable) */
  version?: string;
  /** URL or reference to documentation */
  url?: string;
  /** Reputation score (from Context7) */
  reputation?: "High" | "Medium" | "Low" | "Unknown";
  /** Benchmark score (from Context7) */
  benchmarkScore?: number;
  /** Number of code snippets (from Context7) */
  codeSnippets?: number;
}

/**
 * A refactoring suggestion with mandatory documentation backing
 */
export interface RefactoringSuggestion {
  /** What is being refactored */
  target: string;
  /** Brief description of the change */
  description: string;
  /** Pattern being applied (e.g., "Extract Method", "Strategy Pattern") */
  pattern: string;
  /** Why this refactoring is beneficial */
  rationale: string;
  /** Code before refactoring */
  before: string;
  /** Code after refactoring */
  after: string;
  /** **MANDATORY**: Documentation sources backing this suggestion */
  sources: DocumentationSource[];
  /** Estimated impact (low, medium, high) */
  impact: "low" | "medium" | "high";
  /** Breaking changes? */
  breaking: boolean;
}

/**
 * Result of documentation verification
 */
export interface DocumentationVerificationResult {
  /** Is the suggestion properly documented? */
  valid: boolean;
  /** Errors preventing approval */
  errors: string[];
  /** Warnings to consider */
  warnings: string[];
  /** Approved suggestion (if valid) */
  suggestion?: RefactoringSuggestion;
}

/**
 * Refactoring Loop State
 */
export interface RefactoringLoopState {
  /** Current phase of the loop */
  phase: "research" | "analyze" | "suggest" | "implement" | "verify";
  /** Documentation sources collected */
  sources: DocumentationSource[];
  /** Suggestions made */
  suggestions: RefactoringSuggestion[];
  /** Implemented suggestions */
  implemented: string[];
  /** Start time */
  startedAt: Date;
}

/** Minimum required length for refactoring rationale */
const MIN_RATIONALE_LENGTH = 20;

/**
 * Validates documentation sources are provided
 *
 * @param sources - Documentation sources to validate
 * @returns Array of error messages (empty if valid)
 */
function validateSources(sources: DocumentationSource[] | undefined): string[] {
  const errors: string[] = [];

  if (!sources || sources.length === 0) {
    errors.push(
      "❌ VERPFLICHTUNG VERLETZT: Keine Dokumentations-Quelle angegeben. Du MUSST Context7 oder Exa verwenden!",
    );
    return errors;
  }

  for (const [idx, source] of sources.entries()) {
    if (!source.library || source.library.trim() === "") {
      errors.push(`❌ Quelle ${idx + 1}: Library-Name fehlt`);
    }
    if (!source.tool) {
      errors.push(`❌ Quelle ${idx + 1}: Tool (context7/exa) nicht angegeben`);
    }
  }

  return errors;
}

/**
 * Validates documentation sources for completeness (warnings only)
 *
 * @param sources - Documentation sources to validate
 * @returns Array of warning messages
 */
function validateSourcesWarnings(sources: DocumentationSource[] | undefined): string[] {
  const warnings: string[] = [];

  if (!sources) return warnings;

  for (const [idx, source] of sources.entries()) {
    if (!source.url) {
      warnings.push(`⚠️ Quelle ${idx + 1}: Kein URL/Link zur Dokumentation`);
    }

    if (source.tool === "context7") {
      if (!source.reputation) {
        warnings.push(`⚠️ Quelle ${idx + 1}: Context7 Reputation fehlt`);
      }
      if (!source.benchmarkScore) {
        warnings.push(`⚠️ Quelle ${idx + 1}: Context7 Benchmark Score fehlt`);
      }
    }
  }

  return warnings;
}

/**
 * Validates that a pattern name is specified
 *
 * @param pattern - Pattern name to validate
 * @returns Array of error messages (empty if valid)
 */
function validatePattern(pattern: string | undefined): string[] {
  const errors: string[] = [];

  if (!pattern || pattern.trim() === "") {
    errors.push(`❌ Pattern-Name fehlt (z.B. 'Factory Pattern', 'Extract Method')`);
  }

  return errors;
}

/**
 * Validates that rationale is substantial
 *
 * @param rationale - Rationale text to validate
 * @returns Array of warning messages
 */
function validateRationale(rationale: string | undefined): string[] {
  const warnings: string[] = [];

  if (!rationale || rationale.length < MIN_RATIONALE_LENGTH) {
    warnings.push(
      `⚠️ Begründung zu kurz (min. ${MIN_RATIONALE_LENGTH} Zeichen). Erkläre WARUM basierend auf der Dokumentation.`,
    );
  }

  return warnings;
}

/**
 * Validates that code examples are provided
 *
 * @param before - Code before refactoring
 * @param after - Code after refactoring
 * @returns Array of error messages (empty if valid)
 */
function validateCodeExamples(before: string | undefined, after: string | undefined): string[] {
  const errors: string[] = [];

  if (!before || !after) {
    errors.push("❌ Vorher/Nachher Code-Beispiele fehlen");
  }

  return errors;
}

/**
 * Validates that a refactoring suggestion has mandatory documentation sources
 *
 * @param suggestion - The refactoring suggestion to validate
 * @returns Verification result with errors/warnings
 *
 * @example
 * ```typescript
 * const suggestion = {
 *   target: "UserService",
 *   pattern: "Dependency Injection",
 *   sources: [{ tool: "context7", library: "TypeDI" }],
 *   // ... other fields
 * };
 *
 * const result = validateDocumentation(suggestion);
 * if (!result.valid) {
 *   console.error("Missing documentation:", result.errors);
 * }
 * ```
 */
export function validateDocumentation(
  suggestion: RefactoringSuggestion,
): DocumentationVerificationResult {
  const errors: string[] = [
    ...validateSources(suggestion.sources),
    ...validatePattern(suggestion.pattern),
    ...validateCodeExamples(suggestion.before, suggestion.after),
  ];

  const warnings: string[] = [
    ...validateSourcesWarnings(suggestion.sources),
    ...validateRationale(suggestion.rationale),
  ];

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    suggestion: errors.length === 0 ? suggestion : undefined,
  };
}

/**
 * Options for creating a Context7 documentation source
 */
export interface Context7SourceOptions {
  /** Library version */
  readonly version?: string;
  /** URL or reference to documentation */
  readonly url?: string;
  /** Reputation score */
  readonly reputation?: "High" | "Medium" | "Low" | "Unknown";
  /** Benchmark quality score */
  readonly benchmarkScore?: number;
  /** Number of available code snippets */
  readonly codeSnippets?: number;
}

/**
 * Creates a documentation source entry for Context7
 *
 * @param libraryId - Context7-compatible library ID (e.g., "/refactoringguru/design-patterns-typescript")
 * @param options - Additional metadata
 * @returns Formatted documentation source
 */
export function createContext7Source(
  libraryId: string,
  options: Context7SourceOptions = {},
): DocumentationSource {
  return {
    tool: "context7",
    library: libraryId,
    ...options,
  };
}

/**
 * Creates a documentation source entry for Exa
 *
 * @param query - Search query used with Exa
 * @param url - URL of the found resource
 * @returns Formatted documentation source
 */
export function createExaSource(query: string, url: string): DocumentationSource {
  return {
    tool: "exa",
    library: query,
    url,
  };
}

/**
 * Enforces the refactoring loop workflow with mandatory documentation research
 *
 * @returns Instructions for the refactoring loop workflow
 */
export function getRefactoringLoopWorkflow(): string {
  return `
# Refactoring Loop Workflow (mit Context7/Exa Verpflichtung)

## Phase 1: Research (VERPFLICHTEND)
1. **Identifiziere** die zu refactorierende Technologie/Library
2. **Recherchiere** mit Context7:
   - \`mcp__context7__resolve-library-id({ libraryName: "..." })\`
   - \`mcp__context7__get-library-docs({ context7CompatibleLibraryID: "..." })\`
3. **Recherchiere** mit Exa:
   - \`mcp__exa__get_code_context_exa({ query: "...", tokensNum: 3000 })\`
   - \`mcp__exa__web_search_exa({ query: "..." })\`

## Phase 2: Analyze
1. **Analysiere** gefundene Best Practices
2. **Identifiziere** anwendbare Patterns
3. **Priorisiere** Refactorings nach Impact

## Phase 3: Suggest
1. **Erstelle** RefactoringSuggestion mit Sources
2. **Validiere** mit \`validateDocumentation()\`
3. **Korrigiere** falls Fehler

## Phase 4: Implement
1. **Implementiere** nur validierte Suggestions
2. **Dokumentiere** Änderungen mit Source-Links
3. **Teste** Behavior unchanged

## Phase 5: Verify
1. **Prüfe** Tests bestehen
2. **Prüfe** Build erfolgreich
3. **Dokumentiere** Ergebnisse

**WICHTIG:** Phase 1 (Research) ist NICHT optional!
`;
}

/**
 * Formats a refactoring suggestion for output
 *
 * @param suggestion - The validated suggestion
 * @returns Formatted markdown output
 */
export function formatRefactoringSuggestion(suggestion: RefactoringSuggestion): string {
  const sourcesFormatted = suggestion.sources
    .map((source, idx) => {
      let line = `${idx + 1}. **${source.tool}**: ${source.library}`;
      if (source.version) line += ` (v${source.version})`;
      if (source.reputation) line += ` [Reputation: ${source.reputation}]`;
      if (source.benchmarkScore) line += ` [Score: ${source.benchmarkScore}]`;
      if (source.url) line += `\n   URL: ${source.url}`;
      if (source.codeSnippets) line += `\n   Code Examples: ${source.codeSnippets}`;
      return line;
    })
    .join("\n");

  return `
## Refactoring: ${suggestion.target}

**Pattern**: ${suggestion.pattern}
**Impact**: ${suggestion.impact}
**Breaking**: ${suggestion.breaking ? "⚠️ Yes" : "✅ No"}

### Beschreibung
${suggestion.description}

### Begründung
${suggestion.rationale}

### Quellen
${sourcesFormatted}

### Vorher
\`\`\`typescript
${suggestion.before}
\`\`\`

### Nachher
\`\`\`typescript
${suggestion.after}
\`\`\`
`;
}
