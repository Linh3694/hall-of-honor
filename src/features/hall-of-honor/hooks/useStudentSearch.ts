import { useMemo } from "react";
import { normalizeSearchKey } from "@/shared/lib/textSearch";

/** Chuẩn hoá ô tìm kiếm (tên / lớp / số) — dùng chung listing học sinh. */
export function useStudentSearchQuery(searchRaw: string) {
  const trimmed = searchRaw.trim();
  const normalizedTerm = useMemo(
    () => normalizeSearchKey(trimmed),
    [trimmed],
  );
  const isNumericSearch = useMemo(() => /^\d+$/.test(trimmed), [trimmed]);

  return { normalizedTerm, isNumericSearch, trimmed };
}
