/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useSelectedSchoolYear } from "./useSelectedSchoolYear";
import type { SchoolYearDoc } from "./schoolYearUtils";

describe("useSelectedSchoolYear", () => {
  const sy2023: SchoolYearDoc = {
    _id: "old",
    code: "2022-2023",
    startDate: "2022-09-01",
    endDate: "2023-06-30",
  };
  const sy2024: SchoolYearDoc = {
    _id: "new",
    code: "2024-2025",
    startDate: "2024-09-01",
    endDate: "2025-06-30",
  };

  it("enabled: false thì không set năm học", async () => {
    const { result } = renderHook(() =>
      useSelectedSchoolYear({
        schoolYears: [sy2023, sy2024],
        displaySchoolYears: [sy2024],
        enabled: false,
      }),
    );
    await waitFor(() => {
      expect(result.current.selectedSchoolYearId).toBe("");
    });
  });

  it("chọn năm mới nhất trong displaySchoolYears khi chưa có lựa chọn", async () => {
    const { result } = renderHook(() =>
      useSelectedSchoolYear({
        schoolYears: [sy2023, sy2024],
        displaySchoolYears: [sy2023, sy2024],
        enabled: true,
      }),
    );

    await waitFor(() => {
      expect(result.current.selectedSchoolYearId).toBe("new");
    });
  });
});
