import { describe, expect, it } from "vitest";

describe("useCollapsibleKeys", () => {
  it("export hook", async () => {
    const mod = await import("./useCollapsibleKeys");
    expect(typeof mod.useCollapsibleKeys).toBe("function");
  });
});
