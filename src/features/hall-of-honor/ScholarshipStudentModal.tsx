// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { FaChevronLeft, FaChevronRight, FaTimes } from "react-icons/fa";
import { BASE_URL } from "../../core/config";

/**
 * Lấy danh sách hoạt động / thành tích theo đúng bản ghi student trong record
 */
function getStudentActivities(modalRecord, modalStudent, useVi) {
  const mid = modalStudent.student?._id;
  const student = modalRecord.students.find(
    (s) => mid != null && String(s.student?._id) === String(mid),
  );
  return useVi ? student?.activity : student?.activityEng;
}

const ACTIVITY_PAGE_SIZE = 4;

/**
 * Danh sách thành tích: 4 mục/trang; >4 thì có mũi tên. Trang cuối ít hơn 4 mục vẫn giữ đủ 4 dòng (dòng trống invisible) để khối không nhảy chiều cao.
 */
function ActivitiesSlider({ items, emptyLabel, resetKey }) {
  const list = useMemo(
    () => (Array.isArray(items) ? items.filter(Boolean) : []),
    [items],
  );
  const [page, setPage] = useState(0);

  useEffect(() => {
    setPage(0);
  }, [resetKey]);

  const pageCount = Math.max(1, Math.ceil(list.length / ACTIVITY_PAGE_SIZE));
  const safePage = Math.min(Math.max(0, page), pageCount - 1);
  const slice = list.slice(
    safePage * ACTIVITY_PAGE_SIZE,
    (safePage + 1) * ACTIVITY_PAGE_SIZE,
  );
  const showArrows = list.length > ACTIVITY_PAGE_SIZE;

  // Nhiều trang: luôn render đủ 4 dòng để trang cuối (ít hơn 4 mục) không làm khối co lại
  const displayRows =
    showArrows && slice.length > 0 && slice.length < ACTIVITY_PAGE_SIZE
      ? [
          ...slice,
          ...Array(ACTIVITY_PAGE_SIZE - slice.length).fill(null),
        ]
      : slice;

  const goPrev = () => setPage((p) => Math.max(0, p - 1));
  const goNext = () => setPage((p) => Math.min(pageCount - 1, p + 1));

  return (
    <div className="flex items-start gap-1 sm:gap-2 w-full">
      {showArrows ? (
        <button
          type="button"
          onClick={goPrev}
          disabled={safePage <= 0}
          className="shrink-0 self-center w-8 h-8 flex items-center justify-center rounded-full text-[#F9D16F] hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Trang trước"
        >
          <FaChevronLeft className="w-4 h-4" />
        </button>
      ) : null}

      <ul className="flex-1 min-w-0 flex flex-col items-start space-y-2.5 py-0">
        {list.length === 0 ? (
          <li className="text-gray-400 text-sm">{emptyLabel}</li>
        ) : (
          displayRows.map((act, idx) =>
            act == null ? (
              <li
                key={`pad-${safePage}-${idx}`}
                aria-hidden
                className="invisible pointer-events-none flex items-start font-bold w-full"
              >
                <img
                  src="/halloffame/star.svg"
                  alt=""
                  className="mt-1 flex-shrink-0 w-5 h-5"
                />
                <p className="ml-3 text-white text-sm leading-snug">&nbsp;</p>
              </li>
            ) : (
              <li
                key={`row-${safePage}-${idx}`}
                className="flex items-start font-bold w-full"
              >
                <img
                  src="/halloffame/star.svg"
                  alt=""
                  className="mt-1 flex-shrink-0 w-5 h-5"
                />
                <p className="ml-3 text-white text-sm leading-snug">{act}</p>
              </li>
            ),
          )
        )}
      </ul>

      {showArrows ? (
        <button
          type="button"
          onClick={goNext}
          disabled={safePage >= pageCount - 1}
          className="shrink-0 self-center w-8 h-8 flex items-center justify-center rounded-full text-[#F9D16F] hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Trang sau"
        >
          <FaChevronRight className="w-4 h-4" />
        </button>
      ) : null}
    </div>
  );
}

