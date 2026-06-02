export abstract class DomainError extends Error {
  abstract readonly code: string;
  readonly details?: Record<string, unknown>;

  constructor(message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = this.constructor.name;
    if (details !== undefined) {
      this.details = details;
    }
    // Ensure correct prototype chain for instanceof checks in ESM
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
