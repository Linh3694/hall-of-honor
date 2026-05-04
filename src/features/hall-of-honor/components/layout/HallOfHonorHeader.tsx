import type { ReactNode } from "react";
import { FaBars } from "react-icons/fa";
import { LanguageToggle } from "./LanguageToggle";

export type HallOfHonorHeaderVariant = "marketing" | "detail";

type HallOfHonorHeaderProps = {
  variant: HallOfHonorHeaderVariant;
  /** Click logo HoH (marketing: về / ; detail: về /hall-of-honor) */
  onLogoClick: () => void;
  /** Detail: mở sidebar mobile */
  onMenuToggle?: () => void;
  /** Marketing: nhãn nút shortcut vào Bảng vinh danh */
  hallHonorLabel?: string;
  onHallHonorClick?: () => void;
  /** Thêm nút/link bên trái (tuỳ trang) */
  leftExtra?: ReactNode;
};

/**
 * Header cố định 80px — hai biến thể: trang chủ HoH vs trang detail có menu.
 */
export function HallOfHonorHeader({
  variant,
  onLogoClick,
  onMenuToggle,
  hallHonorLabel,
  onHallHonorClick,
  leftExtra,
}: HallOfHonorHeaderProps) {
  const isDetail = variant === "detail";

  return (
    <header
      className={`fixed top-0 left-0 w-full h-[80px] bg-[#002855] text-white flex items-center lg:shadow-none justify-between shadow-md z-50 ${isDetail ? "xll:px-20 px-6" : "lg:px-20 px-6"}`}
    >
      <div
        className={`flex flex-row items-center ${isDetail ? "gap-7" : "gap-10"}`}
      >
        {isDetail && (
          <button
            type="button"
            className="xll:hidden mr-4"
            onClick={onMenuToggle}
            aria-label="Menu"
          >
            <FaBars size={24} />
          </button>
        )}
        <button type="button" onClick={onLogoClick}>
          <img
            src="/halloffame/HOH-gold.png"
            className="h-10"
            alt="Wellspring Logo"
          />
        </button>
        <a href="https://wellspring.edu.vn">
          <img
            src="/halloffame/WS-white.png"
            className="h-16"
            alt="Wellspring"
          />
        </a>
        {!isDetail &&
          hallHonorLabel &&
          onHallHonorClick && (
            <button
              type="button"
              onClick={onHallHonorClick}
              className="hidden md:block px-4 py-2 rounded-md font-semibold hover:bg-white hover:text-[#002855] transition-colors"
            >
              {hallHonorLabel}
            </button>
          )}
        {leftExtra}
      </div>

      <div className="flex flex-row gap-10 items-center">
        <img
          src="/halloffame/HJ-white.png"
          className={`h-12 ${isDetail ? "hidden xl:block" : "hidden md:block"}`}
          alt="Happy Journey"
        />
        <LanguageToggle />
      </div>
    </header>
  );
}
