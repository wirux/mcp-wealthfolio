import { DomainError } from "./domain-error.js";

export class ValidationError extends DomainError {
  readonly code = "VALIDATION_ERROR" as const;
  readonly field?: string;

  constructor(message: string, field?: string, details?: Record<string, unknown>) {
    super(message, { ...(field !== undefined ? { field } : {}), ...details });
    if (field !== undefined) {
      this.field = field;
    }
  }
}
