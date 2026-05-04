// @ts-nocheck
import React, { useState, useEffect } from "react";
import { BASE_URL, subAwardLabelToSlug } from "@/core/config";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import hallOfHonorService from "../api/hallOfHonorService";

/**
 * Hub "Thành tích chuẩn hóa": hiển thị tiêu đề + lưới nút điều hướng tới chi tiết theo slug tiểu mục.
 */
const StandardizedTestAchievements = ({ categoryId, categoryName }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const categoriesData = await hallOfHonorService.getAwardCategories();
        setCategories(categoriesData);
      } catch (err) {
        console.error("❌ Error fetching categories:", err);
        setCategories([]);
      }
    })();
  }, []);

  const currentCategory =
    categories.find((cat) => cat._id === categoryId) || {};
  const subAwards = (currentCategory.subAwards || []).slice(0, 7);

  const rawText =
    i18n.language === "vi"
      ? currentCategory.name || t("award", "Danh hiệu")
      : currentCategory.nameEng || t("award", "Award");
  const normalizedText = rawText.replace(/\\n/g, "\n");
  const lines = normalizedText.split("\n");

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
            <img
              src={`${BASE_URL}${currentCategory.coverImage}`}
              alt="Cover"
              className="w-full max-h-[470px] object-cover"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
            <img
              src={`/halloffame/frame-cover-2.png`}
              alt="Frame Cover"
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
            <div className="absolute top-0 left-0 h-full flex items-center justify-center pl-4">
              <div className="text-[#f9d16f] text-left lg:ml-8 lg:mt-12 leading-tight ">
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

      <div className="flex flex-col items-center justify-center mb-10 mt-10 w-full">
        <div className="grid grid-cols-3 gap-[24px] w-full px-4 py-8 justify-center items-center">
          {subAwards.map((sub) => (
            <button
              key={sub.label}
              type="button"
              className={`flex flex-col items-center justify-center border border-gray-300 rounded-2xl bg-white shadow-sm transition-all duration-200 h-[443px] w-[443px] hover:shadow-lg focus:outline-none`}
              onClick={() =>
                navigate(
                  `/detail/${categoryName}/${encodeURIComponent(subAwardLabelToSlug(sub.label))}`
                )
              }
            >
              <img
                src={`/halloffame/${subAwardLabelToSlug(sub.label)}.svg`}
                alt={sub.label}
                className="w-auto h-[auto] object-contain mb-3 transition-transform duration-200 group-hover:scale-110 hover:scale-110"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StandardizedTestAchievements;
