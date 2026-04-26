import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { translations, type Locale, type TranslationKey } from "@/i18n/translations";

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function detectLocale(): Locale {
  const stored = localStorage.getItem("versea-locale");
  if (stored && (stored === "en" || stored === "es" || stored === "fr" || stored === "ca")) return stored;
  const browserLang = navigator.language.slice(0, 2).toLowerCase();
  if (browserLang === "es") return "es";
  if (browserLang === "fr") return "fr";
  if (browserLang === "ca") return "ca";
  return "en";
}

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocaleState] = useState<Locale>(detectLocale);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("versea-locale", l);
    document.documentElement.lang = l;
  };

  useEffect(() => {
    document.documentElement.lang = locale;
  }, []);

  const t = (key: TranslationKey) => {
    const val = translations[locale][key];
    if (val !== undefined && val !== null) return val;
    return translations.en[key] ?? key;
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
};
