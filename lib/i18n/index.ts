import { en } from "./en";
import { fr } from "./fr";

export type Lang = "en" | "fr";

const dicts: Record<Lang, Record<string, string>> = { en, fr };

export function t(key: string, lang: Lang, vars?: Record<string, string>): string {
  let str = dicts[lang][key] ?? dicts.en[key] ?? key;
  if (vars) {
    Object.entries(vars).forEach(([k, v]) => {
      str = str.replace(`{{${k}}}`, v);
    });
  }
  return str;
}
