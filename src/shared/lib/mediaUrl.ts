import { BASE_URL } from "@/core/config";

/**
 * Đổi đường dẫn ảnh từ API Frappe thành URL hiển thị được.
 *
 * Backend (hook `after_request` ký CDN) đã trả URL tuyệt đối có chữ ký cho ảnh
 * học sinh / cover / ảnh lớp, ví dụ
 * `https://media.wellspring.edu.vn/student-photos/WS...jpg?e=..&s=..` — giữ
 * nguyên, không được ghép BASE_URL. Chỉ đường dẫn tương đối kiểu `/files/...`
 * (CDN tắt, dữ liệu cũ) mới ghép BASE_URL.
 */
export function resolveMediaUrl(path?: string | null): string {
  if (!path) return "";
  const p = path.trim();
  if (/^(https?:)?\/\//i.test(p) || /^(data|blob):/i.test(p)) return p;
  return `${BASE_URL.replace(/\/+$/, "")}/${p.replace(/^\/+/, "")}`;
}
