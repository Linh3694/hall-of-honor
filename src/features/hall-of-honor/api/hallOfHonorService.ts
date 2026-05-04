import axios from "axios";
import { API_URL } from "../../../core/config";

/** Tham số lọc bản ghi vinh danh — đồng bộ với API Frappe */
export interface AwardRecordFilters {
  categoryId?: string;
  schoolYearId?: string;
  subCategoryType?: string;
}

/**
 * Service để xử lý API và chuẩn hóa dữ liệu từ Frappe backend
 * cho dự án Hall of Honor
 */

// ==================== API ENDPOINTS ====================

/**
 * Lấy danh sách các loại vinh danh (Award Categories)
 * API Endpoint: .get_award_categories (Frappe method format)
 */
export const getAwardCategories = async () => {
  try {
    const response = await axios.get(`${API_URL}.get_award_categories`);
    
    // Kiểm tra response từ Frappe
    if (response.data?.message?.success && response.data?.message?.data) {
      const categoriesData = response.data.message.data;
      // Chuẩn hóa dữ liệu từ Frappe về format MongoDB cũ
      return categoriesData.map(normalizeCategory);
    }
    
    return [];
  } catch (error) {
    console.error("❌ Error fetching award categories:", error);
    throw error;
  }
};

/**
 * Lấy danh sách các bản ghi vinh danh (Award Records)
 * API Endpoint: .get_award_records (Frappe method format)
 */
export const getAwardRecords = async (filters: AwardRecordFilters = {}) => {
  try {
    const params = new URLSearchParams();
    
    // Thêm các filter params nếu có
    // IMPORTANT: Backend nhận "award_category" không phải "category_id"
    if (filters.categoryId) {
      params.append("award_category", filters.categoryId);
    }
    if (filters.schoolYearId) {
      params.append("school_year_id", filters.schoolYearId);
    }
    if (filters.subCategoryType) {
      params.append("sub_category_type", filters.subCategoryType);
    }
    
    const url = `${API_URL}.get_award_records${params.toString() ? `?${params.toString()}` : ""}`;
    const response = await axios.get(url);
    
    // Kiểm tra response từ Frappe
    if (response.data?.message?.success && response.data?.message?.data) {
      const recordsData = response.data.message.data;
      // Chuẩn hóa dữ liệu từ Frappe về format MongoDB cũ
      return recordsData.map(normalizeRecord);
    }
    
    return [];
  } catch (error) {
    console.error("❌ Error fetching award records:", error);
    throw error;
  }
};

/**
 * Lấy danh sách năm học (School Years)
 * API Endpoint: .get_school_years (Frappe method format)
 */
export const getSchoolYears = async () => {
  try {
    const response = await axios.get(`${API_URL}.get_school_years`);
    
    // Kiểm tra response từ Frappe
    if (response.data?.message?.success && response.data?.message?.data) {
      const schoolYearsData = response.data.message.data;
      // Chuẩn hóa dữ liệu từ Frappe về format MongoDB cũ
      return schoolYearsData.map(normalizeSchoolYear);
    }
    
    return [];
  } catch (error) {
    console.error("❌ Error fetching school years:", error);
    throw error;
  }
};

/**
 * Lấy chi tiết một bản ghi vinh danh theo ID
 * API Endpoint: .get_award_record_detail (Frappe method format)
 */
export const getAwardRecordDetail = async (recordId: string) => {
  try {
    const response = await axios.get(`${API_URL}.get_award_record_detail`, {
      params: { record_id: recordId }
    });
    
    if (response.data?.message?.success && response.data?.message?.data) {
      return normalizeRecord(response.data.message.data);
    }
    
    return null;
  } catch (error) {
    console.error("❌ Error fetching award record detail:", error);
    throw error;
  }
};

// ==================== DATA NORMALIZATION FUNCTIONS ====================

