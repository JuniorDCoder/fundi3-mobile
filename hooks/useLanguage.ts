import { useCallback, useEffect, useState } from "react";
import * as Localization from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { type Lang, t as translate } from "../lib/i18n";

const STORAGE_KEY = "fundi3.lang";

function detectDefaultLang(): Lang {
  const tag = Localization.getLocales()[0]?.languageCode ?? "en";
  return tag.startsWith("fr") ? "fr" : "en";
}

let memoryLang: Lang | null = null;
const listeners = new Set<(lang: Lang) => void>();

function setGlobalLang(lang: Lang) {
  memoryLang = lang;
  listeners.forEach((listener) => listener(lang));
  AsyncStorage.setItem(STORAGE_KEY, lang).catch(() => {});
}

export function useLanguage() {
  const [lang, setLang] = useState<Lang>(memoryLang ?? detectDefaultLang());

  useEffect(() => {
    if (memoryLang === null) {
      AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
        const initial: Lang = stored === "fr" || stored === "en" ? stored : detectDefaultLang();
        memoryLang = initial;
        setLang(initial);
      });
    }
    listeners.add(setLang);
    return () => {
      listeners.delete(setLang);
    };
  }, []);

  const toggleLanguage = useCallback(() => {
    setGlobalLang(lang === "fr" ? "en" : "fr");
  }, [lang]);

  const t = useCallback(
    (key: string, vars?: Record<string, string>) => translate(key, lang, vars),
    [lang],
  );

  return { lang, setLang: setGlobalLang, toggleLanguage, t };
}
