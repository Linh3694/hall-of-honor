import React, { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

const HomePage = lazy(() => import("../features/hall-of-honor/pages/HomePage"));
const DetailPage = lazy(() => import("../features/hall-of-honor/pages/DetailPage"));

/** Skeleton đơn giản khi đang tải chunk lazy */
function PageSkeleton() {
  return (
    <div className="min-h-[40vh] flex items-center justify-center text-[#002855] font-semibold">
      Đang tải…
    </div>
  );
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/detail/:category" element={<DetailPage />} />
        <Route
          path="/detail/:category/student/:recordId/:studentId"
          element={<DetailPage />}
        />
        <Route
          path="/detail/:category/class/:recordId/:classId"
          element={<DetailPage />}
        />
        <Route
          path="/detail/:category/:ten-sub-award"
          element={<DetailPage />}
        />
        <Route
          path="/detail"
          element={<Navigate to="/detail/scholarship-talent" replace />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
