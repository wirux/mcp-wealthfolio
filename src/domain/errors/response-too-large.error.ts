import { DomainError } from "./domain-error.js";

export class ResponseTooLargeError extends DomainError {
  readonly code = "RESPONSE_TOO_LARGE" as const;

  constructor(message: string) {
    super(message);
  }
}
