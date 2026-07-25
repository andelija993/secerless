import { ui, defaultLang, type languages } from './ui';

export type Lang = keyof typeof languages;

/** Extracts the current language from the Astro URL (e.g. /sr/recipes -> 'sr') */
export function getLangFromUrl(url: URL): Lang {
  const [, lang] = url.pathname.split('/');
  if (lang in ui) return lang as Lang;
  return defaultLang as Lang;
}

/** Returns a `t(key)` translation function bound to the given language */
export function useTranslations(lang: Lang) {
  return function t(key: keyof (typeof ui)[typeof defaultLang]) {
    return ui[lang][key] ?? ui[defaultLang][key];
  };
}

/** Builds a path prefixed with the given language (except default 'en', which stays at root) */
export function useTranslatedPath(lang: Lang) {
  return function translatePath(path: string, targetLang: Lang = lang) {
    return targetLang === defaultLang ? path : `/${targetLang}${path}`;
  };
}

