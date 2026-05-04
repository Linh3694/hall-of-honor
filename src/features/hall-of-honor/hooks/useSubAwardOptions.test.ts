/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useSubAwardOptions } from "./useSubAwardOptions";

describe("useSubAwardOptions", () => {
  it("gộp trùng label theo priority nhỏ hơn (ưu tiên cao hơn)", () => {
    const subAwards = [
      { type: "custom", label: "Hạng A", schoolYear: "sy1", priority: 2 },
      { type: "custom", label: "Hạng A", schoolYear: "sy1", priority: 1 },
    ];

    const { result } = renderHook(() =>
      useSubAwardOptions(subAwards, "sy1", { awardType: "custom" }),
    );

    expect(result.current).toHaveLength(1);
    expect(result.current[0].priority).toBe(1);
  });

  it("trả [] khi schoolYearId rỗng", () => {
    const { result } = renderHook(() =>
      useSubAwardOptions(
        [{ type: "custom", label: "X", schoolYear: "sy1", priority: 1 }],
        "",
      ),
    );
    expect(result.current).toEqual([]);
  });
});
