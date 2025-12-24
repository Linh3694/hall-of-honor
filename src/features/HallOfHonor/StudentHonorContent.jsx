import React, { useState, useEffect, useMemo } from "react";
import { BASE_URL } from "../../core/config";
import { FaAngleDown, FaAngleRight } from "react-icons/fa6";
import { FaSearch } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import hallOfHonorService from "../../services/hallOfHonorService";

const StudentHonorContent = ({
  categoryId,
  categoryName,
  recordIdParam,
  studentIdParam,
  setSearchParams,
}) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  // --- States cho dữ liệu API ---
  const [categories, setCategories] = useState([]);
  const [records, setRecords] = useState([]);
  const [schoolYears, setSchoolYears] = useState([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(true);

  // --- States cho giao diện lọc (filter) ---
  const [activeTab, setActiveTab] = useState("year");
  const [selectedSchoolYearId, setSelectedSchoolYearId] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [searchName, setSearchName] = useState("");
  const [openLevel, setOpenLevel] = useState(null);

  // State cho Modal
  const [showModal, setShowModal] = useState(false);
  const [modalRecord, setModalRecord] = useState(null); // record được chọn
  const [modalStudent, setModalStudent] = useState(null); // student được chọn
  const [modalClass, setModalClass] = useState(null); // class được chọn

  // Lấy thông tin chi tiết của danh mục hiện tại từ dữ liệu API
  const currentCategory =
    categories.find((cat) => cat._id === categoryId) || {};

  // -----------------------------
  // 1) Lấy dữ liệu từ server
  // -----------------------------
  useEffect(() => {
    fetchCategories();
    fetchRecords();
    fetchSchoolYears();
  }, []);

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

  // Lấy danh sách categories từ Frappe backend qua service
  const fetchCategories = async () => {
    try {
      const categoriesData = await hallOfHonorService.getAwardCategories();
      setCategories(categoriesData);
    } catch (err) {
      console.error("❌ Error fetching categories:", err);
      setCategories([]);
    }
  };

  // Lấy danh sách records từ Frappe backend qua service
  const fetchRecords = async () => {
    setIsLoadingRecords(true);
    try {
      // Có thể truyền filters nếu cần, ví dụ:
      // const filters = { categoryId: categoryId };
      const recordsData = await hallOfHonorService.getAwardRecords();
      setRecords(recordsData);
    } catch (err) {
      console.error("❌ Error fetching records:", err);
      setRecords([]);
    } finally {
      setIsLoadingRecords(false);
    }
  };

  // Lấy danh sách school years từ Frappe backend qua service
  const fetchSchoolYears = async () => {
    try {
      const schoolYearsData = await hallOfHonorService.getSchoolYears();
      setSchoolYears(schoolYearsData);
    } catch (err) {
      console.error("❌ Error fetching schoolYears:", err);
      setSchoolYears([]); // Đảm bảo luôn là mảng
    }
  };

  // -----------------------------
  // 2) Thiết lập mặc định view cho danh mục được chọn
  // SubCategory được match vào 3 phần: Năm học - Học kỳ - Tháng
  // -----------------------------
  useEffect(() => {
    if (categoryId && records.length && schoolYears.length) {
      setDefaultViewForCategory(categoryId);
    }
  }, [categoryId, records, schoolYears]);

  const setDefaultViewForCategory = (catId) => {
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
    const currentSyId = getCurrentSchoolYearId();

    let selectedSyId;
    if (currentSyId) {
      // Kiểm tra xem năm học hiện tại có trong schoolYears không
      const currentSyExists = schoolYears.some((sy) => sy._id === currentSyId);
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
        // Nếu không có records nào, chọn năm học mới nhất từ tất cả năm học
        const newestYear = [...schoolYears].sort((a, b) => {
          const dateA = new Date(a.startDate);
          const dateB = new Date(b.startDate);
          return dateB - dateA;
        })[0];
        selectedSyId = newestYear?._id || "";
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

  // Hàm lấy năm học hiện tại (đang diễn ra)
  const getCurrentSchoolYearId = () => {
    const today = new Date();
    const currentSy = schoolYears.find((sy) => {
      const start = new Date(sy.startDate);
      const end = new Date(sy.endDate);
      return today >= start && today <= end;
    });
    return currentSy ? currentSy._id : "";
  };

  // Hàm lấy năm học mới nhất (nếu không tìm thấy năm học hiện tại)
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

  // -----------------------------
  // 3) Tính toán các danh sách dùng cho filter
  // Lọc records theo category và type (year/semester/month)
  // -----------------------------
  const recordsSameCatAndType = records.filter(
    (r) => r.awardCategory?._id === categoryId && r.subAward?.type === activeTab
  );

  const distinctSchoolYearIds = [
    ...new Set(
      recordsSameCatAndType
        .map((r) => String(r.subAward?.schoolYear))
        .filter(Boolean)
    ),
  ];

  const relevantSchoolYears = schoolYears.filter((sy) =>
    distinctSchoolYearIds.includes(String(sy._id))
  );

  // Fallback: If no relevant school years found, show all school years
  const displaySchoolYears =
    relevantSchoolYears.length > 0 ? relevantSchoolYears : schoolYears;

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

  const recordsCatTypeYear = recordsSameCatAndType.filter(
    (r) => String(r.subAward?.schoolYear) === selectedSchoolYearId
  );

  // Lọc month records cho category và năm học hiện tại
  const monthRecords = useMemo(() => {
    return records.filter(
      (r) =>
        r.awardCategory?._id === categoryId &&
        r.subAward?.type === "month" &&
        String(r.subAward?.schoolYear) === selectedSchoolYearId
    );
  }, [records, categoryId, selectedSchoolYearId]);

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

  const distinctMonths = useMemo(() => {
    return [
      ...new Set(
        recordsCatTypeYear.map((r) => r.subAward?.month).filter(Boolean)
      ),
    ].sort((a, b) => a - b);
  }, [recordsCatTypeYear]);

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
  // 4) Lọc record theo các tiêu chí
  // -----------------------------
  const filteredBaseRecords = records.filter((r) => {
    if (r.awardCategory?._id !== categoryId) return false;
    if (r.subAward?.type !== activeTab) return false;
    if (!selectedSchoolYearId) return false;
    if (String(r.subAward?.schoolYear) !== selectedSchoolYearId) return false;
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

  // Hàm normalize: loại bỏ ký tự không phải chữ và số, chuyển về chữ thường
  function removeDiacritics(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  function normalize(str) {
    // Ví dụ: vừa remove diacritics, vừa bỏ hết ký tự không phải chữ-số, vừa toLowerCase
    return removeDiacritics(str)
      .replace(/[^a-zA-Z0-9]/g, "")
      .toLowerCase();
  }

  const filteredSearchRecords = !searchName.trim()
    ? filteredBaseRecords
    : filteredBaseRecords.reduce((acc, record) => {
        // Lấy searchTerm
        const searchTerm = normalize(searchName.trim());
        const isNumeric = /^\d+$/.test(searchName.trim());

        // Lọc students của record
        const filteredStudents = record.students.filter((stu) => {
          // 1) Normalize tên
          const normalizedStuName = normalize(stu.student?.name || "");

          // 2) Normalize lớp
          const classNameRaw =
            stu.currentClass?.name || stu.currentClass?.className || "";
          const normalizedClassName = normalize(classNameRaw);

          // A) So sánh tên học sinh (đã normalize)
          if (normalizedStuName.includes(searchTerm)) {
            return true;
          }

          // B) So sánh khối/lớp
          if (isNumeric) {
            // Nếu người dùng nhập số (VD: "10"), ta so sánh với số lớp
            const gradeMatch = normalizedClassName.match(/^\d+/);
            if (gradeMatch && gradeMatch[0] === searchTerm) {
              return true;
            }
          } else {
            // Nếu nhập chữ (VD: "10a1"), so sánh full normalized
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

  // -----------------------------
  // 5) Phân chia record theo cấp học (Tiểu học, THCS, THPT)
  // -----------------------------
  const educationLevels = [
    {
      id: "elementary",
      name: t("elementary", "Tiểu học"),
      minClass: 1,
      maxClass: 5,
    },
    { id: "secondary", name: t("secondary", "THCS"), minClass: 6, maxClass: 9 },
    {
      id: "highschool",
      name: t("highschool", "THPT"),
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

  // Hàm chuẩn hóa category name (bỏ \n, chuẩn hóa case)
  const normalizeCategoryName = (name) => {
    if (!name) return "";
    // Bỏ \n và khoảng trắng thừa, chuẩn hóa chữ hoa/thường
    return name
      .replace(/\\n/g, " ") // Thay \n thành space
      .replace(/\n/g, " ") // Thay newline thành space
      .replace(/\s+/g, " ") // Thay nhiều space thành 1 space
      .split(" ")
      .map((word, index) => {
        // Chữ đầu viết hoa, các chữ sau viết thường
        if (word.length === 0) return "";
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(" ")
      .trim();
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

  // Hàm lấy tên năm học (hoặc code) từ schoolYears
  const findSchoolYearLabel = (syId) => {
    const syDoc = schoolYears.find((sy) => String(sy._id) === String(syId));
    // Ví dụ hiển thị "2024-2025" hay "Khóa 2024-2025"
    return syDoc?.code || syDoc?.name || "";
  };

  // Helper for subAward label for filter
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const getSubAwardLabelForFilter = (sub) => {
    const nums = sub.label.match(/\d+/g) || [];
    if (i18n.language === "vi")
      return nums.map((n) => `Tháng ${n}`).join(" & ");
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    return nums.map((n) => monthNames[Number(n) - 1]).join(" & ");
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

  return (
    <div className="lg:p-6 px-3 mb-10 lg:min-w-[960px] w-full mx-auto mt-[40px] overflow-y-auto">
      {/* ===== PHẦN 1: TIÊU ĐỀ, MÔ TẢ VÀ ẢNH COVER CỦA CATEGORY ===== */}
      <div>
        {/* Tiêu đề Category - Hiển thị theo ngôn ngữ (vi/en) */}
        <div className="flex flex-col shimmer-text-title text-center items-center justify-center uppercase leading-tight">
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

        {/* Ảnh Cover của Category - Từ Frappe backend */}
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

      {/* ===== PHẦN 2: TABS LỌC THEO SUBCATEGORY (NĂM HỌC / HỌC KÌ / THÁNG) ===== */}
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

      {/* ===== PHẦN 3: BỘ LỌC (NĂM HỌC, HỌC KÌ, THÁNG, TÌM KIẾM) ===== */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
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
            <option value="">{t("selectSemester", "--Chọn học kì--")}</option>
            {distinctSemesters.length > 0 ? (
              distinctSemesters.map((label) => {
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
              })
            ) : (
              <option disabled>
                {t("noSemesterAvailable", "Chưa có học kì nào")}
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
                i18n.language === "vi" ? sub.label : sub.labelEng || sub.label;

              return (
                <option key={sub.label} value={sub.label}>
                  {displayLabel}
                </option>
              );
            })}
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

      {searchName.trim() ? (
        <div className="grid justify-items-center xl:grid-cols-5 lg:grid-cols-4 md:grid-cols-3 grid-cols-2 gap-x-[8px] gap-y-[8px] lg:gap-x-[30px] lg:gap-y-[35px]">
          {filteredSearchRecords
            .flatMap((record) =>
              record.students.map((student) => ({ record, student }))
            )
            .map((item, idx) => {
              const { record, student } = item;
              return (
                <div
                  key={idx}
                  className="lg:h-[400px] lg:w-[258px] w-[180px] h-[270px] border rounded-[20px] shadow-sm lg:py-[20px] lg:px-[25px] px-[15px] py-[15px] bg-gradient-to-b from-[#03171c] to-[#182b55] flex flex-col items-center justify-center space-y-2 cursor-pointer"
                  onClick={() => handleOpenModal(record, student)}
                >
                  {student.photo?.photoUrl ? (
                    <img
                      src={`${BASE_URL}/${student.photo.photoUrl}`}
                      alt="Student"
                      className="lg:h-[260px] lg:w-[208px] w-[208px] h-[160px] object-cover object-top rounded-[15px]"
                    />
                  ) : (
                    <div className="text-xs italic text-gray-400">
                      {t("noPhoto", "Chưa có ảnh")}
                    </div>
                  )}
                  <div className="h-[20px] w-[208px] lg:text-[16px] text-xs lg:pt-[13px] lg:pb-[15px] pt-[8px] pb-[10px] font-semibold text-white py-2 text-center">
                    {t("classLabel", "Lớp")}{" "}
                    {student.currentClass?.name ||
                      student.currentClass?.className ||
                      t("noClass", "Chưa cập nhật lớp")}
                  </div>
                  <div className="h-[60px] lg:w-[208px] w-[150px] text-[#f9d16f]  lg:text-[18px] text-[14px] font-bold text-center">
                    {student.student?.name}
                  </div>
                </div>
              );
            })}
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
                            className="lg:h-[400px] lg:w-[258px] w-[180px] h-[270px] border rounded-[20px] shadow-sm lg:py-[20px] lg:px-[25px] px-[15px] py-[15px] bg-gradient-to-b from-[#03171c] to-[#182b55] flex flex-col items-center justify-center space-y-2 cursor-pointer"
                            onClick={() => handleOpenModal(record, student)}
                          >
                            {student.photo?.photoUrl ? (
                              <img
                                src={`${BASE_URL}/${student.photo.photoUrl}`}
                                alt="Student"
                                className="lg:h-[260px] lg:w-[208px] w-[208px] h-[160px] object-cover object-top rounded-[15px]"
                              />
                            ) : (
                              <div className="text-xs italic text-gray-400">
                                {t("noPhoto", "Chưa có ảnh")}
                              </div>
                            )}
                            <div className="h-[20px] w-[208px] lg:text-[16px] text-xs lg:pt-[13px] lg:pb-[15px] pt-[8px] pb-[10px] font-semibold text-white py-2 text-center">
                              {t("classLabel", "Lớp")}{" "}
                              {student.currentClass?.name ||
                                student.currentClass?.className ||
                                t("noClass", "Chưa cập nhật lớp")}
                            </div>
                            <div className="h-[60px] lg:w-[208px] w-[150px] text-[#f9d16f]  lg:text-[18px] text-[14px] font-bold text-center">
                              {student.student?.name}
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
      {/* Modal hiển thị chi tiết khi click vào 1 học sinh */}
      {showModal && modalStudent && modalRecord && (
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
                      {t("classLabel", "Lớp")}{" "}
                      {modalStudent.currentClass?.name ||
                        modalStudent.currentClass?.className ||
                        t("noClass", "Chưa cập nhật lớp")}
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
      )}
    </div>
  );
};

export default StudentHonorContent;
