/**
 * Safe JSON Parsing Utilities
 *
 * SECURITY: Prevents prototype pollution attacks by filtering dangerous keys
 * during JSON parsing. All external JSON data should be parsed through these utilities.
 */

/**
 * Safely parse JSON with prototype pollution protection
 *
 * @param content - JSON string to parse
 * @returns Parsed object with dangerous keys filtered out
 * @throws SyntaxError if JSON is invalid
 *
 * @example
 * ```typescript
 * // Safe usage
 * const data = safeJsonParse<MyType>('{"name": "test"}');
 *
 * // Malicious input is neutralized
 * const data = safeJsonParse('{"__proto__": {"polluted": true}}');
 * // Result: {} - no pollution
 * ```
 */
export function safeJsonParse<T>(content: string): T {
  return JSON.parse(content, (key, value) => {
    // Block prototype pollution attempts
    if (key === "__proto__" || key === "constructor" || key === "prototype") {
      return undefined;
    }
    return value;
  }) as T;
}

/**
 * Safely parse JSON with default value on error
 *
 * @param content - JSON string to parse
 * @param defaultValue - Value to return if parsing fails
 * @returns Parsed object or default value
 */
export function safeJsonParseOrDefault<T>(content: string, defaultValue: T): T {
  try {
    return safeJsonParse<T>(content);
  } catch {
    return defaultValue;
  }
}

/**
 * Check if a value contains prototype pollution attempts
 *
 * @param obj - Object to check
 * @returns true if dangerous keys are detected
 */
export function hasPrototypePollution(obj: unknown): boolean {
  if (obj === null || typeof obj !== "object") {
    return false;
  }

  const dangerousKeys = ["__proto__", "constructor", "prototype"];

  for (const key of Object.keys(obj as object)) {
    if (dangerousKeys.includes(key)) {
      return true;
    }
    // Recursively check nested objects
    const value = (obj as Record<string, unknown>)[key];
    if (hasPrototypePollution(value)) {
      return true;
    }
  }

  return false;
}
