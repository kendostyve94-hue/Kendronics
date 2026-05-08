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

const siteTranslations: Record<string, string> = {
  Accueil: 'Home',
  Produit: 'Product',
  Support: 'Support',
  'A propos': 'About',
  Suivi: 'Tracking',
  Commande: 'Order',
  Connexion: 'Login',
  Connecte: 'Signed in',
  Panier: 'Cart',
  Devis: 'Quote',
  Rechercher: 'Search',
  'Rechercher une page, un service...': 'Search a page or service...',
  'Aucun resultat trouve.': 'No result found.',
  'Ouvrir le menu': 'Open menu',
  'Fermer le menu': 'Close menu',
  'Ouvrir la page compte': 'Open account page',
  'Creer mon compte': 'Create my account',
  'Nouveau client ?': 'New customer?',
  Langue: 'Language',
  'Passer en anglais': 'Switch to English',
  'Passer en francais': 'Switch to French',
  'PCB prototype': 'PCB prototype',
  'Petites series': 'Small batches',
  'PCB avance': 'Advanced PCB',
  'Assistance Gerber': 'Gerber assistance',
  'Comment ca marche': 'How it works',
  'Centre aide': 'Help center',
  FAQ: 'FAQ',
  'Guide technique': 'Technical guide',
  Contact: 'Contact',
  'Qui sommes-nous': 'About us',
  Remboursement: 'Refunds',
  'Termes et conditions': 'Terms and conditions',
  Cookies: 'Cookies',
  Services: 'Services',
  Compte: 'Account',
  'Demander un devis': 'Get quote',
  'Voir les services': 'View services',
  'Commencer': 'Start',
  'Lire': 'Read',
  'Lire le cadre': 'Read the policy',
  'Voir le detail': 'View details',
  'Devis PCB en ligne': 'Online PCB quote',
  'Instructions de commande >': 'Ordering instructions >',
  'Livraison vers :': 'Ship to:',
  'Suivi commande': 'Order tracking',
  'Centre d aide': 'Help center',
  "Centre d'aide": 'Help center',
  'Catalogue de services': 'Service catalog',
  'Services PCB pour l Afrique': 'PCB services for Africa',
  'Explorer les services': 'Explore services',
  'Commencer le devis': 'Start quote',
  'Suivre une commande': 'Track an order',
  'Configurer une commande': 'Configure an order',
  'Mon profil': 'My profile',
  'Repertoire utilisateur': 'User directory',
  Enregistrer: 'Save',
  'Suivez votre commande Kendronics.': 'Track your Kendronics order.',
  'ID commande': 'Order ID',
  'UUID de commande': 'Order UUID',
  'Verification du suivi...': 'Checking tracking...',
  'Suivre la commande': 'Track order',
  'Commande introuvable': 'Order not found',
  'Suivi indisponible': 'Tracking unavailable',
  'Numero de commande': 'Order number',
  'Numero de suivi': 'Tracking number',
  'Pas encore disponible': 'Not available yet',
  'Details de commande': 'Order details',
  'Timeline de suivi': 'Tracking timeline',
  Progression: 'Progress',
  Paiement: 'Payment',
  'Prix total': 'Total price',
  'Livraison estimee': 'Estimated delivery',
  'Confirmation en attente': 'Pending confirmation',
  'Specifications PCB': 'PCB specifications',
  'Resume de fabrication': 'Manufacturing snapshot',
  'Type de produit': 'Product type',
  Couches: 'Layers',
  Quantite: 'Quantity',
  'Materiau de base': 'Base material',
  Epaisseur: 'Thickness',
  'Masque de soudure': 'Solder mask',
  'Finition de surface': 'Surface finish',
  Assemblage: 'Assembly',
  Requis: 'Required',
  'Non requis': 'Not required',
  'Gerber televerse': 'Uploaded Gerber',
  'Fichier :': 'File:',
  'Taille :': 'Size:',
  'Televerse :': 'Uploaded:',
  'Detail du prix': 'Pricing breakdown',
  'Resume des couts': 'Cost summary',
  'Total paye': 'Total paid',
  Actuel: 'Current',
  Termine: 'Completed',
  'En attente': 'Pending',
  'Contacter le support': 'Contact support',
  'Ouvrir un ticket support': 'Open support ticket',
  'Le paiement est confirme pour cette commande.': 'Payment is confirmed for this order.',
  'Payez en securite via Stripe Checkout. Kendronics ne manipule jamais directement les donnees de carte.':
    'Pay securely through Stripe Checkout. Kendronics never handles card details directly.',
  'Ouverture de Stripe...': 'Opening Stripe...',
  Paye: 'Paid',
  'Payer avec Stripe': 'Pay with Stripe',
  'Creez votre compte Kendronics': 'Create your Kendronics account',
  'Creer un compte': 'Create account',
  'Creation du compte...': 'Creating account...',
  'Connectez-vous pour gerer vos devis, commandes et livraisons.': 'Sign in to manage quotes, orders, and deliveries.',
  'Devis Express PCB': 'PCB Express Quote',
  'Une seule zone prend en charge Gerber, BOM et CPL.': 'One area handles Gerber, BOM and CPL.',
  'Ajouter Gerber': 'Add Gerber',
  'Ajouter BOM': 'Add BOM',
  'Ajouter CPL': 'Add CPL',
  'Upload en cours...': 'Uploading...',
  'Gerber ZIP max 50 Mo. BOM et CPL optionnels.': 'Gerber ZIP max 50 MB. BOM and CPL optional.',
  'Parametres de base': 'Basic settings',
  'Materiau, couches, dimensions, quantite et type de produit.': 'Material, layers, dimensions, quantity and product type.',
  Dimensions: 'Dimensions',
  Longueur: 'Length',
  Largeur: 'Width',
  Destination: 'Destination',
  Assurance: 'Insurance',
  'Options avancees': 'Advanced options',
  'Total estime': 'Estimated total',
  Fermer: 'Close',
  'Sauvegarde du devis...': 'Saving quote...',
  'Devis sauvegarde cote serveur. Validation fournisseur requise avant paiement final.':
    'Quote saved on the server. Supplier validation is required before final payment.',
  'Voir la commande': 'View order',
  'Gestion des cookies Kendronics': 'Kendronics cookie management',
  'Politique de cookies': 'Cookie policy',
  Accepter: 'Accept',
  Refuser: 'Reject',
  Personnaliser: 'Customize',
  Necessaires: 'Necessary',
  Preferences: 'Preferences',
  'Mesure d audience': 'Audience measurement',
  'Enregistrer mes choix': 'Save my choices',
};

