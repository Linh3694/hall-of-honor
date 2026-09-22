import { describe, expect, it } from "vitest";
import { BASE_URL } from "@/core/config";
import { resolveMediaUrl } from "./mediaUrl";

describe("resolveMediaUrl", () => {
  it("giữ nguyên URL CDN đã ký", () => {
    const url =
      "https://media.wellspring.edu.vn/student-photos/WS1.jpg?e=1&s=abc";
    expect(resolveMediaUrl(url)).toBe(url);
  });

  it("ghép BASE_URL cho /files/ tương đối, không lặp dấu /", () => {
    expect(resolveMediaUrl("/files/a.jpg")).toBe(`${BASE_URL}/files/a.jpg`);
    expect(resolveMediaUrl("files/a.jpg")).toBe(`${BASE_URL}/files/a.jpg`);
  });

  it("trả rỗng khi không có ảnh", () => {
    expect(resolveMediaUrl(null)).toBe("");
    expect(resolveMediaUrl(undefined)).toBe("");
  });
});
