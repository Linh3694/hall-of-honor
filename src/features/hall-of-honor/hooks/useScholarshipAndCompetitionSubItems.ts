import { useEffect, useState } from "react";
import hallOfHonorService from "../api/hallOfHonorService";
import {
  SCHOLARSHIP_SUB_AWARDS_FALLBACK,
  SCHOLARSHIP_TALENT_CATEGORY_ID,
  COMPETITION_ACHIEVEMENT_CATEGORY_ID,
  subAwardLabelToSlug,
  subAwardDedupeKey,
  pickPreferredSubAwardRow,
  compareSubAwardsByPriorityAsc,
} from "@/core/config";

export type SidebarSubItemRow = {
  label: string;
  labelEng?: string | null;
  slug: string;
  priority?: string | number | null;
};

/**
 * Tiểu mục động học bổng tài năng + thành tích cuộc thi — logic gom từ Sidebar.
 */
export function useScholarshipAndCompetitionSubItems() {
  const [scholarshipSubItems, setScholarshipSubItems] = useState<
    SidebarSubItemRow[]
  >(() =>
    SCHOLARSHIP_SUB_AWARDS_FALLBACK.map((s) => ({
      label: s.label,
      labelEng: "labelEng" in s ? (s as { labelEng?: string }).labelEng : undefined,
      slug: subAwardLabelToSlug(s.label),
      priority: s.priority ?? 9999,
    })),
  );

  const [competitionSubItems, setCompetitionSubItems] = useState<
    SidebarSubItemRow[]
  >([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const categories = await hallOfHonorService.getAwardCategories();
        if (cancelled) return;

        const mergeCustomSubs = (cat: {
          subAwards?: Array<{
            type?: string;
            label?: string | null;
            labelEng?: string | null;
            priority?: string | number | null;
          }>;
        }) => {
          const raw = (cat?.subAwards || []).filter((s) => s.type === "custom");
          const byKey = new Map<string, (typeof raw)[0]>();
          raw.forEach((s) => {
            if (!s.label) return;
            const key = subAwardDedupeKey(s.label);
            const prev = byKey.get(key);
            if (!prev) byKey.set(key, s);
            else {
              const picked = pickPreferredSubAwardRow(prev, s);
              byKey.set(key, picked != null ? picked : s);
            }
          });
          return [...byKey.values()].sort(compareSubAwardsByPriorityAsc);
        };

        const talentCat = categories.find(
          (c: { _id?: string }) =>
            c._id === SCHOLARSHIP_TALENT_CATEGORY_ID,
        );
        const talentMerged = mergeCustomSubs(talentCat || {});
        if (talentMerged.length > 0) {
          setScholarshipSubItems(
            talentMerged.map((s) => ({
              label: s.label || "",
              labelEng: s.labelEng,
              slug: subAwardLabelToSlug(s.label),
              priority: s.priority,
            })),
          );
        }

        const compCat = categories.find(
          (c: { _id?: string }) =>
            c._id === COMPETITION_ACHIEVEMENT_CATEGORY_ID,
        );
        const compMerged = mergeCustomSubs(compCat || {});
        setCompetitionSubItems(
          compMerged.map((s) => ({
            label: s.label || "",
            labelEng: s.labelEng,
            slug: subAwardLabelToSlug(s.label),
            priority: s.priority,
          })),
        );
      } catch {
        /* giữ fallback học bổng; cuộc thi để rỗng */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { scholarshipSubItems, competitionSubItems };
}
