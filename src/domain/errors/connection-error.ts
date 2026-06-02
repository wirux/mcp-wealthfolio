import { DomainError } from "./domain-error.js";

export type ConnectionErrorCode = "CONNECTION_FAILED" | "CONNECTION_TIMEOUT";

export class ConnectionError extends DomainError {
  readonly code: ConnectionErrorCode;

  constructor(
    message: string,
    code: ConnectionErrorCode = "CONNECTION_FAILED",
    details?: Record<string, unknown>,
  ) {
    super(message, details);
    this.code = code;
  }
}
