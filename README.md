# Hall of Honor (Wellspring)

Ứng dụng React + Vite hiển thị **Bảng vinh danh** (Hall of Honor), lấy dữ liệu từ API Frappe / SIS.

## Cấu trúc `src/`

- `app/` — `main.tsx`, `App.tsx`, `routes.tsx` (lazy route)
- `core/config/` — biến môi trường, ID hạng mục, map slug ↔ category, hằng số UI
- `core/i18n/` — khởi tạo `i18next` + `i18next-browser-languagedetector`, file `locales/{vi,en}/*.json` theo namespace
- `features/hall-of-honor/` — toàn bộ UI feature (`api/`, `data/`, `hooks/`, `pages/`, components lớn)
- `shared/` — component/hook/lib dùng chung
- `types/` — kiểu domain

## Scripts

| Lệnh | Mô tả |
|------|--------|
| `npm run dev` | Dev server (Vite, cổng 3000) |
| `npm run build` | Build production → thư mục `build/` |
| `npm run preview` | Xem bản build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Vitest (unit test hooks/lib) |

## Biến môi trường

Khai báo trong `.env` (tiền tố `VITE_` cho client): `VITE_API_URL`, `VITE_UPLOAD_URL`, `VITE_URL`, `VITE_CDN`. Các ID danh mục (tuỳ chọn, mặc định trong `core/config/categories.ts`): `VITE_SCHOLARSHIP_TALENT_CATEGORY_ID`, `VITE_HONOR_STUDENT_CATEGORY_ID`, `VITE_HONOR_CLASS_CATEGORY_ID`, `VITE_WISER_EFFORT_CATEGORY_ID`, `VITE_STANDARDIZED_TEST_CATEGORY_ID`, và các `VITE_*_CATEGORY_ID` khác nếu môi trường khác Frappe prod.

## Ghi chú

- Plugin `vite-plugin-obfuscator` dùng API cũ (`transformIndexHtml`); Vite có thể cảnh báo `enforce`/`transform` deprecated — chờ bản plugin cập nhật hoặc thay thế.
- Obfuscator bật khi `vite build` (production), xem `vite.config.ts`.
- Chunk vendor: GSAP, Splide, Swiper, i18n được tách qua `manualChunks`.
