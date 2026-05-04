// Sidebar.jsx
// @ts-nocheck
import React, { useEffect } from "react";
import { FaAngleDown, FaAngleRight, FaArrowLeft } from "react-icons/fa6";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  SCHOLARSHIP_TALENT_CATEGORY_ID,
  SCHOLARSHIP_TALENT_PARENT_ID,
  SCHOLARSHIP_SHINE_CATEGORY_ID,
  SCHOLARSHIP_AP_CATEGORY_ID,
  TOP_GRADUATE_CATEGORY_ID,
  WISER_EXCELLENT_CATEGORY_ID,
  WISER_INSPIRATION_CATEGORY_ID,
  COMPETITION_ACHIEVEMENT_CATEGORY_ID,
  COMPETITION_ACHIEVEMENT_PARENT_ID,
  HONOR_STUDENT_CATEGORY_ID,
  HONOR_CLASS_CATEGORY_ID,
  WISER_EFFORT_CATEGORY_ID,
  STANDARDIZED_TEST_CATEGORY_ID,
  SLUG_BY_CATEGORY_ID,
} from "@/core/config";
import { getScholarshipBrandColor } from "../../data/scholarshipBrandColors";
import { useScholarshipAndCompetitionSubItems } from "../../hooks/useScholarshipAndCompetitionSubItems";

