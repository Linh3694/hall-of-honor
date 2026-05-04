import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CATEGORY_ID_BY_SLUG, SLUG_BY_CATEGORY_ID } from "@/core/config";

/**
 * Đồng bộ slug URL ↔ selectedCategoryId + redirect legacy (scholarship-student/class).
 */
export function useDetailCategoryNavigation() {
  const {
    category,
    recordId,
    studentId,
    classId,
    "ten-sub-award": tenSubAward,
  } = useParams();

  const navigate = useNavigate();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );

  const getCategoryIdFromName = useCallback((name: string | undefined) => {
    if (!name) return null;
    return CATEGORY_ID_BY_SLUG[name] ?? null;
  }, []);

  const getCategoryNameFromId = useCallback((id: string | null | undefined) => {
    if (!id) return null;
    return SLUG_BY_CATEGORY_ID[id] ?? null;
  }, []);

  useEffect(() => {
    if (category) {
      const categoryId = getCategoryIdFromName(category);
      if (categoryId) setSelectedCategoryId(categoryId);
    }
  }, [category, getCategoryIdFromName]);

  useEffect(() => {
    if (category === "scholarship-student" || category === "scholarship-class") {
      navigate("/detail/scholarship-talent", { replace: true });
    }
  }, [category, navigate]);

  useEffect(() => {
    if (!selectedCategoryId) return;
    const categoryName = getCategoryNameFromId(selectedCategoryId);
    if (!categoryName) return;
    if (recordId && (studentId || classId)) return;

    const currentCategoryId = getCategoryIdFromName(category);
    if (tenSubAward && currentCategoryId === selectedCategoryId) return;

    const timeoutId = setTimeout(() => {
      navigate(`/detail/${categoryName}`, { replace: true });
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [
    selectedCategoryId,
    navigate,
    recordId,
    studentId,
    classId,
    tenSubAward,
    category,
    getCategoryIdFromName,
    getCategoryNameFromId,
  ]);

  return {
    selectedCategoryId,
    setSelectedCategoryId,
    getCategoryIdFromName,
    getCategoryNameFromId,
    category,
    recordId,
    studentId,
    classId,
    tenSubAward,
  };
}
