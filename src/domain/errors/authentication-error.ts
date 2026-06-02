import { DomainError } from "./domain-error.js";

export class AuthenticationError extends DomainError {
  readonly code = "AUTH_FAILED" as const;

  constructor(message: string, details?: Record<string, unknown>) {
    super(message, details);
  }
}
