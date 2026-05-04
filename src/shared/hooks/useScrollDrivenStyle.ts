import { useEffect, useState } from "react";
import { SCROLL_REVEAL_THRESHOLD_PX } from "@/core/config";

/**
 * Theo dõi scrollY và tính opacity / translate cho hero text (homepage).
 */
export function useScrollDrivenStyle() {
  const [scrollPosition, setScrollPosition] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const textOpacity = Math.min(
    1,
    (scrollPosition - SCROLL_REVEAL_THRESHOLD_PX) / 100,
  );
  const textTransform = `translateY(${Math.max(0, 50 - scrollPosition / 15)}px)`;

  return { scrollPosition, textOpacity, textTransform };
}
