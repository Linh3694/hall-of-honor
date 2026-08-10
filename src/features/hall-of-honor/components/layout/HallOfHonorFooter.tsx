/** Footer ảnh — desktop vs mobile (Hall of Honor marketing + detail) */
export function HallOfHonorFooter() {
  return (
    <>
      <footer className="shrink-0 w-full mt-auto hidden lg:block">
        <img
          src="/halloffame/footer-desktop.png"
          alt="Footer"
          className="w-full"
        />
      </footer>
      <footer className="shrink-0 w-full mt-auto lg:hidden">
        <img
          src="/halloffame/footer-mobile.png"
          alt="Footer"
          className="w-full"
        />
      </footer>
    </>
  );
}