/** Gộp lớp + năm học một dòng: "Lớp … (Năm học …)" — màu hiển thị do JSX */
function formatApClassYearLine(header) {
  if (!header) return "";
  const c = (header.classLineText || "").trim();
  const y = (header.schoolYearLineText || "").trim();
  if (c && y) return `${c} (${y})`;
  return c || y;
}

/**
 * Modal chi tiết học sinh học bổng — portal ra body, dùng chung ScholarShipContent & Detail.
 * Avatar tròn: desktop chồng đáy khung trái, mobile chồng mép trên ô ghi chú.
 * apDiplomaHeader: có thể có scholarshipText (HB AP); lớp + năm học gộp một dòng trong modal.
 */
function ScholarshipStudentModal({
  open,
  onClose,
  modalRecord,
  modalStudent,
  apDiplomaHeader = null,
}) {
  const { t, i18n } = useTranslation(["scholarship", "common"]);

  if (
    !open ||
    !modalRecord ||
    !modalStudent ||
    typeof document === "undefined"
  ) {
    return null;
  }

  const useVi = i18n.language === "vi";
  const activities = getStudentActivities(modalRecord, modalStudent, useVi);
  const emptyActivities = t("noActivitiesYet", "Chưa có hoạt động");
  const activityResetKey = `${modalRecord._id}-${modalStudent.student?._id ?? ""}`;
  const apClassYearLine = formatApClassYearLine(apDiplomaHeader);

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      {/* Desktop */}
      <div
        className="hidden xl:flex relative md:w-[60%] w-[70%] max-w-[1200px] min-h-[min(520px,85vh)] px-10 py-10 rounded-xl max-h-[90vh] items-stretch overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src="/halloffame/scholarship.svg"
          alt=""
          className="hidden lg:block absolute inset-0 w-full h-full object-cover"
        />
        <img
          src="/halloffame/scholarship-mobile.svg"
          alt=""
          className="block lg:hidden absolute inset-0 w-full h-full object-cover"
        />

        <div className="relative w-[50%] max-h-[80%] p-10 flex flex-row lg:flex-col">
          <div className="w-full h-full border border-[#F9D16F] rounded-xl p-9 flex-grow overflow-y-hidden hover:overflow-y-auto">
            <p className="xl:text-base text-sm font-semibold text-justify text-white mb-[13%]">
              {useVi ? modalStudent.note : modalStudent.noteEng}
            </p>
          </div>
          {modalStudent.photo?.photoUrl ? (
            <img
              src={`${BASE_URL}/${modalStudent.photo.photoUrl}`}
              alt={modalStudent.student?.name || ""}
              className="absolute object-cover object-top -bottom-[3%] left-1/2 transform -translate-x-1/2 w-28 h-28 rounded-full shadow-lg"
            />
          ) : (
            <div
              className="absolute left-1/2 -translate-x-1/2 -bottom-[3%] w-28 h-28 rounded-full bg-white/10"
              aria-hidden
            />
          )}
        </div>

        <div className="w-[60%] flex flex-col self-stretch py-10 px-5 relative z-10 min-h-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute -top-[5%] right-0 text-[#F9D16F] hover:text-gray-800 z-20"
            aria-label={t("close", "Đóng")}
          >
            <FaTimes size={20} />
          </button>

          {/* Cụm tên + (AP: học bổng + năm) lớp + thành tích — canh đáy cột phải */}
          <div className="mt-auto w-full flex flex-col">
            {apDiplomaHeader ? (
              <div className="flex w-full flex-col gap-4 xl:gap-5 mb-4">
                <div className="w-full xl:text-xl text-lg font-bold leading-tight text-[#F9D16F]">
                  {modalStudent.student?.name?.toUpperCase()}
                </div>
                {apDiplomaHeader.scholarshipText ? (
                  <div className="w-full xl:text-base text-sm font-normal leading-snug text-[#F9D16F]">
                    {apDiplomaHeader.scholarshipText}
                  </div>
                ) : null}
                {apClassYearLine ? (
                  <div className="w-full xl:text-base text-sm font-normal leading-snug text-white">
                    {apClassYearLine}
                  </div>
                ) : null}
              </div>
            ) : (
              <>
                <div className="w-full xl:text-xl text-lg font-bold text-[#F9D16F]">
                  {modalStudent.student?.name?.toUpperCase()}
                </div>
                <div className="w-full xl:text-base text-sm font-semibold text-[#F9D16F] my-3">
                  {t("classLabel", "Lớp")}{" "}
                  {modalStudent.currentClass?.name ||
                    modalStudent.currentClass?.className ||
                    t("noClass", "Chưa cập nhật lớp")}
                </div>
              </>
            )}
            <hr className="border-gray-300 mb-6" />
            <div className="max-h-[280px] overflow-hidden">
              <ActivitiesSlider
                items={activities}
                emptyLabel={emptyActivities}
                resetKey={activityResetKey}
              />
            </div>
            <hr className="border-gray-300 mt-6" />
          </div>
        </div>
      </div>

      {/* Mobile */}
      <div
        className="flex xl:hidden flex-col relative w-[90%] min-h-[min(480px,85vh)] max-h-[90%] px-4 py-8 rounded-xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src="/halloffame/scholarship-mobile.svg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />

        <div className="relative w-full flex flex-col items-center z-10 min-h-[min(420px,78vh)]">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-0 right-2 text-[#F9D16F] hover:text-gray-800 z-20"
            aria-label={t("close", "Đóng")}
          >
            <FaTimes size={16} />
          </button>

          <div className="w-full h-full px-4 pt-10 mb-4 flex justify-center shrink-0">
            <div className="relative w-full">
              {modalStudent.photo?.photoUrl ? (
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
                  <img
                    src={`${BASE_URL}/${modalStudent.photo.photoUrl}`}
                    alt={modalStudent.student?.name || ""}
                    className="w-[100px] h-[100px] rounded-full object-cover object-top shadow-lg"
                  />
                </div>
              ) : (
                <div
                  className="absolute -top-12 left-1/2 -translate-x-1/2 w-[100px] h-[100px] rounded-full bg-white/10"
                  aria-hidden
                />
              )}
              <div className="h-full border border-[#F9D16F] rounded-xl pt-16 p-4">
                <p className="text-sm font-semibold text-justify  text-white max-h-[200px] overflow-y-hidden hover:overflow-y-auto">
                  {useVi ? modalStudent.note : modalStudent.noteEng}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-auto w-full flex flex-col">
            <div className="w-full px-4 text-start mb-4">
              {apDiplomaHeader ? (
                <div className="flex w-full flex-col gap-3.5 sm:gap-4">
                  <div className="text-lg font-bold leading-tight text-[#F9D16F]">
                    {modalStudent.student?.name?.toUpperCase()}
                  </div>
                  {apDiplomaHeader.scholarshipText ? (
                    <div className="text-sm font-normal leading-snug text-[#F9D16F]">
                      {apDiplomaHeader.scholarshipText}
                    </div>
                  ) : null}
                  {apClassYearLine ? (
                    <div className="text-sm font-normal leading-snug text-white">
                      {apClassYearLine}
                    </div>
                  ) : null}
                </div>
              ) : (
                <>
                  <div className="text-lg font-bold text-[#F9D16F] mb-1">
                    {modalStudent.student?.name?.toUpperCase()}
                  </div>
                  <div className="text-sm font-semibold text-[#F9D16F] mt-1">
                    {t("classLabel", "Lớp")}{" "}
                    {modalStudent.currentClass?.name ||
                      modalStudent.currentClass?.className ||
                      t("noClass", "Chưa cập nhật lớp")}
                  </div>
                </>
              )}
            </div>

            <hr className="w-full border-gray-300 mb-4" />

            <div className="w-full px-4 max-h-[220px] overflow-hidden">
              <ActivitiesSlider
                items={activities}
                emptyLabel={emptyActivities}
                resetKey={activityResetKey}
              />
            </div>
            <hr className="w-full border-gray-300 my-4" />
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default ScholarshipStudentModal;
