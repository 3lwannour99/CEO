"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { defaultLanguage, languages, type LanguageCode, type LanguageMeta } from "./locales";
import { resolveTranslation } from "./translations";

interface I18nContextValue {
  language: LanguageCode;
  languageMeta: LanguageMeta;
  setLanguage: (language: LanguageCode) => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

function getStoredLanguage(): LanguageCode {
  if (typeof window === "undefined") {
    return defaultLanguage;
  }

  const storedLanguage = window.localStorage.getItem("inventory-language");
  return storedLanguage === "ar" || storedLanguage === "en" ? storedLanguage : defaultLanguage;
}

export function I18nProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [language, setLanguageState] = useState<LanguageCode>(defaultLanguage);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setLanguageState(getStoredLanguage());
      setMounted(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const languageMeta = languages[language];

    document.documentElement.lang = language;
    document.documentElement.dir = languageMeta.direction;
    document.documentElement.dataset.language = language;
    document.body.dir = languageMeta.direction;
    document.body.dataset.language = language;

    if (mounted) {
      window.localStorage.setItem("inventory-language", language);
    }
  }, [language, mounted]);

  const value = useMemo<I18nContextValue>(
    () => ({
      language,
      languageMeta: languages[language],
      setLanguage: setLanguageState,
      toggleLanguage: () => setLanguageState((current) => (current === "en" ? "ar" : "en")),
      t: (key: string) => resolveTranslation(language, key),
    }),
    [language],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18nContext() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }

  return context;
}
