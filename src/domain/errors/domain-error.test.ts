import { describe, expect, it } from "vitest";
import { ApiError } from "./api-error.js";
import { AuthenticationError } from "./authentication-error.js";
import { ConnectionError } from "./connection-error.js";
import { DomainError } from "./domain-error.js";
import { InvalidTargetAllocationError } from "./invalid-target-allocation-error.js";
import { ValidationError } from "./validation-error.js";

describe("DomainError hierarchy", () => {
  describe("AuthenticationError", () => {
    it("has AUTH_FAILED code", () => {
      const err = new AuthenticationError("Login failed");
      expect(err.code).toBe("AUTH_FAILED");
    });

    it("is instanceof DomainError and Error", () => {
      const err = new AuthenticationError("Login failed");
      expect(err).toBeInstanceOf(DomainError);
      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(AuthenticationError);
    });

    it("has correct name and message", () => {
      const err = new AuthenticationError("Session expired");
      expect(err.name).toBe("AuthenticationError");
      expect(err.message).toBe("Session expired");
    });

    it("stores optional details", () => {
      const err = new AuthenticationError("Login failed", { attempts: 3 });
      expect(err.details).toEqual({ attempts: 3 });
    });
  });

  describe("ConnectionError", () => {
    it("defaults to CONNECTION_FAILED code", () => {
      const err = new ConnectionError("Unreachable");
      expect(err.code).toBe("CONNECTION_FAILED");
    });

    it("accepts CONNECTION_TIMEOUT code", () => {
      const err = new ConnectionError("Timed out", "CONNECTION_TIMEOUT");
      expect(err.code).toBe("CONNECTION_TIMEOUT");
    });

    it("is instanceof DomainError", () => {
      const err = new ConnectionError("Unreachable");
      expect(err).toBeInstanceOf(DomainError);
      expect(err).toBeInstanceOf(ConnectionError);
    });

    it("has correct name and message", () => {
      const err = new ConnectionError("Host not found");
      expect(err.name).toBe("ConnectionError");
      expect(err.message).toBe("Host not found");
    });
  });

  describe("ApiError", () => {
    it("has API_ERROR code", () => {
      const err = new ApiError("Not found", 404);
      expect(err.code).toBe("API_ERROR");
    });

    it("stores statusCode", () => {
      const err = new ApiError("Not found", 404);
      expect(err.statusCode).toBe(404);
    });

    it("is instanceof DomainError", () => {
      const err = new ApiError("Server error", 500);
      expect(err).toBeInstanceOf(DomainError);
      expect(err).toBeInstanceOf(ApiError);
    });

    it("stores body in details", () => {
      const err = new ApiError("Bad request", 400, { message: "invalid input" });
      expect(err.details?.["body"]).toEqual({ message: "invalid input" });
      expect(err.details?.["statusCode"]).toBe(400);
    });

    it("omits body from details when not provided", () => {
      const err = new ApiError("Not found", 404);
      expect(err.details?.["body"]).toBeUndefined();
      expect(err.details?.["statusCode"]).toBe(404);
    });
  });

  describe("ValidationError", () => {
    it("has VALIDATION_ERROR code", () => {
      const err = new ValidationError("Invalid input");
      expect(err.code).toBe("VALIDATION_ERROR");
    });

    it("stores optional field name", () => {
      const err = new ValidationError("Required", "email");
      expect(err.field).toBe("email");
      expect(err.details?.["field"]).toBe("email");
    });

    it("is instanceof DomainError", () => {
      const err = new ValidationError("Invalid input");
      expect(err).toBeInstanceOf(DomainError);
      expect(err).toBeInstanceOf(ValidationError);
    });

    it("field is undefined when not provided", () => {
      const err = new ValidationError("Invalid input");
      expect(err.field).toBeUndefined();
    });
  });

  describe("InvalidTargetAllocationError", () => {
    it("has INVALID_TARGET_ALLOCATION code", () => {
      const err = new InvalidTargetAllocationError({ AAPL: 0.6, MSFT: 0.35 }, 0.95);
      expect(err.code).toBe("INVALID_TARGET_ALLOCATION");
    });

    it("stores weights and sum", () => {
      const weights = { AAPL: 0.6, MSFT: 0.35 };
      const err = new InvalidTargetAllocationError(weights, 0.95);
      expect(err.weights).toEqual(weights);
      expect(err.sum).toBe(0.95);
    });

    it("is instanceof DomainError", () => {
      const err = new InvalidTargetAllocationError({ AAPL: 1.1 }, 1.1);
      expect(err).toBeInstanceOf(DomainError);
      expect(err).toBeInstanceOf(InvalidTargetAllocationError);
    });

    it("message includes the sum", () => {
      const err = new InvalidTargetAllocationError({ AAPL: 0.6, MSFT: 0.35 }, 0.95);
      expect(err.message).toContain("0.9500");
      expect(err.message).toContain("1.0");
    });

    it("stores weights in details", () => {
      const weights = { VTI: 0.7, BND: 0.3 };
      const err = new InvalidTargetAllocationError(weights, 1.0);
      expect(err.details?.["weights"]).toEqual(weights);
    });
  });
});
