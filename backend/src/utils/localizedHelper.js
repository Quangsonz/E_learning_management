/**
 * Utility to safely extract string values from potentially localized fields.
 * Handles:
 * - Plain string: "Lập trình Web"
 * - Serialized JSON string: '{"vi":"Lập trình Web","en":"Web Development"}'
 * - Object: { vi: "Lập trình Web", en: "Web Development" }
 * - Null/Undefined/Other: fallback gracefully
 */
function getLocalizedText(field, lang = 'vi', fallbackLang = 'vi') {
  if (field === null || field === undefined) {
    return '';
  }

  // 1. Plain string or serialized JSON string
  if (typeof field === 'string') {
    const trimmed = field.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (typeof parsed === 'object' && parsed !== null) {
          return getLocalizedText(parsed, lang, fallbackLang);
        }
      } catch {
        // Not JSON, return as-is
      }
    }
    return field;
  }

  // 2. Localized Object { vi: '...', en: '...' }
  if (typeof field === 'object') {
    const current = field[lang];
    if (typeof current === 'string' && current.trim() !== '') {
      return current;
    }

    const fallback = field[fallbackLang];
    if (typeof fallback === 'string' && fallback.trim() !== '') {
      return fallback;
    }

    // Try any non-empty string in the object
    for (const key of Object.keys(field)) {
      const val = field[key];
      if (typeof val === 'string' && val.trim() !== '') {
        return val;
      }
    }
  }

  return String(field || '');
}

module.exports = {
  getLocalizedText
};
