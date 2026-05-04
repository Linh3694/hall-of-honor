// @ts-nocheck
import React, { useState, useEffect, useMemo } from "react";
import {
  BASE_URL,
  subAwardDedupeKey,
} from "@/core/config";
import {
  getScholarshipSubAwardCopy,
  getScholarshipSingleStudentLayout,
} from "../../data/scholarshipSubAwardBilingual";
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
import { getScholarshipBrandColor } from "../../data/scholarshipBrandColors";
import { SubAwardCoverBanner } from "../components/SubAwardCoverBanner";
import { useStudentSearchQuery } from "../../hooks/useStudentSearch";
import { normalizeSearchKey } from "@/shared/lib/textSearch";

/**
 * Gom cặp { record, student } theo năm học trên record; năm mới hơn (startDate) lên trước
 */
function groupStudentItemsBySchoolYear(studentItems, schoolYears) {
  const map = new Map();
  for (const item of studentItems) {
    const raw = item.record?.subAward?.schoolYear;
    const key =
      raw != null && String(raw) !== "" ? String(raw) : "__none__";
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  }
  const ids = [...map.keys()].filter((k) => k !== "__none__");
  const byStart = (syId) => {
    const sy = schoolYears.find((y) => String(y._id) === syId);
    return sy ? new Date(sy.startDate).getTime() : 0;
  };
  ids.sort((a, b) => byStart(b) - byStart(a));
  const ordered = [...ids];
  if (map.has("__none__")) ordered.push("__none__");
  return ordered.map((id) => ({
    schoolYearId: id === "__none__" ? "" : id,
    items: map.get(id) || [],
  }));
}

