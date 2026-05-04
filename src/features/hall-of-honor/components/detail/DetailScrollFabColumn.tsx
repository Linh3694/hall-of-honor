import { FaArrowDown, FaArrowUp } from "react-icons/fa";

/** Hai nút cuộn nhanh — chỉ detail desktop */
export function DetailScrollFabColumn() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const scrollToBottom = () => {
    const height = document.documentElement.scrollHeight;
    window.scrollTo({ top: height, behavior: "smooth" });
  };

  return (
    <div className="hidden md:flex fixed bottom-10 right-3 flex-col space-y-5 z-50 pointer-events-none">
      <button
        type="button"
        onClick={scrollToTop}
        className="pointer-events-auto w-10 h-10 rounded-full bg-[#F6967B] text-white shadow-lg flex items-center justify-center hover:bg-[#f05023]"
        aria-label="Lên đầu trang"
      >
        <FaArrowUp />
      </button>
      <button
        type="button"
        onClick={scrollToBottom}
        className="pointer-events-auto w-10 h-10 rounded-full bg-[#F6967B] text-white shadow-lg flex items-center justify-center hover:bg-[#f05023]"
        aria-label="Xuống cuối trang"
      >
        <FaArrowDown />
      </button>
    </div>
  );
}