/**
 * Chuẩn hóa dữ liệu Category từ Frappe về format MongoDB cũ
 * 
 * Frappe format:
 * {
 *   name: "SIS-AWARD-CAT-4373820",
 *   title_vn: "Học sinh \n DANH DỰ",
 *   title_en: "Honor \n STUDENT",
 *   description_vn: "...",
 *   description_en: "...",
 *   cover_image: "/files/...",
 *   recipient_type: "student",
 *   is_active: 1,
 *   campus_id: "CAMPUS-00001",
 *   sub_categories: [...]
 * }
 * 
 * MongoDB format cũ:
 * {
 *   _id: "SIS-AWARD-CAT-4373820",
 *   name: "Học sinh Danh dự",
 *   nameEng: "Honor Student",
 *   description: "...",
 *   descriptionEng: "...",
 *   coverImage: "/files/...",
 *   recipientType: "student",
 *   isActive: true,
 *   campusId: "CAMPUS-00001",
 *   subAwards: [...]
 * }
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- payload Frappe động, chuẩn hoá từng field
const normalizeCategory = (frappeCategory: any) => {
  return {
    _id: frappeCategory.name,
    name: frappeCategory.title_vn?.replace(/\\n/g, "\n") || "",
    nameEng: frappeCategory.title_en?.replace(/\\n/g, "\n") || "",
    description: frappeCategory.description_vn || "",
    descriptionEng: frappeCategory.description_en || "",
    coverImage: frappeCategory.cover_image || null,
    recipientType: frappeCategory.recipient_type || "student",
    isActive: Boolean(frappeCategory.is_active),
    campusId: frappeCategory.campus_id || "",
    subAwards: (frappeCategory.sub_categories || []).map(normalizeSubCategory),
  };
};

/**
 * Chuẩn hóa dữ liệu SubCategory từ Frappe
 * 
 * Frappe format:
 * {
 *   type: "year",
 *   label: "Năm học 2024-2025",
 *   label_en: "School Year 2024-2025",
 *   description: "",
 *   description_en: "",
 *   school_year_id: "SIS_SCHOOL_YEAR-4370719",
 *   semester: 0,
 *   month: 0,
 *   priority: 0
 * }
 * 
 * MongoDB format cũ:
 * {
 *   type: "year",
 *   label: "Năm học 2024-2025",
 *   labelEng: "School Year 2024-2025",
 *   description: "",
 *   descriptionEng: "",
 *   schoolYear: "SIS_SCHOOL_YEAR-4370719",
 *   semester: 0,
 *   month: 0,
 *   priority: 0
 * }
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const normalizeSubCategory = (frappeSubCategory: any) => {
  return {
    type: frappeSubCategory.type || "",
    label: frappeSubCategory.label || "",
    labelEng: frappeSubCategory.label_en || "",
    description: frappeSubCategory.description || "",
    descriptionEng: frappeSubCategory.description_en || "",
    schoolYear: frappeSubCategory.school_year_id || "",
    semester: frappeSubCategory.semester || 0,
    month: frappeSubCategory.month || 0,
    priority: frappeSubCategory.priority || 0,
    coverImage: frappeSubCategory.cover_image || null,
  };
};

/**
 * Chuẩn hóa dữ liệu Record - Backend đã populate sẵn, chỉ cần map field names
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const normalizeRecord = (frappeRecord: any) => {
  // Map subAward với labelEng
  const subAward = frappeRecord.subAward ? {
    ...frappeRecord.subAward,
    labelEng: frappeRecord.subAward.label_en || frappeRecord.subAward.labelEng || frappeRecord.subAward.label,
  } : null;
  
  return {
    _id: frappeRecord.name || "",
    awardCategory: frappeRecord.awardCategory ? {
      _id: frappeRecord.awardCategory.name || "",
      name: frappeRecord.awardCategory.title_vn || "",
      nameEng: frappeRecord.awardCategory.title_en || "",
    } : null,
    subAward: subAward,
    students: (frappeRecord.students || []).map(normalizeStudent),
    awardClasses: (frappeRecord.awardClasses || []).map(normalizeClass),
  };
};

/**
 * Bỏ tiền tố dạng bullet từ CMS (-, –, •, * …) — UI modal đã có icon sao từng dòng.
 * Chỉ gỡ khi có khoảng trắng sau ký hiệu để tránh ăn nhầm số âm kiểu "-5".
 */
const stripLeadingActivityBullet = (text: string): string => {
  let s = text.trim();
  const re = /^[\s\uFEFF]*(?:[-–—•*])\s+/;
  while (s.length > 0) {
    const next = s.replace(re, "").trim();
    if (next === s) break;
    s = next;
  }
  return s;
};

/**
 * Tách danh sách thành tích thành từng dòng (mỗi ý một bullet).
 * CMS thường gửi một chuỗi dài các ý nối bằng " , " (có khoảng trắng hai bên phẩy)
 * để không lẫn với dấu phẩy trong ngoặc như "(9, 10)".
 */
