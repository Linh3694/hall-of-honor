import { describe, expect, it } from "vitest";
import { normalizeSearchKey, removeDiacritics } from "./textSearch";

describe("textSearch", () => {
  it("removeDiacritics bỏ dấu kết hợp (ví dụ é → e)", () => {
    expect(removeDiacritics("café")).toBe("cafe");
  });

  it("normalizeSearchKey chuẩn hoá tìm kiếm", () => {
    expect(normalizeSearchKey("  Lớp 12A-1  ")).toBe("lop12a1");
  });
});
