import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

// Get saved language from localStorage
const savedLanguage = localStorage.getItem('gkp_language');

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'hi', 'mr', 'te', 'kn', 'ta', 'bn', 'gu', 'or'],
    interpolation: { escapeValue: false },
    backend: { loadPath: '/locales/{{lng}}/translation.json' },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'gkp_language',
    },
    // Use saved language if available
    lng: savedLanguage || undefined,
  });

// Save language preference when it changes
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('gkp_language', lng);
});

export default i18n;
