import { useTranslation } from 'react-i18next';

export type LocalizedField =
  | string
  | { vi?: string; en?: string }
  | Record<string, any>
  | null
  | undefined;

/**
 * Extracts the appropriate string from a potentially localized field.
 * Handles:
 * 1. null / undefined -> returns empty string
 * 2. string -> returns directly (or parsed if it's serialized JSON)
 * 3. object -> returns value[lang], fallback value[fallbackLang], or first non-empty string value
 */
export function getLocalizedValue(
  field: LocalizedField,
  lang: string = 'vi',
  fallbackLang: string = 'vi'
): string {
  if (field === null || field === undefined) {
    return '';
  }

  // If already a plain string
  if (typeof field === 'string') {
    const trimmed = field.trim();
    // Check if it was serialized as JSON object like '{"vi":"...","en":"..."}'
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (typeof parsed === 'object' && parsed !== null) {
          return getLocalizedValue(parsed, lang, fallbackLang);
        }
      } catch {
        // Not valid JSON, return as normal string
      }
    }
    return field;
  }

  // If it's a localized object { vi: '...', en: '...' }
  if (typeof field === 'object') {
    const currentVal = (field as any)[lang];
    if (typeof currentVal === 'string' && currentVal.trim() !== '') {
      return currentVal;
    }

    const fallbackVal = (field as any)[fallbackLang];
    if (typeof fallbackVal === 'string' && fallbackVal.trim() !== '') {
      return fallbackVal;
    }

    // Pick first non-empty string entry
    for (const key of Object.keys(field)) {
      const val = (field as any)[key];
      if (typeof val === 'string' && val.trim() !== '') {
        return val;
      }
    }
  }

  return String(field || '');
}

/**
 * React hook to easily localize dynamic fields using the active i18next language.
 * Usage:
 *   const lv = useLocalizedValue();
 *   <h1>{lv(course.title)}</h1>
 */
export function useLocalizedValue() {
  const { i18n } = useTranslation();
  return (field: LocalizedField, fallbackLang: string = 'vi') =>
    getLocalizedValue(field, i18n.language, fallbackLang);
}