const normalizeActivityList = (raw: unknown): string[] => {
  if (raw == null) return [];
  const rows = Array.isArray(raw) ? raw : [raw];
  const out: string[] = [];
  for (const row of rows) {
    if (row == null) continue;
    const s = String(row).trim();
    if (!s) continue;
    for (const line of s.split(/\r?\n/)) {
      const t = line.trim();
      if (!t) continue;
      const parts = t
        .split(/\s+,\s+/)
        .map((x) => x.trim())
        .filter(Boolean);
      for (const p of parts) {
        const cleaned = stripLeadingActivityBullet(p);
        if (cleaned) out.push(cleaned);
      }
    }
  }
  return out;
};

/**
 * Chuẩn hóa dữ liệu Student - Chỉ map field names, giữ nguyên structure backend
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const normalizeStudent = (frappeStudent: any) => {
  const sid =
    frappeStudent.student?.name ||
    frappeStudent.student_id ||
    "";
  return {
    student: frappeStudent.student
      ? {
          _id: sid,
          name: frappeStudent.student.student_name || "",
        }
      : sid
        ? { _id: sid, name: "" }
        : null,
    currentClass: frappeStudent.current_class ? {
      _id: frappeStudent.current_class.name || "",
      name: frappeStudent.current_class.title || "",
      className: frappeStudent.current_class.title || "",
    } : null,
    photo: frappeStudent.photo || null,
    note: frappeStudent.note_vn || "",
    noteEng: frappeStudent.note_en || "",
    // Thêm exam và score cho trang Standardized Test
    exam: frappeStudent.exam || "",
    testName: frappeStudent.exam || "",  // Alias cho compatibility
    score: frappeStudent.score || "",
    // Map activities từ backend — tách chuỗi/mảng 1 phần tử thành nhiều dòng hiển thị
    activity: normalizeActivityList(frappeStudent.activities_vn),
    activityEng: normalizeActivityList(frappeStudent.activities_en),
  };
};

/**
 * Chuẩn hóa dữ liệu Class - Chỉ map field names, giữ nguyên structure backend
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const normalizeClass = (frappeClass: any) => {
  return {
    classInfo: frappeClass.classInfo ? {
      _id: frappeClass.classInfo.name || "",
      name: frappeClass.classInfo.title || "",
      className: frappeClass.classInfo.title || "",
    } : null,
    note: frappeClass.note_vn || "",
    noteEng: frappeClass.note_en || "",
    // Ảnh lớp từ backend
    classImage: frappeClass.classImage || null,
  };
};

/**
 * Chuẩn hóa dữ liệu School Year từ Frappe
 * 
 * Frappe format:
 * {
 *   name: "SIS_SCHOOL_YEAR-4370719",
 *   title_vn: "Năm học 2024-2025",
 *   title_en: "School Year 2024-2025",
 *   start_date: "2024-09-01",
 *   end_date: "2025-06-30",
 *   is_enable: 1
 * }
 * 
 * MongoDB format cũ:
 * {
 *   _id: "SIS_SCHOOL_YEAR-4370719",
 *   name: "Năm học 2024-2025",
 *   code: "2024-2025",
 *   startDate: "2024-09-01",
 *   endDate: "2025-06-30"
 * }
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const normalizeSchoolYear = (frappeSchoolYear: any) => {
  // Tạo code từ title_vn bằng cách lấy phần năm (VD: "2024-2025")
  const titleVn = frappeSchoolYear.title_vn || "";
  const yearMatch = titleVn.match(/\d{4}-\d{4}/);
  const code = yearMatch ? yearMatch[0] : titleVn;
  
  return {
    _id: frappeSchoolYear.name || "",
    name: titleVn || frappeSchoolYear.title_en || "",
    code: code,
    startDate: frappeSchoolYear.start_date || "",
    endDate: frappeSchoolYear.end_date || "",
    isEnable: Boolean(frappeSchoolYear.is_enable),
  };
};

// ==================== EXPORT SERVICES ====================

const hallOfHonorService = {
  getAwardCategories,
  getAwardRecords,
  getSchoolYears,
  getAwardRecordDetail,
  // Export các hàm normalize để có thể test hoặc dùng riêng
  normalizeCategory,
  normalizeSubCategory,
  normalizeRecord,
  normalizeStudent,
  normalizeClass,
  normalizeSchoolYear,
};

export default hallOfHonorService;
