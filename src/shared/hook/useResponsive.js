import { useState, useEffect } from "react";

function useResponsive() {
  const [windowSize, setWindowSize] = useState(() => ({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  }));

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
    window.addEventListener("resize", handleResize);
    // Gọi ngay để cập nhật giá trị ban đầu
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Định nghĩa breakpoint nhất quán: ví dụ mobile là < 1024px
  const isMobile = windowSize.width < 1024;
  const isTablet = windowSize.width >= 1024 && windowSize.width < 1280;
  const isDesktop = windowSize.width >= 1280;

  // Hỗ trợ kiểm tra query nếu cần
  const matchesQuery = (query) => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  };

  return { ...windowSize, isMobile, isTablet, isDesktop, matchesQuery };
}

export default useResponsive;