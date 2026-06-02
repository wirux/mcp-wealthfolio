import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ConsoleLogger } from "./logger.js";

describe("ConsoleLogger", () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does NOT emit debug when level is info", () => {
    const logger = new ConsoleLogger("info");
    logger.debug("msg");
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("emits info when level is info", () => {
    const logger = new ConsoleLogger("info");
    logger.info("msg");
    expect(errorSpy).toHaveBeenCalledOnce();
    expect(errorSpy.mock.calls[0]?.[0]).toContain("[INFO] msg");
  });

  it("emits debug when level is debug", () => {
    const logger = new ConsoleLogger("debug");
    logger.debug("msg");
    expect(errorSpy).toHaveBeenCalledOnce();
    expect(errorSpy.mock.calls[0]?.[0]).toContain("[DEBUG] msg");
  });

  it("redacts password field", () => {
    const logger = new ConsoleLogger("info");
    logger.info("login", { password: "secret123" });
    const output = errorSpy.mock.calls[0]?.[0] as string;
    expect(output).toContain("[REDACTED]");
    expect(output).not.toContain("secret123");
  });

  it("redacts token field", () => {
    const logger = new ConsoleLogger("info");
    logger.info("auth", { token: "abc" });
    const output = errorSpy.mock.calls[0]?.[0] as string;
    expect(output).toContain("[REDACTED]");
    expect(output).not.toContain("abc");
  });

  it("never calls console.log", () => {
    const logger = new ConsoleLogger("trace");
    logger.debug("d");
    logger.info("i");
    logger.warn("w");
    logger.error("e");
    expect(logSpy).not.toHaveBeenCalled();
  });

  it("redacts nested cookie field", () => {
    const logger = new ConsoleLogger("error");
    logger.error("msg", { nested: { cookie: "xyz" } });
    const output = errorSpy.mock.calls[0]?.[0] as string;
    expect(output).toContain("[REDACTED]");
    expect(output).not.toContain("xyz");
  });

  it("does NOT emit warn when level is error", () => {
    const logger = new ConsoleLogger("error");
    logger.warn("msg");
    expect(errorSpy).not.toHaveBeenCalled();
  });
});
