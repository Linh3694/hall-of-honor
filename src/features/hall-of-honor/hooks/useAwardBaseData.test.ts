/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useAwardBaseData } from "./useAwardBaseData";

const mockGetCategories = vi.fn();
const mockGetSchoolYears = vi.fn();
const mockGetRecords = vi.fn();

vi.mock("../api/hallOfHonorService", () => ({
  default: {
    getAwardCategories: (...args: unknown[]) => mockGetCategories(...args),
    getSchoolYears: (...args: unknown[]) => mockGetSchoolYears(...args),
    getAwardRecords: (...args: unknown[]) => mockGetRecords(...args),
  },
}));

describe("useAwardBaseData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCategories.mockResolvedValue([{ _id: "cat-1", name: "Cat" }]);
    mockGetSchoolYears.mockResolvedValue([{ _id: "sy-1", code: "2024-2025" }]);
    mockGetRecords.mockResolvedValue([{ _id: "rec-1" }]);
  });

  it("không gọi API khi enabled: false", async () => {
    const { result } = renderHook(() =>
      useAwardBaseData("cat-1", { enabled: false }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockGetCategories).not.toHaveBeenCalled();
    expect(result.current.categories).toEqual([]);
  });

  it("fetch categories + schoolYears + records khi có categoryId", async () => {
    const { result } = renderHook(() => useAwardBaseData("cat-1"));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockGetCategories).toHaveBeenCalledTimes(1);
    expect(mockGetSchoolYears).toHaveBeenCalledTimes(1);
    expect(mockGetRecords).toHaveBeenCalledWith({ categoryId: "cat-1" });
    expect(result.current.records).toEqual([{ _id: "rec-1" }]);
  });
});
