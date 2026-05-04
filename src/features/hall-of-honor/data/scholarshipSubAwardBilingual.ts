/**
 * Mapping song ngữ: tên + mô tả ngắn hiển thị dưới tên hạng mục học bổng tài năng.
 * - `slug`: khớp URL / subAwardLabelToSlug(label từ CMS) khi đồng bộ tên.
 * - `matchKeys`: thêm bí danh chuẩn hóa (subAwardDedupeKey) nếu CMS đặt tên khác (VD: "HB Đại sứ").
 * Sửa nội dung description vi/en trực tiếp trong file này.
 */

import { subAwardLabelToSlug, subAwardDedupeKey } from "../../../core/config";

export type ScholarshipSubAwardCopy = {
  priority: number;
  slug: string;
  matchKeys?: string[];
  title: { vi: string; en: string };
  description: { vi: string; en: string };
  singleStudentLayout?: { leftSrc: string; rightSrc: string; bottomSrc: string };
};

/** @type {ScholarshipSubAwardCopy[]} */
export const SCHOLARSHIP_SUB_AWARD_BILINGUAL = [
  {
    priority: 1,
    slug: "dai-su-wellspring",
    matchKeys: [subAwardDedupeKey("Đại sứ Wellspring")],
    title: { vi: "Đại sứ Wellspring", en: "Wellspring Ambassador" },
    description: {
      vi: "100% giá trị học phí",
      en: "100% tuition fee value",
    },
    singleStudentLayout: {
      leftSrc: "/dai-su-left.svg",
      rightSrc: "/dai-su-right.svg",
      bottomSrc: "/dai-su-bottom.svg",
    },
  },
  {
    priority: 2,
    slug: "danh-du-wellspring",
    matchKeys: [subAwardDedupeKey("Danh dự Wellspring")],
    title: { vi: "Danh dự Wellspring", en: "Wellspring Honor" },
    description: {
       vi: "70% giá trị học phí",
      en: "70% tuition fee value",
    },
  },
  {
    priority: 3,
    slug: "khat-vong-wellspring",
    matchKeys: [subAwardDedupeKey("Khát vọng Wellspring")],
    title: { vi: "Khát vọng Wellspring", en: "Wellspring Aspiration" },
    description: {
        vi: "50% giá trị học phí",
        en: "50% tuition fee value",
    },
  },
  {
    priority: 4,
    slug: "uom-mam-tai-nang",
    matchKeys: [subAwardDedupeKey("Ươm mầm tài năng")],
    title: { vi: "Ươm mầm tài năng", en: "Nurturing Talent" },
    description: {
      vi: "Tối đa 30% giá trị học phí",
      en: "Up to 30% of the tuition fees",
    },
  },
  {
    priority: 5,
    slug: "hanh-phuc-wellspring",
    matchKeys: [subAwardDedupeKey("Hạnh phúc Wellspring")],
    title: { vi: "Hạnh phúc Wellspring", en: "Wellspring Happiness" },
    description: {
      vi: "Tối đa 25% giá trị học phí",
      en: "Up to 25% of the tuition fees",
    },
  },
  {
    priority: 6,
    slug: "khoi-dau-hanh-phuc",
    matchKeys: [subAwardDedupeKey("Khởi đầu Hạnh phúc")],
    title: { vi: "Khởi đầu Hạnh phúc", en: "Happy Beginning" },
    description: {
      vi: "15 triệu VNĐ",
      en: "15 million VND",
    },
  },
  {
    priority: 7,
    slug: "y-tuong-sang-tao",
    matchKeys: [
      subAwardDedupeKey("Ý tưởng sáng tạo"),
      subAwardDedupeKey("Giải thưởng Ý tưởng Sáng tạo"),
    ],
    title: {
      vi: "Ý tưởng sáng tạo",
      en: "Creative Ideas",
    },
    description: {
      vi: "10 triệu VNĐ",
      en: "10 million VND",
    },
  },
  {
    priority: 8,
    slug: "hanh-trinh-hanh-phuc",
    matchKeys: [subAwardDedupeKey("Hành trình hạnh phúc")],
    title: { vi: "Hành trình hạnh phúc", en: "Journey of Happiness" },
    description: {
      vi: "40% giá trị học phí",
      en: "40% tuition fee value",
    },
  },
];

