/**
 * ID danh mục giải thưởng + map slug ↔ ID — gom một chỗ (plan: categories.ts)
 */

// Một SIS Award Category "Học bổng Tài năng"; các hạng mục con là dòng sub_categories (type custom) trên Frappe
export const SCHOLARSHIP_TALENT_CATEGORY_ID =
  import.meta.env.VITE_SCHOLARSHIP_TALENT_CATEGORY_ID ||
  "SIS-AWARD-CAT-4409109";

// Khóa nhóm sidebar (không phải DocType Frappe)
export const SCHOLARSHIP_TALENT_PARENT_ID = "scholarship_talent_parent";

/** Học sinh Danh dự — DocType SIS Award Category */
export const HONOR_STUDENT_CATEGORY_ID =
  import.meta.env.VITE_HONOR_STUDENT_CATEGORY_ID ||
  "SIS-AWARD-CAT-4373820";

/** Lớp Danh dự */
export const HONOR_CLASS_CATEGORY_ID =
  import.meta.env.VITE_HONOR_CLASS_CATEGORY_ID || "SIS-AWARD-CAT-4409107";

/** WISers Nỗ lực */
export const WISER_EFFORT_CATEGORY_ID =
  import.meta.env.VITE_WISER_EFFORT_CATEGORY_ID || "SIS-AWARD-CAT-4409108";

/** Thành tích các bài thi chuẩn hóa quốc tế */
export const STANDARDIZED_TEST_CATEGORY_ID =
  import.meta.env.VITE_STANDARDIZED_TEST_CATEGORY_ID ||
  "SIS-AWARD-CAT-4409110";

/** Học bổng Toả sáng — `name` từ Frappe (title_vn: Học bổng / Toả sáng) */
export const SCHOLARSHIP_SHINE_CATEGORY_ID =
  import.meta.env.VITE_SCHOLARSHIP_SHINE_CATEGORY_ID ||
  "SIS-AWARD-CAT-5709053";

/** Học bổng AP (AP Diploma) — `name` từ Frappe (title_vn: Học bổng / AP) */
export const SCHOLARSHIP_AP_CATEGORY_ID =
  import.meta.env.VITE_SCHOLARSHIP_AP_CATEGORY_ID ||
  "SIS-AWARD-CAT-5709012";

/** Thủ khoa Tốt nghiệp — `name` DocType SIS Award Category */
export const TOP_GRADUATE_CATEGORY_ID =
  import.meta.env.VITE_TOP_GRADUATE_CATEGORY_ID ||
  "SIS-AWARD-CAT-5798797";

/** WISers Ưu tú */
export const WISER_EXCELLENT_CATEGORY_ID =
  import.meta.env.VITE_WISER_EXCELLENT_CATEGORY_ID ||
  "SIS-AWARD-CAT-5798816";

/** WISers Truyền cảm hứng */
export const WISER_INSPIRATION_CATEGORY_ID =
  import.meta.env.VITE_WISER_INSPIRATION_CATEGORY_ID ||
  "SIS-AWARD-CAT-5798828";

/** Cover mặc định (public/) khi CMS chưa gán cover_image */
export const WISER_EXCELLENT_DEFAULT_COVER_PATH = "/wiser-uu-tu.png";
export const WISER_INSPIRATION_DEFAULT_COVER_PATH =
  "/wiser-truyen-cam-hung.png";

/** Thành tích cuộc thi và giải đấu */
export const COMPETITION_ACHIEVEMENT_CATEGORY_ID =
  import.meta.env.VITE_COMPETITION_ACHIEVEMENT_CATEGORY_ID ||
  "SIS-AWARD-CAT-5798829";

export const COMPETITION_ACHIEVEMENT_PARENT_ID =
  "competition_achievements_parent";

export function subAwardLabelToSlug(label: string | null | undefined): string {
  if (!label || typeof label !== "string") return "";
  return label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

export function subAwardDedupeKey(label: string | null | undefined): string {
  if (!label || typeof label !== "string") return "";
  return label
    .trim()
    .replace(/\s+/g, " ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function subAwardPrioritySortValue(
  priority: string | number | null | undefined
): number {
  if (priority === null || priority === undefined || priority === "") return 9999;
  const n = Number(priority);
  if (!Number.isFinite(n)) return 9999;
  if (n < 1) return 9999;
  return n;
}

export function compareSubAwardsByPriorityAsc(
  a: { priority?: string | number | null; label?: string | null } | null | undefined,
  b: { priority?: string | number | null; label?: string | null } | null | undefined
): number {
  const da = subAwardPrioritySortValue(a?.priority);
  const db = subAwardPrioritySortValue(b?.priority);
  if (da !== db) return da - db;
  return subAwardDedupeKey(a?.label || "").localeCompare(
    subAwardDedupeKey(b?.label || ""),
    "vi"
  );
}

export type SubAwardRowLite = {
  priority?: string | number | null;
  label?: string | null;
  labelEng?: string | null;
};

export function pickPreferredSubAwardRow<T extends SubAwardRowLite>(
  existing: T | null | undefined,
  next: T | null | undefined
): T | null | undefined {
  if (existing == null) return next ?? undefined;
  if (next == null) return existing;
  const pe = subAwardPrioritySortValue(existing.priority);
  const pn = subAwardPrioritySortValue(next.priority);
  if (pn !== pe) return pn < pe ? next : existing;
  const le = (existing.labelEng || "").length;
  const ln = (next.labelEng || "").length;
  if (ln !== le) return ln > le ? next : existing;
  return (existing.label || "").length >= (next.label || "").length
    ? existing
    : next;
}

export const SCHOLARSHIP_SUB_AWARDS_FALLBACK = [
  { label: "Giải thưởng Ý tưởng Sáng tạo", priority: 1 },
  { label: "Học bổng Danh dự Wellspring", priority: 2 },
  { label: "Học bổng Hạnh phúc Wellspring", priority: 3 },
  { label: "Học bổng Khởi đầu Hạnh phúc", priority: 4 },
  { label: "Học bổng Khát vọng Wellspring", priority: 5 },
];

export const CATEGORY_ID_BY_SLUG: Record<string, string> = {
  "scholarship-talent": SCHOLARSHIP_TALENT_CATEGORY_ID,
  "honor-student": HONOR_STUDENT_CATEGORY_ID,
  "honor-class": HONOR_CLASS_CATEGORY_ID,
  "wisers-effort": WISER_EFFORT_CATEGORY_ID,
  "standardized-test": STANDARDIZED_TEST_CATEGORY_ID,
  "scholarship-shine": SCHOLARSHIP_SHINE_CATEGORY_ID,
  "scholarship-ap": SCHOLARSHIP_AP_CATEGORY_ID,
  "top-graduate": TOP_GRADUATE_CATEGORY_ID,
  "wiser-excellent": WISER_EXCELLENT_CATEGORY_ID,
  "wiser-inspiration": WISER_INSPIRATION_CATEGORY_ID,
  "competition-achievements": COMPETITION_ACHIEVEMENT_CATEGORY_ID,
};

export const SLUG_BY_CATEGORY_ID: Record<string, string> = Object.fromEntries(
  Object.entries(CATEGORY_ID_BY_SLUG).map(([slug, id]) => [id, slug])
);
