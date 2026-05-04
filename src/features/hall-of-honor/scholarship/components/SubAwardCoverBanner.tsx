import { useEffect, useMemo, useState } from "react";
import {
  BASE_URL,
  SCHOLARSHIP_COVER_MAX_HEIGHT_PX,
  subAwardLabelToSlug,
} from "@/core/config";
import { FramedCategoryCover } from "../../components/category/FramedCategoryCover";

type SubAwardCoverBannerProps = {
  label: string;
  coverImage?: string | null;
};

/**
 * Banner ảnh tiểu mục học bổng — CDN → fallback /halloffame/{slug}.png|.svg + khung.
 */
export function SubAwardCoverBanner({
  label,
  coverImage,
}: SubAwardCoverBannerProps) {
  const urls = useMemo(() => {
    const slug = subAwardLabelToSlug(label);
    return [
      ...(coverImage ? [`${BASE_URL}${coverImage}`] : []),
      `/halloffame/${slug}.png`,
      `/halloffame/${slug}.svg`,
    ];
  }, [coverImage, label]);

  const [urlIndex, setUrlIndex] = useState(0);

  useEffect(() => {
    setUrlIndex(0);
  }, [label, coverImage, urls]);

  if (urlIndex >= urls.length) return null;

  const src = urls[urlIndex];
  const objectFit =
    coverImage && urlIndex === 0 ? "object-cover" : "object-contain";

  return (
    <FramedCategoryCover
      className="relative w-full mx-auto mb-8 mt-2"
      style={{ maxHeight: SCHOLARSHIP_COVER_MAX_HEIGHT_PX }}
      showDecor
      image={
        <img
          key={src}
          src={src}
          alt={label}
          className={`w-full ${objectFit} bg-[#f8f8f8]`}
          style={{ maxHeight: SCHOLARSHIP_COVER_MAX_HEIGHT_PX }}
          onError={() => setUrlIndex((i) => i + 1)}
        />
      }
    />
  );
}
