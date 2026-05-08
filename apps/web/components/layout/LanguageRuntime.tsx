'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type Language = 'fr' | 'en';

export type TranslationKey =
  | 'nav.home'
  | 'nav.product'
  | 'nav.support'
  | 'nav.about'
  | 'nav.tracking'
  | 'nav.order'
  | 'nav.login'
  | 'nav.connected'
  | 'nav.account'
  | 'nav.cart'
  | 'nav.quote'
  | 'nav.search'
  | 'nav.searchPlaceholder'
  | 'nav.noSearchResults'
  | 'nav.openMenu'
  | 'nav.closeMenu'
  | 'nav.openAccount'
  | 'nav.createAccount'
  | 'nav.newCustomer'
  | 'nav.language'
  | 'nav.switchToEnglish'
  | 'nav.switchToFrench'
  | 'nav.item.prototype'
  | 'nav.item.smallSeries'
  | 'nav.item.advanced'
  | 'nav.item.gerberHelp'
  | 'nav.item.howItWorks'
  | 'nav.item.helpCenter'
  | 'nav.item.faq'
  | 'nav.item.technicalGuide'
  | 'nav.item.contact'
  | 'nav.item.aboutUs'
  | 'nav.item.refund'
  | 'nav.item.terms'
  | 'nav.item.cookies'
  | 'nav.item.services'
  | 'nav.item.profile';

const messages: Record<Language, Record<TranslationKey, string>> = {
  fr: {
    'nav.home': 'Accueil',
    'nav.product': 'Produit',
    'nav.support': 'Support',
    'nav.about': 'A propos',
    'nav.tracking': 'Suivi',
    'nav.order': 'Commande',
    'nav.login': 'Connexion',
    'nav.connected': 'Connecte',
    'nav.account': 'Compte',
    'nav.cart': 'Panier',
    'nav.quote': 'Devis',
    'nav.search': 'Rechercher',
    'nav.searchPlaceholder': 'Rechercher une page, un service...',
    'nav.noSearchResults': 'Aucun resultat trouve.',
    'nav.openMenu': 'Ouvrir le menu',
    'nav.closeMenu': 'Fermer le menu',
    'nav.openAccount': 'Ouvrir la page compte',
    'nav.createAccount': 'Creer mon compte',
    'nav.newCustomer': 'Nouveau client ?',
    'nav.language': 'Langue',
    'nav.switchToEnglish': 'Passer en anglais',
    'nav.switchToFrench': 'Passer en francais',
    'nav.item.prototype': 'PCB prototype',
    'nav.item.smallSeries': 'Petites series',
    'nav.item.advanced': 'PCB avance',
    'nav.item.gerberHelp': 'Assistance Gerber',
    'nav.item.howItWorks': 'Comment ca marche',
    'nav.item.helpCenter': 'Centre aide',
    'nav.item.faq': 'FAQ',
    'nav.item.technicalGuide': 'Guide technique',
    'nav.item.contact': 'Contact',
    'nav.item.aboutUs': 'Qui sommes-nous',
    'nav.item.refund': 'Remboursement',
    'nav.item.terms': 'Termes et conditions',
    'nav.item.cookies': 'Cookies',
    'nav.item.services': 'Services',
    'nav.item.profile': 'Compte',
  },
  en: {
    'nav.home': 'Home',
    'nav.product': 'Product',
    'nav.support': 'Support',
    'nav.about': 'About',
    'nav.tracking': 'Tracking',
    'nav.order': 'Order',
    'nav.login': 'Login',
    'nav.connected': 'Signed in',
    'nav.account': 'Account',
    'nav.cart': 'Cart',
    'nav.quote': 'Quote',
    'nav.search': 'Search',
    'nav.searchPlaceholder': 'Search a page or service...',
    'nav.noSearchResults': 'No result found.',
    'nav.openMenu': 'Open menu',
    'nav.closeMenu': 'Close menu',
    'nav.openAccount': 'Open account page',
    'nav.createAccount': 'Create my account',
    'nav.newCustomer': 'New customer?',
    'nav.language': 'Language',
    'nav.switchToEnglish': 'Switch to English',
    'nav.switchToFrench': 'Switch to French',
    'nav.item.prototype': 'PCB prototype',
    'nav.item.smallSeries': 'Small batches',
    'nav.item.advanced': 'Advanced PCB',
    'nav.item.gerberHelp': 'Gerber assistance',
    'nav.item.howItWorks': 'How it works',
    'nav.item.helpCenter': 'Help center',
    'nav.item.faq': 'FAQ',
    'nav.item.technicalGuide': 'Technical guide',
    'nav.item.contact': 'Contact',
    'nav.item.aboutUs': 'About us',
    'nav.item.refund': 'Refunds',
    'nav.item.terms': 'Terms and conditions',
    'nav.item.cookies': 'Cookies',
    'nav.item.services': 'Services',
    'nav.item.profile': 'Account',
  },
};

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  t: (key: TranslationKey) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);
const languageStorageKey = 'kendronics.language';

export function LanguageRuntime({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('fr');

  useEffect(() => {
    const storedLanguage = window.localStorage.getItem(languageStorageKey);
    setLanguageState(storedLanguage === 'en' ? 'en' : 'fr');
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    window.localStorage.setItem(languageStorageKey, language);
    window.dispatchEvent(new CustomEvent('kendronics:language-changed', { detail: { language } }));
  }, [language]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage: setLanguageState,
      toggleLanguage: () => setLanguageState((current) => (current === 'fr' ? 'en' : 'fr')),
      t: (key) => messages[language][key],
    }),
    [language],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useI18n() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useI18n must be used inside LanguageRuntime.');
  }
  return context;
}
