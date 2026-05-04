// @ts-nocheck
import React, { useState, useEffect, useMemo } from "react";
import {
  BASE_URL,
  pickPreferredSubAwardRow,
  subAwardDedupeKey,
  subAwardPrioritySortValue,
} from "@/core/config";
import { FaSearch } from "react-icons/fa";
import { FaAngleDown, FaAngleRight } from "react-icons/fa6";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAwardBaseData } from "../../hooks/useAwardBaseData";
import { useScholarshipDeepLink } from "../../hooks/useScholarshipDeepLink";
import { useCollapsibleKeys } from "../../hooks/useCollapsibleKeys";
import { useSelectedSchoolYear } from "../../hooks/useSelectedSchoolYear";
import { useSubAwardOptions } from "../../hooks/useSubAwardOptions";
import ScholarshipStudentModal from "../../ScholarshipStudentModal";
import { useStudentSearchQuery } from "../../hooks/useStudentSearch";
import { normalizeSearchKey } from "@/shared/lib/textSearch";

/**
 * Học bổng AP Diploma & Học bổng Toả sáng — cùng UI (thẻ, modal tài năng, accordion năm).
 * - groupBySubAward=true (AP): lọc custom + tuỳ chọn theo mức subAward; lưới sort theo priority tiểu mục (CMS).
 * - groupBySubAward=false (Toả sáng): mọi loại subAward + năm học, một lưới giữ thứ tự API.
 */
