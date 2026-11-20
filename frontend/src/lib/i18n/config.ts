/**
 * i18n configuration. Core market is Nigeria, so `en-NG` / NGN are the defaults
 * for every locale-aware formatter and the base message catalog.
 */
export const DEFAULT_LOCALE = "en-NG";
export const DEFAULT_CURRENCY = "NGN";

export const SUPPORTED_LOCALES = [
  "en-NG",
  "en-US",
  "ha-NG",
  "yo-NG",
  "ig-NG",
  "pseudo",
] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

/** Storage key shared by the cookie and localStorage persistence layers. */
export const LOCALE_STORAGE_KEY = "locale";

let activeLocale: Locale | undefined;

function isSupportedLocale(value: string | null | undefined): value is Locale {
  return !!value && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/** Read the persisted locale from localStorage, falling back to the cookie. */
export function readStoredLocale(): Locale | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const fromStorage = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (isSupportedLocale(fromStorage)) return fromStorage;
  } catch {
    // localStorage may be unavailable (private mode / blocked); fall through.
  }
  try {
    const match = document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${LOCALE_STORAGE_KEY}=`));
    const fromCookie = match
      ? decodeURIComponent(match.split("=").slice(1).join("="))
      : undefined;
    if (isSupportedLocale(fromCookie)) return fromCookie;
  } catch {
    // Cookies may be blocked; ignore.
  }
  return undefined;
}

/**
 * Persist the selected locale to both localStorage and a cookie so the choice
 * survives reloads even when one storage mechanism is blocked.
 */
export function persistLocale(locale: Locale): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // Ignore storage failures; the cookie below is the fallback.
  }
  try {
    document.cookie = `${LOCALE_STORAGE_KEY}=${encodeURIComponent(
      locale,
    )}; path=/; max-age=31536000; samesite=lax`;
  } catch {
    // Ignore cookie failures; localStorage above is the fallback.
  }
}

/** Set by LocaleProvider when a user selects a language. */
export function setActiveLocale(locale: Locale | undefined): void {
  activeLocale = locale;
  if (locale) persistLocale(locale);
}

/**
 * Pseudo-localization surfaces hardcoded strings (they stay ASCII while
 * catalog strings become accented + padded). Enabled at build/run time with
 * `NEXT_PUBLIC_PSEUDO_LOCALE=1` or by passing `locale: "pseudo"` explicitly.
 */
export function isPseudoLocaleEnabled(): boolean {
  return (
    process.env.NEXT_PUBLIC_PSEUDO_LOCALE === "1" ||
    process.env.NEXT_PUBLIC_PSEUDO_LOCALE === "true"
  );
}

/** Best-effort match of the browser locale against the supported set. */
function browserLocale(): Locale | undefined {
  if (typeof navigator === "undefined") return undefined;
  const candidates = navigator.languages?.length
    ? navigator.languages
    : [navigator.language];
  for (const candidate of candidates) {
    if (!candidate) continue;
    if (isSupportedLocale(candidate)) return candidate;
    const base = candidate.split("-")[0];
    const match = SUPPORTED_LOCALES.find(
      (locale) => locale.split("-")[0] === base,
    );
    if (match) return match;
  }
  return undefined;
}

export function resolveLocale(explicit?: Locale): Locale {
  if (explicit) return explicit;
  if (isPseudoLocaleEnabled()) return "pseudo";
  if (activeLocale) return activeLocale;
  const stored = readStoredLocale();
  if (stored) return stored;
  const env = process.env.NEXT_PUBLIC_LOCALE as Locale | undefined;
  if (env && SUPPORTED_LOCALES.includes(env)) return env;
  return browserLocale() ?? DEFAULT_LOCALE;
}

/** Locale actually handed to `Intl` — "pseudo" has no CLDR data, fall back to en-NG. */
export function intlLocale(locale: Locale): string {
  return locale === "pseudo" ? DEFAULT_LOCALE : locale;
}

export type LocaleDirection = "ltr" | "rtl";

/**
 * Returns text direction ('ltr' or 'rtl') for a given locale.
 * Standard Nigerian locales (en-NG, ha-NG, yo-NG, ig-NG) use Latin script (ltr).
 * Right-to-left scripts (e.g. Arabic, Hebrew, or Ajami variants) return rtl.
 */
export function localeDirection(locale: Locale | string): LocaleDirection {
  if (
    locale.startsWith("ar") ||
    locale.startsWith("he") ||
    locale.startsWith("fa") ||
    locale.startsWith("ur") ||
    locale.includes("-Arab") ||
    locale.includes("-Hebr")
  ) {
    return "rtl";
  }
  return "ltr";
}
