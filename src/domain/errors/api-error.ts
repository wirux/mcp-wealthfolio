import { DomainError } from "./domain-error.js";

export class ApiError extends DomainError {
  readonly code = "API_ERROR" as const;
  readonly statusCode: number;

  constructor(message: string, statusCode: number, body?: unknown) {
    super(message, { statusCode, ...(body !== undefined ? { body } : {}) });
    this.statusCode = statusCode;
  }
}
