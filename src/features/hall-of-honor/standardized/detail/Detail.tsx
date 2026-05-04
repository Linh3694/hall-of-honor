// @ts-nocheck
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaSearch } from "react-icons/fa";
import { FaAngleDown, FaAngleRight } from "react-icons/fa6";
import {
  BASE_URL,
  SCHOLARSHIP_TALENT_CATEGORY_ID,
  COMPETITION_ACHIEVEMENT_CATEGORY_ID,
  CATEGORY_ID_BY_SLUG,
  subAwardLabelToSlug,
} from "@/core/config";
import {
  getScholarshipSubAwardCopy,
  splitScholarshipCoverTitleLines,
} from "../../data/scholarshipSubAwardBilingual";
import ScholarshipStudentModal from "../../ScholarshipStudentModal";
import {
  getScholarshipBrandColor,
  isLightBrandBackground,
} from "../../data/scholarshipBrandColors";
import {
  CategoryCmsDescription,
  CategoryHeroDividerVector,
  CoverGoldTitleOverlay,
  FramedCategoryCover,
} from "../../components/category";
import {
  pickCurrentSchoolYearId,
  pickNewestSchoolYearIdFromList,
} from "../../hooks/schoolYearUtils";
import { useAwardBaseData } from "../../hooks/useAwardBaseData";
import { useStudentSearchQuery } from "../../hooks/useStudentSearch";
import { normalizeSearchKey } from "@/shared/lib/textSearch";

/** Ảnh cover mặc định — Thành tích cuộc thi (thư mục public) */
const COMPETITION_DEFAULT_COVER_PATH = "/thanh-tich-trong-cac-giai-dau.png";

// Map category name từ URL sang categoryId (gom trong core/config)
function getCategoryIdFromName(name) {
  if (!name) return null;
  return CATEGORY_ID_BY_SLUG[name] ?? null;
}

