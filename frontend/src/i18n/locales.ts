export type LanguageCode = "en" | "ar";
export type Direction = "ltr" | "rtl";

export interface LanguageMeta {
  code: LanguageCode;
  label: string;
  nativeLabel: string;
  direction: Direction;
}

export const languages: Record<LanguageCode, LanguageMeta> = {
  en: {
    code: "en",
    label: "English",
    nativeLabel: "English",
    direction: "ltr",
  },
  ar: {
    code: "ar",
    label: "Arabic",
    nativeLabel: "العربية",
    direction: "rtl",
  },
};

export const defaultLanguage: LanguageCode = "en";