const ApDiplomaScholarshipContent = ({
  categoryId,
  categoryName,
  recordIdParam,
  studentIdParam,
  groupBySubAward = true,
}) => {
  const { t, i18n } = useTranslation(["scholarship", "common"]);
  const navigate = useNavigate();

  const {
    categories,
    records,
    schoolYears,
    loading: isLoadingRecords,
  } = useAwardBaseData(categoryId);

  /** "" = tất cả mức; khác = đúng label tiểu mục (chỉ AP) */
  const [selectedSubAwardLabel, setSelectedSubAwardLabel] = useState("");
  const [searchName, setSearchName] = useState("");
  const { normalizedTerm, isNumericSearch, trimmed } =
    useStudentSearchQuery(searchName);

  const [showModal, setShowModal] = useState(false);
  const [modalRecord, setModalRecord] = useState(null);
  const [modalStudent, setModalStudent] = useState(null);

  /** id năm học có trong Set = khối năm đang thu gọn (giống Học bổng tài năng) */
  const {
    collapsedKeys: collapsedYearIds,
    toggleCollapsedKey: toggleCollapsedYearKey,
    clearCollapsedKeys: clearCollapsedYearIds,
  } = useCollapsibleKeys();

  const currentCategory = categories.find((cat) => cat._id === categoryId) || {};

  // Năm học có bản ghi: AP chỉ custom; Toả sáng = mọi loại subAward
  const recordsSchoolYearIds = useMemo(() => {
    const ids = new Set();
    records.forEach((r) => {
      if (r.awardCategory?._id !== categoryId) return;
      if (groupBySubAward && r.subAward?.type !== "custom") return;
      const sy = r.subAward?.schoolYear;
      if (sy != null && String(sy) !== "") ids.add(String(sy));
    });
    return [...ids];
  }, [records, categoryId, groupBySubAward]);

  const displaySchoolYearsForCategory = useMemo(() => {
    const rel = schoolYears.filter((sy) =>
      recordsSchoolYearIds.includes(String(sy._id)),
    );
    return rel.length > 0 ? rel : schoolYears;
  }, [schoolYears, recordsSchoolYearIds]);

  const { selectedSchoolYearId, setSelectedSchoolYearId } =
    useSelectedSchoolYear({
      schoolYears,
      displaySchoolYears: displaySchoolYearsForCategory,
    });

  const subAwardsForYear = useSubAwardOptions(
    currentCategory.subAwards,
    selectedSchoolYearId,
    { enabled: groupBySubAward },
  );

  // Đổi bộ lọc năm thì mở lại hết khối năm
  useEffect(() => {
    clearCollapsedYearIds();
  }, [selectedSchoolYearId, groupBySubAward, clearCollapsedYearIds]);

  useScholarshipDeepLink({
    recordIdParam,
    studentIdParam,
    records,
    onOpen: (foundRecord, foundStudent) => {
      setModalRecord(foundRecord);
      setModalStudent(foundStudent);
      setShowModal(true);
    },
  });

  useEffect(() => {
    setSelectedSubAwardLabel("");
  }, [selectedSchoolYearId]);

  const baseRecords = useMemo(() => {
    if (!selectedSchoolYearId) return [];
    return records.filter((r) => {
      if (r.awardCategory?._id !== categoryId) return false;
      if (String(r.subAward?.schoolYear) !== String(selectedSchoolYearId)) {
        return false;
      }
      if (groupBySubAward) {
        if (r.subAward?.type !== "custom") return false;
        if (
          selectedSubAwardLabel &&
          r.subAward?.label !== selectedSubAwardLabel
        ) {
          return false;
        }
      }
      return true;
    });
  }, [
    records,
    categoryId,
    selectedSchoolYearId,
    selectedSubAwardLabel,
    groupBySubAward,
  ]);

  const filteredSearchRecords = useMemo(() => {
    if (!trimmed) return baseRecords;
    const searchTerm = normalizedTerm;
    const isNumeric = isNumericSearch;
    return baseRecords.reduce((acc, record) => {
      const filteredStudents = record.students.filter((stu) => {
        const normalizedStuName = normalizeSearchKey(stu.student?.name || "");
        const classNameRaw =
          stu.currentClass?.name || stu.currentClass?.className || "";
        const normalizedClassName = normalizeSearchKey(classNameRaw);
        if (normalizedStuName.includes(searchTerm)) return true;
        if (isNumeric) {
          const gradeMatch = normalizedClassName.match(/^\d+/);
          if (gradeMatch && gradeMatch[0] === searchTerm) return true;
        } else if (normalizedClassName.includes(searchTerm)) return true;
        return false;
      });
      if (filteredStudents.length > 0) {
        acc.push({ ...record, students: filteredStudents });
      }
      return acc;
    }, []);
  }, [baseRecords, trimmed, normalizedTerm, isNumericSearch]);

  // AP: sort bản ghi từ mức cao → thấp theo priority tiểu mục (1 trước 2; khớp CMS)
  const recordsSortedBySubAwardForDisplay = useMemo(() => {
    if (!groupBySubAward) return filteredSearchRecords;
    if (!selectedSchoolYearId) return filteredSearchRecords;
    const sy = String(selectedSchoolYearId);
    const pickDefForLabel = (label) => {
      const raw = (currentCategory.subAwards || []).filter(
        (s) =>
          s.type === "custom" &&
          String(s.schoolYear) === sy &&
          s.label === label,
      );
      if (raw.length === 0) return null;
      if (raw.length === 1) return raw[0];
      return raw.reduce((acc, s) => pickPreferredSubAwardRow(acc, s));
    };
    return [...filteredSearchRecords].sort((a, b) => {
      const da = subAwardPrioritySortValue(
        pickDefForLabel(a.subAward?.label || "")?.priority,
      );
      const db = subAwardPrioritySortValue(
        pickDefForLabel(b.subAward?.label || "")?.priority,
      );
      if (da !== db) return da - db;
      const la = subAwardDedupeKey(a.subAward?.label || "");
      const lb = subAwardDedupeKey(b.subAward?.label || "");
      if (la !== lb) return la.localeCompare(lb, "vi");
      return String(a._id).localeCompare(String(b._id));
    });
  }, [
    filteredSearchRecords,
    groupBySubAward,
    selectedSchoolYearId,
    currentCategory.subAwards,
  ]);

  // Một khối lưới / năm (không còn nhóm con theo sub-award)
  const displayRecordGroups = useMemo(
    () => [
      {
        label: "__ALL__",
        labelEng: null,
        records: recordsSortedBySubAwardForDisplay,
      },
    ],
    [recordsSortedBySubAwardForDisplay],
  );

  // Cấu trúc: năm học (1 khối) → lưới toàn bộ
  const yearBlocks = useMemo(() => {
    if (!selectedSchoolYearId) return [];
    return [
      {
        schoolYearId: selectedSchoolYearId,
        subGroups: displayRecordGroups,
      },
    ];
  }, [selectedSchoolYearId, displayRecordGroups]);

  const findSchoolYearLabel = (syId) => {
    const syDoc = schoolYears.find((sy) => String(sy._id) === String(syId));
    return syDoc?.code || syDoc?.name || "";
  };

  /** Rút gọn năm học cho thẻ: "2025-2026" → "25-26" (giống mockup [NH 25-26]) */
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

  const handleOpenModal = (record, student) => {
    setModalRecord(record);
    setModalStudent(student);
    setShowModal(true);
    const rid = record?._id;
    const sid = student?.student?._id;
    if (
      categoryName &&
      rid != null &&
      sid != null &&
      String(rid) !== "" &&
      String(sid) !== ""
    ) {
      navigate(`/detail/${categoryName}/student/${rid}/${sid}`);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setModalRecord(null);
    setModalStudent(null);
    if (categoryName) navigate(`/detail/${categoryName}`);
  };

  const toggleYearSection = (schoolYearId) => {
    toggleCollapsedYearKey(String(schoolYearId));
  };

  // Header modal AP: Học bổng AP Diploma + subAward; lớp + năm học tách 2 dòng
  const apDiplomaModalHeader = useMemo(() => {
    if (!groupBySubAward || !modalRecord || !modalStudent) return null;
    const sub =
      i18n.language === "vi"
        ? modalRecord.subAward?.label
        : modalRecord.subAward?.labelEng || modalRecord.subAward?.label;
    const title = t("apModalScholarshipTitle", "Học bổng AP Diploma");
    const scholarshipText = [title, sub].filter(Boolean).join(" ");
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
  }, [groupBySubAward, modalRecord, modalStudent, i18n.language, t, schoolYears]);

  const rawText =
    i18n.language === "vi"
      ? currentCategory.name || t("award", "Danh hiệu")
      : currentCategory.nameEng || t("award", "Award");
  const normalizedText = rawText.replace(/\\n/g, "\n");
  const lines = normalizedText.split("\n");

  const renderStudentGrid = (items) => (
    <div className="w-full grid justify-items-center xl:grid-cols-5 lg:grid-cols-4 md:grid-cols-3 grid-cols-2 gap-x-[8px] gap-y-[20px] lg:gap-x-[30px] lg:gap-y-[35px]">
      {items.map((item, idx) => {
        const { record, student } = item;
        const classRaw =
          student.currentClass?.name ||
          student.currentClass?.className ||
          t("noClass", "Chưa cập nhật lớp");
        const syShort = getSchoolYearShortOnCard(record.subAward?.schoolYear);
        const nhTag = syShort
          ? `[${t("schoolYearAbbr", "NH")} ${syShort}]`
          : "";
        const classSchoolLine = nhTag
          ? `${t("classLabel", "Lớp")} ${classRaw} - ${nhTag}`
          : `${t("classLabel", "Lớp")} ${classRaw}`;
        // AP: "Học bổng" + mức tiểu mục (label CMS); Toả sáng: "HB Toả sáng" + subAward
        const subPct =
          i18n.language === "vi"
            ? record.subAward?.label
            : record.subAward?.labelEng || record.subAward?.label;
        const scholarshipLine = groupBySubAward
          ? [t("apScholarshipCardPrefix", "Học bổng"), subPct]
              .filter(Boolean)
              .join(" ")
          : `${t("shineScholarshipHBLine", "HB Toả sáng")} ${subPct || ""}`.trim();

        return (
          <div
            key={idx}
            className="w-full max-w-[258px] lg:w-[258px] rounded-[28px] lg:rounded-[30px] border border-white/15 shadow-sm lg:py-5 lg:px-5 px-3 py-4 bg-gradient-to-b from-[#03171c] to-[#182b55] flex flex-col items-center cursor-pointer"
            onClick={() => handleOpenModal(record, student)}
          >
            {/* Ảnh: cùng chiều ngang, cao = 1,5× so với ảnh vuông (aspect 2:3) */}
            <div className="w-full max-w-[208px] mx-auto aspect-[2/3] rounded-[16px] overflow-hidden ring-1 ring-white/30 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] bg-black/20 shrink-0">
              {student.photo?.photoUrl ? (
                <img
                  src={`${BASE_URL}/${student.photo.photoUrl}`}
                  alt=""
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs italic text-gray-400 px-2 text-center">
                  {t("noPhoto", "Chưa có ảnh")}
                </div>
              )}
            </div>
            {/* Dòng 1: Lớp + năm học rút gọn */}
            <p className="mt-3 w-full text-center text-white text-[11px] sm:text-xs lg:text-[14px] font-normal leading-snug px-1">
              {classSchoolLine}
            </p>
            {/* Tên: khối cao cố định = đúng 2 dòng — tên 1 dòng thì dòng dưới để trống; tên dài tối đa 2 dòng (…) */}
            <div className="mt-1 w-full h-[2.65rem] sm:h-[2.8rem] lg:h-[3.2rem] shrink-0 flex items-start justify-center px-1 overflow-hidden">
              <p className="w-full text-center text-[#f9d16f] text-[14px] sm:text-[15px] lg:text-[18px] font-bold leading-snug line-clamp-2 break-words">
                {student.student?.name}
              </p>
            </div>
            {/* Dòng HB: sát khối tên */}
            <p className="mt-1 mb-1 w-full text-center text-white text-[11px] sm:text-[13px] lg:text-[15px] font-normal leading-snug px-2 pb-1">
              {scholarshipLine}
            </p>
          </div>
        );
      })}
    </div>
  );

  if (isLoadingRecords && !records.length) {
    return (
      <div className="p-10 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F05023] mx-auto mb-4" />
        <p>{t("loading", "Đang tải...")}</p>
      </div>
    );
  }

  return (
    <div className="lg:p-6 px-3 mb-10 lg:min-w-[960px] w-full mx-auto mt-[40px] overflow-y-auto">
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
          <img src="/halloffame/vector.png" alt="" />
        </div>
        <div className="lg:w-[900px] w-full mx-auto text-left mt-4 mb-4">
          <div className="mb-4 text-[#002855] text-justify font-semibold lg:text-[18px] text-[15px]">
            {i18n.language === "vi"
              ? currentCategory.description || ""
              : currentCategory.descriptionEng || ""}
          </div>
        </div>
        {currentCategory.coverImage ? (
          <div className="relative mb-4 mt-8 w-full max-h-[470px] mx-auto">
            <img
              src={`${BASE_URL}${currentCategory.coverImage}`}
              alt=""
              className="w-full max-h-[470px] object-cover"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
            <img
              src="/halloffame/frame-cover.png"
              alt=""
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
            <div className="absolute top-0 right-0 h-full flex items-center justify-center pr-4">
              <div className="text-[#f9d16f] text-right lg:mr-8 lg:mt-12 leading-tight">
                {lines.map((line, idx) => {
                  const textSize =
                    i18n.language === "vi"
                      ? idx === 0
                        ? "lg:text-[52px] text-[18px]"
                        : "lg:text-[70px] text-[20px] font-extrabold"
                      : idx === 0
                        ? "lg:text-[70px] text-[20px] font-extrabold"
                        : "lg:text-[52px] text-[18px]";
                  return (
                    <div key={idx} className={textSize}>
                      {line}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Năm học + (AP) giá trị học bổng + tìm tên — cùng style pill xám */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-10 mt-6">
        <select
          className="lg:w-[280px] py-2 bg-[#f5f5f5] text-[#757575] border-none rounded-full focus:outline-none"
          value={selectedSchoolYearId}
          onChange={(e) => setSelectedSchoolYearId(e.target.value)}
        >
          <option value="">{t("selectSchoolYear", "--Chọn năm học--")}</option>
          {displaySchoolYearsForCategory.map((sy) => (
            <option key={sy._id} value={sy._id}>
              {t("schoolYearText", "Năm học")} {sy.code || sy.name}
            </option>
          ))}
        </select>
        {groupBySubAward ? (
          <select
            className="lg:w-[280px] py-2 bg-[#f5f5f5] text-[#757575] border-none rounded-full focus:outline-none"
            value={selectedSubAwardLabel}
            onChange={(e) => setSelectedSubAwardLabel(e.target.value)}
            disabled={!selectedSchoolYearId}
            aria-label={t("apScholarshipValue", "Giá trị học bổng")}
          >
            <option value="">
              {t("apScholarshipValue", "Giá trị học bổng")}
            </option>
            {subAwardsForYear.map((sub) => {
              const displayLabel =
                i18n.language === "vi" ? sub.label : sub.labelEng || sub.label;
              return (
                <option key={sub.label} value={sub.label}>
                  {displayLabel}
                </option>
              );
            })}
          </select>
        ) : null}
        <div className="relative flex items-center justify-items-center">
          <input
            type="text"
            placeholder={t("searchNamePlaceholder", "Tìm kiếm tên")}
            className="lg:w-[400px] w-[250px] px-4 py-2 bg-[#f5f5f5] text-[#757575] border-none rounded-full focus:outline-none"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
          />
          <button
            type="button"
            className="hidden absolute right-[-40px] w-[36px] h-[36px] bg-[#002855] rounded-full lg:flex items-center justify-center hover:bg-[#001F3F] transition"
          >
            <FaSearch className="text-white text-[18px]" />
          </button>
        </div>
      </div>

      {/* Năm học (accordion) → lưỡi toàn bộ, AP đã sort theo priority tiểu mục */}
      {yearBlocks.map((block) => {
        const isYearOpen = !collapsedYearIds.has(String(block.schoolYearId));
        return (
          <div key={block.schoolYearId} className="w-full mb-10">
            <button
              type="button"
              className="w-full flex justify-between items-center gap-3 py-3 text-left border-b border-gray-200 hover:opacity-90"
              onClick={() => toggleYearSection(block.schoolYearId)}
            >
              <span className="font-bold text-2xl md:text-[28px] lg:text-[32px] text-[#002855] leading-tight min-w-0">
                {t("schoolYearText", "Năm học")}{" "}
                {findSchoolYearLabel(block.schoolYearId)}
              </span>
              <span className="shrink-0 flex h-10 w-10 md:h-11 md:w-11 items-center justify-center rounded-full border-2 bg-white shadow-sm border-[#002855] text-[#002855]">
                {isYearOpen ? (
                  <FaAngleDown className="text-lg md:text-xl" />
                ) : (
                  <FaAngleRight className="text-lg md:text-xl" />
                )}
              </span>
            </button>
            {isYearOpen && (
              <div className="w-full space-y-8 mt-6">
                {block.subGroups[0]?.records.length === 0 ? (
                  <p className="text-center text-gray-500">
                    {t("noMatchingData", "Không có dữ liệu phù hợp.")}
                  </p>
                ) : (
                  block.subGroups.map((g) => {
                    const flat = g.records.flatMap((record) =>
                      record.students.map((student) => ({
                        record,
                        student,
                      })),
                    );
                    return (
                      <div key={g.label} className="w-full">
                        {flat.length === 0 ? (
                          <p className="text-center text-gray-500">
                            {t("noMatchingData", "Không có dữ liệu phù hợp.")}
                          </p>
                        ) : (
                          renderStudentGrid(flat)
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Cùng modal portal + layout học bổng tài năng (SVG, note trái, thành tích sao) */}
      <ScholarshipStudentModal
        open={Boolean(showModal && modalRecord && modalStudent)}
        onClose={handleCloseModal}
        modalRecord={modalRecord}
        modalStudent={modalStudent}
        apDiplomaHeader={apDiplomaModalHeader}
      />
    </div>
  );
};

export default ApDiplomaScholarshipContent;
