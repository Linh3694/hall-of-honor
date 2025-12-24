import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaSearch } from "react-icons/fa";
import { BASE_URL } from "../../../core/config";
import hallOfHonorService from "../../../services/hallOfHonorService";

// Map category name từ URL sang categoryId
function getCategoryIdFromName(name) {
  switch (name) {
    case "scholarship-talent":
      return "SIS-AWARD-CAT-4409109"; // Học bổng Tài năng
    case "honor-student":
      return "SIS-AWARD-CAT-4373820"; // Học sinh Danh dự
    case "honor-class":
      return "SIS-AWARD-CAT-4409107"; // Lớp Danh dự
    case "wisers-effort":
      return "SIS-AWARD-CAT-4409108"; // WISers Nỗ lực
    case "standardized-test":
      return "SIS-AWARD-CAT-4409110"; // Thành tích chuẩn hóa quốc tế
    default:
      return null;
  }
}

const Detail = () => {
  const { category, "ten-sub-award": subCategoryParam } = useParams();
  const { t, i18n } = useTranslation();
  const [categories, setCategories] = useState([]);
  const [records, setRecords] = useState([]);
  const [schoolYears, setSchoolYears] = useState([]);
  const [selectedSchoolYearId, setSelectedSchoolYearId] = useState("");
  const [searchName, setSearchName] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Lấy categoryId từ URL param
  const categoryId = getCategoryIdFromName(category);

  // Fetch data từ Frappe backend qua service
  // Chỉ fetch records của category cụ thể để tăng tốc độ load
  useEffect(() => {
    const fetchAll = async () => {
      if (!categoryId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const [categoriesData, recordsData, schoolYearsData] =
          await Promise.all([
            hallOfHonorService.getAwardCategories(),
            // Chỉ fetch records của category này thay vì tất cả
            hallOfHonorService.getAwardRecords({ categoryId }),
            hallOfHonorService.getSchoolYears(),
          ]);
        setCategories(categoriesData);
        setRecords(recordsData);
        setSchoolYears(schoolYearsData);
      } catch (err) {
        console.error("❌ Error fetching detail data:", err);
        setCategories([]);
        setRecords([]);
        setSchoolYears([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAll();
  }, [categoryId]);

  // Tìm tất cả sub-categories cùng tên và category
  const { subCategories, currentCategory, displaySubCategory } = useMemo(() => {
    let foundSubCategories = [];
    let foundCategory = null;
    let displaySub = null;

    console.log("🔍 Debug Detail page:");
    console.log("  - URL category param:", category);
    console.log("  - Mapped category ID:", categoryId);
    console.log("  - URL sub-category param:", subCategoryParam);
    console.log("  - Total categories:", categories.length);

    if (!categoryId) {
      console.log("  ❌ Invalid category name in URL!");
      return {
        subCategories: [],
        currentCategory: null,
        displaySubCategory: null,
      };
    }

    // Tìm category theo categoryId
    foundCategory = categories.find((c) => c._id === categoryId);

    if (foundCategory) {
      console.log("  ✅ Found category:", foundCategory.name);
      console.log("  - Total sub-categories:", foundCategory.subAwards?.length);

      // Gom TẤT CẢ sub-categories cùng label (từ nhiều năm học)
      if (foundCategory.subAwards) {
        const normalizedSubParam = normalizeLabel(subCategoryParam || "");

        foundSubCategories = foundCategory.subAwards.filter((sub) => {
          const normalizedSubLabel = normalizeLabel(sub.label);
          return normalizedSubLabel === normalizedSubParam;
        });

        console.log(
          `  ✅ Found ${foundSubCategories.length} sub-categories with label matching "${subCategoryParam}"`
        );

        // Chọn sub-category để hiển thị mô tả/ảnh (ưu tiên năm hiện tại, hoặc lấy đầu tiên)
        if (foundSubCategories.length > 0) {
          const today = new Date();
          displaySub =
            foundSubCategories.find((sub) => {
              if (!sub.schoolYear) return false;
              const sy = schoolYears.find((y) => y._id === sub.schoolYear);
              if (!sy) return false;
              const start = new Date(sy.startDate);
              const end = new Date(sy.endDate);
              return today >= start && today <= end;
            }) || foundSubCategories[0];

          console.log("  - Display sub-category:", displaySub.label);
          console.log("  - School year:", displaySub.schoolYear);
        }
      }

      if (foundSubCategories.length === 0) {
        console.log("  ❌ No sub-categories found!");
      }
    } else {
      console.log("  ❌ Category not found with ID:", categoryId);
    }

    return {
      subCategories: foundSubCategories,
      currentCategory: foundCategory,
      displaySubCategory: displaySub,
    };
  }, [categories, subCategoryParam, categoryId, schoolYears]);

  // Lọc records theo tất cả sub-categories cùng label
  const recordsOfSubCategory = useMemo(() => {
    if (subCategories.length === 0 || !currentCategory) return [];

    // Lọc records theo label của sub-category (gom tất cả năm học)
    const subCategoryLabel = subCategories[0]?.label;
    const filtered = records.filter(
      (r) =>
        r.subAward?.label === subCategoryLabel &&
        r.awardCategory?._id === currentCategory._id
    );

    console.log("  - Records matching sub-category:", filtered.length);
    return filtered;
  }, [records, subCategories, currentCategory]);

  // Lấy các năm học có record
  const schoolYearIds = useMemo(() => {
    return [
      ...new Set(
        recordsOfSubCategory
          .map((r) => String(r.subAward?.schoolYear))
          .filter(Boolean)
      ),
    ];
  }, [recordsOfSubCategory]);

  const displaySchoolYears = useMemo(() => {
    const relevantSchoolYears = schoolYears.filter((sy) =>
      schoolYearIds.includes(String(sy._id))
    );
    return relevantSchoolYears.length > 0 ? relevantSchoolYears : schoolYears;
  }, [schoolYears, schoolYearIds]);

  // Helper functions giống StudentHonorContent
  const getCurrentSchoolYearId = () => {
    const today = new Date();
    const currentSy = schoolYears.find((sy) => {
      const start = new Date(sy.startDate);
      const end = new Date(sy.endDate);
      return today >= start && today <= end;
    });
    return currentSy ? currentSy._id : "";
  };

  const getNewestSchoolYearId = (years) => {
    if (years.length === 0) return "";
    // Sắp xếp theo start_date giảm dần và lấy năm đầu tiên
    const sorted = [...years].sort((a, b) => {
      const dateA = new Date(a.startDate);
      const dateB = new Date(b.startDate);
      return dateB - dateA; // Giảm dần
    });
    return sorted[0]._id;
  };

  // Auto-select năm học hiện tại (hoặc năm học mới nhất nếu không có năm hiện tại)
  useEffect(() => {
    if (!selectedSchoolYearId && displaySchoolYears.length > 0) {
      // Ưu tiên: Chọn năm học hiện tại (đang diễn ra)
      const currentYearId = getCurrentSchoolYearId();

      if (
        currentYearId &&
        displaySchoolYears.some((sy) => sy._id === currentYearId)
      ) {
        setSelectedSchoolYearId(currentYearId);
      } else {
        // Nếu không có năm hiện tại, chọn năm học mới nhất
        const newestYearId = getNewestSchoolYearId(displaySchoolYears);
        setSelectedSchoolYearId(newestYearId);
      }
    }
  }, [selectedSchoolYearId, displaySchoolYears, schoolYears]);

  // Hàm normalize search
  function removeDiacritics(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }
  function normalize(str) {
    return removeDiacritics(str)
      .replace(/[^a-zA-Z0-9]/g, "")
      .toLowerCase();
  }

  function normalizeLabel(str) {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // bỏ dấu tiếng Việt
      .replace(/[^a-zA-Z0-9]+/g, "-") // thay ký tự đặc biệt bằng -
      .replace(/^-+|-+$/g, "") // bỏ dấu - ở đầu/cuối
      .toLowerCase();
  }

  // Lọc record theo năm học và search
  const filteredRecords = useMemo(() => {
    let filtered = recordsOfSubCategory.filter(
      (r) => String(r.subAward?.schoolYear) === selectedSchoolYearId
    );
    if (!searchName.trim()) return filtered;
    const searchTerm = normalize(searchName.trim());
    const isNumeric = /^\d+$/.test(searchName.trim());
    return filtered.reduce((acc, record) => {
      const filteredStudents = record.students.filter((stu) => {
        const normalizedStuName = normalize(stu.student?.name || "");
        const classNameRaw =
          stu.currentClass?.name || stu.currentClass?.className || "";
        const normalizedClassName = normalize(classNameRaw);
        if (normalizedStuName.includes(searchTerm)) return true;
        if (isNumeric) {
          const gradeMatch = normalizedClassName.match(/^\d+/);
          if (gradeMatch && gradeMatch[0] === searchTerm) return true;
        } else {
          if (normalizedClassName.includes(searchTerm)) return true;
        }
        return false;
      });
      if (filteredStudents.length > 0) {
        acc.push({ ...record, students: filteredStudents });
      }
      return acc;
    }, []);
  }, [recordsOfSubCategory, selectedSchoolYearId, searchName]);

  // Nhóm theo logic khác nhau tùy loại bài thi
  // IELTS: group theo điểm (score)
  // Các bài thi khác: group theo tên bài thi (exam)
  const groupedData = useMemo(() => {
    // Kiểm tra xem có phải IELTS không
    const subLabel = displaySubCategory?.label?.toUpperCase() || "";
    const isIELTS = subLabel.includes("IELTS");

    if (isIELTS) {
      // IELTS: Group theo điểm số
      const scoreGroups = {};
      filteredRecords.forEach((record) => {
        record.students.forEach((student) => {
          const score = student.score || "Chưa có điểm";
          if (!scoreGroups[score]) scoreGroups[score] = [];
          scoreGroups[score].push({ record, student });
        });
      });

      // Sort theo điểm giảm dần (điểm cao trước)
      return Object.entries(scoreGroups)
        .sort(([a], [b]) => {
          const scoreA = parseFloat(a) || 0;
          const scoreB = parseFloat(b) || 0;
          return scoreB - scoreA; // Giảm dần
        })
        .map(([score, items]) => ({
          exam: `${score}`, // Hiển thị điểm làm tiêu đề group
          isScoreGroup: true, // Flag để biết đây là group theo điểm
          items: items.sort((a, b) => {
            // Sort theo tên học sinh trong mỗi group
            const nameA = a.student.student?.name || "";
            const nameB = b.student.student?.name || "";
            return nameA.localeCompare(nameB, "vi");
          }),
        }));
    } else {
      // Các bài thi khác: Group theo tên bài thi
      const examGroups = {};
      filteredRecords.forEach((record) => {
        record.students.forEach((student) => {
          const exam =
            student.testName || student.examName || student.exam || "Khác";
          if (!examGroups[exam]) examGroups[exam] = [];
          examGroups[exam].push({ record, student });
        });
      });

      // Sort theo tên exam
      return Object.entries(examGroups)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([exam, items]) => ({
          exam,
          isScoreGroup: false,
          items: items.sort(
            (a, b) =>
              (Number(b.student.score) || 0) - (Number(a.student.score) || 0) // Cao đến thấp
          ),
        }));
    }
  }, [filteredRecords, displaySubCategory]);

  // Lấy label năm học
  const findSchoolYearLabel = (syId) => {
    const syDoc = schoolYears.find((sy) => String(sy._id) === String(syId));
    return syDoc?.code || syDoc?.name || "";
  };

  if (isLoading)
    return (
      <div className="text-center py-10">{t("loading", "Đang tải...")}</div>
    );
  if (!displaySubCategory || !currentCategory)
    return (
      <div className="text-center py-10 text-red-500">
        {t(
          "subCategoryNotFound",
          "Không tìm thấy thông tin danh mục hoặc loại bài thi"
        )}
      </div>
    );

  return (
    <div className="lg:p-6 px-3 mb-10 lg:min-w-[960px] w-full mx-auto mt-[40px] overflow-y-auto">
      {/* Tiêu đề và mô tả sub-category */}
      <div className="text-center mb-8">
        <div className="text-[40px] font-extrabold uppercase text-[#F05023] mb-2">
          {i18n.language === "vi"
            ? displaySubCategory.label
            : displaySubCategory.labelEng || displaySubCategory.label}
        </div>
        {(i18n.language === "vi"
          ? displaySubCategory.description
          : displaySubCategory.descriptionEng ||
            displaySubCategory.description) && (
          <div className="lg:w-[900px] w-full mx-auto text-left mt-4 mb-4">
            <div className="mb-4 text-[#002855] text-justify font-semibold lg:text-[18px] text-[15px]">
              {i18n.language === "vi"
                ? displaySubCategory.description
                : displaySubCategory.descriptionEng ||
                  displaySubCategory.description}
            </div>
          </div>
        )}

        {/* Hiển thị ảnh sub-category */}
        {displaySubCategory.coverImage ? (
          <div className="relative mb-4 mt-8 w-full max-h-[470px] mx-auto">
            <img
              src={`${BASE_URL}${displaySubCategory.coverImage}`}
              alt={displaySubCategory.label}
              className="w-full max-h-[470px] object-cover"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          </div>
        ) : (
          <div className="flex justify-center mb-6">
            <img
              src={`/halloffame/${normalizeLabel(displaySubCategory.label)}.png`}
              alt={displaySubCategory.label}
              className="w-full max-h-[470px] object-contain"
              onError={(e) => {
                // Fallback to SVG if PNG not found
                e.target.src = `/halloffame/${normalizeLabel(displaySubCategory.label)}.svg`;
                e.target.onerror = () => {
                  e.target.style.display = "none";
                };
              }}
            />
          </div>
        )}
      </div>

      {/* Filter năm học và search */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
        <select
          className="w-[220px] py-2 bg-[#f5f5f5] text-[#757575] border-none rounded-full focus:outline-none"
          value={selectedSchoolYearId}
          onChange={(e) => setSelectedSchoolYearId(e.target.value)}
        >
          <option value="">{t("selectSchoolYearOption")}</option>
          {displaySchoolYears.map((sy) => (
            <option key={sy._id} value={sy._id}>
              {t("schoolYearPrefix")} {sy.code || sy.name}
            </option>
          ))}
        </select>
        <div className="relative flex items-center">
          <input
            type="text"
            placeholder={t("searchNamePlaceholder")}
            className="w-[250px] px-4 py-2 bg-[#f5f5f5] text-[#757575] border-none rounded-full focus:outline-none"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
          />
          <button className="hidden absolute right-[-40px] w-[36px] h-[36px] bg-[#002855] rounded-full lg:flex items-center justify-center hover:bg-[#001F3F] transition">
            <FaSearch className="text-white text-[18px]" />
          </button>
        </div>
      </div>

      {/* Danh sách nhóm - IELTS group theo điểm, các bài khác group theo exam */}
      <div className="space-y-10">
        {groupedData.map((group, idx) => (
          <div key={idx}>
            {/* Tiêu đề group */}
            <div className="text-2xl font-bold text-[#002855] mb-4 border-b pb-2">
              {group.isScoreGroup ? (
                // IELTS: Hiển thị "IELTS - X.X" hoặc "Điểm X.X"
                <>
                  IELTS - <span className="text-[#F05023]">{group.exam}</span>
                </>
              ) : (
                // Các bài thi khác: Hiển thị tên bài thi
                group.exam
              )}
            </div>
            <div className="grid justify-items-center xl:grid-cols-5 lg:grid-cols-4 md:grid-cols-3 grid-cols-2 gap-x-[8px] gap-y-[8px] lg:gap-x-[30px] lg:gap-y-[35px]">
              {group.items.map((item, i) => {
                const { record, student } = item;
                // Fix: currentClass.title hoặc currentClass.className (không phải .name)
                const className =
                  student.currentClass?.title ||
                  student.currentClass?.className ||
                  student.currentClass?.name ||
                  t("noClass", "Chưa cập nhật lớp");
                const schoolYearLabel = record.subAward?.schoolYear
                  ? findSchoolYearLabel(record.subAward.schoolYear)
                  : "";
                // Lấy score từ student entry
                const score = student.score || student.result || "";
                const studentName = student.student?.name || "";
                return (
                  <div
                    key={i}
                    className="lg:h-[420px] lg:w-[250px] w-[180px] h-[370px] border rounded-[30px] shadow-sm lg:py-[25px] lg:px-[20px] px-[15px] py-[20px] bg-gradient-to-b from-[#03171c] to-[#182b55] flex flex-col items-center"
                  >
                    {/* Ảnh - chiều cao cố định */}
                    <div className="flex-shrink-0 mb-3">
                      {student.photo?.photoUrl ? (
                        <img
                          src={`${BASE_URL}${student.photo.photoUrl}`}
                          alt="Student"
                          className="h-[250px] w-[190px] object-cover object-top rounded-2xl shadow-md"
                          onError={(e) => {
                            e.target.style.display = "none";
                            e.target.parentElement.innerHTML =
                              '<div class="h-[250px] w-[190px] flex items-center justify-center rounded-2xl bg-gray-200 text-sm italic text-gray-400">Chưa có ảnh</div>';
                          }}
                        />
                      ) : (
                        <div className="h-[250px] w-[190px] flex items-center justify-center rounded-2xl bg-gray-200 text-sm italic text-gray-400">
                          {t("noPhoto", "Chưa có ảnh")}
                        </div>
                      )}
                    </div>

                    {/* Lớp - chiều cao cố định */}
                    <div className="flex-shrink-0 text-white text-[14px] font-semibold text-center mb-2">
                      {t("classPrefix")} {className} - {t("schoolYearAbbr")}{" "}
                      {schoolYearLabel}
                    </div>

                    {/* Tên học sinh - cố định 2 dòng */}
                    <div className="flex-shrink-0 h-[52px] flex items-center justify-center mb-2">
                      <span className="text-[#F9D16F] text-[18px] font-bold text-center line-clamp-2 leading-[26px]">
                        {studentName}
                      </span>
                    </div>

                    {/* Điểm số - chiều cao cố định */}
                    <div className="flex-shrink-0 text-white text-[16px] font-semibold text-center">
                      {group.isScoreGroup ? (
                        // IELTS: Chỉ hiển thị "IELTS - điểm" (vì đã group theo điểm)
                        <>
                          IELTS -{" "}
                          <span className="text-[#F9D16F]">{score}</span>
                        </>
                      ) : (
                        // Các bài thi khác: Hiển thị exam và score
                        <>
                          {group.exam}
                          {score && (
                            <>
                              {" - "}
                              <span className="text-[#F9D16F]">{score}</span>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {groupedData.length === 0 && (
          <div className="text-center text-gray-500 py-10">
            {t("noMatchingData")}
          </div>
        )}
      </div>
    </div>
  );
};

export default Detail;
