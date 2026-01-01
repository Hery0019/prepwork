// INTL-002 : les clés sont écrites en entier, préfixées par leur feature. Ce fichier est le
// seul endroit qui charge les traductions.
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import fr from './locales/fr.json';

export const i18n = i18next.createInstance();

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, fr: { translation: fr } },
  lng: 'fr',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});
