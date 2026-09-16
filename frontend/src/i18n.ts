import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import vi from './locales/vi.json';

const resources = {
  en: { translation: en },
  vi: { translation: vi }
};

const rawLang = localStorage.getItem('language') || 'vi';
const savedLanguage = rawLang.toLowerCase().startsWith('en') ? 'en' : 'vi';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'vi',
    supportedLngs: ['vi', 'en'],
    nonExplicitSupportedLngs: true,
    load: 'languageOnly',
    interpolation: {
      escapeValue: false
    }
  });

// Cross-tab synchronization
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === 'language' && event.newValue) {
      const normalized = event.newValue.toLowerCase().startsWith('en') ? 'en' : 'vi';
      if (normalized !== i18n.language) {
        i18n.changeLanguage(normalized);
      }
    }
  });
}

export default i18n;
