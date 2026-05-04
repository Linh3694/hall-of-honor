import type { CSSProperties, ReactNode } from "react";

type FramedCategoryCoverProps = {
  /** Wrapper relative — khớp lớp khung absolute */
  className?: string;
  style?: CSSProperties;
  /** Ảnh nền (giữ onLoad/onError ở phần tử con) */
  image: ReactNode;
  /** Hiện frame-cover.png + overlay */
  showDecor: boolean;
  /** Nội dung góc phải (vd. chữ vàng tiêu đề) */
  overlay?: ReactNode;
};

/**
 * Cover có khung Hall of Honor — ảnh + frame-cover.png + overlay tuỳ chọn.
 */
export function FramedCategoryCover({
  className = "relative mb-4 mt-8 w-full max-h-[470px] mx-auto",
  style,
  image,
  showDecor,
  overlay,
}: FramedCategoryCoverProps) {
  return (
    <div className={className} style={style}>
      {image}
      {showDecor ? (
        <>
          <img
            src="/halloffame/frame-cover.png"
            alt=""
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          {overlay ? (
            <div className="absolute top-0 right-0 h-full flex items-center justify-center pr-4">
              {overlay}
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