const Detail = () => {
  const { category, "ten-sub-award": subCategoryParam } = useParams();
  // common trước: t() mặc định chỉ resolve trong namespace đầu tiên (UI chọn năm / search dùng common.json)
  const { t, i18n } = useTranslation(["common", "standardized"]);

  const categoryId = getCategoryIdFromName(category);
  const {
    categories,
    records,
    schoolYears,
    loading: dataLoading,
  } = useAwardBaseData(categoryId ?? undefined, {
    enabled: Boolean(categoryId),
  });

  const [selectedSchoolYearId, setSelectedSchoolYearId] = useState("");
  const [searchName, setSearchName] = useState("");

  const { normalizedTerm, isNumericSearch, trimmed } =
    useStudentSearchQuery(searchName);

  // Modal học bổng (cùng hành vi ScholarShipContent — trang Detail trước đây không gắn click)
  const [showScholarshipModal, setShowScholarshipModal] = useState(false);
  const [modalRecord, setModalRecord] = useState(null);
  const [modalStudent, setModalStudent] = useState(null);
  /** key năm học trong Set = section đang thu gọn (trang Detail học bổng) */
  const [collapsedScholarshipYearKeys, setCollapsedScholarshipYearKeys] =
    useState(() => new Set());

  // Tìm tất cả sub-categories cùng tên và category
  const { subCategories, currentCategory, displaySubCategory } = useMemo(() => {
    let foundSubCategories = [];
    let foundCategory = null;
    let displaySub = null;

    if (!categoryId) {
      return {
        subCategories: [],
        currentCategory: null,
        displaySubCategory: null,
      };
    }

    // Tìm category theo categoryId
    foundCategory = categories.find((c) => c._id === categoryId);

    if (foundCategory) {
      // Gom TẤT CẢ sub-categories cùng label (từ nhiều năm học)
      if (foundCategory.subAwards) {
        const normalizedSubParam = subAwardLabelToSlug(subCategoryParam || "");

        foundSubCategories = foundCategory.subAwards.filter((sub) => {
          const normalizedSubLabel = subAwardLabelToSlug(sub.label);
          return normalizedSubLabel === normalizedSubParam;
        });

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
        }
      }
    }

    return {
      subCategories: foundSubCategories,
      currentCategory: foundCategory,
      displaySubCategory: displaySub,
    };
  }, [categories, subCategoryParam, categoryId, schoolYears]);

  const isCompetitionCategory = categoryId === COMPETITION_ACHIEVEMENT_CATEGORY_ID;
  const coverStateKey = [
    subCategoryParam,
    displaySubCategory?.coverImage ??
      (isCompetitionCategory ? COMPETITION_DEFAULT_COVER_PATH : ""),
    displaySubCategory?.label ?? "",
  ].join("|");

  /** Chỉ hiện frame + chữ khi ảnh nền load xong; ảnh lỗi → ẩn cả khối cover */
  const [coverShowDecor, setCoverShowDecor] = useState(false);
  const [coverGone, setCoverGone] = useState(false);
  const [localCoverTier, setLocalCoverTier] = useState(0);

  useEffect(() => {
    setCoverShowDecor(false);
    setCoverGone(false);
    setLocalCoverTier(0);
  }, [coverStateKey]);

  // Lọc records theo tất cả sub-categories cùng label
  const recordsOfSubCategory = useMemo(() => {
    if (subCategories.length === 0 || !currentCategory) return [];

    // Lọc records theo label của sub-category (gom tất cả năm học)
    const subCategoryLabel = subCategories[0]?.label;
    const filtered = records.filter(
      (r) =>
        r.subAward?.label === subCategoryLabel &&
        r.awardCategory?._id === currentCategory._id,
    );

    return filtered;
  }, [records, subCategories, currentCategory]);

  // Lấy các năm học có record
  const schoolYearIds = useMemo(() => {
    return [
      ...new Set(
        recordsOfSubCategory
          .map((r) => String(r.subAward?.schoolYear))
          .filter(Boolean),
      ),
    ];
  }, [recordsOfSubCategory]);

  const displaySchoolYears = useMemo(() => {
    const relevantSchoolYears = schoolYears.filter((sy) =>
      schoolYearIds.includes(String(sy._id)),
    );
    return relevantSchoolYears.length > 0 ? relevantSchoolYears : schoolYears;
  }, [schoolYears, schoolYearIds]);

  const prevSubSlugRef = useRef(null);

  // Năm học: đổi slug tiểu mục → chọn lại mặc định; cùng slug → giữ lựa chọn nếu vẫn có trong dữ liệu (tránh năm sub trước làm filter rỗng)
  useEffect(() => {
    if (displaySchoolYears.length === 0) {
      setSelectedSchoolYearId("");
      return;
    }

    const slugChanged = prevSubSlugRef.current !== subCategoryParam;
    prevSubSlugRef.current = subCategoryParam;

    setSelectedSchoolYearId((prev) => {
      const prevStillValid =
        !slugChanged &&
        prev &&
        displaySchoolYears.some((sy) => String(sy._id) === String(prev));
      if (prevStillValid) return prev;

      const currentYearId = pickCurrentSchoolYearId(schoolYears);
      if (
        currentYearId &&
        displaySchoolYears.some(
          (sy) => String(sy._id) === String(currentYearId),
        )
      ) {
        return currentYearId;
      }
      return pickNewestSchoolYearIdFromList(displaySchoolYears);
    });
  }, [subCategoryParam, displaySchoolYears, schoolYears]);

  // Đổi tiểu mục: bỏ trạng thái thu gọn năm cũ
  useEffect(() => {
    setCollapsedScholarshipYearKeys(new Set());
  }, [subCategoryParam]);

  const filteredRecords = useMemo(() => {
    const filtered = recordsOfSubCategory.filter(
      (r) => String(r.subAward?.schoolYear) === selectedSchoolYearId,
    );
    if (!trimmed) return filtered;
    const searchTerm = normalizedTerm;
    const isNumeric = isNumericSearch;
    return filtered.reduce((acc, record) => {
      const filteredStudents = record.students.filter((stu) => {
        const normalizedStuName = normalizeSearchKey(stu.student?.name || "");
        const classNameRaw =
          stu.currentClass?.name || stu.currentClass?.className || "";
        const normalizedClassName = normalizeSearchKey(classNameRaw);
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
  }, [
    recordsOfSubCategory,
    selectedSchoolYearId,
    trimmed,
    normalizedTerm,
    isNumericSearch,
  ]);

  // Nhóm theo logic khác nhau tùy loại bài thi
  // IELTS: group theo điểm (score)
  // Các bài thi khác: group theo tên bài thi (exam)
  const groupedData = useMemo(() => {
    // Học bổng Tài năng + Thành tích cuộc thi (tiểu mục custom) — lưới phẳng theo năm học
    if (
      categoryId === SCHOLARSHIP_TALENT_CATEGORY_ID ||
      categoryId === COMPETITION_ACHIEVEMENT_CATEGORY_ID
    ) {
      const items = [];
      filteredRecords.forEach((record) => {
        record.students.forEach((student) => {
          items.push({ record, student });
        });
      });
      const byYear = new Map();
      items.forEach((it) => {
        const sy = String(it.record.subAward?.schoolYear || "");
        const key = sy || "__none__";
        if (!byYear.has(key)) byYear.set(key, []);
        byYear.get(key).push(it);
      });
      const ids = [...byYear.keys()].filter((k) => k !== "__none__");
      ids.sort((a, b) => {
        const ya = schoolYears.find((y) => String(y._id) === a);
        const yb = schoolYears.find((y) => String(y._id) === b);
        return new Date(yb?.startDate || 0) - new Date(ya?.startDate || 0);
      });
      if (byYear.has("__none__")) ids.push("__none__");
      return ids.map((id) => ({
        exam: "",
        isScoreGroup: false,
        isScholarshipFlat: true,
        schoolYearId: id === "__none__" ? "" : id,
        items: (byYear.get(id) || []).sort((a, b) =>
          (a.student.student?.name || "").localeCompare(
            b.student.student?.name || "",
            "vi",
          ),
        ),
      }));
    }

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
              (Number(b.student.score) || 0) - (Number(a.student.score) || 0), // Cao đến thấp
          ),
        }));
    }
  }, [filteredRecords, displaySubCategory, categoryId, schoolYears]);

  const isCompetitionAchievement =
    categoryId === COMPETITION_ACHIEVEMENT_CATEGORY_ID;

  // Mở modal tài năng / AP-style — Học bổng Tài năng + Thành tích cuộc thi (4 tiểu mục)
  const openScholarshipModal = (record, student) => {
    if (
      categoryId !== SCHOLARSHIP_TALENT_CATEGORY_ID &&
      categoryId !== COMPETITION_ACHIEVEMENT_CATEGORY_ID
    ) {
      return;
    }
    setModalRecord(record);
    setModalStudent(student);
    setShowScholarshipModal(true);
  };

  const closeScholarshipModal = () => {
    setShowScholarshipModal(false);
    setModalRecord(null);
    setModalStudent(null);
  };

  // Lấy label năm học
  const findSchoolYearLabel = (syId) => {
    const syDoc = schoolYears.find((sy) => String(sy._id) === String(syId));
    return syDoc?.code || syDoc?.name || "";
  };

  // Rút gọn năm học trên thẻ: "2025-2026" → "25-26" (cùng logic thẻ Học bổng AP)
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

  const toggleScholarshipYearSection = (syKey) => {
    setCollapsedScholarshipYearKeys((prev) => {
      const next = new Set(prev);
      if (next.has(syKey)) next.delete(syKey);
      else next.add(syKey);
      return next;
    });
  };

  // Header modal cuộc thi — không lặp dòng «Thành tích cuộc thi / Thể thao»; chỉ lớp + năm học (layout AP)
  const competitionModalHeader = useMemo(() => {
    if (!isCompetitionAchievement || !modalRecord || !modalStudent) return null;
    const className =
      modalStudent.currentClass?.name ||
      modalStudent.currentClass?.className ||
      modalStudent.currentClass?.title ||
      t("noClass", "Chưa cập nhật lớp");
    const syId = modalRecord.subAward?.schoolYear;
    const syDoc = schoolYears.find((sy) => String(sy._id) === String(syId));
    const yearFull = syDoc?.code || syDoc?.name || "";
    const classLineText = `${t("classLabel", "Lớp")} ${className}`;
    const schoolYearLineText = t("apModalSchoolYearLine", "Năm học {{year}}", {
      year: yearFull || "—",
    });
    return { scholarshipText: null, classLineText, schoolYearLineText };
  }, [
    isCompetitionAchievement,
    modalRecord,
    modalStudent,
    t,
    schoolYears,
  ]);

  if (dataLoading)
    return (
      <div className="text-center py-10">{t("loading", "Đang tải...")}</div>
    );
  if (!displaySubCategory || !currentCategory)
    return (
      <div className="text-center py-10 text-red-500">
        {t(
          "subCategoryNotFound",
          "Không tìm thấy thông tin danh mục hoặc loại bài thi",
        )}
      </div>
    );

  const isScholarshipTalent = categoryId === SCHOLARSHIP_TALENT_CATEGORY_ID;
  // Ưu tiên label CMS rồi slug URL để khớp bản ghi song ngữ
  const scholarshipSubCopy = isScholarshipTalent
    ? getScholarshipSubAwardCopy(displaySubCategory.label) ||
      getScholarshipSubAwardCopy(subCategoryParam)
    : null;
  // Chỉ tiểu mục Đại sứ Wellspring: tên HS dùng shimmer giống tiêu đề
  const isDaiSuWellspring = scholarshipSubCopy?.slug === "dai-su-wellspring";

  const cmsDescriptionVi =
    i18n.language === "vi"
      ? displaySubCategory.description
      : displaySubCategory.descriptionEng || displaySubCategory.description;

  const scholarshipBrandColor = getScholarshipBrandColor(
    displaySubCategory?.label || "",
  );

  // Dòng tiêu đề cha — cố định khi đổi tiểu mục (Thành tích cuộc thi…)
  const competitionParentTitleRaw =
    i18n.language === "vi"
      ? currentCategory?.name || ""
      : currentCategory?.nameEng || currentCategory?.name || "";
  const competitionTitleLines = competitionParentTitleRaw
    .replace(/\\n/g, "\n")
    .split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  // CMS có cover thì ưu tiên; không có — trang cuộc thi dùng banner mặc định trong public
  const coverImageSrc = displaySubCategory.coverImage
    ? `${BASE_URL}${displaySubCategory.coverImage}`
    : isCompetitionAchievement
      ? COMPETITION_DEFAULT_COVER_PATH
      : null;

  // Lớp chữ trên ảnh cover — chỉ tên, tách 2 dòng theo VI/EN (splitScholarshipCoverTitleLines)
  const coverOverlayLines = (() => {
    if (isScholarshipTalent) {
      const raw = scholarshipSubCopy
        ? i18n.language === "vi"
          ? scholarshipSubCopy.title.vi
          : scholarshipSubCopy.title.en
        : i18n.language === "vi"
          ? displaySubCategory.label
          : displaySubCategory.labelEng || displaySubCategory.label;
      const lines = splitScholarshipCoverTitleLines(
        raw,
        i18n.language === "vi" ? "vi" : "en",
      );
      return lines.length > 0 ? lines : [raw];
    }
    if (isCompetitionAchievement) {
      const sub =
        i18n.language === "vi"
          ? displaySubCategory.label
          : displaySubCategory.labelEng || displaySubCategory.label;
      if (competitionTitleLines.length > 0) {
        return [...competitionTitleLines, sub];
      }
      return [sub];
    }
    const one =
      i18n.language === "vi"
        ? displaySubCategory.label
        : displaySubCategory.labelEng || displaySubCategory.label;
    return one
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
  })();

  return (
    <div className="lg:p-6 px-3 mb-10 lg:min-w-[960px] w-full mx-auto mt-[40px] overflow-y-auto">
      {/* Tiêu đề và mô tả sub-category */}
      <div className="text-center mb-8">
        {isScholarshipTalent ? (
          <>
            <div className="flex flex-col items-center gap-0 mb-2">
              <div className="shimmer-text-title font-black uppercase tracking-wide font-[Metropolis] text-[clamp(1.25rem,4vw,2.5rem)]">
                {scholarshipSubCopy
                  ? i18n.language === "vi"
                    ? scholarshipSubCopy.title.vi
                    : scholarshipSubCopy.title.en
                  : i18n.language === "vi"
                    ? displaySubCategory.label
                    : displaySubCategory.labelEng || displaySubCategory.label}
              </div>
              {scholarshipSubCopy ? (
                <div className="shimmer-text-subtitle uppercase text-[clamp(0.875rem,2.5vw,1.25rem)] mt-0 leading-tight mb-4">
                  {i18n.language === "vi"
                    ? scholarshipSubCopy.description.vi
                    : scholarshipSubCopy.description.en}
                </div>
              ) : null}
              {/* Gạch chân vector — cùng asset với tiêu đề category (ScholarShip / StandardizedTest) */}
              <CategoryHeroDividerVector />
            </div>
            {cmsDescriptionVi ? (
              <CategoryCmsDescription>
                {cmsDescriptionVi}
              </CategoryCmsDescription>
            ) : null}
          </>
        ) : isCompetitionAchievement ? (
          <>
            {/* Tiêu đề cha (shimmer) → tiểu mục → vector; vector nằm dưới tên Thể thao / Học thuật… */}
            <div className="flex flex-col items-center gap-0 mb-2">
              <div className="flex flex-col shimmer-text-title text-center items-center justify-center uppercase">
                {competitionTitleLines.length > 0
                  ? competitionTitleLines.map((line, idx) => {
                      const textSize =
                        i18n.language === "vi"
                          ? idx === 0
                            ? "text-[50px] font-[Metropolis]"
                            : "text-[70px] font-black font-[Metropolis]"
                          : idx === 0
                            ? "text-[70px] font-black font-[Metropolis]"
                            : "text-[50px] font-[Metropolis]";
                      return (
                        <div key={`comp-main-${idx}`} className={textSize}>
                          {line}
                        </div>
                      );
                    })
                  : (() => {
                      const fb =
                        i18n.language === "vi"
                          ? displaySubCategory.label
                          : displaySubCategory.labelEng ||
                            displaySubCategory.label;
                      const sz =
                        i18n.language === "vi"
                          ? "text-[50px] font-[Metropolis]"
                          : "text-[70px] font-black font-[Metropolis]";
                      return <div className={sz}>{fb}</div>;
                    })()}
              </div>
              <div className="shimmer-text-subtitle mt-3 mb-1 uppercase tracking-wide font-[Metropolis] text-[clamp(1rem,3vw,1.65rem)] leading-tight">
                {i18n.language === "vi"
                  ? displaySubCategory.label
                  : displaySubCategory.labelEng || displaySubCategory.label}
              </div>
              <CategoryHeroDividerVector className="mt-1" />
            </div>
            {cmsDescriptionVi ? (
              <CategoryCmsDescription>
                {cmsDescriptionVi}
              </CategoryCmsDescription>
            ) : null}
          </>
        ) : (
          <>
            <div className="text-[40px] font-extrabold uppercase text-[#F05023] mb-2">
              {i18n.language === "vi"
                ? displaySubCategory.label
                : displaySubCategory.labelEng || displaySubCategory.label}
            </div>
            {cmsDescriptionVi ? (
              <CategoryCmsDescription>
                {cmsDescriptionVi}
              </CategoryCmsDescription>
            ) : null}
          </>
        )}

        {/* Ảnh subAward — cuộc thi: một lớp ảnh w-full h-auto; còn lại: frame + chữ */}
        {!coverGone &&
          (coverImageSrc ? (
            isCompetitionAchievement ? (
              <div className="mb-4 mt-8 w-full mx-auto">
                <img
                  key={`comp-cover-${coverStateKey}`}
                  src={coverImageSrc}
                  alt={displaySubCategory.label}
                  className="h-auto w-full"
                  onError={() => {
                    setCoverGone(true);
                  }}
                />
              </div>
            ) : (
              <FramedCategoryCover
                showDecor={coverShowDecor}
                overlay={
                  coverShowDecor ? (
                    <CoverGoldTitleOverlay
                      lines={coverOverlayLines}
                      isVi={i18n.language === "vi"}
                    />
                  ) : undefined
                }
                image={
                  <img
                    key={`cms-cover-${coverStateKey}`}
                    src={coverImageSrc}
                    alt={displaySubCategory.label}
                    className="w-full max-h-[470px] object-cover"
                    onLoad={() => setCoverShowDecor(true)}
                    onError={() => {
                      setCoverGone(true);
                      setCoverShowDecor(false);
                    }}
                  />
                }
              />
            )
          ) : (
            <FramedCategoryCover
              showDecor={coverShowDecor}
              overlay={
                coverShowDecor ? (
                  <CoverGoldTitleOverlay
                    lines={coverOverlayLines}
                    isVi={i18n.language === "vi"}
                  />
                ) : undefined
              }
              image={
                <img
                  key={`local-cover-${coverStateKey}-${localCoverTier}`}
                  src={`/halloffame/${subAwardLabelToSlug(displaySubCategory.label)}.${localCoverTier === 0 ? "png" : "svg"}`}
                  alt={displaySubCategory.label}
                  className="w-full max-h-[470px] object-contain bg-[#f8f8f8]"
                  onLoad={() => setCoverShowDecor(true)}
                  onError={() => {
                    if (localCoverTier === 0) {
                      setLocalCoverTier(1);
                      setCoverShowDecor(false);
                    } else {
                      setCoverGone(true);
                      setCoverShowDecor(false);
                    }
                  }}
                />
              }
            />
          ))}
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
        {groupedData.map((group, idx) => {
          const scholarshipYearKey =
            group.isScholarshipFlat && group.schoolYearId !== undefined
              ? String(group.schoolYearId || "__none__")
              : null;
          const isScholarshipYearOpen =
            scholarshipYearKey === null ||
            !collapsedScholarshipYearKeys.has(scholarshipYearKey);

          return (
            <div key={`${idx}-${scholarshipYearKey ?? "exam"}`}>
              {scholarshipYearKey !== null && (
                <button
                  type="button"
                  className="w-full flex justify-between items-center gap-3 py-2 mb-4 text-left hover:opacity-90"
                  onClick={() =>
                    toggleScholarshipYearSection(scholarshipYearKey)
                  }
                >
                  <span
                    className="font-bold text-xl lg:text-2xl"
                    style={{ color: scholarshipBrandColor }}
                  >
                    {group.schoolYearId &&
                    findSchoolYearLabel(group.schoolYearId)
                      ? `${t("schoolYearPrefix")} ${findSchoolYearLabel(group.schoolYearId)}`
                      : t("schoolYearUnknown", "Năm học khác")}
                  </span>
                  <span
                    className="shrink-0 flex h-9 w-9 items-center justify-center rounded-full border bg-white shadow-sm"
                    style={{
                      borderColor: scholarshipBrandColor,
                      color: scholarshipBrandColor,
                    }}
                  >
                    {isScholarshipYearOpen ? (
                      <FaAngleDown className="text-base" />
                    ) : (
                      <FaAngleRight className="text-base" />
                    )}
                  </span>
                </button>
              )}
              {/* Tiêu đề group — học bổng không lặp lại nhóm */}
              {isScholarshipYearOpen && !group.isScholarshipFlat && (
                <div className="text-2xl font-bold text-[#002855] mb-4 border-b pb-2">
                  {group.isScoreGroup ? (
                    <>
                      IELTS -{" "}
                      <span className="text-[#F05023]">{group.exam}</span>
                    </>
                  ) : (
                    group.exam
                  )}
                </div>
              )}
              {isScholarshipYearOpen && (
                <div
                  className={
                    group.isScholarshipFlat
                      ? "flex flex-wrap justify-center items-start gap-x-[8px] gap-y-[8px] lg:gap-x-[30px] lg:gap-y-[35px] w-full py-2"
                      : "grid justify-items-center xl:grid-cols-5 lg:grid-cols-4 md:grid-cols-3 grid-cols-2 gap-x-[8px] gap-y-[8px] lg:gap-x-[30px] lg:gap-y-[35px]"
                  }
                >
                  {group.items.map((item, i) => {
                    const { record, student } = item;
                    const className =
                      student.currentClass?.title ||
                      student.currentClass?.className ||
                      student.currentClass?.name ||
                      t("noClass", "Chưa cập nhật lớp");
                    const schoolYearLabel =
                      !group.isScholarshipFlat && record.subAward?.schoolYear
                        ? findSchoolYearLabel(record.subAward.schoolYear)
                        : "";
                    const score = student.score || student.result || "";
                    const studentName = student.student?.name || "";
                    const isTalentCard = group.isScholarshipFlat;
                    const openFlatCard = () => {
                      if (
                        categoryId === SCHOLARSHIP_TALENT_CATEGORY_ID ||
                        categoryId === COMPETITION_ACHIEVEMENT_CATEGORY_ID
                      ) {
                        openScholarshipModal(record, student);
                      }
                    };
                    const isCompetitionFlatCard =
                      isCompetitionAchievement && isTalentCard;
                    const compLightBg =
                      isCompetitionFlatCard &&
                      isLightBrandBackground(scholarshipBrandColor);
                    const compLineMutedClass = compLightBg
                      ? "text-[#002855]"
                      : "text-white";
                    const compNameClass = compLightBg
                      ? "text-[#002855]"
                      : "text-[#F9D16F]";
                    const syShort = getSchoolYearShortOnCard(
                      record.subAward?.schoolYear,
                    );
                    const nhTag = syShort
                      ? `[${t("schoolYearAbbr", "NH")} ${syShort}]`
                      : "";
                    const competitionClassYearLine = nhTag
                      ? `${t("classLabel", "Lớp")} ${className} - ${nhTag}`
                      : `${t("classLabel", "Lớp")} ${className}`;
                    const competitionSubLine =
                      i18n.language === "vi"
                        ? displaySubCategory?.label
                        : displaySubCategory?.labelEng ||
                          displaySubCategory?.label ||
                          "";
                    return (
                      // Thẻ thi chuẩn hóa / HB flat: min-height + pb để dòng bài thi + điểm dài không sát mép bo
                      <div
                        key={i}
                        role={isTalentCard ? "button" : undefined}
                        tabIndex={isTalentCard ? 0 : undefined}
                        onKeyDown={
                          isTalentCard
                            ? (e) => {
                                if (e.key === "Enter" || e.key === " ")
                                  openFlatCard();
                              }
                            : undefined
                        }
                        className={`lg:w-[250px] w-[180px] rounded-[30px] shadow-sm flex flex-col items-center border border-white/15 ${
                          isCompetitionFlatCard
                            ? "lg:h-[420px] h-[370px] lg:px-5 lg:py-5 px-4 py-5 justify-between"
                            : "min-h-[370px] lg:min-h-[420px] lg:pt-[25px] lg:px-[20px] lg:pb-8 px-[15px] pt-[20px] pb-7 bg-gradient-to-b from-[#03171c] to-[#182b55]"
                        } ${isTalentCard ? "cursor-pointer" : ""}`}
                        style={
                          isCompetitionFlatCard
                            ? { backgroundColor: scholarshipBrandColor }
                            : undefined
                        }
                        onClick={
                          isTalentCard ? () => openFlatCard() : undefined
                        }
                      >
                        {isCompetitionFlatCard ? (
                          <div className="flex h-full w-full flex-col items-center text-center">
                            {/* Ảnh học sinh — giữ như thẻ học bổng */}
                            <div className="mb-2 flex w-full flex-shrink-0 justify-center">
                              {student.photo?.photoUrl ? (
                                <img
                                  src={`${BASE_URL}${student.photo.photoUrl}`}
                                  alt="Student"
                                  className="h-[250px] w-[190px] object-cover object-top rounded-2xl shadow-md ring-1 ring-white/25"
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                    e.target.parentElement.innerHTML =
                                      '<div class="h-[250px] w-[190px] flex items-center justify-center rounded-2xl bg-gray-200 text-sm italic text-gray-400">Chưa có ảnh</div>';
                                  }}
                                />
                              ) : (
                                <div className="flex h-[250px] w-[190px] items-center justify-center rounded-2xl bg-gray-200 text-sm italic text-gray-400">
                                  {t("noPhoto", "Chưa có ảnh")}
                                </div>
                              )}
                            </div>
                            <div className="mt-auto flex w-full flex-col items-center pb-0">
                              <p
                                className={`w-full text-[13px] sm:text-[14px] font-semibold leading-snug ${compLineMutedClass}`}
                              >
                                {competitionClassYearLine}
                              </p>
                              <p
                                className={`mt-2 w-full px-1 text-[16px] sm:text-[18px] font-bold leading-snug line-clamp-3 break-words ${compNameClass}`}
                              >
                                {studentName}
                              </p>
                              <p
                                className={`mt-4 w-full text-[13px] sm:text-[14px] font-semibold leading-snug ${compLineMutedClass}`}
                              >
                                {competitionSubLine}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex w-full flex-col items-center">
                            {/* Ảnh - chiều cao cố định (cùng layout mọi thẻ trong lưới) */}
                            <div className="mb-3 flex-shrink-0">
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

                            {/* Học bổng: chỉ lớp; thi chuẩn hóa: lớp + năm học */}
                            <div className="mb-2 flex-shrink-0 text-center text-[14px] font-semibold text-white">
                              {group.isScholarshipFlat ? (
                                <>
                                  {t("classLabel", "Lớp")} {className}
                                </>
                              ) : (
                                <>
                                  {t("classPrefix")} {className} -{" "}
                                  {t("schoolYearAbbr")} {schoolYearLabel}
                                </>
                              )}
                            </div>

                            <div className="mb-2 flex h-[52px] w-full min-w-0 flex-shrink-0 items-center justify-center px-1">
                              <span
                                className={
                                  group.isScholarshipFlat && isDaiSuWellspring
                                    ? "shimmer-text-title line-clamp-2 w-full min-w-0 max-w-full text-center text-[18px] font-black leading-[1.45]"
                                    : "line-clamp-2 text-center text-[18px] font-extrabold leading-[26px] text-[#F9D16F]"
                                }
                              >
                                {studentName}
                              </span>
                            </div>

                            <div className="flex-shrink-0 text-center text-[14px] sm:text-[16px] font-semibold text-white px-1.5 leading-snug break-words">
                              {group.isScholarshipFlat ? (
                                score ? (
                                  <span className="text-[#F9D16F]">
                                    {score}
                                  </span>
                                ) : null
                              ) : group.isScoreGroup ? (
                                <>
                                  IELTS -{" "}
                                  <span className="text-[#F9D16F]">
                                    {score}
                                  </span>
                                </>
                              ) : (
                                <>
                                  {group.exam}
                                  {score && (
                                    <>
                                      {" - "}
                                      <span className="text-[#F9D16F]">
                                        {score}
                                      </span>
                                    </>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        {groupedData.length === 0 && (
          <div className="text-center text-gray-500 py-10">
            {t("noMatchingData")}
          </div>
        )}
      </div>

      <ScholarshipStudentModal
        open={Boolean(
          (isScholarshipTalent || isCompetitionAchievement) &&
            showScholarshipModal &&
            modalRecord &&
            modalStudent,
        )}
        onClose={closeScholarshipModal}
        modalRecord={modalRecord}
        modalStudent={modalStudent}
        apDiplomaHeader={competitionModalHeader}
      />
    </div>
  );
};

export default Detail;
