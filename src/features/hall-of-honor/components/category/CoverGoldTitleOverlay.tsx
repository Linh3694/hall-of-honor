type CoverGoldTitleOverlayProps = {
  lines: string[];
  /** true = tiếng Việt (thứ tự cỡ chữ dòng 1 / dòng 2 khác bản EN) */
  isVi: boolean;
};

/**
 * Chữ vàng trên cover — cỡ chữ xen kẽ VI/EN giống layout Detail chuẩn hoá.
 */
export function CoverGoldTitleOverlay({
  lines,
  isVi,
}: CoverGoldTitleOverlayProps) {
  return (
    <div className="text-[#f9d16f] text-right lg:mr-8 lg:mt-12 leading-tight">
      {lines.map((line, idx) => {
        const textSize = isVi
          ? idx === 0
            ? "lg:text-[52px] text-[18px]"
            : "lg:text-[70px] text-[20px] font-extrabold"
          : idx === 0
            ? "lg:text-[70px] text-[20px] font-extrabold"
            : "lg:text-[52px] text-[18px]";
        return (
          <div key={`${idx}-${line.slice(0, 12)}`} className={textSize}>
            {line}
          </div>
        );
      })}
    </div>
  );
}
