// Updated to use Frappe API endpoints
export const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://prod.sis.wellspring.edu.vn/api/method/erp.api.erp_sis.hall_of_honor";
export const UPLOAD_URL =
  import.meta.env.VITE_UPLOAD_URL || "https://prod.sis.wellspring.edu.vn/files";
export const BASE_URL =
  import.meta.env.VITE_URL || "https://prod.sis.wellspring.edu.vn";
export const CDN_URL = import.meta.env.VITE_CDN;
