import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaSearch } from "react-icons/fa";
import { API_URL, BASE_URL } from "../../../core/config";
import axios from "axios";

function getCategoryIdFromName(name) {
  switch (name) {
    case "scholarship-talent":
      return "67c17b7ae8a7b376ad9986c1";
    case "honor-student":
      return "67c1799de8a7b376ad998650";
    case "honor-class":
      return "67c17aaee8a7b376ad9986bb";
    case "wisers-effort":
      return "67c17afce8a7b376ad9986be";
    case "standardized-test":
      return "6833dbe3edff5e164ffc1589";
    default:
      return name; // fallback nếu truyền ID
  }
}

const Detail = () => {
  const { category, "ten-sub-award": subAwardParam } = useParams();
  const { t, i18n } = useTranslation();
  const [categories, setCategories] = useState([]);
  const [records, setRecords] = useState([]);
  const [schoolYears, setSchoolYears] = useState([]);
  const [selectedSchoolYearId, setSelectedSchoolYearId] = useState("");
  const [searchName, setSearchName] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Fetch data
  useEffect(() => {
    const fetchAll = async () => {
      setIsLoading(true);
      try {
        const [catRes, recRes, syRes] = await Promise.all([
          axios.get(`${API_URL}/award-categories`),
          axios.get(`${API_URL}/award-records`),
          axios.get(`${API_URL}/school-years`),
        ]);
        setCategories(
          Array.isArray(catRes.data) ? catRes.data : catRes.data.data || []
        );
        setRecords(
          Array.isArray(recRes.data) ? recRes.data : recRes.data.data || []
        );
        setSchoolYears(
          Array.isArray(syRes.data) ? syRes.data : syRes.data.data || []
        );
      } catch (err) {
        // eslint-disable-next-line
        console.error("❌ Error fetching detail data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAll();
  }, []);

  // Tìm subAward theo param và category
  const { subAward, currentCategory } = useMemo(() => {
    let found = null;
    let cat = null;
    const categoryId = getCategoryIdFromName(category);
    for (const c of categories) {
      if (String(c._id) !== String(categoryId)) continue;
      if (c.subAwards) {
        for (const s of c.subAwards) {
          if (normalizeLabel(s.label) === normalizeLabel(subAwardParam || "")) {
            found = s;
            cat = c;
            break;
          }
        }
      }
      if (found) break;
    }
    return { subAward: found, currentCategory: cat };
  }, [categories, subAwardParam, category]);

  // Lọc records theo subAward
  const recordsOfSubAward = useMemo(() => {
    const filtered = records.filter(
      (r) =>
        r.subAward?.label === subAward.label &&
        r.awardCategory?._id === currentCategory?._id
    );
    return filtered;
  }, [records, subAward, currentCategory]);

  // Lấy các năm học có record
  const schoolYearIds = useMemo(() => {
    return [
      ...new Set(
        recordsOfSubAward
          .map((r) => String(r.subAward?.schoolYear))
          .filter(Boolean)
      ),
    ];
  }, [recordsOfSubAward]);

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

  // Set năm học mặc định thông minh hơn
  useEffect(() => {
    if (
      !selectedSchoolYearId &&
      displaySchoolYears.length > 0 &&
      recordsOfSubAward.length > 0
    ) {
      // Ưu tiên năm học hiện tại nếu có data
      const currentSyId = getCurrentSchoolYearId();
      if (currentSyId && schoolYearIds.includes(currentSyId)) {
        setSelectedSchoolYearId(currentSyId);
      } else {
        // Nếu không có năm học hiện tại, chọn năm học mới nhất
        const newestSyId = findNewestSchoolYearId(schoolYearIds);
        setSelectedSchoolYearId(newestSyId || displaySchoolYears[0]._id);
      }
    }
  }, [
    displaySchoolYears,
    selectedSchoolYearId,
    recordsOfSubAward,
    schoolYearIds,
  ]);

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
    let filtered = recordsOfSubAward.filter(
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
  }, [recordsOfSubAward, selectedSchoolYearId, searchName]);

  // Nhóm theo Exam, sort theo Score tăng dần
  const groupedByExam = useMemo(() => {
    const examGroups = {};
    filteredRecords.forEach((record) => {
      record.students.forEach((student) => {
        const exam =
          student.testName || student.examName || student.exam || "Khác";
        if (!examGroups[exam]) examGroups[exam] = [];
        examGroups[exam].push({ record, student });
      });
    });
    // Chuyển thành mảng và sort theo tên exam
    return Object.entries(examGroups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([exam, items]) => ({
        exam,
        items: items.sort(
          (a, b) =>
            (Number(a.student.score) || 0) - (Number(b.student.score) || 0)
        ),
      }));
  }, [filteredRecords]);

  // Lấy label năm học
  const findSchoolYearLabel = (syId) => {
    const syDoc = schoolYears.find((sy) => String(sy._id) === String(syId));
    return syDoc?.code || syDoc?.name || "";
  };

  if (isLoading) return <div className="text-center py-10">{t("loading")}</div>;
  if (!subAward)
    return (
      <div className="text-center py-10 text-red-500">
        {t("subAwardNotFound")}
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Tiêu đề và mô tả */}
      <div className="text-center mb-8">
        <div className="text-[40px] font-extrabold uppercase text-[#F05023] mb-2">
          {i18n.language === "vi"
            ? subAward.label
            : subAward.labelEng || subAward.label}
        </div>
        {(i18n.language === "vi"
          ? subAward.description
          : subAward.descriptionEng || subAward.description) && (
          <div className="lg:w-[900px] w-full mx-auto text-left text-[#002855] font-semibold mt-4 mb-4">
            {i18n.language === "vi"
              ? subAward.description
              : subAward.descriptionEng || subAward.description}
          </div>
        )}

        {/* Hiển thị coverImage nếu có, giống category */}
        {currentCategory.coverImage ? (
          <div className="relative mb-4 mt-8 w-full max-h-[470px] mx-auto">
            <img
              src={`/halloffame/${normalizeLabel(subAward.label)}.png`}
              alt={subAward.label}
              className="w-full max-h-[470px] object-cover"
            />
          </div>
        ) : (
          // Nếu không có coverImage, hiển thị ảnh tĩnh subAward
          <div className="flex justify-center mb-6">
            <img
              src={`/halloffame/${normalizeLabel(subAward.label)}.svg`}
              alt={subAward.label}
              className="w-[320px] h-[180px] object-contain rounded-xl"
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

      {/* Danh sách nhóm theo Exam */}
      <div className="space-y-10">
        {groupedByExam.map((group, idx) => (
          <div key={idx}>
            <div className="text-2xl font-bold text-[#002855] mb-4 border-b pb-2">
              {group.exam}
            </div>
            <div className="grid justify-items-center xl:grid-cols-5 lg:grid-cols-4 md:grid-cols-3 grid-cols-2 gap-x-[8px] gap-y-[8px] lg:gap-x-[30px] lg:gap-y-[35px]">
              {group.items.map((item, i) => {
                const { record, student } = item;
                const className =
                  student.currentClass?.name ||
                  student.currentClass?.className ||
                  t("noClass", "Chưa cập nhật lớp");
                const schoolYearLabel = record.subAward?.schoolYear
                  ? findSchoolYearLabel(record.subAward.schoolYear)
                  : "";
                const score = student.score || student.result || "";
                return (
                  <div
                    key={i}
                    className="lg:h-[400px] lg:w-[250px] w-[180px] h-[350px] border rounded-[30px] shadow-sm lg:py-[30px] lg:px-[25px] px-[15px] py-[20px] bg-gradient-to-b from-[#03171c] to-[#182b55] flex flex-col items-center justify-center space-y-4"
                  >
                    {student.photo?.photoUrl ? (
                      <img
                        src={`${BASE_URL}${student.photo.photoUrl}`}
                        alt="Student"
                        className="h-[260px] w-[208px] object-cover object-top rounded-2xl  shadow-md mb-2"
                      />
                    ) : (
                      <div className="h-[150px] w-[150px] flex items-center justify-center rounded-full bg-gray-200 text-xs italic text-gray-400 mb-2">
                        {t("noPhoto", "Chưa có ảnh")}
                      </div>
                    )}
                    <div className="text-white text-[14px] font-semibold text-center">
                      {t("classPrefix")} {className} - {t("schoolYearAbbr")}{" "}
                      {schoolYearLabel}
                    </div>
                    <div className="text-[#F9D16F] text-[22px] font-bold text-center">
                      {student.student?.name}
                    </div>
                    <div className="text-white text-[18px] font-semibold text-center">
                      {group.exam} -{" "}
                      <span className="text-[#F9D16F]">{score}/5</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {groupedByExam.length === 0 && (
          <div className="text-center text-gray-500 py-10">
            {t("noMatchingData")}
          </div>
        )}
      </div>
    </div>
  );
};

export default Detail;