const reverseSiteTranslations = Object.fromEntries(Object.entries(siteTranslations).map(([fr, en]) => [en, fr]));

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
    applySiteTranslations(language);
    window.dispatchEvent(new CustomEvent('kendronics:language-changed', { detail: { language } }));
  }, [language]);

  useEffect(() => {
    let isApplying = false;
    const observer = new MutationObserver(() => {
      if (isApplying) return;
      isApplying = true;
      window.requestAnimationFrame(() => {
        applySiteTranslations(readStoredLanguage());
        isApplying = false;
      });
    });

    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, []);

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

function readStoredLanguage(): Language {
  return window.localStorage.getItem(languageStorageKey) === 'en' ? 'en' : 'fr';
}

function applySiteTranslations(language: Language) {
  if (typeof document === 'undefined') return;
  translateTextNodes(document.body, language);
  translateAttributes(language);
}

function translateTextNodes(root: HTMLElement, language: Language) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA'].includes(parent.tagName)) return NodeFilter.FILTER_REJECT;
      if (parent.closest('[data-i18n-skip="true"]')) return NodeFilter.FILTER_REJECT;
      if (!node.nodeValue?.trim()) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);

  nodes.forEach((node) => {
    const current = node.nodeValue ?? '';
    const translated = translateValue(current, language);
    if (translated !== current) node.nodeValue = translated;
  });
}

function translateAttributes(language: Language) {
  document.querySelectorAll<HTMLElement>('[placeholder],[title],[aria-label]').forEach((element) => {
    ['placeholder', 'title', 'aria-label'].forEach((attribute) => {
      const value = element.getAttribute(attribute);
      if (!value) return;
      const translated = translateValue(value, language);
      if (translated !== value) element.setAttribute(attribute, translated);
    });
  });
}

function translateValue(value: string, language: Language): string {
  const start = value.match(/^\s*/)?.[0] ?? '';
  const end = value.match(/\s*$/)?.[0] ?? '';
  const key = value.trim();
  const dictionary = language === 'en' ? siteTranslations : reverseSiteTranslations;
  const exact = dictionary[key];
  if (exact) return `${start}${exact}${end}`;

  const translated = Object.entries(dictionary)
    .sort(([left], [right]) => right.length - left.length)
    .reduce((current, [source, target]) => current.replaceAll(source, target), key);

  return translated === key ? value : `${start}${translated}${end}`;
}

export function useI18n() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useI18n must be used inside LanguageRuntime.');
  }
  return context;
}
