// @ts-nocheck
import React, { useState, useEffect, useMemo } from "react";
import {
  BASE_URL,
  TOP_GRADUATE_CATEGORY_ID,
  WISER_EXCELLENT_CATEGORY_ID,
  WISER_INSPIRATION_CATEGORY_ID,
  WISER_EXCELLENT_DEFAULT_COVER_PATH,
  WISER_INSPIRATION_DEFAULT_COVER_PATH,
} from "@/core/config";
import { FaAngleDown, FaAngleRight } from "react-icons/fa6";
import { FaSearch } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAwardBaseData } from "../hooks/useAwardBaseData";
import { useSelectedSchoolYear } from "../hooks/useSelectedSchoolYear";
import {
  pickCurrentSchoolYearId,
  pickNewestSchoolYearIdFromList,
} from "../hooks/schoolYearUtils";
import ScholarshipStudentModal from "../ScholarshipStudentModal";
import { getScholarshipBrandColor } from "../data/scholarshipBrandColors";
import { useStudentSearchQuery } from "../hooks/useStudentSearch";
import { normalizeSearchKey } from "@/shared/lib/textSearch";

/** Nền thẻ record Thủ khoa — gradient dọc (không áp vào sidebar) */
const TOP_GRADUATE_RECORD_GRADIENT =
  "linear-gradient(180deg, #F9D16F 0%, #DB9A38 28%, #FFF1D5 62%, #F9D16F 100%)";

/**
 * Một học sinh / một thẻ trong nhóm năm — API có thể trả nhiều AwardRecord (tiểu mục/import trùng) cùng HS.
 */
function dedupeYearGroupCardItems(items) {
  const byKey = new Map();
  for (const item of items) {
    const stu = item.student;
    const id = stu?.student?._id;
    const key =
      id != null && String(id).trim() !== ""
        ? `id:${String(id)}`
        : `fb:${normalizeSearchKey(stu?.student?.name || "")}|${normalizeSearchKey(
            stu.currentClass?.name ||
              stu.currentClass?.className ||
              stu.currentClass?.title ||
              "",
          )}`;
    if (!byKey.has(key)) byKey.set(key, item);
  }
  return [...byKey.values()];
}

