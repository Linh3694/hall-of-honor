// @ts-nocheck
import React, { useState, useEffect, useMemo } from "react";
import { BASE_URL } from "@/core/config";
import { FaAngleDown, FaAngleRight } from "react-icons/fa6";
import { FaSearch } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAwardBaseData } from "../hooks/useAwardBaseData";
import { useSelectedSchoolYear } from "../hooks/useSelectedSchoolYear";
import { pickCurrentSchoolYearId } from "../hooks/schoolYearUtils";
import { normalizeSearchKey } from "@/shared/lib/textSearch";

/**
 * Component hiển thị danh hiệu dành cho LỚP (thay vì học sinh).
 * Dữ liệu đọc từ AwardRecord, trong đó ta dùng mảng awardClasses thay cho students.
 */
const ClassHonorContent = ({
  categoryId,
  categoryName,
  recordIdParam,
  classIdParam,
}) => {
  // common trước: lọc năm/học kỳ/tháng + placeholder dùng common.json; student:… cho nhãn khối
  const { t, i18n } = useTranslation(["common", "student", "class"]);
  const navigate = useNavigate();

  const { categories, records, schoolYears } = useAwardBaseData(categoryId);

  // --- States cho giao diện lọc (filter) ---
  const [activeTab, setActiveTab] = useState("year");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [searchName, setSearchName] = useState("");
  const [openLevel, setOpenLevel] = useState(null);

  // Ảnh lớp - không cần state riêng vì API đã trả về classImage trong mỗi class entry

  // --- States cho Modal (khi click vào 1 lớp) ---
  const [showModal, setShowModal] = useState(false);
  const [modalRecord, setModalRecord] = useState(null);
  const [modalClass, setModalClass] = useState(null); // Thông tin lớp trong record

  // Lấy thông tin chi tiết của danh mục hiện tại
  const currentCategory =
    categories.find((cat) => cat._id === categoryId) || {};

  // --------------------------------------------------
  // 1) Dữ liệu nền: useAwardBaseData (categories / schoolYears / records)
  // --------------------------------------------------

  // --------------------------------------------------
  // 2) Khi category thay đổi => set view mặc định
  // --------------------------------------------------
  useEffect(() => {
    if (!recordIdParam || !classIdParam || !records.length) return;
    const foundRecord = records.find((r) => r._id === recordIdParam);
    if (!foundRecord) return;

    const foundClass = foundRecord.awardClasses.find(
      (c) => c.classInfo?._id === classIdParam
    );
    if (!foundClass) return;

    setModalRecord(foundRecord);
    setModalClass(foundClass);
    setShowModal(true);
  }, [recordIdParam, classIdParam, records]);

  // --------------------------------------------------
  // 3) Khi category thay đổi => set view mặc định
  // --------------------------------------------------
  useEffect(() => {
    if (categoryId && records.length && schoolYears.length) {
      setDefaultViewForCategory(categoryId);
    }
  }, [categoryId, records, schoolYears]);

  const setDefaultViewForCategory = (catId) => {
    const catRecords = records.filter((r) => r.awardCategory?._id === catId);
    if (!catRecords.length) return;

    const yearRecs = catRecords.filter((r) => r.subAward?.type === "year");
    const semesterRecs = catRecords.filter(
      (r) => r.subAward?.type === "semester"
    );
    const monthRecs = catRecords.filter((r) => r.subAward?.type === "month");

    // 1) Nếu có record type "year"
    if (yearRecs.length > 0) {
      const currentSyId = pickCurrentSchoolYearId(schoolYears);
      if (currentSyId) {
        const recordsInCurrentSy = yearRecs.filter(
          (r) => String(r.subAward?.schoolYear) === currentSyId
        );
        if (recordsInCurrentSy.length > 0) {
          setActiveTab("year");
          setSelectedSchoolYearId(currentSyId);
          return;
        }
      }
      const bySchoolYear = groupRecordsBySchoolYear(yearRecs);
      const newestSyId = findNewestSchoolYearId(Object.keys(bySchoolYear));
      setActiveTab("year");
      setSelectedSchoolYearId(newestSyId || "");
      return;
    }

    // 2) Nếu có record type "semester"
    if (semesterRecs.length > 0) {
      const currentSyId = pickCurrentSchoolYearId(schoolYears);
      if (currentSyId) {
        const recordsInCurrentSy = semesterRecs.filter(
          (r) => String(r.subAward?.schoolYear) === currentSyId
        );
        if (recordsInCurrentSy.length > 0) {
          // Lấy danh sách label (không phải số)
          const listSem = recordsInCurrentSy
            .map((r) => r.subAward?.label)
            .filter(Boolean);
          const chosenSemester = listSem.length > 0 ? listSem[0] : "";
          setActiveTab("semester");
          setSelectedSchoolYearId(currentSyId);
          setSelectedSemester(chosenSemester);
          return;
        }
      }
      const bySchoolYear = groupRecordsBySchoolYear(semesterRecs);
      const newestSyId = findNewestSchoolYearId(Object.keys(bySchoolYear));
      const recsOfNewest = semesterRecs.filter(
        (r) => String(r.subAward?.schoolYear) === newestSyId
      );
      // Lấy danh sách label (không phải số)
      const listSem = recsOfNewest
        .map((r) => r.subAward?.label)
        .filter(Boolean);
      const chosenSemester = listSem.length > 0 ? listSem[0] : "";
      setActiveTab("semester");
      setSelectedSchoolYearId(newestSyId || "");
      setSelectedSemester(chosenSemester);
      return;
    }

    // 3) Nếu có record type "month"
    if (monthRecs.length > 0) {
      const currentSyId = pickCurrentSchoolYearId(schoolYears);
      if (currentSyId) {
        const recordsInCurrentSy = monthRecs.filter(
          (r) => String(r.subAward?.schoolYear) === currentSyId
        );
        if (recordsInCurrentSy.length > 0) {
          // Lấy danh sách label (không phải số tháng)
          const listMonth = recordsInCurrentSy
            .map((r) => r.subAward?.label)
            .filter(Boolean);
          const chosenMonth = listMonth.length > 0 ? listMonth[0] : "";
          setActiveTab("month");
          setSelectedSchoolYearId(currentSyId);
          setSelectedMonth(chosenMonth);
          return;
        }
      }
      const bySchoolYear = groupRecordsBySchoolYear(monthRecs);
      const newestSyId = findNewestSchoolYearId(Object.keys(bySchoolYear));
      const recsOfNewest = monthRecs.filter(
        (r) => String(r.subAward?.schoolYear) === newestSyId
      );
      // Lấy danh sách label (không phải số tháng)
      const listMonth = recsOfNewest
        .map((r) => r.subAward?.label)
        .filter(Boolean);
      const chosenMonth = listMonth.length > 0 ? listMonth[0] : "";
      setActiveTab("month");
      setSelectedSchoolYearId(newestSyId || "");
      setSelectedMonth(chosenMonth);
      return;
    }
  };

  const groupRecordsBySchoolYear = (arr) => {
    const map = {};
    arr.forEach((r) => {
      const sy = String(r.subAward?.schoolYear);
      if (!map[sy]) map[sy] = [];
      map[sy].push(r);
    });
    return map;
  };

  const findNewestSchoolYearId = (syIds) => {
    let bestId = "";
    let bestCode = "";
    syIds.forEach((id) => {
      const syDoc = schoolYears.find((sy) => String(sy._id) === id);
      if (!syDoc) return;
      const codeStr = syDoc.code || "";
      if (codeStr > bestCode) {
        bestCode = codeStr;
        bestId = id;
      }
    });
    return bestId;
  };

  const recordsSameCatAndType = records.filter(
    (r) => r.awardCategory?._id === categoryId && r.subAward?.type === activeTab,
  );

  const distinctSchoolYearIds = [
    ...new Set(
      recordsSameCatAndType.map((r) => String(r.subAward?.schoolYear))
    ),
  ].filter(Boolean);

  const relevantSchoolYears = schoolYears.filter((sy) =>
    distinctSchoolYearIds.includes(String(sy._id))
  );

  const displaySchoolYears =
    relevantSchoolYears.length > 0 ? relevantSchoolYears : schoolYears;

  const { selectedSchoolYearId, setSelectedSchoolYearId } =
    useSelectedSchoolYear({
      schoolYears,
      displaySchoolYears,
    });

  // Month records for selected school year
  const monthRecords = useMemo(
    () =>
      recordsSameCatAndType.filter(
        (r) =>
          r.subAward?.type === "month" &&
          String(r.subAward?.schoolYear) === selectedSchoolYearId
      ),
    [recordsSameCatAndType, selectedSchoolYearId]
  );

  // Available month subAwards for filter
  const monthSubAwards = useMemo(
    () =>
      (currentCategory.subAwards || []).filter(
        (sub) =>
          sub.type === "month" &&
          String(sub.schoolYear) === selectedSchoolYearId &&
          monthRecords.some((r) => r.subAward?.label === sub.label)
      ),
    [currentCategory.subAwards, selectedSchoolYearId, monthRecords]
  );

  // Helper for bilingual month labels in filter - Sử dụng labelEng từ backend
  const getMonthOptionLabel = (sub) => {
    if (i18n.language === "vi") {
      return sub.label;
    }
    return sub.labelEng || sub.label;
  };

  // Lấy danh sách semester từ subAwards của category (theo label, không phải số)
  const semesterSubAwards = useMemo(
    () =>
      (currentCategory.subAwards || []).filter(
        (sub) =>
          sub.type === "semester" &&
          String(sub.schoolYear) === selectedSchoolYearId
      ),
    [currentCategory.subAwards, selectedSchoolYearId]
  );

  const distinctSemesters = useMemo(
    () => semesterSubAwards.map((sub) => sub.label),
    [semesterSubAwards]
  );

  const distinctMonths = useMemo(
    () => monthSubAwards.map((sub) => sub.label),
    [monthSubAwards]
  );

  // Auto-select semester khi đổi năm học hoặc chuyển tab
  useEffect(() => {
    if (
      activeTab === "semester" &&
      selectedSchoolYearId &&
      distinctSemesters.length > 0 &&
      (!selectedSemester || !distinctSemesters.includes(selectedSemester))
    ) {
      setSelectedSemester(distinctSemesters[0]);
    }
  }, [activeTab, selectedSchoolYearId, distinctSemesters, selectedSemester]);

  // Auto-select month khi đổi năm học hoặc chuyển tab
  useEffect(() => {
    if (
      activeTab === "month" &&
      selectedSchoolYearId &&
      monthSubAwards.length > 0 &&
      (!selectedMonth || !distinctMonths.includes(selectedMonth))
    ) {
      setSelectedMonth(distinctMonths[0]);
    }
  }, [
    activeTab,
    selectedSchoolYearId,
    selectedMonth,
    monthSubAwards,
    distinctMonths,
  ]);

  // --------------------------------------------------
  // 4) Lọc record theo các tiêu chí => DÙNG awardClasses
  // --------------------------------------------------
  const filteredRecords = records
    // Bước 1: Lọc theo danh mục, subAward, schoolYear, ...
    .filter((r) => {
      if (r.awardCategory?._id !== categoryId) return false;
      if (r.subAward?.type !== activeTab) return false;
      if (!selectedSchoolYearId) return false;
      if (String(r.subAward?.schoolYear) !== selectedSchoolYearId) return false;
      if (activeTab === "semester") {
        if (!selectedSemester) return false;
        if (r.subAward?.label !== selectedSemester) return false;
      }
      if (activeTab === "month") {
        if (!selectedMonth) return false;
        if (r.subAward?.label !== selectedMonth) return false;
      }

      return true;
    })
    // Bước 2: Nếu có searchName => chỉ giữ lớp match, ngược lại giữ nguyên
    .map((record) => {
      if (!searchName.trim()) {
        return record;
      }
      const searchTerm = normalizeSearchKey(searchName.trim());
      const matchedClasses = record.awardClasses.filter((cls) => {
        const normName = normalizeSearchKey(cls.classInfo?.className || "");
        return normName.includes(searchTerm);
      });
      if (matchedClasses.length === 0) {
        return null;
      }
      return { ...record, awardClasses: matchedClasses };
    })
    .filter(Boolean);

  // --------------------------------------------------
  // 5) Phân chia record theo cấp học (nếu muốn)
  // --------------------------------------------------
  const educationLevels = [
    {
      id: "elementary",
      name: t("student:elementary", "Tiểu học"),
      minClass: 1,
      maxClass: 5,
    },
    { id: "secondary", name: t("student:secondary", "THCS"), minClass: 6, maxClass: 9 },
    {
      id: "highschool",
      name: t("student:highschool", "THPT"),
      minClass: 10,
      maxClass: 12,
    },
  ];

  const filterRecordsByLevel = (recordsArr, minClass, maxClass) => {
    return recordsArr
      .map((record) => {
        const classesInRange = record.awardClasses.filter((cls) => {
          if (!cls?.classInfo?.className) return false;
          const matched = cls.classInfo.className.match(/\d+/);
          if (!matched) return false;
          const classNumber = parseInt(matched[0], 10);
          return classNumber >= minClass && classNumber <= maxClass;
        });

        return {
          ...record,
          awardClasses: classesInRange,
        };
      })
      .filter((r) => r.awardClasses.length > 0);
  };

  // --------------------------------------------------
  // 6) Modal hiển thị chi tiết khi click 1 lớp
  // --------------------------------------------------
  const handleOpenModalClass = (record, cls) => {
    setModalRecord(record);
    setModalClass(cls);
    setShowModal(true);
    navigate(
      `/detail/${categoryName}/class/${record._id}/${cls.classInfo?._id}`
    );
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setModalRecord(null);
    setModalClass(null);
    navigate(`/detail/${categoryName}`);
  };

  const findSchoolYearLabel = (syId) => {
    const syDoc = schoolYears.find((sy) => String(sy._id) === String(syId));
    // Ví dụ hiển thị "2024-2025" hay "Khóa 2024-2025"
    return syDoc?.code || syDoc?.name || "";
  };

  // Hàm chuẩn hóa tên category: bỏ \n và chuẩn hóa case
  const normalizeCategoryName = (name) => {
    if (!name) return "";
    // Bỏ \n và khoảng trắng thừa, chuẩn hóa chữ hoa/thường
    return name
      .replace(/\\n/g, " ") // Thay \n thành space
      .replace(/\n/g, " ") // Thay newline thành space
      .replace(/\s+/g, " ") // Thay nhiều space thành 1 space
      .split(" ")
      .map((word) => {
        // Giữ nguyên từ viết hoa toàn bộ (như DANH DỰ)
        if (word === word.toUpperCase() && word.length > 1) {
          return word.charAt(0) + word.slice(1).toLowerCase();
        }
        return word;
      })
      .join(" ")
      .trim();
  };

  // Hàm phụ: trả về text cho danh hiệu (VD: "Học Sinh Danh Dự - Học kì 1")
  const getSubAwardLabel = (record) => {
    if (!record?.subAward) return "";
    const { type, schoolYear, label, labelEng } = record.subAward;

    // Lấy tên category và chuẩn hóa
    const rawCategoryName =
      i18n.language === "vi"
        ? currentCategory.name || t("award", "Danh hiệu")
        : currentCategory.nameEng || t("award", "Award");

    const categoryName = normalizeCategoryName(rawCategoryName);

    const schoolYearLabel = findSchoolYearLabel(schoolYear);

    // Lấy label của sub-category theo ngôn ngữ
    const subCategoryLabel = i18n.language === "vi" ? label : labelEng || label;

    if (type === "month") {
      return `${categoryName} - ${subCategoryLabel} - ${t("schoolYearSC", "Năm học")} ${schoolYearLabel}`;
    } else if (type === "semester") {
      return `${categoryName} - ${subCategoryLabel} - ${t("schoolYearSC", "Năm học")} ${schoolYearLabel}`;
    } else if (type === "year") {
      return `${categoryName} - ${t("schoolYear", "Năm học")} ${schoolYearLabel}`;
    }
    return categoryName;
  };

  // Lấy text từ DB (hoặc i18n)
  const rawText =
    i18n.language === "vi"
      ? currentCategory.name || t("award", "Danh hiệu")
      : currentCategory.nameEng || t("award", "Award");

  // Nếu DB lưu nhầm thành \\n, bạn có thể replace:
  const normalizedText = rawText.replace(/\\n/g, "\n");

  // Tách thành mảng theo ký tự xuống dòng
  const lines = normalizedText.split("\n");
  // --------------------------------------------------
  // 7) Giao diện
  // --------------------------------------------------
  return (
    <div className="lg:p-6 px-3 lg:min-w-[960px] w-full mx-auto mt-[40px] overflow-y-auto">
      {/* Tiêu đề, mô tả và ảnh cover */}
      <div>
        <div className="flex flex-col shimmer-text-title text-center items-center justify-center uppercase">
          {lines.map((line, idx) => {
            const textSize =
              i18n.language === "vi"
                ? idx === 0
                  ? "text-[50px] font-[Metropolis]"
                  : "text-[70px] font-black font-[Metropolis]"
                : idx === 0
                  ? "text-[70px] font-black font-[Metropolis]"
                  : "text-[50px] font-[Metropolis]";

            return (
              <div key={idx} className={textSize}>
                {line}
              </div>
            );
          })}
          <img src={`/halloffame/vector.png`} alt="Cover" />
        </div>
        <div className="lg:w-[900px] w-full mx-auto text-left mt-4 mb-4">
          <p className="mb-4 text-[#002855] text-justify font-semibold md:text-[18px] text-[15px]">
            {i18n.language === "vi"
              ? currentCategory.description || ""
              : currentCategory.descriptionEng || ""}
          </p>
        </div>
        {currentCategory.coverImage && (
          <div className="relative mb-4 mt-8 w-full max-h-[470px] mx-auto">
            {/* Lớp dưới cùng: ảnh coverImage từ Frappe */}
            <img
              src={`${BASE_URL}${currentCategory.coverImage}`}
              alt="Cover"
              className="w-full max-h-[470px] object-cover"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
            {/* Lớp giữa: khung frame-cover.png đè lên */}
            <img
              src={`/halloffame/frame-cover.png`}
              alt="Frame Cover"
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
            {/* Lớp trên cùng: text ở góc trên bên phải căn giữa theo chiều dọc */}
            <div className="absolute top-0 right-0 h-full flex items-center justify-center pr-4">
              <div className="text-[#f9d16f] text-right lg:mr-8 lg:mt-12 leading-tight ">
                {lines.map((line, idx) => {
                  const textSize =
                    i18n.language === "vi"
                      ? idx === 0
                        ? "lg:text-[52px] text-[18px]"
                        : "lg:text-[70px] text-[20px] font-extrabold"
                      : idx === 0
                        ? "lg:text-[70px] text-[20px] font-extrabold"
                        : "lg:text-[52px] text-[18px] ";

                  return (
                    <div key={idx} className={textSize}>
                      {line}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs: Năm học / Học kì / Tháng */}
      <div className="flex space-x-12 text-lg items-center justify-center font-medium mb-10 mt-10">
        {["year", "semester", "month"].map((tab) => (
          <button
            key={tab}
            className={`pb-1 ${
              activeTab === tab
                ? "text-[#002855] font-semibold lg:text-[32px] text-[24px] border-b-2 border-[#002855]"
                : "text-[#757575] lg:text-[24px] text-[18px]"
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "year"
              ? t("schoolYear", "Năm học")
              : tab === "semester"
                ? t("semester", "Học kì")
                : t("month", "Tháng")}
          </button>
        ))}
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
        {(activeTab === "year" ||
          activeTab === "semester" ||
          activeTab === "month") && (
          <select
            className="lg:w-[300px] py-2 bg-[#f5f5f5] text-[#757575] border-none rounded-full focus:outline-none"
            value={selectedSchoolYearId}
            onChange={(e) => {
              setSelectedSchoolYearId(e.target.value);
              setSelectedSemester("");
              setSelectedMonth("");
            }}
          >
            <option value="">
              {t("selectSchoolYear", "--Chọn năm học--")}
            </option>
            {displaySchoolYears.map((sy) => (
              <option key={sy._id} value={sy._id}>
                {t("schoolYearText", "Năm học")} {sy.code || sy.name}
              </option>
            ))}
          </select>
        )}

        {activeTab === "semester" && selectedSchoolYearId && (
          <select
            className="py-2 bg-[#f5f5f5] text-[#757575] border-none rounded-full focus:outline-none"
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
          >
            <option value="">{t("selectSemester", "Chọn học kì")}</option>
            {distinctSemesters.map((label) => {
              // Tìm subAward tương ứng để lấy label theo ngôn ngữ
              const subAward = semesterSubAwards.find(
                (sub) => sub.label === label
              );
              const displayLabel =
                i18n.language === "vi" ? label : subAward?.labelEng || label;

              return (
                <option key={label} value={label}>
                  {displayLabel}
                </option>
              );
            })}
          </select>
        )}

        {activeTab === "month" && selectedSchoolYearId && (
          <select
            className="py-2 bg-[#f5f5f5] text-[#757575] border-none rounded-full focus:outline-none"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            <option value="">{t("selectMonth", "Chọn tháng")}</option>
            {monthSubAwards.map((sub) => (
              <option key={sub.label} value={sub.label}>
                {getMonthOptionLabel(sub)}
              </option>
            ))}
          </select>
        )}

        {/* Tìm kiếm (theo tên lớp) */}
        <div className="relative flex items-center">
          <input
            type="text"
            placeholder={t("searchNamePlaceholder", "Tìm kiếm tên lớp")}
            className="lg:w-[400px] w-[250px] px-4 py-2 bg-[#f5f5f5] text-[#757575] border-none rounded-full focus:outline-none"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
          />
          <button
            onClick={() => console.log("Searching:", searchName)}
            className="hidden absolute right-[-40px] w-[36px] h-[36px] bg-[#002855] rounded-full lg:flex items-center justify-center hover:bg-[#001F3F] transition"
          >
            <FaSearch className="text-white text-[18px]" />
          </button>
        </div>
      </div>

      {/* Nếu đang gõ searchName => hiển thị flat, else => group theo khối */}
      {searchName.trim() ? (
        // ------------ 1) Hiển thị phẳng ------------
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecords
            .flatMap((rec) =>
              rec.awardClasses.map((cls) => ({ record: rec, cls }))
            )
            .map((item, idx) => {
              const { record, cls } = item;
              return (
                <div
                  key={idx}
                  className="border rounded-2xl p-5 shadow-sm bg-gradient-to-b from-[#03171c] to-[#182b55] rounded-[20px] flex flex-col items-center justify-center space-y-2 cursor-pointer"
                  onClick={() => handleOpenModalClass(record, cls)}
                >
                  {cls.classImage ? (
                    <img
                      src={`${BASE_URL}${cls.classImage}`}
                      alt={`Ảnh lớp ${cls.classInfo?.className}`}
                      className="mt-2 w-full object-contain rounded-2xl"
                    />
                  ) : (
                    <div className="text-xs italic text-[#f9d16f]">
                      {t("noPhoto", "Chưa có ảnh")}
                    </div>
                  )}
                  <div className="text-[#f9d16f] shimmer-text text-[20px] font-bold">
                    {t("classLabel", "Lớp")} {cls.classInfo?.className}
                  </div>
                </div>
              );
            })}
        </div>
      ) : (
        // ------------ 2) Hiển thị theo khối ------------
        <div className="space-y-6">
          {educationLevels.map((level) => {
            // Lọc records theo level (tiểu học, THCS, THPT)
            const levelRecords = filterRecordsByLevel(
              filteredRecords,
              level.minClass,
              level.maxClass
            );

            // Gom thành mảng classCards
            const classCards = [];
            levelRecords.forEach((rec) => {
              rec.awardClasses.forEach((cls) => {
                classCards.push({ record: rec, cls });
              });
            });

            // Nếu không có lớp nào => ẩn khối này
            if (classCards.length === 0) return null;

            return (
              <div
                key={level.id}
                className="w-full border-b border-gray-200 pb-4 mx-auto"
              >
                <div
                  className=" w-full flex justify-between items-center cursor-pointer py-4 text-[#002855] text-[22px] font-semibold"
                  onClick={() =>
                    setOpenLevel(openLevel === level.id ? null : level.id)
                  }
                >
                  <span>{level.name}</span>
                  <span className="text-gray-500 text-lg">
                    {openLevel === level.id ? (
                      <FaAngleDown />
                    ) : (
                      <FaAngleRight />
                    )}
                  </span>
                </div>
                {openLevel === level.id && (
                  <div className="p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {classCards.map((item, idx) => {
                        const { record, cls } = item;
                        return (
                          <div
                            key={idx}
                            className="border rounded-[20px] shadow-sm p-5 bg-gradient-to-b from-[#03171c] to-[#182b55] flex flex-col items-center justify-center space-y-2 cursor-pointer"
                            onClick={() => handleOpenModalClass(record, cls)}
                          >
                            {cls.classImage ? (
                              <img
                                src={`${BASE_URL}${cls.classImage}`}
                                alt={`Ảnh lớp ${cls.classInfo?.className}`}
                                className="mt-2 w-full object-contain rounded-2xl"
                              />
                            ) : (
                              <div className="text-xs italic text-[#f9d16f]">
                                {t("noPhoto", "Chưa có ảnh")}
                              </div>
                            )}
                            <div className="text-[#f9d16f] shimmer-text text-[20px] font-bold">
                              {t("classLabel", "Lớp")}{" "}
                              {cls.classInfo?.className}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ----------------- Modal hiển thị khi click 1 lớp ----------------- */}
      {showModal && modalClass && modalRecord && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50"
          onClick={handleCloseModal}
        >
          <div
            className="lg:w-[1200px] md:w-[80%] w-[95%] h-auto rounded-[20px] lg:py-16 lg:px-16 p-8 relative shadow-lg"
            style={{
              backgroundImage: `url(${
                window.innerWidth >= 1024
                  ? "/halloffame/studentcard-desktop.png"
                  : "/halloffame/studentcard-mobile.png"
              })`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Nội dung modal */}
            <div className="w-full flex flex-col lg:flex-row gap-4">
              {/* Ảnh lớp */}
              <div className="w-full relative flex items-center justify-center">
                {modalClass.classImage ? (
                  <img
                    src={`${BASE_URL}${modalClass.classImage}`}
                    alt="Class"
                    className="relative z-10 w-full h-auto object-cover rounded-[15px] shadow-md"
                  />
                ) : (
                  <div className="relative z-10 w-[518px] h-[377px] bg-gray-200 flex items-center justify-center rounded-lg shadow-md">
                    <span className="text-xs text-gray-400">
                      {t("noPhoto", "Chưa có ảnh")}
                    </span>
                  </div>
                )}
              </div>

              {/* Thông tin lớp */}
              <div className="w-full lg:w-[670px] xl:w-[700px] flex flex-col">
                <h2 className="w-full lg:text-[24px] md:text-[20px] text-[16px] font-bold text-[#F9D16F] mb-2">
                  {t("classLabel", "Lớp")} {modalClass.classInfo?.className}
                </h2>

                <hr className="w-full border-t border-gray-100 my-2 lg:my-4" />

                <p className=" w-full mb-2 font-semibold text-white  text-[13px] md:text-[15px] lg:text-[18px]">
                  {getSubAwardLabel(modalRecord)}
                </p>

                <div className="w-full h-auto overflow-y-auto border-b-2 pb-4">
                  {(i18n.language === "vi"
                    ? modalClass.note
                    : modalClass.noteEng) && (
                    <p className=" text-white my-auto text-justify text-[13px] md:text-[15px]">
                      {i18n.language === "vi"
                        ? modalClass.note
                        : modalClass.noteEng}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Nút đóng */}
            <div className="flex w-full mx-auto items-center justify-center pt-5">
              <button
                onClick={handleCloseModal}
                className="bg-[#F9D16F] lg:px-16 px-2 lg:py-1 py-1 rounded-md text-[#002855] text-[13px] lg:text-[16px] font-semibold hover:bg-gray-400"
              >
                {t("close", "Đóng")}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ----------------- End modal ----------------- */}
    </div>
  );
};

export default ClassHonorContent;
