import type { ImgHTMLAttributes } from "react";
import { useState } from "react";

type ImageWithFallbackProps = {
  src: string;
  alt: string;
  className?: string;
  /** Thử lần lượt khi onError */
  fallbackSrcs?: string[];
} & ImgHTMLAttributes<HTMLImageElement>;

/**
 * Ảnh có chuỗi fallback (CDN lỗi → ảnh local…).
 */
export function ImageWithFallback({
  src,
  alt,
  className,
  fallbackSrcs = [],
  ...rest
}: ImageWithFallbackProps) {
  const chain = [src, ...fallbackSrcs].filter(Boolean);
  const [index, setIndex] = useState(0);

  if (index >= chain.length) {
    return (
      <span className={className} role="img" aria-label={alt}>
        {/* không còn URL */}
      </span>
    );
  }

  return (
    <img
      {...rest}
      src={chain[index]}
      alt={alt}
      className={className}
      onError={() => setIndex((i) => i + 1)}
    />
  );
}
