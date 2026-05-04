import { subAwardLabelToSlug } from "../../../core/config";

/**
 * Màu thương hiệu theo tiểu mục học bổng (slug từ nhãn tiếng Việt).
 * Chỉnh hex tại đây khi design cập nhật.
 */
export const SCHOLARSHIP_BRAND_COLORS_BY_SLUG: Record<string, string> = {
  // Thành tích cuộc thi và giải đấu (sub-award custom)
  "the-thao": "#002855",
  "nghe-thuat": "#F05023",
  "khoa-hoc-ky-thuat": "#F5AA1E",
  "hoc-thuat": "#FFCE02",

  "dai-su-wellspring": "#002855",
  "danh-du-wellspring": "#F05023",
  "khat-vong-wellspring": "#F5AA1E",
  "uom-mam-tai-nang": "#FFCE02",
  "hanh-phuc-wellspring": "#BED232",
  "khoi-dau-hanh-phuc": "#009483",
  "y-tuong-sang-tao": "#00687F",
  "hanh-trinh-hanh-phuc": "#002855",
};

export const SCHOLARSHIP_BRAND_COLOR_FALLBACK = "#F15A24";

/**
 * Nền sáng → chữ cần tối (VD: tiểu mục Học thuật #FFCE02).
 */
export function isLightBrandBackground(hex: string | null | undefined): boolean {
  if (!hex || typeof hex !== "string") return false;
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!m) return false;
  const r = parseInt(m[1], 16) / 255;
  const g = parseInt(m[2], 16) / 255;
  const b = parseInt(m[3], 16) / 255;
  const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return l > 0.72;
}

/**
 * @param {string} label — nhãn tiểu mục từ CMS (VD: "Đại sứ Wellspring")
 */
export function getScholarshipBrandColor(label: string | null | undefined): string {
  if (!label || typeof label !== "string") {
    return SCHOLARSHIP_BRAND_COLOR_FALLBACK;
  }
  const slug = subAwardLabelToSlug(label);
  if (SCHOLARSHIP_BRAND_COLORS_BY_SLUG[slug]) {
    return SCHOLARSHIP_BRAND_COLORS_BY_SLUG[slug];
  }
  for (const [k, v] of Object.entries(SCHOLARSHIP_BRAND_COLORS_BY_SLUG)) {
    if (slug.length >= 4 && (slug.includes(k) || k.includes(slug))) {
      return v;
    }
  }
  return SCHOLARSHIP_BRAND_COLOR_FALLBACK;
}
