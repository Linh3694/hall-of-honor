import { useCallback, useEffect, useState } from "react";
import hallOfHonorService from "../api/hallOfHonorService";

export type AwardBaseState = {
  categories: unknown[];
  records: unknown[];
  schoolYears: unknown[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
};

export type UseAwardBaseDataOptions = {
  /** false: không gọi API (vd. URL chưa có categoryId hợp lệ) */
  enabled?: boolean;
};

/**
 * Fetch song song categories + school years + (tuỳ chọn) records theo categoryId.
 * Dùng chung cho Class/Student/Scholarship/AP (giảm lặp useEffect + loader).
 */
export function useAwardBaseData(
  categoryId?: string,
  options?: UseAwardBaseDataOptions,
): AwardBaseState {
  const enabled = options?.enabled !== false;
  const [categories, setCategories] = useState<unknown[]>([]);
  const [records, setRecords] = useState<unknown[]>([]);
  const [schoolYears, setSchoolYears] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      setError(null);
      setCategories([]);
      setRecords([]);
      setSchoolYears([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [categoriesData, schoolYearsData] = await Promise.all([
        hallOfHonorService.getAwardCategories(),
        hallOfHonorService.getSchoolYears(),
      ]);
      setCategories(categoriesData);
      setSchoolYears(schoolYearsData);
      if (categoryId) {
        const recordsData = await hallOfHonorService.getAwardRecords({
          categoryId,
        });
        setRecords(recordsData);
      } else {
        setRecords([]);
      }
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      setError(err);
      setCategories([]);
      setRecords([]);
      setSchoolYears([]);
    } finally {
      setLoading(false);
    }
  }, [categoryId, enabled]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    categories,
    records,
    schoolYears,
    loading,
    error,
    refetch: load,
  };
}
