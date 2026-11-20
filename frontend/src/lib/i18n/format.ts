import { en } from './en';

type Dictionary = Record<string, unknown>;

function lookup(dict: Dictionary, key: string): string | undefined {
  const parts = key.split('.');
  let current: unknown = dict;
  for (const part of parts) {
    if (current === null || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Dictionary)[part];
  }
  return typeof current === 'string' ? current : undefined;
}

/**
 * Resolve a dot-notation translation key against the given dictionary,
 * falling back to the English dictionary when the localized key is missing.
 */
export function formatTranslation(
  dict: Dictionary | undefined,
  key: string,
): string {
  const localized = dict ? lookup(dict, key) : undefined;
  if (localized !== undefined) {
    return localized;
  }

  const fallback = lookup(en as Dictionary, key);
  if (fallback !== undefined) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.warn(
        `[i18n] Missing translation for key "${key}"; falling back to English.`,
      );
    }
    return fallback;
  }

  return key;
}