/** Map slug → bản ghi (tra cứu nhanh) */
export const SCHOLARSHIP_SUB_AWARD_BY_SLUG = Object.fromEntries(
  SCHOLARSHIP_SUB_AWARD_BILINGUAL.map((row) => [row.slug, row])
);

/** Map dedupeKey(label CMS) → bản ghi */
function buildByDedupeKey(): Record<string, ScholarshipSubAwardCopy> {
  const out: Record<string, ScholarshipSubAwardCopy> = {};
  for (const row of SCHOLARSHIP_SUB_AWARD_BILINGUAL) {
    out[row.slug] = row;
    for (const k of row.matchKeys || []) {
      if (k) out[k] = row;
    }
    const fromTitle = subAwardDedupeKey(row.title.vi);
    if (fromTitle) out[fromTitle] = row;
  }
  return out;
}

export const SCHOLARSHIP_SUB_AWARD_BY_DEDUPE_KEY = buildByDedupeKey();

/**
 * Lấy copy theo slug URL (ten-sub-award) hoặc label từ API.
 * @param {string} slugOrLabel
 * @returns {ScholarshipSubAwardCopy | null}
 */
export function getScholarshipSubAwardCopy(
  slugOrLabel: string | null | undefined
): ScholarshipSubAwardCopy | null {
  if (!slugOrLabel || typeof slugOrLabel !== "string") return null;
  const trimmed = slugOrLabel.trim();
  const bySlug = SCHOLARSHIP_SUB_AWARD_BY_SLUG[trimmed.toLowerCase()];
  if (bySlug) return bySlug;
  const key = subAwardDedupeKey(trimmed);
  return SCHOLARSHIP_SUB_AWARD_BY_DEDUPE_KEY[key] || null;
}

/**
 * Tách tiêu đề hiển thị trên ảnh cover (2 dòng).
 * - VI: phần tiếng Việt / "Wellspring" (VD: "Đại sứ" + "Wellspring").
 * - EN: "Wellspring" / phần còn lại (VD: "Wellspring" + "Ambassador").
 * - Không khớp pattern: chia đôi theo số từ (làm tròn lên dòng 1).
 * @param {string} text
 * @param {"vi"|"en"} lang
 * @returns {string[]}
 */
export function splitScholarshipCoverTitleLines(
  text: string | null | undefined,
  lang: "vi" | "en"
): string[] {
  if (!text || typeof text !== "string") return [];
  const trimmed = text.trim();
  if (!trimmed) return [];

  if (trimmed.includes("\n")) {
    return trimmed
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
  }

  if (lang === "vi") {
    const m = trimmed.match(/^(.+?)\s+Wellspring$/i);
    if (m) {
      const a = m[1].trim();
      if (a) return [a, "Wellspring"];
    }
  } else {
    const m = trimmed.match(/^Wellspring\s+(.+)$/i);
    if (m) {
      const b = m[1].trim();
      if (b) return ["Wellspring", b];
    }
  }

  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length < 2) return [trimmed];
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
}

/**
 * Cấu hình layout 1 học sinh (ảnh trái/phải/dưới) nếu có trong bản ghi song ngữ.
 * @param {string} slugOrLabel
 * @returns {{ leftSrc: string, rightSrc: string, bottomSrc: string } | null}
 */
export function getScholarshipSingleStudentLayout(
  slugOrLabel: string | null | undefined
): { leftSrc: string; rightSrc: string; bottomSrc: string } | null {
  const row = getScholarshipSubAwardCopy(slugOrLabel);
  return row?.singleStudentLayout ?? null;
}

/**
 * Gợi ý slug từ tiêu đề tiếng Việt (đối chiếu với CMS).
 * @param {string} labelVi
 */
export function suggestSlugFromTitleVi(labelVi: string | null | undefined): string {
  return subAwardLabelToSlug(labelVi || "");
}
