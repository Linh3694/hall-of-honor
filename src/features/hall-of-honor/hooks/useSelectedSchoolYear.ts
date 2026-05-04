import { useEffect, useState } from "react";
import type { SchoolYearDoc } from "./schoolYearUtils";
import {
  pickCurrentSchoolYearId,
  pickNewestSchoolYearIdFromList,
} from "./schoolYearUtils";

export type UseSelectedSchoolYearArgs = {
  schoolYears: SchoolYearDoc[];
  /** Năm học hiển thị trong dropdown (đã lọc theo category/records) */
  displaySchoolYears: SchoolYearDoc[];
  /**
   * false: không auto-chọn (vd. StudentHonor khi category nhóm theo năm riêng).
   */
  enabled?: boolean;
};

/**
 * State năm học + auto chọn: ưu tiên năm đang diễn ra trong displaySchoolYears,
 * không có thì năm mới nhất (theo startDate).
 */
export function useSelectedSchoolYear({
  schoolYears,
  displaySchoolYears,
  enabled = true,
}: UseSelectedSchoolYearArgs) {
  const [selectedSchoolYearId, setSelectedSchoolYearId] = useState("");

  useEffect(() => {
    if (!enabled) return;
    if (selectedSchoolYearId || displaySchoolYears.length === 0) return;

    const cur = pickCurrentSchoolYearId(schoolYears);
    const curInDisplay =
      cur &&
      displaySchoolYears.some((sy) => String(sy._id) === String(cur));

    setSelectedSchoolYearId(
      curInDisplay ? cur : pickNewestSchoolYearIdFromList(displaySchoolYears),
    );
  }, [enabled, selectedSchoolYearId, displaySchoolYears, schoolYears]);

  return { selectedSchoolYearId, setSelectedSchoolYearId };
}
