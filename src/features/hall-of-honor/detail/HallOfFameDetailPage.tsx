// @ts-nocheck
import React, { useState, useEffect, Suspense, lazy } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  SCHOLARSHIP_TALENT_CATEGORY_ID,
  SCHOLARSHIP_SHINE_CATEGORY_ID,
  SCHOLARSHIP_AP_CATEGORY_ID,
  TOP_GRADUATE_CATEGORY_ID,
  WISER_EXCELLENT_CATEGORY_ID,
  WISER_INSPIRATION_CATEGORY_ID,
  COMPETITION_ACHIEVEMENT_CATEGORY_ID,
  HONOR_STUDENT_CATEGORY_ID,
  HONOR_CLASS_CATEGORY_ID,
  WISER_EFFORT_CATEGORY_ID,
  STANDARDIZED_TEST_CATEGORY_ID,
} from "@/core/config";
import { useDetailCategoryNavigation } from "../hooks/useDetailCategoryNavigation";
import Sidebar from "./sidebar/Sidebar";
import { HallOfHonorHeader } from "../components/layout/HallOfHonorHeader";
import { HallOfHonorFooter } from "../components/layout/HallOfHonorFooter";
import { DetailScrollFabColumn } from "../components/detail/DetailScrollFabColumn";
import StudentHonorContent from "../student/StudentHonorContent";
import ApDiplomaScholarshipContent from "../scholarship/ap/ApDiplomaScholarshipContent";
import ClassHonorContent from "../class/ClassHonorContent";
import ScholarShipContent from "../scholarship/talent/ScholarShipContent";
import StandardizedTestAchievements from "../StandardizedTestAchievements/StandardizedTestAchievements";
const StandardizedDetailPage = lazy(
  () => import("../standardized/detail/Detail"),
);
function HallOfFamePublicPage() {
  const [, setSearchParams] = useSearchParams();

  const {
    selectedCategoryId,
    setSelectedCategoryId,
    getCategoryNameFromId,
    category,
    recordId,
    studentId,
    classId,
    tenSubAward,
  } = useDetailCategoryNavigation();

  // --- i18n, Header logic ---
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [openDropdown, setOpenDropdown] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  const categoryName = getCategoryNameFromId(selectedCategoryId);

  // --- Chọn component hiển thị theo danh mục ---
  const renderMainContent = () => {
    // Nếu có ten-sub-award param thì render Detail
    if (tenSubAward) {
      return (
        <Suspense
          fallback={
            <div className="p-8 text-center text-[#002855] font-semibold">
              Đang tải chi tiết…
            </div>
          }
        >
          <StandardizedDetailPage />
        </Suspense>
      );
    }
    // Switch case với ID mới từ Frappe
    switch (selectedCategoryId) {
      // Học sinh danh dự
      case HONOR_STUDENT_CATEGORY_ID:
        return (
          <StudentHonorContent
            categoryId={selectedCategoryId}
            categoryName={categoryName}
            recordIdParam={recordId}
            studentIdParam={studentId}
            setSearchParams={setSearchParams}
          />
        );
      // Học bổng Tài năng — trang tổng (nhóm theo sub-award custom); từng hạng mục dùng route /detail/scholarship-talent/:slug → Detail
      case SCHOLARSHIP_TALENT_CATEGORY_ID:
        return (
          <ScholarShipContent
            categoryId={selectedCategoryId}
            categoryName={categoryName}
            recordIdParam={recordId}
            studentIdParam={studentId}
            setSearchParams={setSearchParams}
          />
        );
      // WISers Nỗ lực
      case WISER_EFFORT_CATEGORY_ID:
        return (
          <StudentHonorContent
            categoryId={selectedCategoryId}
            categoryName={categoryName}
            recordIdParam={recordId}
            studentIdParam={studentId}
            setSearchParams={setSearchParams}
          />
        );
      // Lớp danh dự
      case HONOR_CLASS_CATEGORY_ID:
        return (
          <ClassHonorContent
            categoryId={selectedCategoryId}
            categoryName={categoryName}
            recordIdParam={recordId}
            classIdParam={classId}
            setSearchParams={setSearchParams}
          />
        );
      // Thành tích các bài thi chuẩn hóa quốc tế
      case STANDARDIZED_TEST_CATEGORY_ID:
        return (
          <StandardizedTestAchievements
            categoryId={selectedCategoryId}
            categoryName={categoryName}
            recordIdParam={recordId}
            studentIdParam={studentId}
            setSearchParams={setSearchParams}
          />
        );
      // Học bổng Toả sáng — cùng UI AP; sau năm học gộp một lưới (không chia sub-award)
      case SCHOLARSHIP_SHINE_CATEGORY_ID:
        return (
          <ApDiplomaScholarshipContent
            categoryId={selectedCategoryId}
            categoryName={categoryName}
            recordIdParam={recordId}
            studentIdParam={studentId}
            groupBySubAward={false}
          />
        );
      // Học bổng AP Diploma — cùng component (lọc năm, lưới theo tất cả tiểu mục custom, sort priority)
      case SCHOLARSHIP_AP_CATEGORY_ID:
        return (
          <ApDiplomaScholarshipContent
            categoryId={selectedCategoryId}
            categoryName={categoryName}
            recordIdParam={recordId}
            studentIdParam={studentId}
          />
        );
      // Thủ khoa tốt nghiệp, WISers Ưu tú / Truyền cảm hứng, thành tích cuộc thi — cùng lưới học sinh
      case TOP_GRADUATE_CATEGORY_ID:
      case WISER_EXCELLENT_CATEGORY_ID:
      case WISER_INSPIRATION_CATEGORY_ID:
      case COMPETITION_ACHIEVEMENT_CATEGORY_ID:
        return (
          <StudentHonorContent
            categoryId={selectedCategoryId}
            categoryName={categoryName}
            recordIdParam={recordId}
            studentIdParam={studentId}
            setSearchParams={setSearchParams}
          />
        );
      default:
        if (!selectedCategoryId) {
          return (
            <div className="p-10 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F05023] mx-auto mb-4"></div>
              <p>{t("loading", "Đang tải...")}</p>
            </div>
          );
        }
        return (
          <div className="p-10">
            {t("noInterface", "Chưa có giao diện cho danh mục này.")}
          </div>
        );
    }
  };
  useEffect(() => {
    document.title = "Wellspring Hà Nội | Hall of Honor";
    // Cleanup function để reset title khi unmount
    return () => {
      document.title = "Wellspring";
    };
  }, []);
  return (
    <div className="min-h-screen w-full flex flex-col">
      <HallOfHonorHeader
        variant="detail"
        onLogoClick={() => navigate("/hall-of-honor")}
        onMenuToggle={() => setIsSidebarOpen((v) => !v)}
      />
      {/* Cột dọc dưới header: tối thiểu 100vh - header để footer bám đáy màn hình khi nội dung ngắn; sidebar + main stretch theo nhau */}
      <div className="flex flex-1 flex-col w-full pt-[80px] min-h-[calc(100dvh-80px)]">
        <div className="flex flex-1 items-stretch w-full md:px-14">
          <Sidebar
            selectedCategoryId={selectedCategoryId}
            setSelectedCategoryId={setSelectedCategoryId}
            openDropdown={openDropdown}
            setOpenDropdown={setOpenDropdown}
            isSidebarOpen={isSidebarOpen}
            closeSidebar={() => setIsSidebarOpen(false)}
            selectedScholarshipSubSlug={
              category === "scholarship-talent" ? tenSubAward : undefined
            }
            selectedCompetitionSubSlug={
              category === "competition-achievements" ? tenSubAward : undefined
            }
          />

          <div className="relative flex-1 xll:pl-16 min-w-0 flex flex-col min-h-0">
            {renderMainContent()}
            {/* Tem tròn Wellspring — góc dưới phải vùng main, phía trên footer */}
            <img
              src="/stamp.png"
              alt=""
              className="pointer-events-none select-none absolute bottom-0 right-0 w-[clamp(216px,33vw,420px)] h-auto z-[5] md:translate-x-14"
            />
          </div>

          <DetailScrollFabColumn />
        </div>

        <HallOfHonorFooter />
      </div>
    </div>
  );
}

export default HallOfFamePublicPage;
