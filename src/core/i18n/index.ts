import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import enClass from "./locales/en/class.json";
import enCommon from "./locales/en/common.json";
import enHomepage from "./locales/en/homepage.json";
import enScholarship from "./locales/en/scholarship.json";
import enSidebar from "./locales/en/sidebar.json";
import enStandardized from "./locales/en/standardized.json";
import enStudent from "./locales/en/student.json";
import viClass from "./locales/vi/class.json";
import viCommon from "./locales/vi/common.json";
import viHomepage from "./locales/vi/homepage.json";
import viScholarship from "./locales/vi/scholarship.json";
import viSidebar from "./locales/vi/sidebar.json";
import viStandardized from "./locales/vi/standardized.json";
import viStudent from "./locales/vi/student.json";

/** Namespace mặc định: copy chung UI + nhãn danh mục */
export const I18N_NAMESPACES = [
  "common",
  "homepage",
  "sidebar",
  "scholarship",
  "student",
  "class",
  "standardized",
] as const;

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        common: enCommon,
        homepage: enHomepage,
        sidebar: enSidebar,
        scholarship: enScholarship,
        student: enStudent,
        class: enClass,
        standardized: enStandardized,
      },
      vi: {
        common: viCommon,
        homepage: viHomepage,
        sidebar: viSidebar,
        scholarship: viScholarship,
        student: viStudent,
        class: viClass,
        standardized: viStandardized,
      },
    },
    fallbackLng: ["vi", "en"],
    supportedLngs: ["vi", "en"],
    defaultNS: "common",
    ns: [...I18N_NAMESPACES],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      // Ưu tiên ngôn ngữ đã lưu, sau đó trình duyệt
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "hall-of-honor-lang",
    },
  });

export default i18n;
