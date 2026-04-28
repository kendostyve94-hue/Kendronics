'use client';

import { useEffect } from 'react';

type Language = 'fr' | 'en';

const frToEn: Record<string, string> = {
  'Accelere ta creativite': 'Accelerate your creativity',
  "Centre d'aide": 'Help center',
  Produit: 'Product',
  Support: 'Support',
  'A propos': 'About',
  Suivi: 'Tracking',
  Commande: 'Order',
  Connexion: 'Login',
  'Creer mon compte': 'Create my account',
  'Nouveau client ?': 'New customer?',
  'PCB standard': 'Standard PCB',
  'PCB petit lot': 'Small-batch PCB',
  'PCB avance': 'Advanced PCB',
  'Assistance technique': 'Technical assistance',
  Capacite: 'Capabilities',
  'Comment ca marche': 'How it works',
  'Guide technique': 'Technical guide',
  'Qui sommes-nous': 'About us',
  Remboursement: 'Refunds',
  'Termes et conditions': 'Terms and conditions',
  Cookies: 'Cookies',
  'Demander un devis': 'Get quote',
  'Devis PCB en ligne': 'Online PCB quote',
  'Instructions de commande >': 'Ordering instructions >',
  'Livraison vers :': 'Ship to:',
  'Besoin d aide ?': 'Need help?',
  'Chat en ligne >': 'Online chat >',
  'Nous ecrire >': 'Email us >',
  'Centre d aide >': 'Help center >',
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
  'Progression': 'Progress',
  'Paiement': 'Payment',
  'Prix total': 'Total price',
  'Livraison estimee': 'Estimated delivery',
  'Confirmation en attente': 'Pending confirmation',
  'Specifications PCB': 'PCB specs',
  'Resume de fabrication': 'Manufacturing snapshot',
  'Type de produit': 'Product type',
  'Couches': 'Layers',
  'Quantite': 'Quantity',
  'Materiau de base': 'Base material',
  'Epaisseur': 'Thickness',
  'Masque de soudure': 'Solder mask',
  'Finition de surface': 'Surface finish',
  'Assemblage': 'Assembly',
  'Requis': 'Required',
  'Non requis': 'Not required',
  'Gerber televerse': 'Uploaded Gerber',
  'Fichier :': 'File:',
  'Taille :': 'Size:',
  'Televerse :': 'Uploaded:',
  'Detail du prix': 'Pricing breakdown',
  'Resume des couts': 'Cost summary',
  'Total paye': 'Total paid',
  'Actuel': 'Current',
  'Termine': 'Completed',
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
  'Connectez-vous pour gerer vos devis, commandes et livraisons.': 'Sign in to manage quotes, orders, and shipments.',
  'Catalogue de services': 'Service catalog',
  'Services PCB pour l Afrique': 'PCB services for Africa',
  'Explorer les services': 'Explore services',
  'Voir les services': 'View services',
  'Commencer le devis': 'Start quote',
  'Suivre une commande': 'Track an order',
  'Configurer une commande': 'Configure an order',
  'Mon profil': 'My profile',
  'Repertoire utilisateur': 'User directory',
  Enregistrer: 'Save',
};

const enToFr = Object.fromEntries(Object.entries(frToEn).map(([fr, en]) => [en, fr]));

export function LanguageRuntime() {
  useEffect(() => {
    const applyStoredLanguage = () => {
      const language = readLanguage();
      document.documentElement.lang = language;
      translateDocument(language);
    };

    applyStoredLanguage();

    const observer = new MutationObserver(() => applyStoredLanguage());
    observer.observe(document.body, { childList: true, subtree: true });

    window.addEventListener('storage', applyStoredLanguage);
    window.addEventListener('kendronics:language-changed', applyStoredLanguage);

    return () => {
      observer.disconnect();
      window.removeEventListener('storage', applyStoredLanguage);
      window.removeEventListener('kendronics:language-changed', applyStoredLanguage);
    };
  }, []);

  return null;
}

function readLanguage(): Language {
  if (typeof window === 'undefined') return 'fr';
  return window.localStorage.getItem('kendronics.language') === 'en' ? 'en' : 'fr';
}

function translateDocument(language: Language) {
  const dictionary = language === 'en' ? frToEn : enToFr;
  translateTextNodes(document.body, dictionary);
  translateAttributes(dictionary);
}

function translateTextNodes(root: HTMLElement, dictionary: Record<string, string>) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA'].includes(parent.tagName)) return NodeFilter.FILTER_REJECT;
      if (!node.nodeValue?.trim()) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);

  nodes.forEach((node) => {
    const current = node.nodeValue ?? '';
    const translated = translateExact(current, dictionary);
    if (translated !== current) node.nodeValue = translated;
  });
}

function translateAttributes(dictionary: Record<string, string>) {
  document.querySelectorAll<HTMLElement>('[placeholder],[title],[aria-label]').forEach((element) => {
    ['placeholder', 'title', 'aria-label'].forEach((attribute) => {
      const value = element.getAttribute(attribute);
      if (!value) return;
      const translated = translateExact(value, dictionary);
      if (translated !== value) element.setAttribute(attribute, translated);
    });
  });
}

function translateExact(value: string, dictionary: Record<string, string>) {
  const start = value.match(/^\s*/)?.[0] ?? '';
  const end = value.match(/\s*$/)?.[0] ?? '';
  const key = value.trim();
  const translated = dictionary[key];
  return translated ? `${start}${translated}${end}` : value;
}
