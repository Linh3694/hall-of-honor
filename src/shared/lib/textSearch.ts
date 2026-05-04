/**
 * Chuẩn hoá chuỗi khi tìm kiếm tên (bỏ dấu, ký tự đặc biệt, lower-case)
 */
export function removeDiacritics(str: string): string {
  return (str || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function normalizeSearchKey(str: string): string {
  return removeDiacritics(str)
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();
}
