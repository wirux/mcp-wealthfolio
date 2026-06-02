import { describe, expect, it } from "vitest";

import { AssetSymbol } from "./asset-symbol.js";

describe("AssetSymbol", () => {
  it("keeps uppercase symbol unchanged", () => {
    expect(AssetSymbol.create("VTI").value).toBe("VTI");
  });

  it("uppercases lowercase symbol", () => {
    expect(AssetSymbol.create("vti").value).toBe("VTI");
  });

  it("preserves exchange suffix while uppercasing", () => {
    expect(AssetSymbol.create("BP.L").value).toBe("BP.L");
    expect(AssetSymbol.create("sap.de").value).toBe("SAP.DE");
  });

  it("trims surrounding whitespace", () => {
    expect(AssetSymbol.create("  aapl  ").value).toBe("AAPL");
  });

  it("rejects empty string", () => {
    expect(() => AssetSymbol.create("")).toThrow(/cannot be empty/);
  });

  it("rejects whitespace-only string", () => {
    expect(() => AssetSymbol.create("  ")).toThrow(/cannot be empty/);
  });

  it("rejects non-string input", () => {
    expect(() => AssetSymbol.create(123)).toThrow(/Invalid asset symbol/);
  });

  it("returns normalized value from toString", () => {
    expect(AssetSymbol.create("vti.wa").toString()).toBe("VTI.WA");
  });
});
