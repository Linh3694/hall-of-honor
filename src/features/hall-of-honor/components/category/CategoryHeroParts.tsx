import type { ReactNode } from "react";

type CategoryHeroDividerVectorProps = {
  className?: string;
};

/** Đường vector dưới block tiêu đề shimmer */
export function CategoryHeroDividerVector({
  className = "",
}: CategoryHeroDividerVectorProps) {
  return (
    <img
      src="/halloffame/vector.png"
      alt=""
      className={`w-full max-w-md object-contain pointer-events-none select-none ${className}`}
    />
  );
}

type CategoryCmsDescriptionProps = {
  children: ReactNode;
};

/** Khối mô tả CMS canh trái (dưới hero) */
export function CategoryCmsDescription({
  children,
}: CategoryCmsDescriptionProps) {
  return (
    <div className="lg:w-[900px] w-full mx-auto text-left mt-4 mb-4">
      <div className="mb-4 text-[#002855] text-justify font-semibold lg:text-[18px] text-[15px]">
        {children}
      </div>
    </div>
  );
}
