"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import {
  SupportedLang,
  getLanguage,
  setLanguage as setLangHelper,
  t as translateHelper,
} from "@/lib/i18n";

interface LanguageContextType {
  lang: SupportedLang;
  setLanguage: (lang: SupportedLang) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "id",
  setLanguage: () => {},
  t: (key: string) => key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<SupportedLang>("id");

  useEffect(() => {
    const current = getLanguage();
    setLangState(current);
    setLangHelper(current);

    const handleLangChange = (e: Event) => {
      const detail = (e as CustomEvent<{ lang: SupportedLang }>).detail;
      if (detail && detail.lang) {
        setLangState(detail.lang);
      }
    };

    window.addEventListener("language-changed", handleLangChange);
    return () => {
      window.removeEventListener("language-changed", handleLangChange);
    };
  }, []);

  const changeLanguage = useCallback((newLang: SupportedLang) => {
    setLangState(newLang);
    setLangHelper(newLang);
  }, []);

  const t = useCallback(
    (key: string) => {
      return translateHelper(key, lang);
    },
    [lang]
  );

  return (
    <LanguageContext.Provider
      value={{
        lang,
        setLanguage: changeLanguage,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
