import type { Language } from "../ui/translations";

const LANGUAGE_KEY = "chess_language";

export function loadLanguage(): Language {
  try {
    const raw = localStorage.getItem(LANGUAGE_KEY);
    if (raw === "fi" || raw === "en") return raw;
  } catch {
    // ignore
  }
  return "en";
}

export function saveLanguage(lang: Language): void {
  try {
    localStorage.setItem(LANGUAGE_KEY, lang);
  } catch {
    // ignore
  }
}
