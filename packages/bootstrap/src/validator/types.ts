/**
 * Validator types
 */

export interface ValidationResult {
  component: string;
  valid: boolean;
  message: string;
  details?: string;
}

export interface ValidationReport {
  timestamp: string;
  results: ValidationResult[];
  allValid: boolean;
  summary: {
    passed: number;
    failed: number;
    total: number;
  };
}

export interface Validator {
  name: string;
  validate(): Promise<ValidationResult>;
}