const Sidebar = ({
  selectedCategoryId,
  setSelectedCategoryId,
  openDropdown,
  setOpenDropdown,
  isSidebarOpen,
  closeSidebar,
  /** Slug tiểu mục học bổng (param ten-sub-award) để highlight */
  selectedScholarshipSubSlug,
  /** Slug tiểu mục thành tích cuộc thi (cùng param ten-sub-award) */
  selectedCompetitionSubSlug,
}) => {
  const { t, i18n } = useTranslation(["sidebar", "common"]);
  const navigate = useNavigate();

  const { scholarshipSubItems, competitionSubItems } =
    useScholarshipAndCompetitionSubItems();

  // Danh sách ID các danh mục đã có giao diện (ID từ Frappe)
  const enabledCategoryIds = [
    HONOR_STUDENT_CATEGORY_ID,
    WISER_EFFORT_CATEGORY_ID,
    HONOR_CLASS_CATEGORY_ID,
    SCHOLARSHIP_TALENT_CATEGORY_ID,
    SCHOLARSHIP_SHINE_CATEGORY_ID,
    SCHOLARSHIP_AP_CATEGORY_ID,
    STANDARDIZED_TEST_CATEGORY_ID,
    TOP_GRADUATE_CATEGORY_ID,
    WISER_EXCELLENT_CATEGORY_ID,
    WISER_INSPIRATION_CATEGORY_ID,
    COMPETITION_ACHIEVEMENT_CATEGORY_ID,
  ];

  const getCategoryNameFromId = (id) => SLUG_BY_CATEGORY_ID[id] ?? null;

  const fixedCategories = [
    {
      id: SCHOLARSHIP_TALENT_PARENT_ID,
      nameKey: "scholarship_talent",
      default: "Học bổng Tài năng",
      isScholarshipGroup: true,
    },
    {
      id: SCHOLARSHIP_SHINE_CATEGORY_ID,
      nameKey: "scholarship_shine",
      default: "Học bổng Toả sáng",
      activeBg: "#F15A29",
    },
    {
      id: SCHOLARSHIP_AP_CATEGORY_ID,
      nameKey: "scholarship_ap",
      default: "Học bổng AP",
      activeBg: "#009681",
    },
    {
      id: TOP_GRADUATE_CATEGORY_ID,
      nameKey: "top_graduates",
      default: "Thủ khoa Tốt nghiệp",
    },
    {
      // Cover mặc định / không lớp phủ: StudentHonorContent + public/wiser-uu-tu.png
      id: WISER_EXCELLENT_CATEGORY_ID,
      nameKey: "wiser_excellent",
      default: "WISers Ưu tú",
    },
    {
      // Cover mặc định / không lớp phủ: StudentHonorContent + public/wiser-truyen-cam-hung.png
      id: WISER_INSPIRATION_CATEGORY_ID,
      nameKey: "wiser_inspiration",
      default: "WISers Truyền cảm hứng",
    },
    {
      id: "empty_5",
      nameKey: "wiser_honor",
      default: "WISers Danh dự",
      subCategories: [
        {
          id: HONOR_STUDENT_CATEGORY_ID,
          nameKey: "student_honor",
          default: "Học sinh Danh dự",
        },
        {
          id: HONOR_CLASS_CATEGORY_ID,
          nameKey: "class_honor",
          default: "Lớp Danh dự",
        },
      ],
    },
    {
      id: WISER_EFFORT_CATEGORY_ID,
      nameKey: "wiser_effort",
      default: "WISers Nỗ lực",
    },
    {
      id: STANDARDIZED_TEST_CATEGORY_ID,
      nameKey: "standardized_test",
      default: "Thành tích các bài thi chuẩn hóa",
    },
    {
      id: COMPETITION_ACHIEVEMENT_PARENT_ID,
      nameKey: "competition",
      default: "Thành tích trong các cuộc thi và giải đấu",
      isCompetitionGroup: true,
    },
  ];

  useEffect(() => {
    if (selectedCategoryId === HONOR_STUDENT_CATEGORY_ID) {
      setOpenDropdown("empty_5");
    } else if (selectedCategoryId === HONOR_CLASS_CATEGORY_ID) {
      setOpenDropdown("empty_5");
    } else if (selectedCategoryId === SCHOLARSHIP_TALENT_CATEGORY_ID) {
      setOpenDropdown(SCHOLARSHIP_TALENT_PARENT_ID);
    } else if (selectedCategoryId === COMPETITION_ACHIEVEMENT_CATEGORY_ID) {
      setOpenDropdown(COMPETITION_ACHIEVEMENT_PARENT_ID);
    }
  }, [selectedCategoryId, selectedScholarshipSubSlug, selectedCompetitionSubSlug]);

  /** variant: scholarship | competition | static (WISers Danh dự con) */
  const renderSubRow = (sub, variant) => {
    const isScholarship = variant === "scholarship";
    const isCompetition = variant === "competition";
    const isDynamic = isScholarship || isCompetition;

    const isSubEnabled = isDynamic
      ? Boolean(sub.slug)
      : enabledCategoryIds.includes(sub.id);

    const isActive = isScholarship
      ? selectedCategoryId === SCHOLARSHIP_TALENT_CATEGORY_ID &&
        selectedScholarshipSubSlug === sub.slug
      : isCompetition
        ? selectedCategoryId === COMPETITION_ACHIEVEMENT_CATEGORY_ID &&
          selectedCompetitionSubSlug === sub.slug
        : sub.id === selectedCategoryId && isSubEnabled;

    const title = isDynamic
      ? i18n.language === "vi"
        ? sub.label
        : sub.labelEng || sub.label
      : t(sub.nameKey, sub.default);

    const brandColor =
      isScholarship || isCompetition
        ? getScholarshipBrandColor(sub.label)
        : null;

    return (
      <div
        key={isDynamic ? sub.slug : sub.id}
        className={`
                  text-[16px] p-3 rounded-lg transition
                  ${
                    isDynamic
                      ? isSubEnabled
                        ? "cursor-pointer"
                        : "opacity-50 cursor-not-allowed"
                      : `${
                          isActive
                            ? "bg-[#F05023] text-white font-bold"
                            : "text-[#757575] font-semibold"
                        } ${isSubEnabled ? "cursor-pointer" : "opacity-50 cursor-not-allowed"}`
                  }
                `}
        // Học bổng / cuộc thi: active theo màu brand (fallback trong getScholarshipBrandColor)
        style={
          (isScholarship || isCompetition) && brandColor
            ? {
                backgroundColor: isActive ? brandColor : undefined,
                color: isActive ? "#ffffff" : "#757575",
                fontWeight: isActive ? 700 : 600,
              }
            : undefined
        }
        onClick={() => {
          if (!isSubEnabled) return;
          if (isScholarship) {
            setSelectedCategoryId(SCHOLARSHIP_TALENT_CATEGORY_ID);
            navigate(
              `/detail/scholarship-talent/${encodeURIComponent(sub.slug)}`,
            );
          } else if (isCompetition) {
            setSelectedCategoryId(COMPETITION_ACHIEVEMENT_CATEGORY_ID);
            navigate(
              `/detail/competition-achievements/${encodeURIComponent(sub.slug)}`,
            );
          } else {
            setSelectedCategoryId(sub.id);
            const categoryName = getCategoryNameFromId(sub.id);
            if (categoryName) navigate(`/detail/${categoryName}`);
          }
          setTimeout(() => {
            if (window.innerWidth < 1600) closeSidebar && closeSidebar();
          }, 100);
        }}
      >
        <span className="leading-snug">{title}</span>
      </div>
    );
  };

  return (
    <aside
      className={`fixed top-12 md:top-0 left-0 z-40 flex max-h-[calc(100vh-4rem)] md:max-h-[calc(100vh-80px)] w-full md:w-[350px] lg:w-[400px] bg-white p-4 shadow-md transform transition-transform duration-300 overflow-y-auto
      ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} 
      xll:max-h-none xll:translate-x-0 xll:relative xll:flex xll:w-[270px] xll:shrink-0 xll:self-stretch xll:min-h-0 xll:shadow-none xll:overflow-visible`}
    >
      <nav className="space-y-4 mt-10 ">
        <button
          onClick={() => navigate("/hall-of-honor")}
          className="flex items-center gap-2 text-[#757575] hover:text-[#002855] mb-6"
        >
          <FaArrowLeft />
          <span className="text-[#757575]">
            {t("back_home", "Quay lại trang chủ")}
          </span>
        </button>

        <h2 className="font-bold text-[24px] mb-4 text-[#002855]">
          {t("category", "Danh mục")}
        </h2>

        <hr className="border-gray-200 mb-4" />

        {fixedCategories.map((fixedCat) => {
          const hasSubcategories =
            fixedCat.isScholarshipGroup ||
            fixedCat.isCompetitionGroup ||
            (fixedCat.subCategories && fixedCat.subCategories.length > 0);
          const isCatEnabled =
            hasSubcategories || enabledCategoryIds.includes(fixedCat.id);
          const isOpen = openDropdown === fixedCat.id;

          const isTopRowActive =
            !hasSubcategories && selectedCategoryId === fixedCat.id;
          const useCustomActiveBg =
            Boolean(fixedCat.activeBg) && isTopRowActive;

          const containerStyle = hasSubcategories
            ? "flex items-center justify-between p-3 text-[18px] rounded-lg transition text-[#757575] font-semibold cursor-pointer"
            : `flex items-center justify-between p-3 text-[18px] rounded-lg transition ${
                isTopRowActive
                  ? useCustomActiveBg
                    ? "font-bold text-white"
                    : "bg-[#F05023] font-bold text-white"
                  : "text-[#757575] font-semibold"
              } ${
                isCatEnabled
                  ? "cursor-pointer"
                  : "opacity-50 cursor-not-allowed"
              }`;

          const topRowStyle =
            useCustomActiveBg && fixedCat.activeBg
              ? { backgroundColor: fixedCat.activeBg, color: "#ffffff" }
              : undefined;

          return (
            <div key={fixedCat.id} className="w-full">
              <div
                className={containerStyle}
                style={topRowStyle}
                onClick={() => {
                  if (!hasSubcategories) {
                    if (isCatEnabled) {
                      setSelectedCategoryId(fixedCat.id);
                      const categoryName = getCategoryNameFromId(fixedCat.id);
                      if (categoryName) navigate(`/detail/${categoryName}`);
                      setTimeout(() => {
                        if (window.innerWidth < 1600)
                          closeSidebar && closeSidebar();
                      }, 100);
                    }
                  } else {
                    setOpenDropdown(
                      openDropdown === fixedCat.id ? null : fixedCat.id,
                    );
                  }
                }}
              >
                <span>{t(fixedCat.nameKey, fixedCat.default)}</span>
                {hasSubcategories && (
                  <span className="text-gray-500 text-lg">
                    {isOpen ? <FaAngleDown /> : <FaAngleRight />}
                  </span>
                )}
              </div>

              {hasSubcategories && isOpen && (
                <div className="pl-6 space-y-2 mt-3">
                  {fixedCat.isScholarshipGroup
                    ? scholarshipSubItems.map((sub) =>
                        renderSubRow(sub, "scholarship"),
                      )
                    : fixedCat.isCompetitionGroup
                      ? competitionSubItems.map((sub) =>
                          renderSubRow(sub, "competition"),
                        )
                      : fixedCat.subCategories.map((sub) =>
                          renderSubRow(sub, "static"),
                        )}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
