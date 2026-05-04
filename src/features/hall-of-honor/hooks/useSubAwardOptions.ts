import { useMemo } from "react";
import {
  compareSubAwardsByPriorityAsc,
  pickPreferredSubAwardRow,
  subAwardDedupeKey,
} from "@/core/config";

export type SubAwardOptionRow = {
  type?: string;
  label?: string;
  labelEng?: string;
  schoolYear?: unknown;
  priority?: number;
  coverImage?: string | null;
};

export type UseSubAwardOptionsArgs = {
  /** Danh sách subAward từ category CMS */
  subAwards: SubAwardOptionRow[] | undefined;
  /** Năm học đang chọn (chuỗi id) */
  schoolYearId: string;
  /** Chỉ lấy subAward.type === awardType */
  awardType?: string;
  /** false → trả về [] (vd. AP khi groupBySubAward = false) */
  enabled?: boolean;
};

/**
 * Tiểu mục (custom…) theo năm — gộp trùng dedupeKey + sort priority (cùng logic HB Tài năng / AP).
 */
export function useSubAwardOptions(
  subAwards: SubAwardOptionRow[] | undefined,
  schoolYearId: string,
  {
    awardType = "custom",
    enabled = true,
  }: Partial<Omit<UseSubAwardOptionsArgs, "subAwards" | "schoolYearId">> = {},
): SubAwardOptionRow[] {
  return useMemo(() => {
    if (!enabled || !schoolYearId) return [];
    const raw = (subAwards || []).filter(
      (sub) =>
        sub.type === awardType &&
        String(sub.schoolYear) === String(schoolYearId),
    );
    const byKey = new Map<string, SubAwardOptionRow>();
    raw.forEach((s) => {
      if (!s.label) return;
      const key = subAwardDedupeKey(s.label);
      const prev = byKey.get(key);
      // pickPreferredSubAwardRow trả T | null | undefined — luôn fallback về s cho Map
      const row: SubAwardOptionRow =
        prev !== undefined
          ? (pickPreferredSubAwardRow(prev, s) ?? s)
          : s;
      byKey.set(key, row);
    });
    return [...byKey.values()].sort(compareSubAwardsByPriorityAsc);
  }, [subAwards, schoolYearId, awardType, enabled]);
}