/** Thẻ học sinh — cùng pattern click/ảnh với StudentHonorContent */
function ScholarshipStudentCard({ record, student, onOpen }) {
  const { t } = useTranslation(["scholarship", "common"]);
  return (
    <div
      className="lg:h-[400px] lg:w-[258px] w-[180px] h-[270px] border rounded-[20px] shadow-sm lg:py-[20px] lg:px-[25px] px-[15px] py-[15px] bg-gradient-to-b from-[#03171c] to-[#182b55] flex flex-col items-center justify-center space-y-2 cursor-pointer"
      onClick={() => onOpen(record, student)}
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
}

const ScholarShipContent = ({
  categoryId,
  categoryName,
  recordIdParam,
  studentIdParam,
}) => {
  const { t, i18n } = useTranslation(["scholarship", "common"]);
  const navigate = useNavigate();

  const { categories, records, schoolYears } = useAwardBaseData(categoryId);

  // --- States cho giao diện lọc ---
  const [selectedSubAwardLabel, setSelectedSubAwardLabel] = useState("");
  const [searchName, setSearchName] = useState("");
  const { normalizedTerm, trimmed } = useStudentSearchQuery(searchName);
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  /** key `${subAwardLabel}|||${schoolYearKey}` có trong Set = section năm học đang thu gọn */
  const {
    collapsedKeys: collapsedSchoolYearKeys,
    toggleCollapsedKey: toggleCollapsedSchoolYearKey,
  } = useCollapsibleKeys();

  // State cho Modal
  const [showModal, setShowModal] = useState(false);
  const [modalRecord, setModalRecord] = useState(null); // record được chọn
  const [modalStudent, setModalStudent] = useState(null); // student được chọn
  const [openLevel, setOpenLevel] = useState(null);

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

  // Lấy thông tin chi tiết của danh mục hiện tại từ API
  const currentCategory =
    categories.find((cat) => cat._id === categoryId) || {};

  const distinctSchoolYearIds = [
    ...new Set(
      (currentCategory.subAwards || [])
        .filter((sub) => sub.type === "custom" && sub.schoolYear)
        .map((sub) => String(sub.schoolYear)),
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
    });

  const subAwardOptions = useSubAwardOptions(
    currentCategory.subAwards,
    selectedSchoolYearId,
  );

  // -----------------------------
  // 2) Thiết lập mặc định view cho danh mục theo subAward custom
  // -----------------------------

  useEffect(() => {
    if (currentCategory.subAwards?.length > 0 && !selectedSubAwardLabel) {
      const defaultSubAward = currentCategory.subAwards.find(
        (sub) => sub.type === "custom",
      );
      if (defaultSubAward) {
        setSelectedSubAwardLabel(defaultSubAward.label);
      }
    }
  }, [currentCategory.subAwards, selectedSubAwardLabel]);

  useEffect(() => {
    if (!selectedSchoolYearId) return;

    if (subAwardOptions.length > 0) {
      const currentLabelExists = subAwardOptions.some(
        (sub) => sub.label === selectedSubAwardLabel,
      );
      if (!currentLabelExists) {
        setSelectedSubAwardLabel(subAwardOptions[0].label);
      }
    } else {
      setSelectedSubAwardLabel("");
    }
  }, [selectedSchoolYearId, subAwardOptions, selectedSubAwardLabel]);

  // -----------------------------
  // 3–4) Lọc record theo năm học + subAward custom, tìm kiếm — nhóm theo năm học trong cùng năm đã chọn
  // -----------------------------

  const validLabelKeys = new Set(
    (currentCategory.subAwards || [])
      .filter((s) => s.type === "custom")
      .map((s) => subAwardDedupeKey(s.label)),
  );

  const filteredBaseRecords = records.filter(
    (r) =>
      r.awardCategory?._id === categoryId &&
      r.subAward?.type === "custom" &&
      validLabelKeys.has(subAwardDedupeKey(r.subAward?.label || "")) &&
      String(r.subAward.schoolYear) === selectedSchoolYearId,
  );

  const filteredSearchRecords = useMemo(() => {
    if (!trimmed) return filteredBaseRecords;
    const searchTerm = normalizedTerm;
    return filteredBaseRecords.reduce((acc, record) => {
      const filteredStudents = record.students.filter((stu) =>
        normalizeSearchKey(stu.student?.name || "").includes(searchTerm),
      );
      if (filteredStudents.length > 0) {
        acc.push({ ...record, students: filteredStudents });
      }
      return acc;
    }, []);
  }, [trimmed, normalizedTerm, filteredBaseRecords]);

  const recordsBySubCategory = filteredSearchRecords.reduce((acc, record) => {
    const key = subAwardDedupeKey(record.subAward?.label || "Unknown");
    if (!acc[key]) acc[key] = [];
    acc[key].push(record);
    return acc;
  }, {});

  const sortedGroups = subAwardOptions.map((subCat) => {
    const key = subAwardDedupeKey(subCat.label);
    const records = recordsBySubCategory[key] || [];
    return {
      subAwardLabel: subCat.label,
      subAwardLabelEng: subCat.labelEng,
      recordsGroup: records,
      priority: subCat.priority || 0,
      hasData: records.some((record) => record.students.length > 0),
      coverImage: subCat.coverImage || null,
    };
  });

  // Thêm useEffect để xử lý search
  useEffect(() => {
    if (!searchName.trim()) {
      setExpandedGroups(new Set());
      return;
    }

    const searchTerm = searchName.toLowerCase().trim();
    const newGroupsToExpand = new Set();

    sortedGroups.forEach((group) => {
      const hasMatch = group.recordsGroup.some((record) => {
        const studentMatch = record.students?.some((student) => {
          const studentData = student.student;
          return (
            studentData?.name?.toLowerCase().includes(searchTerm) ||
            studentData?.studentCode?.toLowerCase().includes(searchTerm) ||
            (student.keyword || []).some((k) =>
              k.toLowerCase().includes(searchTerm),
            ) ||
            (student.keywordEng || []).some((k) =>
              k.toLowerCase().includes(searchTerm),
            ) ||
            (student.activity || []).some((a) =>
              a.toLowerCase().includes(searchTerm),
            ) ||
            (student.activityEng || []).some((a) =>
              a.toLowerCase().includes(searchTerm),
            ) ||
            (student.note || "").toLowerCase().includes(searchTerm) ||
            (student.noteEng || "").toLowerCase().includes(searchTerm)
          );
        });

        const classMatch = record.awardClasses?.some((awardClass) => {
          return (
            awardClass.class?.className?.toLowerCase().includes(searchTerm) ||
            (awardClass.note || "").toLowerCase().includes(searchTerm) ||
            (awardClass.noteEng || "").toLowerCase().includes(searchTerm)
          );
        });

        return studentMatch || classMatch;
      });

      if (hasMatch) {
        newGroupsToExpand.add(group.subAwardLabel);
      }
    });

    setExpandedGroups(newGroupsToExpand);
  }, [searchName, JSON.stringify(sortedGroups)]);

  // -----------------------------
  // 5) Các hàm xử lý mở/đóng Modal và hiển thị thông tin
  // -----------------------------
  // Giống StudentHonorContent: set state + navigate (không chặn sớm, không encode)
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

  // Hàm lấy tên (hoặc code) năm học
  const findSchoolYearLabel = (syId) => {
    const syDoc = schoolYears.find((sy) => String(sy._id) === String(syId));
    return syDoc?.code || syDoc?.name || "";
  };

  const toggleSchoolYearSection = (subLabel, syKey) => {
    toggleCollapsedSchoolYearKey(`${subLabel}|||${syKey}`);
  };

  const rawText =
    i18n.language === "vi"
      ? currentCategory.name || t("award", "Danh hiệu")
      : currentCategory.nameEng || t("award", "Award");

  // Nếu DB lưu nhầm thành \\n, bạn có thể replace:
  const normalizedText = rawText.replace(/\\n/g, "\n");

  // Tách thành mảng theo ký tự xuống dòng
  const lines = normalizedText.split("\n");

  return (
    <div className="relative z-10 lg:p-6 px-3 mb-10 lg:min-w-[960px] w-full mx-auto mt-[40px]">
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
          <div className="mb-4 text-[#002855] text-justify font-semibold lg:text-[18px] text-[15px]">
            {i18n.language === "vi"
              ? currentCategory.description || ""
              : currentCategory.descriptionEng || ""}
          </div>
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
      {/* Chọn năm học + tìm kiếm */}
      <div className="flex flex-col md:flex-row gap-4 items-center space-x-4 my-10 justify-center">
        <select
          value={selectedSchoolYearId}
          onChange={(e) => setSelectedSchoolYearId(e.target.value)}
          className="md:w-[250px] py-2 border-none bg-[#F8F8F8] text-[#757575] rounded-2xl"
        >
          <option value="">{t("selectSchoolYear", "Chọn năm học")}</option>
          {displaySchoolYears.map((sy) => (
            <option key={sy._id} value={sy._id}>
              {t("schoolYear", "Năm học")} {findSchoolYearLabel(sy._id)}
            </option>
          ))}
        </select>
        <div className="relative flex items-center">
          <input
            type="text"
            placeholder={t("searchNamePlaceholder", "Tìm kiếm")}
            className="md:w-[400px] w-[250px] px-4 py-2 bg-[#f5f5f5] text-[#757575] border-none rounded-full focus:outline-none"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
          />
          <button className="absolute right-3 w-[36px] h-[36px] rounded-full flex items-center justify-center hover:bg-[#e5e5e5] transition">
            <FaSearch className="text-[#757575] text-[18px]" />
          </button>
        </div>
      </div>

      {/* Hiển thị các record, nhóm theo SubAward (mỗi SubAward là 1 Level) */}
      {sortedGroups.length === 0 && selectedSchoolYearId && (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg mb-4">
            {t(
              "noSubCategoriesFound",
              "Chưa có danh mục học bổng nào cho năm học này",
            )}
          </p>
          <p className="text-gray-400 text-sm">
            {t("pleaseSelectAnotherYear", "Vui lòng chọn năm học khác")}
          </p>
        </div>
      )}

      {sortedGroups.map(
        ({ subAwardLabel, subAwardLabelEng, recordsGroup, coverImage }) => {
        // Lấy danh sách các student từ mỗi record trong group
        const studentItems = recordsGroup.flatMap((record) =>
          record.students.map((student) => ({ record, student })),
        );

        // Tiêu đề + dòng % học phí từ mapping (chỉ trên header; ảnh cover không gắn dòng %)
        const subCopy = getScholarshipSubAwardCopy(subAwardLabel);
        const titleText = subCopy
          ? i18n.language === "vi"
            ? subCopy.title.vi
            : subCopy.title.en
          : i18n.language === "vi"
            ? subAwardLabel
            : subAwardLabelEng || subAwardLabel;
        const descText = subCopy
          ? i18n.language === "vi"
            ? subCopy.description.vi
            : subCopy.description.en
          : "";

        const singleStudentLayout =
          getScholarshipSingleStudentLayout(subAwardLabel);
        const yearGroups = groupStudentItemsBySchoolYear(
          studentItems,
          schoolYears,
        );
        const brandColor = getScholarshipBrandColor(subAwardLabel);

        return (
          <div
            key={subAwardLabel}
            className="w-full border-b border-gray-200 pb-4 mx-auto"
          >
            <div
              className="w-full flex justify-between items-center gap-3 cursor-pointer py-4"
              onClick={() =>
                setOpenLevel(openLevel === subAwardLabel ? null : subAwardLabel)
              }
            >
              <div className="flex flex-col items-start text-left min-w-0 flex-1">
                <span
                  className="font-bold uppercase tracking-wide font-[Metropolis] lg:text-2xl text-lg leading-tight"
                  style={{ color: brandColor }}
                >
                  {titleText}
                </span>
                {descText ? (
                  <span
                    className="uppercase lg:text-base text-sm mt-0 leading-tight opacity-90"
                    style={{ color: brandColor }}
                  >
                    {descText}
                  </span>
                ) : null}
              </div>
              <span
                className="text-lg shrink-0 self-start mt-1"
                style={{ color: brandColor }}
              >
                {openLevel === subAwardLabel ? (
                  <FaAngleDown />
                ) : (
                  <FaAngleRight />
                )}
              </span>
            </div>
            {(openLevel === subAwardLabel ||
              expandedGroups.has(subAwardLabel)) && (
              <>
                <SubAwardCoverBanner
                  label={subAwardLabel}
                  coverImage={coverImage}
                />
                {studentItems.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400 text-sm">
                      {t(
                        "noStudentsInThisCategory",
                        "Chưa có học sinh nào nhận học bổng này",
                      )}
                    </p>
                  </div>
                ) : (
                  <div className="w-full space-y-8">
                    {yearGroups
                      .filter(({ items }) => items.length > 0)
                      .map(({ schoolYearId, items }) => {
                      const syKey = schoolYearId || "__none__";
                      const rowKey = `${subAwardLabel}|||${syKey}`;
                      const isYearOpen =
                        !collapsedSchoolYearKeys.has(rowKey);
                      const daiSuThisYear =
                        Boolean(singleStudentLayout) && items.length === 1;
                      const yearTitle =
                        schoolYearId && findSchoolYearLabel(schoolYearId)
                          ? `${t("schoolYear", "Năm học")} ${findSchoolYearLabel(schoolYearId)}`
                          : t("schoolYearUnknown", "Năm học khác");

                      return (
                        <div key={rowKey} className="w-full">
                          <button
                            type="button"
                            className="w-full flex justify-between items-center gap-3 py-2 mb-3 text-left hover:opacity-90"
                            onClick={() =>
                              toggleSchoolYearSection(subAwardLabel, syKey)
                            }
                          >
                            <span
                              className="font-bold text-xl lg:text-2xl"
                              style={{ color: brandColor }}
                            >
                              {yearTitle}
                            </span>
                            <span
                              className="shrink-0 flex h-9 w-9 items-center justify-center rounded-full border bg-white/90 shadow-sm"
                              style={{ borderColor: brandColor, color: brandColor }}
                            >
                              {isYearOpen ? (
                                <FaAngleDown className="text-base" />
                              ) : (
                                <FaAngleRight className="text-base" />
                              )}
                            </span>
                          </button>
                          {isYearOpen && daiSuThisYear ? (
                            <div className="w-full flex flex-col items-center py-8 relative z-10">
                              <div className="flex w-full max-w-6xl mx-auto flex-row items-center justify-center gap-1 sm:gap-2 md:gap-3 lg:gap-5 px-2">
                                <img
                                  src={singleStudentLayout.leftSrc}
                                  alt=""
                                  className="flex-1 basis-0 min-w-0 max-w-[40px] sm:max-w-[60px] md:max-w-[90px] lg:max-w-[120px] h-auto object-contain pointer-events-none select-none"
                                />
                                <div className="flex-shrink-0 flex justify-center">
                                  <ScholarshipStudentCard
                                    record={items[0].record}
                                    student={items[0].student}
                                    onOpen={handleOpenModal}
                                  />
                                </div>
                                <img
                                  src={singleStudentLayout.rightSrc}
                                  alt=""
                                  className="flex-1 basis-0 min-w-0 max-w-[40px] sm:max-w-[60px] md:max-w-[90px] lg:max-w-[120px] h-auto object-contain pointer-events-none select-none"
                                />
                              </div>
                              <img
                                src={singleStudentLayout.bottomSrc}
                                alt=""
                                className="mt-3 md:mt-4 mb-4 md:mb-8 w-full max-w-md lg:max-w-lg mx-auto px-4 h-auto object-contain pointer-events-none select-none"
                              />
                            </div>
                          ) : null}
                          {isYearOpen && !daiSuThisYear ? (
                            <div className="w-full grid justify-items-center 2xl:grid-cols-5 lg:grid-cols-4 md:grid-cols-3 grid-cols-2 gap-x-[8px] gap-y-[20px] lg:gap-x-[30px] lg:gap-y-[35px]">
                              {items.map((item, idx) => {
                                const { record, student } = item;
                                return (
                                  <ScholarshipStudentCard
                                    key={`${subAwardLabel}-${syKey}-${idx}`}
                                    record={record}
                                    student={student}
                                    onOpen={handleOpenModal}
                                  />
                                );
                              })}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        );
        },
      )}
      <ScholarshipStudentModal
        open={Boolean(showModal && modalRecord && modalStudent)}
        onClose={handleCloseModal}
        modalRecord={modalRecord}
        modalStudent={modalStudent}
      />
    </div>
  );
};

export default ScholarShipContent;