const StudentHonorContent = ({
  categoryId,
  categoryName,
  recordIdParam,
  studentIdParam,
}) => {
  // common trước: filter năm học / search dùng chung common.json; student:… cho nhãn khối & học kỳ
  const { t, i18n } = useTranslation(["common", "student", "scholarship"]);
  const navigate = useNavigate();

  const {
    categories,
    records,
    schoolYears,
    loading: isLoadingRecords,
  } = useAwardBaseData(categoryId);

  // --- States cho giao diện lọc (filter) ---
  const [activeTab, setActiveTab] = useState("year");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [searchName, setSearchName] = useState("");
  const { normalizedTerm, isNumericSearch, trimmed } =
    useStudentSearchQuery(searchName);
  const [openLevel, setOpenLevel] = useState(null);
  /** Các nhóm năm học (Thủ khoa / WISer) đang mở — mỗi nhóm bật/tắt riêng */
  const [yearGroupExpandedKeys, setYearGroupExpandedKeys] = useState(
    () => new Set(),
  );
  /** Lọc năm học danh sách — Thủ khoa + WISer (cạnh ô search) */
  const [yearGroupedHonorSchoolYearId, setYearGroupedHonorSchoolYearId] =
    useState("");

  // State cho Modal
  const [showModal, setShowModal] = useState(false);
  const [modalRecord, setModalRecord] = useState(null); // record được chọn
  const [modalStudent, setModalStudent] = useState(null); // student được chọn
  const [, setModalClass] = useState(null); // class được chọn (chỉ reset khi đóng modal)

  // Lấy thông tin chi tiết của danh mục hiện tại từ dữ liệu API
  const currentCategory =
    categories.find((cat) => cat._id === categoryId) || {};
  const isTopGraduateCategory = categoryId === TOP_GRADUATE_CATEGORY_ID;
  // WISers: banner cover hiển thị phẳng (không frame-cover + không chữ đè)
  const isWiserPlainCoverCategory =
    categoryId === WISER_EXCELLENT_CATEGORY_ID ||
    categoryId === WISER_INSPIRATION_CATEGORY_ID;
  // Thủ khoa + WISers: bỏ lọc subAward (year/semester/month), chỉ gom theo năm học
  const isYearGroupedHonorCategory =
    isTopGraduateCategory || isWiserPlainCoverCategory;
  // Chỉ Thủ khoa: nền gradient vàng trên thẻ record; WISers dùng nền xanh như các danh hiệu khác
  const isGoldenHonorRecordCard = isTopGraduateCategory;

  // Màu tiêu đề nhóm năm — cùng cách Thành tích cuộc thi / groupedData (Detail.jsx)
  const yearGroupHeaderBrandColor = useMemo(() => {
    const label =
      currentCategory.name ||
      currentCategory.nameEng ||
      "";
    return getScholarshipBrandColor(label);
  }, [currentCategory.name, currentCategory.nameEng]);

  // -----------------------------
  // 1) Dữ liệu nền: useAwardBaseData
  // -----------------------------

  // Đổi hạng mục → reset bộ lọc năm (Thủ khoa / WISer)
  useEffect(() => {
    setYearGroupedHonorSchoolYearId("");
  }, [categoryId]);

  useEffect(() => {
    if (isLoadingRecords) return; // Đợi load xong mới xử lý
    if (!recordIdParam || !studentIdParam) return;

    const foundRecord = records.find((r) => r._id === recordIdParam);
    if (!foundRecord) {
      navigate(`/hall-of-honor/detail/${categoryName}`);
      return;
    }

    let foundStudent = null;
    for (const stu of foundRecord.students) {
      if (stu.student?._id === studentIdParam) {
        foundStudent = stu;
        break;
      }
    }
    if (!foundStudent) {
      navigate(`/hall-of-honor/detail/${categoryName}`);
      return;
    }

    setModalRecord(foundRecord);
    setModalStudent(foundStudent);
    setShowModal(true);
  }, [
    recordIdParam,
    studentIdParam,
    records,
    isLoadingRecords,
    categoryName,
    navigate,
  ]);

  const recordsSameCatAndType = records.filter(
    (r) =>
      r.awardCategory?._id === categoryId && r.subAward?.type === activeTab,
  );

  const distinctSchoolYearIds = [
    ...new Set(
      recordsSameCatAndType
        .map((r) => String(r.subAward?.schoolYear))
        .filter(Boolean),
    ),
  ];

  const relevantSchoolYears = schoolYears.filter((sy) =>
    distinctSchoolYearIds.includes(String(sy._id)),
  );

  const displaySchoolYears =
    relevantSchoolYears.length > 0 ? relevantSchoolYears : schoolYears;

  const { selectedSchoolYearId, setSelectedSchoolYearId } =
    useSelectedSchoolYear({
      schoolYears,
      displaySchoolYears,
      enabled: !isYearGroupedHonorCategory,
    });

  // -----------------------------
  // 2) Thiết lập mặc định view cho danh mục được chọn
  // SubCategory được match vào 3 phần: Năm học - Học kỳ - Tháng
  // -----------------------------
  useEffect(() => {
    if (!categoryId || !records.length) return;
    if (isYearGroupedHonorCategory) {
      setSelectedSchoolYearId("");
      setSelectedSemester("");
      setSelectedMonth("");
      return;
    }
    if (!schoolYears.length) return;
    setDefaultViewForCategory(categoryId);
  }, [categoryId, records, schoolYears, isYearGroupedHonorCategory]);

  const setDefaultViewForCategory = (catId) => {
    if (
      catId === TOP_GRADUATE_CATEGORY_ID ||
      catId === WISER_EXCELLENT_CATEGORY_ID ||
      catId === WISER_INSPIRATION_CATEGORY_ID
    ) {
      setSelectedSchoolYearId("");
      setSelectedSemester("");
      setSelectedMonth("");
      return;
    }
    // Lọc records theo category ID
    const catRecords = records.filter((r) => r.awardCategory?._id === catId);
    if (!catRecords.length) return;

    // Phân loại records theo subAward type (year, semester, month)
    const yearRecs = catRecords.filter((r) => r.subAward?.type === "year");
    const semesterRecs = catRecords.filter(
      (r) => r.subAward?.type === "semester"
    );
    const monthRecs = catRecords.filter((r) => r.subAward?.type === "month");

    // Determine which tab to show based on available records
    let targetTab = "year";
    let targetRecords = yearRecs;

    if (yearRecs.length > 0) {
      targetTab = "year";
      targetRecords = yearRecs;
    } else if (semesterRecs.length > 0) {
      targetTab = "semester";
      targetRecords = semesterRecs;
    } else if (monthRecs.length > 0) {
      targetTab = "month";
      targetRecords = monthRecs;
    }

    setActiveTab(targetTab);

    // Find the best school year to select - Ưu tiên năm học hiện tại
    const currentSyId = pickCurrentSchoolYearId(schoolYears);

    let selectedSyId;
    if (currentSyId) {
      const currentSyExists = schoolYears.some(
        (sy) => String(sy._id) === String(currentSyId),
      );
      if (currentSyExists) {
        selectedSyId = currentSyId;
      }
    }

    // Nếu không có năm học hiện tại hoặc không có records cho năm hiện tại
    if (!selectedSyId) {
      // Lấy năm học mới nhất từ available records
      const bySchoolYear = groupRecordsBySchoolYear(targetRecords);
      const availableYearIds = Object.keys(bySchoolYear);

      if (availableYearIds.length > 0) {
        selectedSyId = findNewestSchoolYearId(availableYearIds);
      } else {
        selectedSyId = pickNewestSchoolYearIdFromList(schoolYears);
      }
    }

    setSelectedSchoolYearId(selectedSyId || "");

    // Set additional filters based on tab type
    if (targetTab === "semester" && selectedSyId) {
      const recordsInSelectedSy = targetRecords.filter(
        (r) => String(r.subAward?.schoolYear) === selectedSyId
      );
      const availableSemesters = recordsInSelectedSy
        .map((r) => r.subAward?.semester)
        .filter(Boolean)
        .map(String)
        .sort((a, b) => Number(a) - Number(b));

      const chosenSemester = availableSemesters.includes("1")
        ? "1"
        : availableSemesters[0] || "";
      setSelectedSemester(chosenSemester);
    }

    if (targetTab === "month" && selectedSyId) {
      const recordsInSelectedSy = targetRecords.filter(
        (r) => String(r.subAward?.schoolYear) === selectedSyId
      );
      const availableMonths = recordsInSelectedSy
        .map((r) => r.subAward?.month)
        .filter(Boolean)
        .map(String)
        .sort((a, b) => Number(a) - Number(b));

      const currentMonth = String(new Date().getMonth() + 1);
      const chosenMonth = availableMonths.includes(currentMonth)
        ? currentMonth
        : availableMonths[0] || "";
      setSelectedMonth(chosenMonth);
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

  // -----------------------------
  // 3) Tính toán các danh sách dùng cho filter (recordsSameCatAndType + displaySchoolYears đã khai báo phía trên cho hook năm học)
  const yearGroupedHonorDisplaySchoolYears = useMemo(() => {
    if (!isYearGroupedHonorCategory) return [];
    const ids = [
      ...new Set(
        records
          .filter((r) => r.awardCategory?._id === categoryId)
          .map((r) => String(r.subAward?.schoolYear))
          .filter(Boolean),
      ),
    ];
    const relevant = schoolYears.filter((sy) => ids.includes(String(sy._id)));
    const sorted = (arr) =>
      [...arr].sort(
        (a, b) =>
          new Date(b.startDate || 0) - new Date(a.startDate || 0),
      );
    return sorted(relevant.length > 0 ? relevant : schoolYears);
  }, [isYearGroupedHonorCategory, records, categoryId, schoolYears]);

  const recordsCatTypeYear = recordsSameCatAndType.filter(
    (r) => String(r.subAward?.schoolYear) === selectedSchoolYearId
  );

  // Lấy danh sách các học kỳ từ subAwards của category theo năm học đã chọn
  const semesterSubAwards = useMemo(() => {
    return (currentCategory.subAwards || []).filter(
      (sub) =>
        sub.type === "semester" &&
        String(sub.schoolYear) === selectedSchoolYearId
    );
  }, [currentCategory.subAwards, selectedSchoolYearId]);

  // Tạo danh sách semester labels (dùng label thay vì number)
  const distinctSemesters = useMemo(() => {
    if (semesterSubAwards.length > 0) {
      // Trả về array các label của semester
      return semesterSubAwards
        .sort((a, b) => (a.priority || 0) - (b.priority || 0))
        .map((sub) => sub.label);
    }
    // Fallback: lấy từ records
    return [
      ...new Set(
        recordsCatTypeYear.map((r) => r.subAward?.label).filter(Boolean)
      ),
    ].sort();
  }, [semesterSubAwards, recordsCatTypeYear]);

  // Lọc subAwards của category theo type "month" và năm học đã chọn
  const monthSubAwards = useMemo(() => {
    return (currentCategory.subAwards || []).filter(
      (sub) =>
        sub.type === "month" && String(sub.schoolYear) === selectedSchoolYearId
    );
  }, [currentCategory.subAwards, selectedSchoolYearId]);

  // Tự động chọn semester đầu tiên khi chuyển tab "semester" hoặc đổi năm học
  useEffect(() => {
    if (
      activeTab === "semester" &&
      selectedSchoolYearId &&
      distinctSemesters.length > 0 &&
      (!selectedSemester || !distinctSemesters.includes(selectedSemester))
    ) {
      setSelectedSemester(distinctSemesters[0]);
    }
  }, [activeTab, selectedSchoolYearId, selectedSemester, distinctSemesters]);

  // Khi chuyển sang tab "month", nếu chưa chọn month thì tự động chọn option đầu tiên (nếu có)
  useEffect(() => {
    if (
      activeTab === "month" &&
      selectedSchoolYearId &&
      monthSubAwards.length > 0 &&
      (!selectedMonth ||
        !monthSubAwards.map((sub) => sub.label).includes(selectedMonth))
    ) {
      setSelectedMonth(monthSubAwards[0].label);
    }
  }, [activeTab, selectedSchoolYearId, selectedMonth, monthSubAwards]);

  // -----------------------------
  // 4) Lọc record theo các tiêu chí (useMemo → ổn định ref, tránh reset accordion nhóm năm mỗi render)
  // -----------------------------
  const filteredBaseRecords = useMemo(() => {
    if (isYearGroupedHonorCategory) {
      let list = records.filter((r) => r.awardCategory?._id === categoryId);
      if (
        yearGroupedHonorSchoolYearId &&
        String(yearGroupedHonorSchoolYearId).trim() !== ""
      ) {
        list = list.filter(
          (r) =>
            String(r.subAward?.schoolYear) ===
            String(yearGroupedHonorSchoolYearId),
        );
      }
      return list;
    }
    return records.filter((r) => {
      if (r.awardCategory?._id !== categoryId) return false;
      if (r.subAward?.type !== activeTab) return false;
      if (!selectedSchoolYearId) return false;
      if (String(r.subAward?.schoolYear) !== selectedSchoolYearId) {
        return false;
      }
      if (activeTab === "semester") {
        if (!selectedSemester) return false;
        // Filter theo label thay vì semester number
        if (r.subAward?.label !== selectedSemester) return false;
      }
      if (activeTab === "month") {
        if (!selectedMonth) return false;
        if (r.subAward?.label !== selectedMonth) return false;
      }
      return true;
    });
  }, [
    isYearGroupedHonorCategory,
    yearGroupedHonorSchoolYearId,
    records,
    categoryId,
    activeTab,
    selectedSchoolYearId,
    selectedSemester,
    selectedMonth,
  ]);

  const filteredSearchRecords = useMemo(() => {
    if (!trimmed) return filteredBaseRecords;
    return filteredBaseRecords.reduce((acc, record) => {
      const searchTerm = normalizedTerm;

      // Lọc students của record
      const filteredStudents = record.students.filter((stu) => {
        const normalizedStuName = normalizeSearchKey(stu.student?.name || "");

        const classNameRaw =
          stu.currentClass?.name || stu.currentClass?.className || "";
        const normalizedClassName = normalizeSearchKey(classNameRaw);

        if (normalizedStuName.includes(searchTerm)) {
          return true;
        }

        if (isNumericSearch) {
          const gradeMatch = normalizedClassName.match(/^\d+/);
          if (gradeMatch && gradeMatch[0] === searchTerm) {
            return true;
          }
        } else {
          if (normalizedClassName.includes(searchTerm)) {
            return true;
          }
        }

        return false;
      });

      if (filteredStudents.length > 0) {
        acc.push({ ...record, students: filteredStudents });
      }
      return acc;
    }, []);
  }, [trimmed, normalizedTerm, isNumericSearch, filteredBaseRecords]);

  // -----------------------------
  // 5) Phân chia record theo cấp học (Tiểu học, THCS, THPT)
  // -----------------------------
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
        const studentsInRange = record.students.filter((stu) => {
          const className =
            stu.currentClass?.name || stu.currentClass?.className || "";
          const classNumber = parseInt(className.match(/\d+/)?.[0], 10);
          if (!classNumber) return false;
          return classNumber >= minClass && classNumber <= maxClass;
        });
        return {
          ...record,
          students: studentsInRange,
        };
      })
      .filter((r) => r.students.length > 0);
  };

  /////// Modal

  // Hàm mở modal khi click vào 1 học sinh
  const handleOpenModal = (record, student) => {
    setModalRecord(record);
    setModalStudent(student);
    setShowModal(true);
    navigate(
      `/detail/${categoryName}/student/${record._id}/${student.student?._id}`
    );
  };

  // Hàm đóng modal
  const handleCloseModal = () => {
    setShowModal(false);
    setModalRecord(null);
    setModalStudent(null);
    setModalClass(null);
    navigate(`/detail/${categoryName}`);
  };

  const honorRecordCardClass = isGoldenHonorRecordCard
    ? "lg:min-h-[458px] min-h-[328px] h-auto lg:w-[258px] w-[180px] border border-black/10 rounded-[20px] shadow-sm lg:pt-[18px] lg:pb-[8px] lg:px-[25px] px-[15px] pt-[14px] pb-[7px] flex flex-col items-center justify-start gap-1.5 cursor-pointer"
    : "lg:h-[400px] lg:w-[258px] w-[180px] h-[270px] border rounded-[20px] shadow-sm lg:py-[20px] lg:px-[25px] px-[15px] py-[15px] bg-gradient-to-b from-[#03171c] to-[#182b55] flex flex-col items-center justify-center space-y-2 cursor-pointer";
  const honorRecordCardStyle = isGoldenHonorRecordCard
    ? { background: TOP_GRADUATE_RECORD_GRADIENT }
    : undefined;
  const honorRecordClassLineClass = isGoldenHonorRecordCard
    ? "min-h-[20px] w-[208px] lg:text-[15px] text-[11px] lg:pt-[13px] lg:pb-[8px] pt-[8px] pb-[6px] font-semibold text-[#002147] py-2 text-center leading-tight px-0.5"
    : "h-[20px] w-[208px] lg:text-[16px] text-xs lg:pt-[13px] lg:pb-[15px] pt-[8px] pb-[10px] font-semibold text-white py-2 text-center";
  // Tên học sinh: khối 3 dòng (như thẻ cuộc thi line-clamp-3); tên ngắn giữ chừa dòng
  const honorRecordNameWrapperClass =
    "min-h-[4.125rem] lg:min-h-[4.65rem] lg:w-[208px] w-[150px] flex items-center justify-center px-0.5";
  const honorRecordNameTextClass = isGoldenHonorRecordCard
    ? "line-clamp-3 max-w-full break-words text-center font-bold leading-snug text-[#002147] lg:text-[18px] text-[14px]"
    : "line-clamp-3 max-w-full break-words text-center font-bold leading-snug text-[#f9d16f] lg:text-[18px] text-[14px]";
  // Dòng đáy thẻ: Thủ khoa (chữ xanh trên nền vàng); WISers (chữ vàng trên nền xanh)
  const honorRecordFootLineClass = isTopGraduateCategory
    ? "max-w-[220px] w-full lg:mt-2 mt-1.5 text-[#002147]/95 lg:text-[15px] text-[11px] font-semibold text-center leading-snug px-0.5 break-words"
    : isWiserPlainCoverCategory
      ? "max-w-[220px] w-full lg:mt-2 mt-1.5 text-[#f9d16f] lg:text-[14px] text-[11px] font-semibold text-center leading-snug px-0.5 break-words"
      : "";
  const honorRecordNoPhotoClass = isGoldenHonorRecordCard
    ? "text-xs italic text-[#002147]/70"
    : "text-xs italic text-gray-400";

  // Hàm chuẩn hóa category name (bỏ \n, chuẩn hóa case)
  const normalizeCategoryName = (name) => {
    if (!name) return "";
    // Bỏ \n và khoảng trắng thừa, chuẩn hóa chữ hoa/thường
    return name
      .replace(/\\n/g, " ") // Thay \n thành space
      .replace(/\n/g, " ") // Thay newline thành space
      .replace(/\s+/g, " ") // Thay nhiều space thành 1 space
      .split(" ")
      .map((word) => {
        // Chữ đầu viết hoa, các chữ sau viết thường
        if (word.length === 0) return "";
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(" ")
      .trim();
  };

  // Hàm lấy tên năm học (hoặc code) từ schoolYears — dùng cho tag [NH/SY …] và getSubAwardLabel
  const findSchoolYearLabel = (syId) => {
    const syDoc = schoolYears.find((sy) => String(sy._id) === String(syId));
    // Ví dụ hiển thị "2024-2025" hay "Khóa 2024-2025"
    return syDoc?.code || syDoc?.name || "";
  };

  // Tag trên thẻ: 2025-2026 / 2025 - 2026 → 25-26 (không đổi getSubAwardLabel modal đầy đủ)
  const formatSchoolYearTagShort = (raw) => {
    if (raw == null) return "";
    const s = String(raw).trim();
    if (!s) return "";
    const fourDigitYears = s.match(/\b(19|20)\d{2}\b/g);
    if (fourDigitYears && fourDigitYears.length >= 2) {
      return `${fourDigitYears[0].slice(-2)}-${fourDigitYears[1].slice(-2)}`;
    }
    const shortPair = s.match(/\b(\d{2})\s*[-–/]\s*(\d{2})\b/);
    if (shortPair) return `${shortPair[1]}-${shortPair[2]}`;
    return s;
  };

  /** Rút gọn năm học trên thẻ — đồng bộ Detail.jsx (Thành tích cuộc thi) */
  const getSchoolYearShortOnCard = (syId) => {
    const full = findSchoolYearLabel(syId);
    if (!full) return "";
    const s = String(full).trim();
    if (/^\d{2}-\d{2}$/.test(s)) return s;
    const m4 = s.match(/(\d{4})\s*[-–—]\s*(\d{4})/);
    if (m4) return `${m4[1].slice(-2)}-${m4[2].slice(-2)}`;
    const m2 = s.match(/(\d{2})\s*[-–—]\s*(\d{2})/);
    if (m2) return `${m2[1]}-${m2[2]}`;
    return s.replace(/\s+/g, "");
  };

  // Hàm phụ: trả về text cho danh hiệu với song ngữ
  const getSubAwardLabel = (record) => {
    if (!record?.subAward) return "";
    const { type, schoolYear, label, labelEng } = record.subAward;

    // Lấy tên category theo ngôn ngữ và chuẩn hóa
    const rawCategoryName =
      i18n.language === "vi"
        ? currentCategory.name || t("award", "Danh hiệu")
        : currentCategory.nameEng || t("award", "Award");

    const categoryName = normalizeCategoryName(rawCategoryName);

    const schoolYearLabel = findSchoolYearLabel(schoolYear);

    // Lấy label của sub_category theo ngôn ngữ
    const subCategoryLabel = i18n.language === "vi" ? label : labelEng || label;

    if (type === "year") {
      // Năm học: "Học sinh Danh dự - Năm học 2025-2026"
      return `${categoryName} - ${subCategoryLabel}`;
    } else if (type === "semester") {
      // Học kì: "Học sinh Danh dự - Học kì 1 - Năm học 2025-2026"
      return `${categoryName} - ${subCategoryLabel} - ${t("schoolYearSC", "Năm học")} ${schoolYearLabel}`;
    } else if (type === "month") {
      // Tháng: "Học sinh Danh dự - Tháng 10 - Năm học 2025-2026"
      return `${categoryName} - ${subCategoryLabel} - ${t("schoolYearSC", "Năm học")} ${schoolYearLabel}`;
    } else if (type === "custom") {
      // Custom: "Học sinh Danh dự - [Custom Label] - Năm học 2025-2026"
      return `${categoryName} - ${subCategoryLabel} - ${t("schoolYearSC", "Năm học")} ${schoolYearLabel}`;
    }

    return categoryName;
  };

  // Label tiểu mục ngắn cho thẻ (song ngữ; không ghép category)
  const getRecordSubAwardShortLabel = (record) => {
    if (!record?.subAward) return "";
    const { label, labelEng } = record.subAward;
    if (i18n.language === "vi") return (label || "").trim();
    return (labelEng || label || "").trim();
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

  // Thủ khoa & WISers: gom record theo năm học (subAward.schoolYear), bỏ qua loại tiểu mục
  const topGraduateYearGroups = useMemo(() => {
    if (!isYearGroupedHonorCategory) return [];
    const bySy = new Map();
    for (const record of filteredSearchRecords) {
      const rawSy = record.subAward?.schoolYear;
      const syKey =
        rawSy != null && String(rawSy) !== "" ? String(rawSy) : "__none__";
      if (!bySy.has(syKey)) bySy.set(syKey, []);
      bySy.get(syKey).push(record);
    }
    const keys = [...bySy.keys()];
    keys.sort((a, b) => {
      if (a === "__none__") return 1;
      if (b === "__none__") return -1;
      const ya = schoolYears.find((y) => String(y._id) === a);
      const yb = schoolYears.find((y) => String(y._id) === b);
      return new Date(yb?.startDate || 0) - new Date(ya?.startDate || 0);
    });
    return keys.map((syKey) => {
      const syDoc =
        syKey === "__none__"
          ? null
          : schoolYears.find((sy) => String(sy._id) === syKey);
      // Tiêu đề nhóm: năm học đầy đủ (code/name từ CMS), không viết tắt 25-26
      const fullYearText =
        syDoc?.code || syDoc?.name || "";
      const title =
        syKey === "__none__"
          ? t("schoolYearUnknown", "Năm học khác")
          : fullYearText
            ? `${t("schoolYearPrefix", "Năm học")} ${fullYearText}`
            : t("schoolYearUnknown", "Năm học khác");
      return {
        sectionKey: syKey,
        title,
        records: bySy.get(syKey),
      };
    });
  }, [isYearGroupedHonorCategory, filteredSearchRecords, schoolYears, t]);

  // Mặc định mở hết các nhóm năm khi dữ liệu nhóm thay đổi
  useEffect(() => {
    if (!isYearGroupedHonorCategory) {
      setYearGroupExpandedKeys(new Set());
      return;
    }
    if (topGraduateYearGroups.length === 0) return;
    setYearGroupExpandedKeys(
      new Set(topGraduateYearGroups.map((g) => g.sectionKey)),
    );
  }, [isYearGroupedHonorCategory, topGraduateYearGroups]);

  const renderHonorRecordCard = (item, idx) => {
    const { record, student } = item;
    const cardKey = `${record._id}-${student.student?._id ?? idx}`;
    const openCardModal = () => handleOpenModal(record, student);

    // WISers — layout flat như cuộc thi; chữ sát ảnh (không mt-auto / justify-between)
    if (isWiserPlainCoverCategory) {
      const classNameForCard =
        student.currentClass?.title ||
        student.currentClass?.className ||
        student.currentClass?.name ||
        t("noClass", "Chưa cập nhật lớp");
      const syShort = getSchoolYearShortOnCard(record.subAward?.schoolYear);
      const nhTag = syShort
        ? `[${t("schoolYearAbbr", "NH")} ${syShort}]`
        : "";
      const wiserClassYearLine = nhTag
        ? `${t("classLabel", "Lớp")} ${classNameForCard} - ${nhTag}`
        : `${t("classLabel", "Lớp")} ${classNameForCard}`;
      const wiserCategoryTitleLine = normalizeCategoryName(
        i18n.language === "vi"
          ? currentCategory.name || ""
          : currentCategory.nameEng || currentCategory.name || "",
      );

      return (
        <div
          key={cardKey}
          role="button"
          tabIndex={0}
          className="lg:w-[250px] w-[180px] rounded-[30px] shadow-sm flex flex-col items-center border border-white/15 lg:h-[420px] h-[370px] lg:px-5 lg:py-5 px-4 py-5 cursor-pointer bg-gradient-to-b from-[#03171c] to-[#182b55]"
          onClick={openCardModal}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openCardModal();
            }
          }}
        >
          <div className="flex w-full flex-col items-center text-center">
            <div className="mb-0.5 flex w-full flex-shrink-0 justify-center">
              {student.photo?.photoUrl ? (
                <img
                  src={`${BASE_URL}/${student.photo.photoUrl}`}
                  alt=""
                  className="h-[250px] w-[190px] object-cover object-top rounded-2xl shadow-md ring-1 ring-white/25"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              ) : (
                <div className="flex h-[250px] w-[190px] items-center justify-center rounded-2xl bg-gray-200 text-sm italic text-gray-400">
                  {t("noPhoto", "Chưa có ảnh")}
                </div>
              )}
            </div>
            <div className="flex w-full flex-col items-center pb-0 pt-1">
              <p className="w-full text-[13px] sm:text-[14px] font-semibold leading-snug text-white">
                {wiserClassYearLine}
              </p>
              <p className="mt-1.5 w-full min-h-[4.2rem] sm:min-h-[4.65rem] flex items-center justify-center px-1">
                <span className="line-clamp-3 w-full text-center text-[16px] sm:text-[18px] font-bold leading-snug break-words text-[#F9D16F]">
                  {student.student?.name}
                </span>
              </p>
              {wiserCategoryTitleLine ? (
                <p className="mt-2 w-full text-[13px] sm:text-[14px] font-semibold leading-snug text-white">
                  {wiserCategoryTitleLine}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      );
    }

    const classNameRaw =
      student.currentClass?.name ||
      student.currentClass?.className ||
      t("noClass", "Chưa cập nhật lớp");
    const syRaw = findSchoolYearLabel(record.subAward?.schoolYear);
    const syTagShort = syRaw ? formatSchoolYearTagShort(syRaw) : "";
    const subAwardLine = getRecordSubAwardShortLabel(record);
    const cardFootLine = isTopGraduateCategory ? subAwardLine : "";

    return (
      <div
        key={cardKey}
        className={honorRecordCardClass}
        style={honorRecordCardStyle}
        onClick={openCardModal}
      >
        {student.photo?.photoUrl ? (
          <img
            src={`${BASE_URL}/${student.photo.photoUrl}`}
            alt="Student"
            className="lg:h-[260px] lg:w-[208px] w-[208px] h-[160px] object-cover object-top rounded-[15px]"
          />
        ) : (
          <div className={honorRecordNoPhotoClass}>
            {t("noPhoto", "Chưa có ảnh")}
          </div>
        )}
        <div className={honorRecordClassLineClass}>
          {isYearGroupedHonorCategory && syTagShort
            ? `${t("classLabel", "Lớp")} ${classNameRaw} - [${t("schoolYearAbbr", "NH")} ${syTagShort}]`
            : `${t("classLabel", "Lớp")} ${classNameRaw}`}
        </div>
        <div className={honorRecordNameWrapperClass}>
          <span className={honorRecordNameTextClass}>
            {student.student?.name}
          </span>
        </div>
        {isTopGraduateCategory && subAwardLine && honorRecordFootLineClass ? (
          <div className={honorRecordFootLineClass}>{cardFootLine}</div>
        ) : null}
      </div>
    );
  };

  // Modal Thủ khoa + WISer: header giống HB AP (tên danh hiệu + tiểu mục, lớp + năm học một dòng)
  const honorScholarshipModalHeader = useMemo(() => {
    if (
      (!isTopGraduateCategory && !isWiserPlainCoverCategory) ||
      !modalRecord ||
      !modalStudent
    ) {
      return null;
    }
    const rawTitle =
      i18n.language === "vi"
        ? currentCategory.name || ""
        : currentCategory.nameEng || currentCategory.name || "";
    const title = normalizeCategoryName(rawTitle);
    const sub =
      i18n.language === "vi"
        ? (modalRecord.subAward?.label || "").trim()
        : (
            modalRecord.subAward?.labelEng ||
            modalRecord.subAward?.label ||
            ""
          ).trim();
    // WISer Ưu tú / Truyền cảm hứng: thẻ chỉ hiện tên category; CMS hay lặp cùng nội dung trong subAward.label → gộp title+sub làm đôi dòng
    const scholarshipText = isWiserPlainCoverCategory
      ? title || sub
      : [title, sub].filter(Boolean).join(" ");

    const className =
      modalStudent.currentClass?.name ||
      modalStudent.currentClass?.className ||
      t("noClass", "Chưa cập nhật lớp");
    const syId = modalRecord.subAward?.schoolYear;
    const syDoc = schoolYears.find((sy) => String(sy._id) === String(syId));
    const yearFull = syDoc?.code || syDoc?.name || "";
    const classLineText = `${t("classLabel", "Lớp")} ${className}`;
    const schoolYearLineText = t("apModalSchoolYearLine", "Năm học {{year}}", {
      year: yearFull || "—",
    });
    return { scholarshipText, classLineText, schoolYearLineText };
  }, [
    isTopGraduateCategory,
    isWiserPlainCoverCategory,
    modalRecord,
    modalStudent,
    i18n.language,
    currentCategory.name,
    currentCategory.nameEng,
    schoolYears,
    t,
  ]);

  const categoryCoverDisplaySrc = useMemo(() => {
    if (currentCategory.coverImage) {
      return `${BASE_URL}${currentCategory.coverImage}`;
    }
    if (categoryId === WISER_EXCELLENT_CATEGORY_ID) {
      return WISER_EXCELLENT_DEFAULT_COVER_PATH;
    }
    if (categoryId === WISER_INSPIRATION_CATEGORY_ID) {
      return WISER_INSPIRATION_DEFAULT_COVER_PATH;
    }
    return null;
  }, [currentCategory.coverImage, categoryId]);

  return (
    <div className="lg:p-6 px-3 mb-10 lg:min-w-[960px] w-full mx-auto mt-[40px] overflow-y-auto">
      {/* ===== PHẦN 1: TIÊU ĐỀ, MÔ TẢ VÀ ẢNH COVER CỦA CATEGORY ===== */}
      <div>
        {/* Tiêu đề Category - Hiển thị theo ngôn ngữ (vi/en) */}
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

        {/* Mô tả Category - Hiển thị theo ngôn ngữ (description_vn / description_en) */}
        <div className="lg:w-[900px] w-full mx-auto text-left mt-4 mb-4">
          <div className="mb-4 text-[#002855] text-justify font-semibold lg:text-[18px] text-[15px]">
            {i18n.language === "vi"
              ? currentCategory.description || ""
              : currentCategory.descriptionEng || ""}
          </div>
        </div>

        {/* Ảnh cover: Frappe hoặc mặc định WISers (public/); WISers không lớp frame/chữ đè */}
        {categoryCoverDisplaySrc &&
          (isWiserPlainCoverCategory ? (
            <div className="relative mb-4 mt-8 w-full max-h-[470px] mx-auto">
              <img
                src={categoryCoverDisplaySrc}
                alt="Cover"
                className="w-full max-h-[470px] object-cover"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            </div>
          ) : (
            <div className="relative mb-4 mt-8 w-full max-h-[470px] mx-auto">
              <img
                src={categoryCoverDisplaySrc}
                alt="Cover"
                className="w-full max-h-[470px] object-cover"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
              <img
                src={`/halloffame/frame-cover.png`}
                alt="Frame Cover"
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
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
          ))}
      </div>

      {/* ===== PHẦN 2: TABS (không dùng cho Thủ khoa / WISers — gom theo năm) ===== */}
      {!isYearGroupedHonorCategory && (
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
      )}

      {/* ===== PHẦN 3: BỘ LỌC — Thủ khoa / WISers chỉ còn ô tìm kiếm ===== */}
      <div
        className={`flex flex-wrap items-center justify-center gap-3 mb-6 ${isYearGroupedHonorCategory ? "mt-10" : ""}`}
      >
        {!isYearGroupedHonorCategory && (
          <>
            {/* Dropdown chọn năm học - Hiển thị cho cả 3 tabs */}
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

            {/* Dropdown chọn học kì - Chỉ hiển thị khi tab "semester" được chọn */}
            {activeTab === "semester" && selectedSchoolYearId && (
              <select
                className="py-2 bg-[#f5f5f5] text-[#757575] border-none rounded-full focus:outline-none"
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
              >
                <option value="">
                  {t("selectSemester", "--Chọn học kì--")}
                </option>
                {distinctSemesters.length > 0 ? (
                  distinctSemesters.map((label) => {
                    // Tìm subAward tương ứng để lấy label theo ngôn ngữ
                    const subAward = semesterSubAwards.find(
                      (sub) => sub.label === label
                    );
                    const displayLabel =
                      i18n.language === "vi"
                        ? label
                        : subAward?.labelEng || label;

                    return (
                      <option key={label} value={label}>
                        {displayLabel}
                      </option>
                    );
                  })
                ) : (
                  <option disabled>
                    {t("student:noSemesterAvailable", "Chưa có học kì nào")}
                  </option>
                )}
              </select>
            )}

            {/* Dropdown chọn tháng - Chỉ hiển thị khi tab "month" được chọn */}
            {activeTab === "month" && selectedSchoolYearId && (
              <select
                className="py-2 bg-[#f5f5f5] text-[#757575] border-none rounded-full focus:outline-none"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                <option value="">{t("selectMonth", "--Chọn tháng--")}</option>
                {monthSubAwards.map((sub) => {
                  // Hiển thị label theo ngôn ngữ
                  const displayLabel =
                    i18n.language === "vi"
                      ? sub.label
                      : sub.labelEng || sub.label;

                  return (
                    <option key={sub.label} value={sub.label}>
                      {displayLabel}
                    </option>
                  );
                })}
              </select>
            )}
          </>
        )}

        {isYearGroupedHonorCategory && (
          <select
            className="lg:w-[280px] w-[min(100%,280px)] py-2 px-3 bg-[#f5f5f5] text-[#757575] border-none rounded-full focus:outline-none"
            value={yearGroupedHonorSchoolYearId}
            onChange={(e) => setYearGroupedHonorSchoolYearId(e.target.value)}
            aria-label={t("schoolYear", "Năm học")}
          >
            <option value="">
              {t("student:allSchoolYears", "Tất cả năm học")}
            </option>
            {yearGroupedHonorDisplaySchoolYears.map((sy) => (
              <option key={sy._id} value={sy._id}>
                {t("schoolYearText", "Năm học")} {sy.code || sy.name}
              </option>
            ))}
          </select>
        )}

        <div className="relative flex items-center justify-items-center">
          <input
            type="text"
            placeholder={t("searchNamePlaceholder", "Tìm kiếm tên")}
            className="lg:w-[400px] w-[250px] px-4 py-2 bg-[#f5f5f5] text-[#757575] border-none rounded-full focus:outline-none"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
          />
          <button className="hidden absolute right-[-40px] w-[36px] h-[36px] bg-[#002855] rounded-full lg:flex items-center justify-center hover:bg-[#001F3F] transition">
            <FaSearch className="text-white text-[18px]" />
          </button>
        </div>
      </div>

      {isYearGroupedHonorCategory ? (
        topGraduateYearGroups.length === 0 ? (
          <div className="text-center text-gray-500 py-10">
            {t("noMatchingData", "Không có dữ liệu phù hợp")}
          </div>
        ) : (
          <div className="space-y-10">
            {topGraduateYearGroups.map((group) => {
              const items = dedupeYearGroupCardItems(
                group.records.flatMap((record) =>
                  record.students.map((student) => ({ record, student })),
                ),
              ).sort((a, b) =>
                (a.student.student?.name || "").localeCompare(
                  b.student.student?.name || "",
                  "vi",
                ),
              );
              const isOpen = yearGroupExpandedKeys.has(group.sectionKey);
              return (
                <div key={group.sectionKey} className="w-full mx-auto">
                  <button
                    type="button"
                    className="w-full flex justify-between items-center gap-3 py-2 mb-4 text-left hover:opacity-90"
                    onClick={() =>
                      setYearGroupExpandedKeys((prev) => {
                        const next = new Set(prev);
                        if (next.has(group.sectionKey)) {
                          next.delete(group.sectionKey);
                        } else {
                          next.add(group.sectionKey);
                        }
                        return next;
                      })
                    }
                  >
                    <span
                      className="font-bold text-xl lg:text-2xl pr-2"
                      style={{ color: yearGroupHeaderBrandColor }}
                    >
                      {group.title}
                    </span>
                    <span
                      className="shrink-0 flex h-9 w-9 items-center justify-center rounded-full border bg-white shadow-sm"
                      style={{
                        borderColor: yearGroupHeaderBrandColor,
                        color: yearGroupHeaderBrandColor,
                      }}
                    >
                      {isOpen ? (
                        <FaAngleDown className="text-base" />
                      ) : (
                        <FaAngleRight className="text-base" />
                      )}
                    </span>
                  </button>
                  {isOpen ? (
                    <div className="flex flex-wrap justify-center items-start gap-x-[8px] gap-y-[8px] lg:gap-x-[30px] lg:gap-y-[35px] w-full py-2">
                      {items.map((item, idx) =>
                        renderHonorRecordCard(item, idx),
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}
            <div className="flex justify-center pt-6 pb-2 w-full">
              <img
                src="/halloffame/vector.png"
                alt=""
                className="max-w-full h-auto"
              />
            </div>
          </div>
        )
      ) : searchName.trim() ? (
        <div className="grid justify-items-center xl:grid-cols-5 lg:grid-cols-4 md:grid-cols-3 grid-cols-2 gap-x-[8px] gap-y-[8px] lg:gap-x-[30px] lg:gap-y-[35px]">
          {filteredSearchRecords
            .flatMap((record) =>
              record.students.map((student) => ({ record, student })),
            )
            .map((item, idx) => renderHonorRecordCard(item, idx))}
        </div>
      ) : (
        // Render theo nhóm (educationLevels)
        educationLevels.map((level) => {
          const levelRecords = filterRecordsByLevel(
            filteredSearchRecords,
            level.minClass,
            level.maxClass
          );
          if (levelRecords.length === 0) return null;
          const studentCards = [];
          levelRecords.forEach((rec) => {
            rec.students.forEach((stu) => {
              studentCards.push({ record: rec, student: stu });
            });
          });
          return (
            <div
              key={level.id}
              className="w-full border-b border-gray-200 pb-4 mx-auto"
            >
              <div
                className="w-full flex justify-between items-center cursor-pointer py-4 text-[#002855] text-[22px] font-semibold"
                onClick={() =>
                  setOpenLevel(openLevel === level.id ? null : level.id)
                }
              >
                <span>{level.name}</span>
                <span className="text-gray-500 text-lg">
                  {openLevel === level.id ? <FaAngleDown /> : <FaAngleRight />}
                </span>
              </div>
              {openLevel === level.id && (
                <div className="">
                  {studentCards.length === 0 ? (
                    <div className="text-gray-500 italic">
                      {t("noMatchingRecords", "Không có record nào phù hợp...")}
                    </div>
                  ) : (
                    <div className="w-full grid justify-items-center xl:grid-cols-5 lg:grid-cols-4 md:grid-cols-3 grid-cols-2 gap-x-[8px] gap-y-[20px] lg:gap-x-[30px] lg:gap-y-[35px]">
                      {studentCards.map((item, idx) => {
                        const { record, student } = item;
                        return (
                          <div
                            key={idx}
                            className={honorRecordCardClass}
                            style={honorRecordCardStyle}
                            onClick={() => handleOpenModal(record, student)}
                          >
                            {student.photo?.photoUrl ? (
                              <img
                                src={`${BASE_URL}/${student.photo.photoUrl}`}
                                alt="Student"
                                className="lg:h-[260px] lg:w-[208px] w-[208px] h-[160px] object-cover object-top rounded-[15px]"
                              />
                            ) : (
                              <div className={honorRecordNoPhotoClass}>
                                {t("noPhoto", "Chưa có ảnh")}
                              </div>
                            )}
                            <div className={honorRecordClassLineClass}>
                              {t("classLabel", "Lớp")}{" "}
                              {student.currentClass?.name ||
                                student.currentClass?.className ||
                                t("noClass", "Chưa cập nhật lớp")}
                            </div>
                            <div className={honorRecordNameWrapperClass}>
                              <span className={honorRecordNameTextClass}>
                                {student.student?.name}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
      {/* Modal Thủ khoa + WISer: cùng ScholarshipStudentModal như HB AP */}
      {showModal &&
      modalStudent &&
      modalRecord &&
      (isTopGraduateCategory || isWiserPlainCoverCategory) ? (
        <ScholarshipStudentModal
          open
          onClose={handleCloseModal}
          modalRecord={modalRecord}
          modalStudent={modalStudent}
          apDiplomaHeader={honorScholarshipModalHeader}
        />
      ) : null}

      {/* Modal danh hiệu khác: thẻ studentcard cũ */}
      {showModal &&
      modalStudent &&
      modalRecord &&
      !isTopGraduateCategory &&
      !isWiserPlainCoverCategory ? (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50"
          onClick={handleCloseModal}
        >
          <div
            className="lg:w-[980px] md:w-[80%] w-[95%] h-auto rounded-[20px] lg:py-20 lg:px-20 py-5 relative shadow-lg"
            style={{
              backgroundImage: `url(${
                window.innerWidth >= 1024
                  ? `/halloffame/studentcard-desktop.png`
                  : `/halloffame/studentcard-mobile.png`
              })`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Bố cục chia làm 2 phần: Ảnh bên trái - Thông tin bên phải */}
            <div className="flex flex-col lg:flex-row lg:space-x-6 space-y-6 lg:space-y-0 ">
              {/* Khung ảnh với nền lệch */}
              <div className="relative flex-shrink-0 px-[25px] lg:px-0">
                {modalStudent.photo?.photoUrl ? (
                  <img
                    src={`${BASE_URL}/${modalStudent.photo.photoUrl}`}
                    alt="Student"
                    className="relative z-10 lg:w-[281px] lg:h-[352px] w-full h-[320px] items-center object-cover object-top rounded-[15px] shadow-md "
                  />
                ) : (
                  <div className="relative z-10 lg:w-[322px] lg:h-[428px] w-[150px] h-[200px] bg-gray-200 flex items-center justify-center rounded-lg shadow-md">
                    <span className="text-xs text-gray-400">
                      {t("noPhoto", "Chưa có ảnh")}
                    </span>
                  </div>
                )}
              </div>

              {/* Phần thông tin học sinh */}
              <div className="flex flex-col items-start justify-start lg:px-[10px] px-[20px] ">
                <div className="lg:w-[500px] w-full flex flex-col">
                  <h2 className="lg:text-[24px] text-[16px] font-bold text-[#F9D16F]">
                    {modalStudent.student?.name}
                  </h2>
                  <div className="flex justify-start gap-6 mt-1 text-[#F9D16F] text-[14px]">
                    <span className="font-semibold lg:text-[16px] text-[12px]">
                      {`${t("classLabel", "Lớp")} ${modalStudent.currentClass?.name || modalStudent.currentClass?.className || t("noClass", "Chưa cập nhật lớp")}`}
                    </span>
                  </div>
                  <hr className="border-t border-gray-100 my-3 w-full" />
                </div>

                {/* Danh hiệu */}
                <p className="w-full mb-2 font-semibold text-white text-[13px] md:text-[15px] lg:text-[18px]">
                  {getSubAwardLabel(modalRecord)}
                </p>
                <div className="border-b-2 pb-4">
                  {/* Nội dung lời nhắn */}
                  {(i18n.language === "vi"
                    ? modalStudent.note
                    : modalStudent.noteEng) && (
                    <p className=" text-white my-auto text-justify text-[13px] md:text-[16px]">
                      {i18n.language === "vi"
                        ? modalStudent.note
                        : modalStudent.noteEng}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Nút đóng */}
            <div className="flex w-full mx-auto items-center justify-center mt-4">
              <button
                onClick={handleCloseModal}
                className="bg-[#F9D16F] lg:px-16 px-2 lg:py-1 py-1 rounded-md text-[#002855] text-[13px] lg:text-[16px] font-semibold hover:bg-gray-400"
              >
                {t("close", "Đóng")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default StudentHonorContent;
