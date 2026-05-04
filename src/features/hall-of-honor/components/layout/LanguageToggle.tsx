import i18n from "@/core/i18n";
import { useTranslation } from "react-i18next";

type LanguageToggleProps = {
  className?: string;
};

/** Nút đổi vi/en — dùng chung header homepage & detail */
export function LanguageToggle({
  className = "w-10 h-10 rounded-full border-2 transition border-gray-300 hover:border-yellow-400 shadow-md",
}: LanguageToggleProps) {
  const { t } = useTranslation("common");

  const toggleLanguage = () => {
    const next = i18n.language === "vi" ? "en" : "vi";
    void i18n.changeLanguage(next);
  };

  return (
    <button type="button" onClick={toggleLanguage} className={className}>
      <img
        src={
          i18n.language === "vi"
            ? "/icons/flag-vi.png"
            : "/icons/flag-en.png"
        }
        alt={t("language")}
        className="w-full h-full rounded-full object-cover"
      />
    </button>
  );
}
