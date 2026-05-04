/**
 * Tiện ích chọn năm học — dùng chung Detail / Student / Class / Scholarship.
 */

export type SchoolYearDoc = {
  _id: unknown;
  startDate?: string;
  endDate?: string;
  code?: string;
  name?: string;
};

/** Id năm học có today thuộc [startDate, endDate] */
export function pickCurrentSchoolYearId(
  schoolYears: SchoolYearDoc[],
): string {
  const today = new Date();
  const currentSy = schoolYears.find((sy) => {
    const start = new Date(sy.startDate ?? "");
    const end = new Date(sy.endDate ?? "");
    return today >= start && today <= end;
  });
  return currentSy ? String(currentSy._id) : "";
}

/** Id năm học mới nhất theo startDate giảm dần */
export function pickNewestSchoolYearIdFromList(
  years: SchoolYearDoc[],
): string {
  if (!years.length) return "";
  const sorted = [...years].sort(
    (a, b) =>
      new Date(b.startDate ?? 0).getTime() -
      new Date(a.startDate ?? 0).getTime(),
  );
  return String(sorted[0]._id);
}
