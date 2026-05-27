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
    'nav.switchToEnglish': 'Francais',
    'nav.switchToFrench': 'Francais',
    'nav.item.prototype': 'PCB prototype',
    'nav.item.smallSeries': 'Petites series',
    'nav.item.advanced': 'PCB avance',
    'nav.item.gerberHelp': 'Gerber assistance',
    'nav.item.howItWorks': 'Comment ca marche',
    'nav.item.helpCenter': 'Centre aide',
    'nav.item.faq': 'FAQ',
    'nav.item.technicalGuide': 'Guide technique',
    'nav.item.contact': 'Contact',
    'nav.item.aboutUs': 'A propos us',
    'nav.item.refund': 'Remboursement',
    'nav.item.terms': 'Termes et conditions',
    'nav.item.cookies': 'Cookies',
    'nav.item.services': 'Services',
    'nav.item.profile': 'Compte',
  },
};

const siteTranslations: Record<string, string> = {
  Accueil: 'Accueil',
  Produit: 'Produit',
  Support: 'Support',
  'A propos': 'A propos',
  Suivi: 'Suivi',
  Commande: 'Commande',
  Connexion: 'Connexion',
  Connecte: 'Connecte',
  Panier: 'Panier',
  Devis: 'Devis',
  Rechercher: 'Rechercher',
  'Rechercher une page, un service...': 'Rechercher une page, un service...',
  'Aucun resultat trouve.': 'Aucun resultat trouve.',
  'Ouvrir le menu': 'Ouvrir le menu',
  'Fermer le menu': 'Fermer le menu',
  'Ouvrir la page compte': 'Ouvrir la page compte',
  'Creer mon compte': 'Creer mon compte',
  'Nouveau client ?': 'Nouveau client ?',
  Langue: 'Langue',
  'Passer en anglais': 'Francais',
  'Passer en francais': 'Francais',
  'PCB prototype': 'PCB prototype',
  'Petites series': 'Petites series',
  'PCB avance': 'PCB avance',
  'Assistance Gerber': 'Gerber assistance',
  'Comment ca marche': 'Comment ca marche',
  'Centre aide': 'Centre aide',
  FAQ: 'FAQ',
  'Guide technique': 'Guide technique',
  Contact: 'Contact',
  'Qui sommes-nous': 'A propos us',
  Remboursement: 'Remboursement',
  'Termes et conditions': 'Termes et conditions',
  Cookies: 'Cookies',
  Services: 'Services',
  Compte: 'Compte',
  'Demander un devis': 'Demander un devis',
  'Voir les services': 'Voir les services',
  'Commencer': 'Commencer',
  'Lire': 'Read',
  'Lire le cadre': 'Lire le cadre',
  'Voir le detail': 'View details',
  'Devis PCB en ligne': 'Devis PCB en ligne',
  'Instructions de commande >': 'Commandeing instructions >',
  'Livraison vers :': 'Livraison vers :',
  'Suivi commande': 'Commande tracking',
  'Centre d aide': 'Centre aide',
  "Centre d'aide": 'Centre aide',
  'Catalogue de services': 'Catalogue de services',
  'Services PCB pour l Afrique': 'PCB services for Africa',
  'Explorer les services': 'Explorer les services',
  'Commencer le devis': 'Commencer quote',
  'Suivre une commande': 'Suivre une commande',
  'Configurer une commande': 'Configurer une commande',
  'Mon profil': 'Mon profil',
  'Repertoire utilisateur': 'Repertoire utilisateur',
  Enregistrer: 'Enregistrer',
  'Suivez votre commande Kendronics.': 'Track your Kendronics order.',
  'ID commande': 'Commande ID',
  'UUID de commande': 'Commande UUID',
  'Verification du suivi...': 'Checking tracking...',
  'Suivre la commande': 'Track order',
  'Commande introuvable': 'Commande not found',
  'Suivi indisponible': 'Suivi unavailable',
  'Numero de commande': 'Commande number',
  'Numero de suivi': 'Suivi number',
  'Pas encore disponible': 'Pas encore disponible',
  'Details de commande': 'Commande details',
  'Timeline de suivi': 'Suivi timeline',
  Progressionion: 'Progression',
  Paiement: 'Paiement',
  'Prix total': 'Prix total',
  'Livraison estimee': 'Livraison estimee',
  'Confirmation en attente': 'Confirmation en attente',
  'Specifications PCB': 'Specifications PCB',
  'Resume de fabrication': 'Resume de fabrication',
  'Type de produit': 'Produit type',
  Couches: 'Couches',
  Quantite: 'Quantite',
  'Materiau de base': 'Materiau de base',
  Epaisseur: 'Epaisseur',
  'Masque de soudure': 'Masque de soudure',
  'Finition de surface': 'Finition de surface',
  Assemblage: 'Assemblage',
  Requis: 'Requis',
  'Non requis': 'Non requis',
  'Gerber televerse': 'Gerber televerse',
  'Fichier :': 'File:',
  'Taille :': 'Size:',
  'Televerse :': 'Televerse :',
  'Detail du prix': 'Detail du prix',
  'Resume des couts': 'Resume des couts',
  'Total paye': 'Total paye',
  Actuel: 'Actuel',
  Termine: 'Termine',
  'En attente': 'En attente',
  'Contacter le support': 'Contacter le support',
  'Ouvrir un ticket support': 'Ouvrir un ticket support',
  'Le paiement est confirme pour cette commande.': 'Paiement is confirmed for this order.',
  'Payez en securite via Stripe Checkout. Kendronics ne manipule jamais directement les donnees de carte.':
    'Pay securely through Stripe Checkout. Kendronics never handles card details directly.',
  'Ouverture de Stripe...': 'Ouverture de Stripe...',
  Paye: 'Paye',
  'Payer avec Stripe': 'Payer avec Stripe',
  'Creez votre compte Kendronics': 'Creez votre compte Kendronics',
  'Creer un compte': 'Creer un compte',
  'Creation du compte...': 'Creation du compte...',
  'Connectez-vous pour gerer vos devis, commandes et livraisons.': 'Sign in to manage quotes, orders, and deliveries.',
  'Devis Express PCB': 'PCB Express Devis',
  'Une seule zone prend en charge Gerber, BOM et CPL.': 'Une seule zone prend en charge Gerber, BOM et CPL.',
  'Ajouter Gerber': 'Ajouter Gerber',
  'Ajouter BOM': 'Ajouter BOM',
  'Ajouter CPL': 'Ajouter CPL',
  'Upload en cours...': 'Televersement...',
  'Gerber ZIP max 50 Mo. BOM et CPL optionnels.': 'Gerber ZIP max 50 MB. BOM and CPL optional.',
  'Parametres de base': 'Parametres de base',
  'Materiau, couches, dimensions, quantite et type de produit.': 'Materiau, couches, dimensions, quantite et type de produit.',
  Dimensions: 'Dimensions',
  Longueur: 'Longueur',
  Largeur: 'Largeur',
  Destination: 'Destination',
  Assurance: 'Assurance',
  'Options avancees': 'Options avancees',
  'Total estime': 'Total estime',
  Fermer: 'Fermer',
  'Sauvegarde du devis...': 'Sauvegarde du devis...',
  'Devis sauvegarde cote serveur. Validation fournisseur requise avant paiement final.':
    'Devis saved on the server. Supplier validation is required before final payment.',
  'Voir la commande': 'Voir la commande',
  'Gestion des cookies Kendronics': 'Kendronics cookie management',
  'Politique de cookies': 'Politique de cookies',
  Accepterer: 'Accepter',
  Refuser: 'Refuser',
  Personnaliser: 'Personnaliser',
  Necessaires: 'Necessaires',
  Preferences: 'Preferences',
  'Mesure d audience': 'Mesure d audience',
  'Enregistrer mes choix': 'Enregistrer my choices',
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
    window.localStorage.setItem(languageStorageKey, 'fr');
    setLanguageState('fr');
  }, []);

  useEffect(() => {
    document.documentElement.lang = 'fr';
    window.localStorage.setItem(languageStorageKey, 'fr');
    applySiteTranslations('fr');
    window.dispatchEvent(new CustomEvent('kendronics:language-changed', { detail: { language: 'fr' } }));
  }, [language]);

  useEffect(() => {
    let isApplying = false;
    const observer = new MutationObserver(() => {
      if (isApplying) return;
      isApplying = true;
      window.requestAnimationFrame(() => {
        applySiteTranslations('fr');
        isApplying = false;
      });
    });

    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language: 'fr',
      setLanguage: () => setLanguageState('fr'),
      toggleLanguage: () => setLanguageState('fr'),
      t: (key) => messages.fr[key],
    }),
    [],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

function readStoredLanguage(): Language {
  return 'fr';
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
